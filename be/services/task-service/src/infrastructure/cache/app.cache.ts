import { redisClient, ensureRedisConnection } from './redis.client';

/**
 * AppCache — Generic cache helper dùng Redis.
 *
 * Pattern: Cache-aside + Pessimistic Invalidate
 *   - READ:  check Redis → HIT: return; MISS: fetch DB → lưu Redis → return
 *   - WRITE: xóa cache TRƯỚC khi ghi DB → đảm bảo không bao giờ có stale data
 *
 * Tại sao pessimistic (xóa trước)?
 *   Nếu xóa Redis thành công nhưng DB write lỗi → cache trống → lần đọc tiếp lấy fresh từ DB ✅
 *   Nếu ghi DB xong nhưng xóa Redis lỗi       → có thể stale tối đa TTL giây              ❌
 *   → Pessimistic loại bỏ risk thứ 2 hoàn toàn.
 */
export class AppCache {
  /**
   * Đọc từ cache, nếu miss thì fetch DB rồi fill vào cache.
   * @param key   - Redis key
   * @param ttlSeconds - Time-to-live (safety net nếu invalidate bị miss)
   * @param fetch - Hàm lấy data từ DB
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetch: () => Promise<T>
  ): Promise<T> {
    try {
      await ensureRedisConnection();
      const raw = await redisClient.get(key);
      if (typeof raw === 'string') {
        return JSON.parse(raw) as T;
      }
    } catch (err) {
      // Redis không khả dụng → fallback về DB, không throw
      console.warn('[CACHE] Redis unavailable on read, falling back to DB:', (err as Error).message);
    }

    const value = await fetch();

    try {
      await ensureRedisConnection();
      await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (err) {
      // Không lưu được cache → chấp nhận, vẫn trả về data từ DB
      console.warn('[CACHE] Redis unavailable on write, skipping cache:', (err as Error).message);
    }

    return value;
  }

  /**
   * Xóa một hoặc nhiều cache keys (dùng cho pessimistic invalidation).
   * Fail-safe: nếu Redis lỗi chỉ log, không throw.
   */
  async invalidate(...keys: string[]): Promise<void> {
    if (!keys.length) return;
    try {
      await ensureRedisConnection();
      await Promise.all(keys.map((k) => redisClient.del(k)));
    } catch (err) {
      console.warn('[CACHE] Redis unavailable on invalidate:', (err as Error).message);
    }
  }

  /**
   * Tạo key cho skill stats theo userId.
   */
  static skillStatsKey(userId: string) {
    return `skill-stats:${userId}`;
  }

  /**
   * Tạo key cho skills list theo userId.
   * (Dự phòng — hiện tại để React Query quản lý skills list)
   */
  static skillsKey(userId: string) {
    return `skills:${userId}`;
  }
}

/** Singleton instance dùng trong toàn bộ task-service */
export const appCache = new AppCache();
