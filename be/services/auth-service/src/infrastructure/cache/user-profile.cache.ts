import { redisClient, ensureRedisConnection } from './redis.client';

/**
 * UserProfileCache — Cache user profile data trong Redis.
 *
 * Được cache vì:
 *   - GET /me được gọi mỗi lần app khởi động và khi refresh token
 *   - email, name gần như không đổi trong một session
 *   - Tiết kiệm 1 DB query mỗi lần gọi /me
 *
 * Pattern: Cache-aside + Pessimistic Invalidate
 *   - Đọc: check Redis → MISS → DB → fill Redis
 *   - Ghi: xóa cache TRƯỚC khi update DB (sẽ dùng khi có PATCH /me)
 */

const TTL_SECONDS = 10 * 60; // 10 phút

export type CachedProfile = {
  id: string;
  email: string;
  name: string | null;
};

export class UserProfileCache {
  private key(userId: string) {
    return `user-profile:${userId}`;
  }

  async get(userId: string): Promise<CachedProfile | null> {
    try {
      await ensureRedisConnection();
      const raw = await redisClient.get(this.key(userId));
      if (typeof raw === 'string') return JSON.parse(raw) as CachedProfile;
    } catch (err) {
      console.warn('[AUTH-CACHE] Redis unavailable on read:', (err as Error).message);
    }
    return null;
  }

  async set(profile: CachedProfile): Promise<void> {
    try {
      await ensureRedisConnection();
      await redisClient.set(this.key(profile.id), JSON.stringify(profile), { EX: TTL_SECONDS });
    } catch (err) {
      console.warn('[AUTH-CACHE] Redis unavailable on write:', (err as Error).message);
    }
  }

  /** Xóa cache (gọi trước khi update profile — pessimistic invalidate) */
  async invalidate(userId: string): Promise<void> {
    try {
      await ensureRedisConnection();
      await redisClient.del(this.key(userId));
    } catch (err) {
      console.warn('[AUTH-CACHE] Redis unavailable on invalidate:', (err as Error).message);
    }
  }
}

export const userProfileCache = new UserProfileCache();
