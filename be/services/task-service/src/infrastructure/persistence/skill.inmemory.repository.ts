import { randomUUID } from 'crypto';
import { Skill } from '../../domain/entities/skill.entity';
import { SkillRepository } from '../../domain/repositories/skill.repository';
import type { UUID } from '../../shared';

export class InMemorySkillRepository extends SkillRepository {
  private readonly skills = new Map<UUID, Skill>();

  async findAllByUser(userId: UUID): Promise<Skill[]> {
    return Array.from(this.skills.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: UUID, userId: UUID): Promise<Skill | null> {
    const skill = this.skills.get(id);
    return skill && skill.userId === userId ? skill : null;
  }

  async update(skill: Skill): Promise<Skill> {
    const existing = await this.findById(skill.id, skill.userId);
    if (!existing) {
      throw new Error('Skill not found');
    }
    const updated = new Skill(
      skill.id,
      skill.userId,
      skill.name,
      skill.totalMinutes,
      skill.targetMinutes,
      existing.createdAt,
      new Date()
    );
    this.skills.set(skill.id, updated);
    return updated;
  }

  async create(skill: Skill): Promise<Skill> {
    const id = skill.id || randomUUID();
    const toSave = new Skill(
      id,
      skill.userId,
      skill.name,
      skill.totalMinutes,
      skill.targetMinutes,
      skill.createdAt,
      skill.updatedAt
    );
    this.skills.set(id, toSave);
    return toSave;
  }

  async incrementTotalMinutes(id: UUID, userId: UUID, delta: number): Promise<void> {
    if (delta === 0) return;
    const skill = await this.findById(id, userId);
    if (!skill) {
      throw new Error('Skill not found');
    }
    const nextTotal = Math.max(0, (skill.totalMinutes ?? 0) + delta);
    const updated = new Skill(
      skill.id,
      skill.userId,
      skill.name,
      nextTotal,
      skill.targetMinutes,
      skill.createdAt,
      new Date()
    );
    this.skills.set(skill.id, updated);
  }

  async delete(id: UUID, userId: UUID): Promise<void> {
    const existing = await this.findById(id, userId);
    if (!existing) return;
    this.skills.delete(id);
    // tasks referencing skill are not tracked here
  }
}
