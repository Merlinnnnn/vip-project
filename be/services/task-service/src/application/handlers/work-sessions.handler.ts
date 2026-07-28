import { IRequest, IRequestHandler } from '../../shared/mediator';
import { WorkSessionRepository, type SessionStatsRow, type DailyStatsRow } from '../../domain/repositories/work-session.repository';
import { TaskRepository } from '../../domain/repositories/task.repository';
import { SkillRepository } from '../../domain/repositories/skill.repository';
import { WorkSession } from '../../domain/entities/work-session.entity';
import { StartSessionDto, StopSessionDto } from '../dto/work-session.dto';
import { UUID } from '../../shared';
import { randomUUID } from 'crypto';
import { PrismaWorkSessionRepository } from '../../infrastructure/persistence/work-session.prisma.repository';

// ── Commands & Queries ─────────────────────────────────────────────────────

export class StartSessionCommand implements IRequest<WorkSession> {
  constructor(
    public readonly userId: UUID,
    public readonly dto: StartSessionDto
  ) {}
}

export class StopSessionCommand implements IRequest<WorkSession> {
  constructor(
    public readonly userId: UUID,
    public readonly id: UUID,
    public readonly dto: StopSessionDto
  ) {}
}

export class GetActiveSessionQuery implements IRequest<WorkSession | null> {
  constructor(public readonly userId: UUID) {}
}

export class ListSessionsQuery implements IRequest<WorkSession[]> {
  constructor(
    public readonly userId: UUID,
    public readonly from: Date,
    public readonly to: Date
  ) {}
}

export class GetSessionStatsQuery implements IRequest<SessionStatsResponse> {
  constructor(public readonly userId: UUID) {}
}

export type SessionStatsResponse = {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  bySkill: SessionStatsRow[];
  dailyHeatmap: DailyStatsRow[];
  streak: number;
};

// ── Handlers ───────────────────────────────────────────────────────────────

export class StartSessionHandler implements IRequestHandler<StartSessionCommand, WorkSession> {
  constructor(
    private readonly sessionRepo: WorkSessionRepository,
    private readonly taskRepo: TaskRepository,
    private readonly skillRepo: SkillRepository
  ) {}

  async handle(command: StartSessionCommand): Promise<WorkSession> {
    const { userId, dto } = command;

    // Only 1 active session per user at a time
    const existing = await this.sessionRepo.findActiveByUser(userId);
    if (existing) {
      throw new Error('A session is already running. Stop it before starting a new one.');
    }

    let skillId = dto.skillId ?? null;

    // If taskId is provided, validate it exists and inherit its skillId
    if (dto.taskId) {
      const task = await this.taskRepo.findById(dto.taskId, userId);
      if (!task) {
        throw new Error('Task not found');
      }
      // Use the task's skill if no explicit skillId was provided
      if (!skillId && task.skillId) {
        skillId = task.skillId;
      }
      // Auto-transition task to in_progress if it's todo
      if (task.status === 'todo') {
        task.status = 'in_progress';
        task.updatedAt = new Date();
        await this.taskRepo.update(task);
      }
    }

    // If skillId is provided, validate it exists
    if (skillId) {
      const skill = await this.skillRepo.findById(skillId, userId);
      if (!skill) {
        throw new Error('Skill not found');
      }
    }

    const session = new WorkSession(
      randomUUID(),
      userId,
      dto.taskId ?? null,
      skillId,
      new Date(), // startedAt
      null,       // endedAt (running)
      0,          // durationMin
      null        // note
    );

    return this.sessionRepo.create(session);
  }
}

export class StopSessionHandler implements IRequestHandler<StopSessionCommand, WorkSession> {
  constructor(
    private readonly sessionRepo: WorkSessionRepository
  ) {}

  async handle(command: StopSessionCommand): Promise<WorkSession> {
    const { userId, id, dto } = command;

    const session = await this.sessionRepo.findById(id, userId);
    if (!session) {
      throw new Error('Session not found');
    }
    if (!session.isActive) {
      throw new Error('Session is already stopped');
    }

    // Stop the session (sets endedAt + calculates durationMin)
    session.stop(dto.note);

    // Use the specialized method that handles skill accumulation transactionally
    const repo = this.sessionRepo as PrismaWorkSessionRepository;
    if (typeof repo.stopAndAccumulate === 'function') {
      return repo.stopAndAccumulate(session);
    }

    // Fallback for non-Prisma repos (e.g., in-memory for testing)
    return this.sessionRepo.update(session);
  }
}

export class GetActiveSessionHandler implements IRequestHandler<GetActiveSessionQuery, WorkSession | null> {
  constructor(private readonly sessionRepo: WorkSessionRepository) {}

  async handle(query: GetActiveSessionQuery): Promise<WorkSession | null> {
    return this.sessionRepo.findActiveByUser(query.userId);
  }
}

export class ListSessionsHandler implements IRequestHandler<ListSessionsQuery, WorkSession[]> {
  constructor(private readonly sessionRepo: WorkSessionRepository) {}

  async handle(query: ListSessionsQuery): Promise<WorkSession[]> {
    return this.sessionRepo.findByUserInRange(query.userId, query.from, query.to);
  }
}

export class GetSessionStatsHandler implements IRequestHandler<GetSessionStatsQuery, SessionStatsResponse> {
  constructor(private readonly sessionRepo: WorkSessionRepository) {}

  async handle(query: GetSessionStatsQuery): Promise<SessionStatsResponse> {
    const now = new Date();

    // Today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todaySessions = await this.sessionRepo.findByUserInRange(
      query.userId,
      todayStart,
      now
    );
    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMin, 0);

    // This week (Monday-based)
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekSessions = await this.sessionRepo.findByUserInRange(
      query.userId,
      weekStart,
      now
    );
    const weekMinutes = weekSessions.reduce((sum, s) => sum + s.durationMin, 0);

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthSessions = await this.sessionRepo.findByUserInRange(
      query.userId,
      monthStart,
      now
    );
    const monthMinutes = monthSessions.reduce((sum, s) => sum + s.durationMin, 0);

    // By skill
    const bySkill = await this.sessionRepo.getStatsBySkill(query.userId);

    // Daily heatmap (last 30 days)
    const dailyHeatmap = await this.sessionRepo.getDailyStats(query.userId, 30);

    // Streak
    const streak = await this.sessionRepo.getStreak(query.userId);

    return {
      todayMinutes,
      weekMinutes,
      monthMinutes,
      bySkill,
      dailyHeatmap,
      streak,
    };
  }
}
