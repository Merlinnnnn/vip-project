import type { UUID } from '../../shared';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export class Task {
  constructor(
    public readonly id: UUID,
    public readonly userId: UUID,
    public title: string,
    public description: string | null,
    public status: TaskStatus = 'todo',
    public priority: number = Date.now(),
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
}
