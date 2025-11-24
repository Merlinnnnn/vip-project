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
      const tasks = await this.listTasks.execute();
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  };

  private create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await this.createTask.execute({
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
      const task = await this.updateTask.execute(req.params.id, req.body);
      res.json(task);
    } catch (err) {
      next(err);
    }
  };

  private remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.deleteTask.execute(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
