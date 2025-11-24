import type { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskRepository } from '../../domain/repositories/task.repository';
import { TaskDomainService } from '../../domain/services/task-domain.service';
import type { UUID } from '../../shared';

export class UpdateTaskUseCase {
  constructor(private readonly repo: TaskRepository, private readonly domain: TaskDomainService) {}

  async execute(userId: UUID, id: UUID, dto: UpdateTaskDto) {
    const task = await this.repo.findById(id, userId);
    if (!task) {
      throw new Error('Task not found');
    }
    this.domain.updateTask(task, dto);
    return this.repo.update(task);
  }
}
