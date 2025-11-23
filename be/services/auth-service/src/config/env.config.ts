export interface EnvConfig {
  port: number;
  databaseUrl?: string;
  jwtSecret?: string;
}

export const envConfig = (): EnvConfig => ({
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET
});
