import { TaskRepository } from '../../domain/repositories/task.repository';
import type { UUID } from '../../shared';

export class DeleteTaskUseCase {
  constructor(private readonly repo: TaskRepository) {}

  async execute(userId: UUID, id: UUID) {
    const task = await this.repo.findById(id, userId);
    if (!task) {
      throw new Error('Task not found');
    }
    await this.repo.delete(id, userId);
  }
}
