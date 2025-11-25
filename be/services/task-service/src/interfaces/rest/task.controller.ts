import { Router, type Request, type Response, type NextFunction } from 'express';
import { CreateTaskUseCase } from '../../application/use-cases/create-task.usecase';
import { UpdateTaskUseCase } from '../../application/use-cases/update-task.usecase';
import { DeleteTaskUseCase } from '../../application/use-cases/delete-task.usecase';
import { ListTasksUseCase } from '../../application/use-cases/list-tasks.usecase';

export class TaskController {
  public readonly router: Router;

  constructor(
    private readonly createTask: CreateTaskUseCase,
    private readonly updateTask: UpdateTaskUseCase,
    private readonly deleteTask: DeleteTaskUseCase,
    private readonly listTasks: ListTasksUseCase
  ) {
    this.router = Router();
    this.router.get('/', this.getAll);
    this.router.post('/', this.create);
    this.router.put('/:id', this.update);
    this.router.delete('/:id', this.remove);
  }

  private getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(_req, res);
      if (!userId) return;
      const tasks = await this.listTasks.execute(userId);
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  };

  private create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;
      const task = await this.createTask.execute(userId, {
        title: req.body.title,
        description: req.body.description
      });
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  };

  private update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;
      const task = await this.updateTask.execute(userId, req.params.id, req.body);
      res.json(task);
    } catch (err) {
      next(err);
    }
  };

  private remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;
      await this.deleteTask.execute(userId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  private getUserId(req: Request, res: Response): string | undefined {
    const token = this.extractAccessToken(req);
    if (!token) {
      res.status(401).json({ message: 'Missing access token' });
      return;
    }
    const payload = this.decodeToken(token);
    if (!payload?.sub) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    return payload.sub;
  }

  private extractAccessToken(req: Request): string | undefined {
    const bearer = req.headers.authorization;
    if (bearer?.startsWith('Bearer ')) {
      return bearer.substring('Bearer '.length);
    }
    const cookieToken = req.cookies?.access_token as string | undefined;
    if (cookieToken) return cookieToken;
    return undefined;
  }

  private decodeToken(token: string): { sub?: string; email?: string } | undefined {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      return JSON.parse(decoded) as { sub?: string; email?: string };
    } catch {
      return undefined;
    }
  }
}
