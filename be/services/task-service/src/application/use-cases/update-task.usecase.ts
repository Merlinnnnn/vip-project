import type { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskRepository } from '../../domain/repositories/task.repository';
import { SkillRepository } from '../../domain/repositories/skill.repository';
import { TaskDomainService } from '../../domain/services/task-domain.service';
import type { UUID } from '../../shared';

export class UpdateTaskUseCase {
  constructor(
    private readonly repo: TaskRepository,
    private readonly domain: TaskDomainService,
    private readonly skills?: SkillRepository
  ) {}

  async execute(userId: UUID, id: UUID, dto: UpdateTaskDto) {
    const task = await this.repo.findById(id, userId);
    if (!task) {
      throw new Error('Task not found');
    }
    const previousSkillId = task.skillId ?? null;
    const previousMinutes = task.learningMinutes ?? 0;
    const parsedLearningMinutes =
      dto.learningMinutes === undefined ? undefined : Number(dto.learningMinutes);
    if (parsedLearningMinutes !== undefined && (Number.isNaN(parsedLearningMinutes) || parsedLearningMinutes < 0)) {
      throw new Error('learningMinutes cannot be negative');
    }
    const nextSkillId = dto.skillId ?? previousSkillId;
    if (nextSkillId && this.skills) {
      const skill = await this.skills.findById(nextSkillId, userId);
      if (!skill) {
        throw new Error('Skill not found for this user');
      }
    }
    this.domain.updateTask(task, { ...dto, learningMinutes: parsedLearningMinutes });
    const updated = await this.repo.update(task);

    if (this.skills) {
      const newSkillId = updated.skillId ?? null;
      const newMinutes = updated.learningMinutes ?? 0;
      if (newSkillId === previousSkillId) {
        const delta = newMinutes - previousMinutes;
        if (newSkillId && delta !== 0) {
          await this.skills.incrementTotalMinutes(newSkillId, userId, delta);
        }
      } else {
        if (previousSkillId) {
          await this.skills.incrementTotalMinutes(previousSkillId, userId, -previousMinutes);
        }
        if (newSkillId) {
          await this.skills.incrementTotalMinutes(newSkillId, userId, newMinutes);
        }
      }
    }

    return updated;
  }
}
