import { randomUUID } from 'crypto';
import { Task } from '../../domain/entities/task.entity';
import { TaskRepository } from '../../domain/repositories/task.repository';
import type { UUID } from '../../shared';

export class InMemoryTaskRepository extends TaskRepository {
  private readonly tasks = new Map<UUID, Task>();

  async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async findById(id: UUID): Promise<Task | null> {
    return this.tasks.get(id) ?? null;
  }

  async create(task: Task): Promise<Task> {
    const id = task.id || randomUUID();
    const toSave = new Task(id, task.title, task.description, task.status, task.createdAt, task.updatedAt);
    this.tasks.set(id, toSave);
    return toSave;
  }

  async update(task: Task): Promise<Task> {
    this.tasks.set(task.id, task);
    return task;
  }

  async delete(id: UUID): Promise<void> {
    this.tasks.delete(id);
  }
}
