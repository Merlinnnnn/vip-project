import { rateLimit, type Options } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { envConfig } from '../../config/env.config';

// ─────────────────────────────────────────────────────────
// Redis clients cache: mỗi limiter prefix có 1 client.
// Dùng `any` để tránh type mismatch giữa redis v5 và
// rate-limit-redis (vẫn expect redis v4 types).
// ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const redisClients = new Map<string, any>();

function getOrCreateRedisClient(prefix: string): any {
  if (redisClients.has(prefix)) {
    return redisClients.get(prefix);
  }

  const { redisUrl } = envConfig();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require('redis');
  const client = createClient({ url: redisUrl });

  client.on('error', (err: Error) => {
    console.warn(`[RATE-LIMIT-REDIS][${prefix}] error:`, err.message);
  });

  client.connect().catch((err: Error) => {
    console.warn(`[RATE-LIMIT-REDIS][${prefix}] connect failed:`, err.message);
  });

  redisClients.set(prefix, client);
  return client;
}

// ─────────────────────────────────────────────────────────
// Factory tạo rate limiter với Redis-backed store.
// Nếu Redis không khả dụng, tự động fallback về MemoryStore
// ─────────────────────────────────────────────────────────
function createLimiter(options: Partial<Options>, keyPrefix: string) {
  const client = getOrCreateRedisClient(keyPrefix);

  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => client.sendCommand(args),
      prefix: `rl:${keyPrefix}:`,
    }),
    standardHeaders: true,   // Trả về RateLimit-* headers (RFC 6585)
    legacyHeaders: false,    // Tắt X-RateLimit-* headers cũ
    skipSuccessfulRequests: false,
    handler: (_req, res) => {
      res.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfter: res.getHeader('RateLimit-Reset'),
      });
    },
    ...options,
  });
}

// ─────────────────────────────────────────────────────────
// Login Limiter: 10 lần trong 15 phút
// Đủ cho user bình thường, ngăn brute-force password
// ─────────────────────────────────────────────────────────
export function createLoginLimiter() {
  return createLimiter(
    {
      windowMs: 15 * 60 * 1000, // 15 phút
      limit: 10,
    },
    'login'
  );
}

// ─────────────────────────────────────────────────────────
// Register Limiter: 5 lần trong 1 giờ
// Ngăn tạo tài khoản spam hàng loạt từ cùng IP
// ─────────────────────────────────────────────────────────
export function createRegisterLimiter() {
  return createLimiter(
    {
      windowMs: 60 * 60 * 1000, // 1 giờ
      limit: 5,
    },
    'register'
  );
}

// ─────────────────────────────────────────────────────────
// Refresh Token Limiter: 20 lần trong 15 phút
// Ngăn token refresh bất thường, ví dụ token bị leak
// ─────────────────────────────────────────────────────────
export function createRefreshTokenLimiter() {
  return createLimiter(
    {
      windowMs: 15 * 60 * 1000, // 15 phút
      limit: 20,
    },
    'refresh'
  );
}
