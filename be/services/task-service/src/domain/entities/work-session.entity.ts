import type { UUID } from '../../shared';

export class WorkSession {
  constructor(
    public readonly id: UUID,
    public readonly userId: UUID,
    public taskId: UUID | null,
    public skillId: UUID | null,
    public readonly startedAt: Date = new Date(),
    public endedAt: Date | null = null,
    public durationMin: number = 0,
    public note: string | null = null,
    public readonly createdAt: Date = new Date()
  ) {}

  /** Returns true if session is still running (no endedAt) */
  get isActive(): boolean {
    return this.endedAt === null;
  }

  /** Calculate duration in minutes from startedAt to endedAt (or now if still active) */
  calculateDuration(): number {
    const end = this.endedAt ?? new Date();
    const diffMs = end.getTime() - this.startedAt.getTime();
    return Math.max(0, Math.round(diffMs / 60000));
  }

  /** Stop the session and compute duration */
  stop(note?: string | null): void {
    if (!this.isActive) {
      throw new Error('Session already stopped');
    }
    this.endedAt = new Date();
    this.durationMin = this.calculateDuration();
    if (note !== undefined) {
      this.note = note;
    }
  }
}
