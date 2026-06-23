import 'dotenv/config';
import { createApp } from './app.module';
import { ensureRedisConnection } from './infrastructure/cache/redis.client';

async function bootstrap() {
  // Đảm bảo Redis đã kết nối TRƯỚC khi khởi tạo rate-limit middleware
  // (RedisStore.init() cần client đang ở trạng thái open)
  await ensureRedisConnection();

  const app = createApp();
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`Auth service (Express) is running on http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('[AUTH-SERVICE] Fatal startup error:', err);
  process.exit(1);
});
