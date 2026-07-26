import { Task } from '../../domain/entities/task.entity';
import { TaskRepository } from '../../domain/repositories/task.repository';
import { TaskDomainService } from '../../domain/services/task-domain.service';
import type { UUID } from '../../shared';
import { prisma } from './prisma/prisma.client';
import { appCache, AppCache } from '../cache/app.cache';
import { Skill } from '../../domain/entities/skill.entity';

/** Shared domain service instance for status enforcement */
const domainService = new TaskDomainService();

function mapToDomain(task: any): Task {
  const domain = new Task(
    task.id,
    task.userId,
    task.title,
    task.description ?? null,
    task.status,
    task.priority,
    task.learningMinutes ?? 0,
    task.dueDate,
    task.skillId ?? null,
    task.createdAt,
    task.updatedAt
  );
  domainService.enforceStatusForDueDate(domain);
  return domain;
}


export class PrismaTaskRepository extends TaskRepository {
  async findAllByUser(userId: UUID): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: [{ dueDate: 'asc' }, { priority: 'asc' }]
    });
    return tasks.map(mapToDomain);
  }

  async findById(id: UUID, userId: UUID): Promise<Task | null> {
    const task = await prisma.task.findFirst({ where: { id, userId } });
    return task ? mapToDomain(task) : null;
  }

  async create(task: Task): Promise<Task> {
    const nextPriority = await this.getNextPriority(task.userId);
    const created = await prisma.task.create({
      data: {
        id: task.id,
        userId: task.userId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: nextPriority,
        learningMinutes: task.learningMinutes,
        dueDate: task.dueDate,
        skillId: task.skillId
      } as any
    });
    return mapToDomain(created);
  }

  async update(task: Task): Promise<Task> {
    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        learningMinutes: task.learningMinutes,
        dueDate: task.dueDate,
        skillId: task.skillId
      } as any
    });
    await this.normalizePriorities(task.userId);
    return mapToDomain(updated);
  }

  async createWithOutbox(task: Task): Promise<Task> {
    const nextPriority = await this.getNextPriority(task.userId);
    
    const created = await prisma.$transaction(async (tx) => {
      // 1. Create the task
      const dbTask = await tx.task.create({
        data: {
          id: task.id,
          userId: task.userId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: nextPriority,
          learningMinutes: task.learningMinutes,
          dueDate: task.dueDate,
          skillId: task.skillId
        } as any
      });

      // 2. Update skill if task.skillId and task.learningMinutes > 0
      if (task.skillId && task.learningMinutes > 0) {
        const skillRawBefore = await tx.skill.findFirst({
          where: { id: task.skillId, userId: task.userId }
        });
        if (!skillRawBefore) {
          throw new Error('Skill not found');
        }
        const skillBefore = new Skill(
          skillRawBefore.id,
          skillRawBefore.userId,
          skillRawBefore.name,
          skillRawBefore.totalMinutes,
          skillRawBefore.targetMinutes,
          skillRawBefore.createdAt,
          skillRawBefore.updatedAt
        );

        // Update skill
        await tx.skill.update({
          where: { id: task.skillId },
          data: { totalMinutes: { increment: task.learningMinutes } }
        });

        const skillRawAfter = await tx.skill.findFirst({
          where: { id: task.skillId, userId: task.userId }
        });
        if (!skillRawAfter) {
          throw new Error('Skill not found after update');
        }
        const skillAfter = new Skill(
          skillRawAfter.id,
          skillRawAfter.userId,
          skillRawAfter.name,
          skillRawAfter.totalMinutes,
          skillRawAfter.targetMinutes,
          skillRawAfter.createdAt,
          skillRawAfter.updatedAt
        );

        // Invalidate cache
        await appCache.invalidate(AppCache.skillStatsKey(task.userId));

        // Check level up
        if (skillAfter.level > skillBefore.level) {
          await tx.outboxEvent.create({
            data: {
              routingKey: 'skill.level_up',
              payload: {
                userId: task.userId,
                skillId: task.skillId,
                skillName: skillAfter.name,
                newLevel: skillAfter.level,
                rank: skillAfter.rank,
                totalMinutes: skillAfter.totalMinutes,
                achievedAt: new Date().toISOString(),
              }
            }
          });
        }
      }

      return dbTask;
    });

    return mapToDomain(created);
  }

  async updateWithOutbox(
    task: Task,
    previousSkillId: UUID | null,
    previousMinutes: number
  ): Promise<Task> {
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update task
      const dbTask = await tx.task.update({
        where: { id: task.id },
        data: {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          learningMinutes: task.learningMinutes,
          dueDate: task.dueDate,
          skillId: task.skillId
        } as any
      });

      const newSkillId = task.skillId ?? null;
      const newMinutes = task.learningMinutes ?? 0;

      // Helper function to handle skill level up checking and increment
      const adjustSkillMinutesAndCheckLevelUp = async (
        skillId: string,
        delta: number
      ) => {
        if (delta === 0) return;
        const skillRawBefore = await tx.skill.findFirst({
          where: { id: skillId, userId: task.userId }
        });
        if (!skillRawBefore) {
          throw new Error('Skill not found');
        }
        const skillBefore = new Skill(
          skillRawBefore.id,
          skillRawBefore.userId,
          skillRawBefore.name,
          skillRawBefore.totalMinutes,
          skillRawBefore.targetMinutes,
          skillRawBefore.createdAt,
          skillRawBefore.updatedAt
        );

        // Update
        await tx.skill.update({
          where: { id: skillId },
          data: { totalMinutes: { increment: delta } }
        });

        // Clamp negative to 0 if needed (e.g. if we decremented too much)
        if (delta < 0) {
          const updatedRaw = await tx.skill.findFirst({ where: { id: skillId } });
          if (updatedRaw && updatedRaw.totalMinutes < 0) {
            await tx.skill.update({
              where: { id: skillId },
              data: { totalMinutes: 0 }
            });
          }
        }

        const skillRawAfter = await tx.skill.findFirst({
          where: { id: skillId, userId: task.userId }
        });
        if (!skillRawAfter) {
          throw new Error('Skill not found after update');
        }
        const skillAfter = new Skill(
          skillRawAfter.id,
          skillRawAfter.userId,
          skillRawAfter.name,
          skillRawAfter.totalMinutes,
          skillRawAfter.targetMinutes,
          skillRawAfter.createdAt,
          skillRawAfter.updatedAt
        );

        // Invalidate cache
        await appCache.invalidate(AppCache.skillStatsKey(task.userId));

        // Check if delta was positive and it leveled up
        if (delta > 0 && skillAfter.level > skillBefore.level) {
          await tx.outboxEvent.create({
            data: {
              routingKey: 'skill.level_up',
              payload: {
                userId: task.userId,
                skillId: skillId,
                skillName: skillAfter.name,
                newLevel: skillAfter.level,
                rank: skillAfter.rank,
                totalMinutes: skillAfter.totalMinutes,
                achievedAt: new Date().toISOString(),
              }
            }
          });
        }
      };

      if (newSkillId === previousSkillId) {
        const delta = newMinutes - previousMinutes;
        if (newSkillId && delta !== 0) {
          await adjustSkillMinutesAndCheckLevelUp(newSkillId, delta);
        }
      } else {
        if (previousSkillId) {
          await adjustSkillMinutesAndCheckLevelUp(previousSkillId, -previousMinutes);
        }
        if (newSkillId) {
          await adjustSkillMinutesAndCheckLevelUp(newSkillId, newMinutes);
        }
      }

      return dbTask;
    });

    await this.normalizePriorities(task.userId);
    return mapToDomain(updated);
  }

  async delete(id: UUID, userId: UUID): Promise<void> {
    await prisma.task.deleteMany({ where: { id, userId } });
    await this.normalizePriorities(userId);
  }

  private async getNextPriority(userId: UUID): Promise<number> {
    const agg = await prisma.task.aggregate({
      where: { userId },
      _max: { priority: true }
    });
    const currentMax = agg._max.priority ?? 0;
    return currentMax + 1;
  }

  private async normalizePriorities(userId: UUID): Promise<void> {
    await prisma.$executeRawUnsafe(
      `
      WITH ordered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY priority, "createdAt") AS rn
        FROM "Task"
        WHERE "userId" = $1
      )
      UPDATE "Task" t
      SET priority = o.rn
      FROM ordered o
      WHERE t.id = o.id;
    `,
      userId
    );
  }
}
