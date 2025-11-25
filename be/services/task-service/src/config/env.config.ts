export const envConfig = () => ({
  port: Number(process.env.PORT ?? 3001),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900),
  refreshTokenTtlSeconds: Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? 60 * 60 * 24 * 30) // 30 days
});
