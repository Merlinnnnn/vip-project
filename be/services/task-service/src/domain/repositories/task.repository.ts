import { Task } from '../entities/task.entity';
import type { UUID } from '../../shared';

export abstract class TaskRepository {
  abstract findAllByUser(userId: UUID): Promise<Task[]>;
  abstract findById(id: UUID, userId: UUID): Promise<Task | null>;
  abstract create(task: Task): Promise<Task>;
  abstract update(task: Task): Promise<Task>;
  abstract delete(id: UUID, userId: UUID): Promise<void>;
}
