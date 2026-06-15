export interface EnvConfig {
  port: number;
  databaseUrl?: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  redisUrl: string;
}

export const envConfig = (): EnvConfig => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('[CONFIG] JWT_SECRET environment variable is required but not set.');
  }
  return {
    port: Number(process.env.PORT ?? 3000),
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  };
};
