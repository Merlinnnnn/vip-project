import { TaskRepository } from '../../domain/repositories/task.repository';
import { SkillRepository } from '../../domain/repositories/skill.repository';
import type { UUID } from '../../shared';

export class DeleteTaskUseCase {
  constructor(private readonly repo: TaskRepository, private readonly skills?: SkillRepository) {}

  async execute(userId: UUID, id: UUID) {
    const task = await this.repo.findById(id, userId);
    if (!task) {
      throw new Error('Task not found');
    }
    await this.repo.delete(id, userId);
    if (this.skills && task.skillId && task.learningMinutes) {
      await this.skills.incrementTotalMinutes(task.skillId, userId, -task.learningMinutes);
    }
  }
}
