import 'dotenv/config';
import { createApp } from './app.module';
import { envConfig } from './config/env.config';
import { ensureRedisConnection } from './infrastructure/cache/redis.client';

async function bootstrap() {
  const { port } = envConfig();

  // Đảm bảo Redis đã kết nối TRƯỚC khi khởi tạo rate-limit middleware
  // (RedisStore.init() cần client đang ở trạng thái open)
  await ensureRedisConnection();

  const app = createApp();
  app.listen(port, () => {
    console.log(`Task service listening on http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('[TASK-SERVICE] Fatal startup error:', err);
  process.exit(1);
});
