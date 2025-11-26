import { randomUUID } from 'crypto';
import { Task } from '../../domain/entities/task.entity';
import { TaskRepository } from '../../domain/repositories/task.repository';
import { TaskDomainService } from '../../domain/services/task-domain.service';
import type { CreateTaskDto } from '../dto/create-task.dto';
import type { UUID } from '../../shared';

export class CreateTaskUseCase {
  constructor(private readonly repo: TaskRepository, private readonly domain: TaskDomainService) {}

  async execute(userId: UUID, dto: CreateTaskDto) {
    const status = dto.status ?? 'todo';
    const priority = dto.priority ?? Date.now();
    const task = new Task(randomUUID(), userId, dto.title, dto.description ?? null, status, priority);
    this.domain.ensureValidStatus(task.status);
    return this.repo.create(task);
  }
}
