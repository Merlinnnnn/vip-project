import { Skill } from '../entities/skill.entity';
import type { UUID } from '../../shared';

export abstract class SkillRepository {
  abstract findAllByUser(userId: UUID): Promise<Skill[]>;
  abstract findById(id: UUID, userId: UUID): Promise<Skill | null>;
  abstract create(skill: Skill): Promise<Skill>;
  abstract incrementTotalMinutes(id: UUID, userId: UUID, delta: number): Promise<void>;
}
