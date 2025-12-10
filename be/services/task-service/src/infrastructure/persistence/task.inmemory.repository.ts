import { randomUUID } from 'crypto';
import { Task } from '../../domain/entities/task.entity';
import { TaskRepository } from '../../domain/repositories/task.repository';
import type { UUID } from '../../shared';

export class InMemoryTaskRepository extends TaskRepository {
  private readonly tasks = new Map<UUID, Task>();

  async findAllByUser(userId: UUID): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.priority - a.priority);
  }

  async findById(id: UUID, userId: UUID): Promise<Task | null> {
    const task = this.tasks.get(id);
    if (task && task.userId === userId) {
      return task;
    }
    return null;
  }

  async create(task: Task): Promise<Task> {
    const id = task.id || randomUUID();
    const nextPriority =
      Math.max(
        0,
        ...Array.from(this.tasks.values())
          .filter((t) => t.userId === task.userId)
          .map((t) => t.priority ?? 0)
      ) + 1;
    const toSave = new Task(
      id,
      task.userId,
      task.title,
      task.description,
      task.status,
      nextPriority,
      task.learningMinutes ?? 0,
      task.skillId ?? null,
      task.createdAt,
      task.updatedAt
    );
    this.tasks.set(id, toSave);
    await this.normalize(task.userId);
    return toSave;
  }

  async update(task: Task): Promise<Task> {
    this.tasks.set(task.id, task);
    await this.normalize(task.userId);
    return task;
  }

  async delete(id: UUID, userId: UUID): Promise<void> {
    const task = this.tasks.get(id);
    if (task && task.userId === userId) {
      this.tasks.delete(id);
    }
    await this.normalize(userId);
  }

  private async normalize(userId: UUID): Promise<void> {
    const ordered = Array.from(this.tasks.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
      .map((t, idx) => ({ ...t, priority: idx + 1 }));
    ordered.forEach((t) =>
      this.tasks.set(
        t.id,
        new Task(
          t.id,
          t.userId,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.learningMinutes,
          t.skillId ?? null,
          t.createdAt,
          t.updatedAt
        )
      )
    );
  }
}
