import { TaskRepository } from '../../domain/repositories/task.repository';
import type { UUID } from '../../shared';

export class DeleteTaskUseCase {
  constructor(private readonly repo: TaskRepository) {}

  async execute(id: UUID) {
    const task = await this.repo.findById(id);
    if (!task) {
      throw new Error('Task not found');
    }
    await this.repo.delete(id);
  }
}
