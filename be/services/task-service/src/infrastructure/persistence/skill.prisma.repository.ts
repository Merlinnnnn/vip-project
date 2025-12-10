import { Skill } from '../../domain/entities/skill.entity';
import { SkillRepository } from '../../domain/repositories/skill.repository';
import type { UUID } from '../../shared';
import { prisma } from './prisma/prisma.client';

const client = prisma as any;

const mapToDomain = (skill: any): Skill =>
  new Skill(
    skill.id,
    skill.userId,
    skill.name,
    skill.totalMinutes,
    skill.targetMinutes,
    skill.createdAt,
    skill.updatedAt
  );

export class PrismaSkillRepository extends SkillRepository {
  async findAllByUser(userId: UUID): Promise<Skill[]> {
    const skills = await client.skill.findMany({ where: { userId }, orderBy: { name: 'asc' } });
    return skills.map(mapToDomain);
  }

  async findById(id: UUID, userId: UUID): Promise<Skill | null> {
    const skill = await client.skill.findFirst({ where: { id, userId } });
    return skill ? mapToDomain(skill) : null;
  }

  async create(skill: Skill): Promise<Skill> {
    const created = await client.skill.create({
      data: {
        id: skill.id,
        userId: skill.userId,
        name: skill.name,
        totalMinutes: skill.totalMinutes,
        targetMinutes: skill.targetMinutes
      }
    });
    return mapToDomain(created);
  }

  async incrementTotalMinutes(id: UUID, userId: UUID, delta: number): Promise<void> {
    if (delta === 0) return;
    const res = await client.skill.updateMany({
      where: { id, userId },
      data: { totalMinutes: { increment: delta } }
    });
    if (!res.count) {
      throw new Error('Skill not found');
    }
  }
}
