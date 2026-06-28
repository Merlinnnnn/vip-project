import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import { Mediator } from '../../shared/mediator';
import { TokenStore } from '../../infrastructure/cache/token.store';
import {
  CreateTaskCommand,
  UpdateTaskCommand,
  DeleteTaskCommand,
  ListTasksQuery,
  GetTaskQuery
} from '../../application/handlers/tasks.handler';

export class TaskController {
  public readonly router: Router;

  constructor(
    private readonly mediator: Mediator,
    private readonly tokenStore?: TokenStore,
    private readonly writeLimiter?: RequestHandler
  ) {
    this.router = Router();
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    // Apply write limiter chỉ với các mutation operations
    this.router.post('/', ...(writeLimiter ? [writeLimiter] : []), this.create);
    this.router.put('/:id', ...(writeLimiter ? [writeLimiter] : []), this.update);
    this.router.delete('/:id', ...(writeLimiter ? [writeLimiter] : []), this.remove);
  }

  private getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(_req, res);
      if (!userId) return;
      const tasks = await this.mediator.query(new ListTasksQuery(userId));
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  };

  private getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(req, res);
      if (!userId) return;
      const task = await this.mediator.query(new GetTaskQuery(userId, req.params.id));
      res.json(task);
    } catch (error) {
      next(error);
    }
  }

  private create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(req, res);
      if (!userId) return;
      const task = await this.mediator.send(new CreateTaskCommand(userId, {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        learningMinutes: req.body.learningMinutes,
        dueDate: req.body.dueDate,
        skillId: req.body.skillId
      }));
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  };

  private update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(req, res);
      if (!userId) return;
      const task = await this.mediator.send(new UpdateTaskCommand(userId, req.params.id, req.body));
      res.json(task);
    } catch (err) {
      next(err);
    }
  };

  private remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(req, res);
      if (!userId) return;
      await this.mediator.send(new DeleteTaskCommand(userId, req.params.id));
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
