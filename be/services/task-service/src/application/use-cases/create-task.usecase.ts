import { randomUUID } from 'crypto';
import { Task } from '../../domain/entities/task.entity';
import { TaskRepository } from '../../domain/repositories/task.repository';
import { TaskDomainService } from '../../domain/services/task-domain.service';
import type { CreateTaskDto } from '../dto/create-task.dto';

export class CreateTaskUseCase {
  constructor(private readonly repo: TaskRepository, private readonly domain: TaskDomainService) {}

  async execute(dto: CreateTaskDto) {
    const task = new Task(randomUUID(), dto.title, dto.description ?? null);
    this.domain.ensureValidStatus(task.status);
    return this.repo.create(task);
  }
}
