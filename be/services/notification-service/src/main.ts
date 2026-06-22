import 'dotenv/config';
import express from 'express';
import { EventConsumer } from './consumers/event.consumer';
import { envConfig } from './config/env.config';

const config = envConfig();

async function bootstrap() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  VIP Task Manager — Notification Service');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  RabbitMQ : ${config.rabbitmqUrl}`);
  console.log(`  SMTP     : ${config.smtpHost}:${config.smtpPort}`);
  console.log(`  Port     : ${config.port}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── HTTP Server (chỉ dùng cho health check) ────────────────
  const app = express();

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
    });
  });

  app.listen(config.port, () => {
    console.log(`[HTTP] Health check available at http://localhost:${config.port}/health`);
  });

  // ── RabbitMQ Consumer ───────────────────────────────────────
  const consumer = new EventConsumer(config.rabbitmqUrl);
  await consumer.start();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[SHUTDOWN] Received ${signal}. Shutting down gracefully...`);
    await consumer.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[BOOTSTRAP] Fatal error:', err);
  process.exit(1);
});
