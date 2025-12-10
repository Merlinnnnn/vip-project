import { Router, type Request, type Response, type NextFunction } from 'express';
import { CreateTaskUseCase } from '../../application/use-cases/create-task.usecase';
import { UpdateTaskUseCase } from '../../application/use-cases/update-task.usecase';
import { DeleteTaskUseCase } from '../../application/use-cases/delete-task.usecase';
import { ListTasksUseCase } from '../../application/use-cases/list-tasks.usecase';
import { TokenStore } from '../../infrastructure/cache/token.store';

export class TaskController {
  public readonly router: Router;

  constructor(
    private readonly createTask: CreateTaskUseCase,
    private readonly updateTask: UpdateTaskUseCase,
    private readonly deleteTask: DeleteTaskUseCase,
    private readonly listTasks: ListTasksUseCase,
    private readonly tokenStore?: TokenStore
  ) {
    this.router = Router();
    this.router.get('/', this.getAll);
    this.router.post('/', this.create);
    this.router.put('/:id', this.update);
    this.router.delete('/:id', this.remove);
  }

  private getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(_req, res);
      if (!userId) return;
      const tasks = await this.listTasks.execute(userId);
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  };

  private create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(req, res);
      if (!userId) return;
      const task = await this.createTask.execute(userId, {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        learningMinutes: req.body.learningMinutes,
        skillId: req.body.skillId
      });
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  };

  private update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(req, res);
      if (!userId) return;
      const task = await this.updateTask.execute(userId, req.params.id, req.body);
      res.json(task);
    } catch (err) {
      next(err);
    }
  };

  private remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(req, res);
      if (!userId) return;
      await this.deleteTask.execute(userId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  private async getUserId(req: Request, res: Response): Promise<string | undefined> {
    const userId = req.header('x-user-id');
    if (userId) return userId;

    const bearer = req.header('authorization')?.replace(/^Bearer\s*/i, '').trim();
    if (bearer && this.tokenStore) {
      const resolved = await this.tokenStore.getUserIdByAccessToken(bearer);
      if (resolved) return resolved;
      res.status(401).json({ message: 'Invalid or expired bearer token' });
      return;
    }

    res.status(400).json({ message: 'Missing x-user-id or bearer token' });
    return;
  }
}
