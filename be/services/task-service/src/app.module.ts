import express from 'express';
import cors from 'cors';
import { TaskDomainService } from './domain/services/task-domain.service';
import { InMemoryTaskRepository } from './infrastructure/persistence/task.inmemory.repository';
import { CreateTaskUseCase } from './application/use-cases/create-task.usecase';
import { UpdateTaskUseCase } from './application/use-cases/update-task.usecase';
import { DeleteTaskUseCase } from './application/use-cases/delete-task.usecase';
import { ListTasksUseCase } from './application/use-cases/list-tasks.usecase';
import { TaskController } from './interfaces/rest/task.controller';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const repo = new InMemoryTaskRepository();
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
