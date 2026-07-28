import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import { Mediator } from '../../shared/mediator';
import {
  CreateTaskCommand,
  UpdateTaskCommand,
  DeleteTaskCommand,
  ListTasksQuery,
  GetTaskQuery
} from '../../application/handlers/tasks.handler';

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task CRUD operations
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Lấy danh sách tasks của user
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *       - UserIdHeader: []
 *     responses:
 *       200:
 *         description: Danh sách tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Lấy chi tiết một task
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *       - UserIdHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Chi tiết task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task không tồn tại
 */

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Tạo task mới
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *       - UserIdHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       201:
 *         description: Task vừa tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Dữ liệu không hợp lệ
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Cập nhật task
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *       - UserIdHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskRequest'
 *     responses:
 *       200:
 *         description: Task đã cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task không tồn tại
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Xóa task
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *       - UserIdHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Xóa thành công
 *       404:
 *         description: Task không tồn tại
 */

export class TaskController {
  public readonly router: Router;

  constructor(
    private readonly mediator: Mediator,
    authMiddleware: RequestHandler,
    writeLimiter?: RequestHandler
  ) {
    this.router = Router();

    // Auth middleware applied to all routes
    this.router.use(authMiddleware);

    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    // Apply write limiter chỉ với các mutation operations
    this.router.post('/', ...(writeLimiter ? [writeLimiter] : []), this.create);
    this.router.put('/:id', ...(writeLimiter ? [writeLimiter] : []), this.update);
    this.router.delete('/:id', ...(writeLimiter ? [writeLimiter] : []), this.remove);
  }

  private getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = res.locals.userId;
      const tasks = await this.mediator.query(new ListTasksQuery(userId));
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  };

  private getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = res.locals.userId;
      const task = await this.mediator.query(new GetTaskQuery(userId, req.params.id));
      res.json(task);
    } catch (error) {
      next(error);
    }
  };

  private create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = res.locals.userId;
      const task = await this.mediator.send(new CreateTaskCommand(userId, {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        estimatedMinutes: req.body.estimatedMinutes,
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
      const userId: string = res.locals.userId;
      const task = await this.mediator.send(new UpdateTaskCommand(userId, req.params.id, req.body));
      res.json(task);
    } catch (err) {
      next(err);
    }
  };

  private remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = res.locals.userId;
      await this.mediator.send(new DeleteTaskCommand(userId, req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
