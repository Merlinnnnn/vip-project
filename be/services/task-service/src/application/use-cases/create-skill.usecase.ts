import { randomUUID } from 'crypto';
import { Skill } from '../../domain/entities/skill.entity';
import { SkillRepository } from '../../domain/repositories/skill.repository';
import type { CreateSkillDto } from '../dto/create-skill.dto';
import type { UUID } from '../../shared';

export class CreateSkillUseCase {
  constructor(private readonly repo: SkillRepository) {}

  async execute(userId: UUID, dto: CreateSkillDto) {
    if (!dto.name?.trim()) {
      throw new Error('Skill name is required');
    }
    const targetMinutes =
      dto.targetMinutes === undefined ? 600000 : Number(dto.targetMinutes);
    if (Number.isNaN(targetMinutes) || targetMinutes <= 0) {
      throw new Error('targetMinutes must be a positive number');
    }
    const skill = new Skill(
      randomUUID(),
      userId,
      dto.name.trim(),
      0,
      targetMinutes
    );
    return this.repo.create(skill);
  }
}
