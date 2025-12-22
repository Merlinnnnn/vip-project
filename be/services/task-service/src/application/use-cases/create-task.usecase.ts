import { randomUUID } from 'crypto';
import { Task } from '../../domain/entities/task.entity';
import { TaskRepository } from '../../domain/repositories/task.repository';
import { SkillRepository } from '../../domain/repositories/skill.repository';
import { TaskDomainService } from '../../domain/services/task-domain.service';
import type { CreateTaskDto } from '../dto/create-task.dto';
import type { UUID } from '../../shared';

export class CreateTaskUseCase {
  constructor(
    private readonly repo: TaskRepository,
    private readonly domain: TaskDomainService,
    private readonly skills?: SkillRepository
  ) {}

  async execute(userId: UUID, dto: CreateTaskDto) {
    const status = dto.status ?? 'todo';
    if (!dto.dueDate) {
      throw new Error('dueDate is required');
    }
    const dueDate = this.domain.ensureDueDate(dto.dueDate);
    const learningMinutes =
      dto.learningMinutes === undefined ? 0 : Number(dto.learningMinutes);
    if (Number.isNaN(learningMinutes) || learningMinutes < 0) {
      throw new Error('learningMinutes cannot be negative');
    }
    const skillId = dto.skillId ?? null;
    if (skillId && this.skills) {
      const skill = await this.skills.findById(skillId, userId);
      if (!skill) {
        throw new Error('Skill not found for this user');
      }
    }

    const task = new Task(
      randomUUID(),
      userId,
      dto.title,
      dto.description ?? null,
      status,
      dto.priority ?? Date.now(),
      learningMinutes,
      dueDate,
      skillId
    );
    this.domain.ensureValidStatus(task.status);
    this.domain.enforceStatusForDueDate(task);
    const created = await this.repo.create(task);
    if (skillId && learningMinutes > 0 && this.skills) {
      await this.skills.incrementTotalMinutes(skillId, userId, learningMinutes);
    }
    return created;
  }
}
