import { SkillRepository } from '../../domain/repositories/skill.repository';
import type { UUID } from '../../shared';

export class DeleteSkillUseCase {
  constructor(private readonly repo: SkillRepository) {}

  async execute(userId: UUID, id: UUID) {
    const skill = await this.repo.findById(id, userId);
    if (!skill) {
      throw new Error('Skill not found');
    }
    await this.repo.delete(id, userId);
  }
}
