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
    const toSave = new Task(
      id,
      task.userId,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.createdAt,
      task.updatedAt
    );
    this.tasks.set(id, toSave);
    return toSave;
  }

  async update(task: Task): Promise<Task> {
    this.tasks.set(task.id, task);
    return task;
  }

  async delete(id: UUID, userId: UUID): Promise<void> {
    const task = this.tasks.get(id);
    if (task && task.userId === userId) {
      this.tasks.delete(id);
    }
  }
}
