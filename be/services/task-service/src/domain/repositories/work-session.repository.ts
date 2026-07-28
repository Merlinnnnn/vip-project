import { WorkSession } from '../entities/work-session.entity';
import type { UUID } from '../../shared';

export type SessionStatsRow = {
  skillId: string;
  skillName: string;
  totalMinutes: number;
};

export type DailyStatsRow = {
  date: string;   // YYYY-MM-DD
  minutes: number;
};

export abstract class WorkSessionRepository {
  abstract create(session: WorkSession): Promise<WorkSession>;
  abstract findById(id: UUID, userId: UUID): Promise<WorkSession | null>;
  abstract findActiveByUser(userId: UUID): Promise<WorkSession | null>;
  abstract update(session: WorkSession): Promise<WorkSession>;
  abstract findByUserInRange(userId: UUID, from: Date, to: Date): Promise<WorkSession[]>;
  abstract getStatsBySkill(userId: UUID): Promise<SessionStatsRow[]>;
  abstract getDailyStats(userId: UUID, days: number): Promise<DailyStatsRow[]>;
  abstract getStreak(userId: UUID): Promise<number>;
}
