import express from 'express';
import cors from 'cors';
import { TaskDomainService } from './domain/services/task-domain.service';
import { PrismaTaskRepository } from './infrastructure/persistence/task.prisma.repository';
import { PrismaSkillRepository } from './infrastructure/persistence/skill.prisma.repository';
import { CreateTaskUseCase } from './application/use-cases/create-task.usecase';
import { UpdateTaskUseCase } from './application/use-cases/update-task.usecase';
import { DeleteTaskUseCase } from './application/use-cases/delete-task.usecase';
import { ListTasksUseCase } from './application/use-cases/list-tasks.usecase';
import { CreateSkillUseCase } from './application/use-cases/create-skill.usecase';
import { ListSkillsUseCase } from './application/use-cases/list-skills.usecase';
import { TaskController } from './interfaces/rest/task.controller';
import { TokenStore } from './infrastructure/cache/token.store';
import { AuthController } from './interfaces/rest/auth.controller';
import { SkillController } from './interfaces/rest/skill.controller';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const repo = new PrismaTaskRepository(); // switch to InMemoryTaskRepository for quick dev
  const skillRepo = new PrismaSkillRepository(); // switch to InMemorySkillRepository for quick dev
  const domain = new TaskDomainService();
  const createTask = new CreateTaskUseCase(repo, domain, skillRepo);
  const updateTask = new UpdateTaskUseCase(repo, domain, skillRepo);
  const deleteTask = new DeleteTaskUseCase(repo, skillRepo);
  const listTasks = new ListTasksUseCase(repo);
  const createSkill = new CreateSkillUseCase(skillRepo);
  const listSkills = new ListSkillsUseCase(skillRepo);
  const tokenStore = new TokenStore();

  const tasksController = new TaskController(createTask, updateTask, deleteTask, listTasks, tokenStore);
  const skillsController = new SkillController(createSkill, listSkills, tokenStore);
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
