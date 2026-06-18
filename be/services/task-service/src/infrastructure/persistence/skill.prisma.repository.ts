import { Skill } from '../../domain/entities/skill.entity';
import { SkillRepository } from '../../domain/repositories/skill.repository';
import type { UUID } from '../../shared';
import { prisma } from './prisma/prisma.client';
import { appCache, AppCache } from '../cache/app.cache';

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

  /**
   * Lấy raw data cho skill stats (tính toán aggregate) — cached trong Redis.
   * Cache key: skill-stats:{userId}, TTL 5 phút.
   * Được invalidate pessimistically trước mọi write operation.
   */
  async getRawStatsData(userId: UUID): Promise<Skill[]> {
    return appCache.getOrSet(
      AppCache.skillStatsKey(userId),
      5 * 60,
      async () => {
        const skills = await client.skill.findMany({ where: { userId } });
        return skills.map(mapToDomain);
      }
    );
  }

  // ─── WRITE methods: pessimistic invalidate (xóa cache TRƯỚC khi ghi DB) ────
  // Lý do: nếu ghi DB lỗi sau khi đã xóa cache → lần đọc tiếp lấy fresh từ DB ✅
  //        nếu ghi DB thành công → cache trống → lần đọc tiếp lấy data mới ✅

  async update(skill: Skill): Promise<Skill> {
    await appCache.invalidate(AppCache.skillStatsKey(skill.userId));
    const updated = await client.skill.update({
      where: { id: skill.id },
      data: {
        name: skill.name,
        targetMinutes: skill.targetMinutes,
        totalMinutes: skill.totalMinutes
      }
    });
    return mapToDomain(updated);
  }

  async create(skill: Skill): Promise<Skill> {
    await appCache.invalidate(AppCache.skillStatsKey(skill.userId));
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
    // Skill stats thay đổi khi totalMinutes thay đổi → invalidate trước
    await appCache.invalidate(AppCache.skillStatsKey(userId));
    const res = await client.skill.updateMany({
      where: { id, userId },
      data: { totalMinutes: { increment: delta } }
    });
    if (!res.count) {
      throw new Error('Skill not found');
    }
    // Clamp về 0 nếu âm (edge case khi delta > totalMinutes hiện tại)
    if (delta < 0) {
      await client.skill.updateMany({
        where: { id, userId, totalMinutes: { lt: 0 } },
        data: { totalMinutes: 0 }
      });
    }
  }

  async delete(id: UUID, userId: UUID): Promise<void> {
    await appCache.invalidate(AppCache.skillStatsKey(userId));
    await client.task.updateMany({
      where: { skillId: id, userId },
      data: { skillId: null }
    });
    await client.skill.deleteMany({ where: { id, userId } });
  }
}
