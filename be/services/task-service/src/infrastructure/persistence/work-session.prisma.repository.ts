import { WorkSession } from '../../domain/entities/work-session.entity';
import { Skill } from '../../domain/entities/skill.entity';
import {
  WorkSessionRepository,
  type SessionStatsRow,
  type DailyStatsRow,
} from '../../domain/repositories/work-session.repository';
import type { UUID } from '../../shared';
import { prisma } from './prisma/prisma.client';
import { appCache, AppCache } from '../cache/app.cache';

function mapToDomain(row: any): WorkSession {
  return new WorkSession(
    row.id,
    row.userId,
    row.taskId ?? null,
    row.skillId ?? null,
    row.startedAt,
    row.endedAt ?? null,
    row.durationMin ?? 0,
    row.note ?? null,
    row.createdAt
  );
}

export class PrismaWorkSessionRepository extends WorkSessionRepository {
  async create(session: WorkSession): Promise<WorkSession> {
    const created = await prisma.workSession.create({
      data: {
        id: session.id,
        userId: session.userId,
        taskId: session.taskId,
        skillId: session.skillId,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        durationMin: session.durationMin,
        note: session.note,
      },
    });
    return mapToDomain(created);
  }

  async findById(id: UUID, userId: UUID): Promise<WorkSession | null> {
    const row = await prisma.workSession.findFirst({
      where: { id, userId },
    });
    return row ? mapToDomain(row) : null;
  }

  async findActiveByUser(userId: UUID): Promise<WorkSession | null> {
    const row = await prisma.workSession.findFirst({
      where: { userId, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    return row ? mapToDomain(row) : null;
  }

  async update(session: WorkSession): Promise<WorkSession> {
    const updated = await prisma.workSession.update({
      where: { id: session.id },
      data: {
        endedAt: session.endedAt,
        durationMin: session.durationMin,
        note: session.note,
        taskId: session.taskId,
        skillId: session.skillId,
      },
    });
    return mapToDomain(updated);
  }

  /**
   * Stop a session + increment Skill.totalMinutes + check level up (transactional).
   * This is the ONLY place where Skill.totalMinutes gets incremented.
   */
  async stopAndAccumulate(session: WorkSession): Promise<WorkSession> {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update session
      const updatedRow = await tx.workSession.update({
        where: { id: session.id },
        data: {
          endedAt: session.endedAt,
          durationMin: session.durationMin,
          note: session.note,
        },
      });

      // 2. If session has a skillId and durationMin > 0, accumulate to Skill
      if (session.skillId && session.durationMin > 0) {
        const skillBefore = await tx.skill.findFirst({
          where: { id: session.skillId, userId: session.userId },
        });
        if (!skillBefore) {
          throw new Error('Skill not found');
        }
        const domainBefore = new Skill(
          skillBefore.id,
          skillBefore.userId,
          skillBefore.name,
          skillBefore.totalMinutes,
          skillBefore.targetMinutes,
          skillBefore.createdAt,
          skillBefore.updatedAt
        );

        await tx.skill.update({
          where: { id: session.skillId },
          data: { totalMinutes: { increment: session.durationMin } },
        });

        const skillAfter = await tx.skill.findFirst({
          where: { id: session.skillId, userId: session.userId },
        });
        if (!skillAfter) {
          throw new Error('Skill not found after update');
        }
        const domainAfter = new Skill(
          skillAfter.id,
          skillAfter.userId,
          skillAfter.name,
          skillAfter.totalMinutes,
          skillAfter.targetMinutes,
          skillAfter.createdAt,
          skillAfter.updatedAt
        );

        // Check level up → outbox event
        if (domainAfter.level > domainBefore.level) {
          await tx.outboxEvent.create({
            data: {
              routingKey: 'skill.level_up',
              payload: {
                userId: session.userId,
                skillId: session.skillId,
                skillName: domainAfter.name,
                newLevel: domainAfter.level,
                rank: domainAfter.rank,
                totalMinutes: domainAfter.totalMinutes,
                achievedAt: new Date().toISOString(),
              },
            },
          });
        }

        // Invalidate skill stats cache
        await appCache.invalidate(AppCache.skillStatsKey(session.userId));
      }

      return updatedRow;
    });

    return mapToDomain(result);
  }

  async findByUserInRange(
    userId: UUID,
    from: Date,
    to: Date
  ): Promise<WorkSession[]> {
    const rows = await prisma.workSession.findMany({
      where: {
        userId,
        startedAt: { gte: from, lte: to },
        endedAt: { not: null }, // only completed sessions
      },
      orderBy: { startedAt: 'desc' },
    });
    return rows.map(mapToDomain);
  }

  async getStatsBySkill(userId: UUID): Promise<SessionStatsRow[]> {
    const rows: any[] = await prisma.$queryRaw`
      SELECT
        ws."skillId" AS "skillId",
        s.name AS "skillName",
        COALESCE(SUM(ws."durationMin"), 0)::int AS "totalMinutes"
      FROM "WorkSession" ws
      JOIN "Skill" s ON s.id = ws."skillId"
      WHERE ws."userId" = ${userId}
        AND ws."endedAt" IS NOT NULL
        AND ws."skillId" IS NOT NULL
      GROUP BY ws."skillId", s.name
      ORDER BY "totalMinutes" DESC
    `;
    return rows.map((r) => ({
      skillId: r.skillId,
      skillName: r.skillName,
      totalMinutes: Number(r.totalMinutes),
    }));
  }

  async getDailyStats(userId: UUID, days: number): Promise<DailyStatsRow[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const rows: any[] = await prisma.$queryRaw`
      SELECT
        TO_CHAR(ws."startedAt", 'YYYY-MM-DD') AS "date",
        COALESCE(SUM(ws."durationMin"), 0)::int AS "minutes"
      FROM "WorkSession" ws
      WHERE ws."userId" = ${userId}
        AND ws."endedAt" IS NOT NULL
        AND ws."startedAt" >= ${since}
      GROUP BY "date"
      ORDER BY "date" ASC
    `;
    return rows.map((r) => ({
      date: r.date,
      minutes: Number(r.minutes),
    }));
  }

  async getStreak(userId: UUID): Promise<number> {
    // Get distinct dates with at least 1 completed session, ordered desc
    const rows: any[] = await prisma.$queryRaw`
      SELECT DISTINCT TO_CHAR(ws."startedAt", 'YYYY-MM-DD') AS "date"
      FROM "WorkSession" ws
      WHERE ws."userId" = ${userId}
        AND ws."endedAt" IS NOT NULL
      ORDER BY "date" DESC
    `;

    if (rows.length === 0) return 0;

    const todayKey = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayKey = yesterdayDate.toISOString().slice(0, 10);

    // Streak must include today or yesterday
    const firstDate = rows[0].date;
    if (firstDate !== todayKey && firstDate !== yesterdayKey) return 0;

    let streak = 1;
    for (let i = 1; i < rows.length; i++) {
      const prev = new Date(rows[i - 1].date);
      const curr = new Date(rows[i].date);
      const diffDays = Math.round(
        (prev.getTime() - curr.getTime()) / 86400000
      );
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
}
