import express from 'express';
import cors from 'cors';
import { TaskDomainService } from './domain/services/task-domain.service';
import { PrismaTaskRepository } from './infrastructure/persistence/task.prisma.repository';
import { PrismaSkillRepository } from './infrastructure/persistence/skill.prisma.repository';
import { TaskController } from './interfaces/rest/task.controller';
import { TokenStore } from './infrastructure/cache/token.store';
import { SkillController } from './interfaces/rest/skill.controller';
import { NotificationController } from './interfaces/rest/notification.controller';
import { Mediator } from './shared/mediator';
import {
  CreateTaskCommand,
  CreateTaskHandler,
  UpdateTaskCommand,
  UpdateTaskHandler,
  DeleteTaskCommand,
  DeleteTaskHandler,
  ListTasksQuery,
  ListTasksHandler,
  GetTaskQuery,
  GetTaskHandler
} from './application/handlers/tasks.handler';
import { NotificationQueueService } from './infrastructure/queue/bullmq.infrastructure';
import { DelayedNotificationHandler } from './application/handlers/delayed-notification.handler';
import {
  CreateSkillCommand,
  CreateSkillHandler,
  UpdateSkillCommand,
  UpdateSkillHandler,
  DeleteSkillCommand,
  DeleteSkillHandler,
  ListSkillsQuery,
  ListSkillsHandler,
  GetUserStatsQuery,
  GetUserStatsHandler
} from './application/handlers/skills.handler';
import {
  createGlobalApiLimiter,
  createTaskWriteLimiter,
} from './infrastructure/middleware/rate-limit.middleware';
import { createAuthMiddleware } from './infrastructure/middleware/auth.middleware';
import { RabbitMQPublisher } from './infrastructure/messaging/rabbitmq.publisher';
import { OutboxWorker } from './infrastructure/messaging/outbox.worker';
import { setupSwagger } from './config/swagger.config';
import { envConfig } from './config/env.config';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Swagger UI — available at /api-docs
  setupSwagger(app);

  // Tin tưởng IP từ Nginx proxy (để rate-limit theo IP thật)
  app.set('trust proxy', 1);

  const { redisUrl, rabbitmqUrl } = envConfig();

  const repo = new PrismaTaskRepository();
  const skillRepo = new PrismaSkillRepository();
  const domain = new TaskDomainService();
  const tokenStore = new TokenStore();

  // RabbitMQ Publisher
  const rabbitPublisher = new RabbitMQPublisher(rabbitmqUrl);

  // Start Outbox Worker
  const outboxWorker = new OutboxWorker(rabbitPublisher);
  outboxWorker.start();

  // Mediator setup
  const mediator = new Mediator();

  // Notification Queue setup (phải trước handlers để inject vào DeleteTaskHandler)
  const queueService = new NotificationQueueService(redisUrl, mediator);
  new DelayedNotificationHandler(mediator, queueService);

  // Task handlers
  mediator.register(CreateTaskCommand, new CreateTaskHandler(repo, domain, mediator, skillRepo));
  mediator.register(UpdateTaskCommand, new UpdateTaskHandler(repo, domain, mediator, skillRepo));
  mediator.register(DeleteTaskCommand, new DeleteTaskHandler(repo, skillRepo, queueService));
  mediator.register(ListTasksQuery, new ListTasksHandler(repo));
  mediator.register(GetTaskQuery, new GetTaskHandler(repo));

  // Skill handlers
  mediator.register(CreateSkillCommand, new CreateSkillHandler(skillRepo));
  mediator.register(UpdateSkillCommand, new UpdateSkillHandler(skillRepo));
  mediator.register(DeleteSkillCommand, new DeleteSkillHandler(skillRepo));
  mediator.register(ListSkillsQuery, new ListSkillsHandler(skillRepo));
  mediator.register(GetUserStatsQuery, new GetUserStatsHandler(skillRepo));

  // ── Middleware ──────────────────────────────────────────
  const globalLimiter = createGlobalApiLimiter();
  const writeLimiter = createTaskWriteLimiter();
  const authMiddleware = createAuthMiddleware(tokenStore);

  // Apply global limiter cho toàn bộ API
  app.use(globalLimiter);

  const tasksController = new TaskController(mediator, authMiddleware, writeLimiter);
  const skillsController = new SkillController(mediator, authMiddleware, writeLimiter);
  const notificationController = new NotificationController(mediator, tokenStore);
  app.use('/api/tasks', tasksController.router);
  app.use('/api/skills', skillsController.router);
  app.use('/api/notifications', notificationController.router);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use(
    (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('[TASK-SERVICE][ERROR]', err);
      res.status(400).json({ message: err?.message || 'Unexpected error' });
    }
  );

  return app;
}

