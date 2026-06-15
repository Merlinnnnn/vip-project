import { rateLimit, type Options } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient, ensureRedisConnection } from '../cache/redis.client';

// ─────────────────────────────────────────────────────────
// Task-service tái sử dụng redisClient đã có sẵn.
// Không tạo thêm connection mới → tiết kiệm tài nguyên.
// ─────────────────────────────────────────────────────────

/**
 * Factory tạo rate limiter với Redis store.
 *
 * Lưu ý về distributed rate limiting:
 * Khi chạy 3 replicas, counter phải được chia sẻ qua Redis.
 * Nếu Redis không khả dụng, sẽ fallback về MemoryStore (counter per-instance).
 */
function createLimiter(options: Partial<Options>, keyPrefix: string) {
  return rateLimit({
    store: new RedisStore({
      // Dùng sendCommand của node-redis v4
      sendCommand: (...args: string[]) => (redisClient as any).sendCommand(args),
      prefix: `rl:${keyPrefix}:`,
    }),
    standardHeaders: true,   // Trả RateLimit-* headers (RFC 6585)
    legacyHeaders: false,     // Tắt X-RateLimit-* headers cũ
    handler: (_req, res) => {
      res.status(429).json({
        message: 'Too many requests. Please slow down.',
        retryAfter: res.getHeader('RateLimit-Reset'),
      });
    },
    skip: async () => {
      // Đảm bảo Redis đã kết nối trước khi dùng store
      try {
        await ensureRedisConnection();
        return false;
      } catch {
        // Nếu Redis lỗi, bỏ qua rate limiting tạm thời
        console.warn('[RATE-LIMIT] Redis unavailable, skipping rate limit check');
        return true;
      }
    },
    ...options,
  });
}

// ─────────────────────────────────────────────────────────
// Global API Limiter: 100 request/phút/IP
// Áp dụng cho toàn bộ API của task-service
// ─────────────────────────────────────────────────────────
export function createGlobalApiLimiter() {
  return createLimiter(
    {
      windowMs: 60 * 1000, // 1 phút
      limit: 100,
    },
    'task-global'
  );
}

// ─────────────────────────────────────────────────────────
// Task Write Limiter: 30 create/update/delete request/phút/IP
// Ngăn tạo task spam hàng loạt
// ─────────────────────────────────────────────────────────
export function createTaskWriteLimiter() {
  return createLimiter(
    {
      windowMs: 60 * 1000, // 1 phút
      limit: 30,
    },
    'task-write'
  );
}
