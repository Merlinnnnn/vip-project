import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { TaskDomainService } from './domain/services/task-domain.service';
import { InMemoryTaskRepository } from './infrastructure/persistence/task.inmemory.repository';
import { PrismaTaskRepository } from './infrastructure/persistence/task.prisma.repository';
import { CreateTaskUseCase } from './application/use-cases/create-task.usecase';
import { UpdateTaskUseCase } from './application/use-cases/update-task.usecase';
import { DeleteTaskUseCase } from './application/use-cases/delete-task.usecase';
import { ListTasksUseCase } from './application/use-cases/list-tasks.usecase';
import { TaskController } from './interfaces/rest/task.controller';

export function createApp() {
  const app = express();
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  app.use(
    cors({
      origin,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  // Basic anti-scripted-clients guard: require browser-like Origin/Fetch headers
  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    const secFetchSite = req.headers['sec-fetch-site'] as string | undefined;
    if (requestOrigin && requestOrigin !== origin) {
      return res.status(403).json({ message: 'Origin not allowed' });
    }
    if (!requestOrigin && !secFetchSite) {
      return res.status(403).json({ message: 'Origin header required' });
    }
    next();
  });

  const repo = new PrismaTaskRepository(); // switch to InMemoryTaskRepository for quick dev
  const domain = new TaskDomainService();
  const createTask = new CreateTaskUseCase(repo, domain);
  const updateTask = new UpdateTaskUseCase(repo, domain);
  const deleteTask = new DeleteTaskUseCase(repo);
  const listTasks = new ListTasksUseCase(repo);

  const controller = new TaskController(createTask, updateTask, deleteTask, listTasks);
  app.use('/api/tasks', controller.router);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use(
    (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('[TASK-SERVICE][ERROR]', err);
      res.status(400).json({ message: err?.message || 'Unexpected error' });
    }
  );

  return app;
}
