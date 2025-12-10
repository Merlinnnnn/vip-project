import { SkillRepository } from '../../domain/repositories/skill.repository';
import type { UUID } from '../../shared';

export class ListSkillsUseCase {
  constructor(private readonly repo: SkillRepository) {}

  async execute(userId: UUID) {
    return this.repo.findAllByUser(userId);
  }
}
