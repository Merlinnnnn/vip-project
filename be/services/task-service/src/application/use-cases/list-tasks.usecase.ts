import { TaskRepository } from '../../domain/repositories/task.repository';
import type { UUID } from '../../shared';

export class ListTasksUseCase {
  constructor(private readonly repo: TaskRepository) {}

  async execute(userId: UUID) {
    return this.repo.findAllByUser(userId);
  }
}
