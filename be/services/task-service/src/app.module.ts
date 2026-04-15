import express from 'express';
import cors from 'cors';
import { TaskDomainService } from './domain/services/task-domain.service';
import { PrismaTaskRepository } from './infrastructure/persistence/task.prisma.repository';
import { PrismaSkillRepository } from './infrastructure/persistence/skill.prisma.repository';
import { TaskController } from './interfaces/rest/task.controller';
import { TokenStore } from './infrastructure/cache/token.store';
import { AuthController } from './interfaces/rest/auth.controller';
import { SkillController } from './interfaces/rest/skill.controller';
import { Mediator } from './shared/mediator';
import {
  CreateTaskCommand,
  CreateTaskHandler,
  UpdateTaskCommand,
  UpdateTaskHandler,
  DeleteTaskCommand,
  DeleteTaskHandler,
  ListTasksQuery,
  ListTasksHandler
} from './application/handlers/tasks.handler';
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

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const repo = new PrismaTaskRepository();
  const skillRepo = new PrismaSkillRepository();
  const domain = new TaskDomainService();
  const tokenStore = new TokenStore();

  // Mediator setup
  const mediator = new Mediator();

  // Task handlers
  mediator.register(CreateTaskCommand, new CreateTaskHandler(repo, domain, skillRepo));
  mediator.register(UpdateTaskCommand, new UpdateTaskHandler(repo, domain, skillRepo));
  mediator.register(DeleteTaskCommand, new DeleteTaskHandler(repo, skillRepo));
  mediator.register(ListTasksQuery, new ListTasksHandler(repo));

  // Skill handlers
  mediator.register(CreateSkillCommand, new CreateSkillHandler(skillRepo));
  mediator.register(UpdateSkillCommand, new UpdateSkillHandler(skillRepo));
  mediator.register(DeleteSkillCommand, new DeleteSkillHandler(skillRepo));
  mediator.register(ListSkillsQuery, new ListSkillsHandler(skillRepo));
  mediator.register(GetUserStatsQuery, new GetUserStatsHandler(skillRepo));

  const tasksController = new TaskController(mediator, tokenStore);
  const skillsController = new SkillController(mediator, tokenStore);
  const authController = new AuthController(tokenStore);

  app.use('/api/tasks', tasksController.router);
  app.use('/api/skills', skillsController.router);
  app.use('/api/auth', authController.router);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use(
    (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('[TASK-SERVICE][ERROR]', err);
      res.status(400).json({ message: err?.message || 'Unexpected error' });
    }
  );

  return app;
}
