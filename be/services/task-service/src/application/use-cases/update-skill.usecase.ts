import { SkillRepository } from '../../domain/repositories/skill.repository';
import type { UUID } from '../../shared';

export class UpdateSkillUseCase {
  constructor(private readonly repo: SkillRepository) {}

  async execute(userId: UUID, id: UUID, data: { name?: string; targetMinutes?: number }) {
    const skill = await this.repo.findById(id, userId);
    if (!skill) {
      throw new Error('Skill not found');
    }
    if (data.name !== undefined) {
      if (!data.name.trim()) throw new Error('Skill name is required');
      skill.name = data.name.trim();
    }
    if (data.targetMinutes !== undefined) {
      const parsed = Number(data.targetMinutes);
      if (Number.isNaN(parsed) || parsed <= 0) {
        throw new Error('targetMinutes must be positive');
      }
      skill.targetMinutes = parsed;
    }
    return this.repo.update(skill);
  }
}
