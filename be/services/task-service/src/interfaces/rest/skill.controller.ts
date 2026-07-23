import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import { Mediator } from '../../shared/mediator';
import {
  CreateSkillCommand,
  ListSkillsQuery,
  UpdateSkillCommand,
  DeleteSkillCommand,
  GetUserStatsQuery
} from '../../application/handlers/skills.handler';

/**
 * @swagger
 * tags:
 *   name: Skills
 *   description: Skill tracking & statistics
 */

/**
 * @swagger
 * /api/skills:
 *   get:
 *     summary: Lấy danh sách skills của user
 *     tags: [Skills]
 *     security:
 *       - BearerAuth: []
 *       - UserIdHeader: []
 *     responses:
 *       200:
 *         description: Danh sách skills
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Skill'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/skills/stats:
 *   get:
 *     summary: Thống kê tổng hợp skills của user
 *     tags: [Skills]
 *     security:
 *       - BearerAuth: []
 *       - UserIdHeader: []
 *     responses:
 *       200:
 *         description: Dữ liệu thống kê
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/skills:
 *   post:
 *     summary: Tạo skill mới
 *     tags: [Skills]
 *     security:
 *       - BearerAuth: []
 *       - UserIdHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSkillRequest'
 *     responses:
 *       201:
 *         description: Skill vừa tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
 *       400:
 *         description: Dữ liệu không hợp lệ
 */

/**
 * @swagger
 * /api/skills/{id}:
 *   put:
 *     summary: Cập nhật skill
 *     tags: [Skills]
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
 *             $ref: '#/components/schemas/UpdateSkillRequest'
 *     responses:
 *       200:
 *         description: Skill đã cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
 *       404:
 *         description: Skill không tồn tại
 */

/**
 * @swagger
 * /api/skills/{id}:
 *   delete:
 *     summary: Xóa skill
 *     tags: [Skills]
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
 *         description: Skill không tồn tại
 */

export class SkillController {
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
    this.router.get('/stats', this.getStats);
    // Apply write limiter chỉ với các mutation operations
    this.router.post('/', ...(writeLimiter ? [writeLimiter] : []), this.create);
    this.router.put('/:id', ...(writeLimiter ? [writeLimiter] : []), this.update);
    this.router.delete('/:id', ...(writeLimiter ? [writeLimiter] : []), this.remove);
  }

  private getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = res.locals.userId;
      const skills = await this.mediator.query(new ListSkillsQuery(userId));
      res.json(skills);
    } catch (err) {
      next(err);
    }
  };

  private getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = res.locals.userId;
      const stats = await this.mediator.query(new GetUserStatsQuery(userId));
      res.json(stats);
    } catch (err) {
      next(err);
    }
  };

  private create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = res.locals.userId;
      const skill = await this.mediator.send(new CreateSkillCommand(userId, {
        name: req.body.name,
        targetMinutes: req.body.targetMinutes
      }));
      res.status(201).json(skill);
    } catch (err) {
      next(err);
    }
  };

  private update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = res.locals.userId;
      const skill = await this.mediator.send(new UpdateSkillCommand(userId, req.params.id, {
        name: req.body.name,
        targetMinutes: req.body.targetMinutes
      }));
      res.json(skill);
    } catch (err) {
      next(err);
    }
  };

  private remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = res.locals.userId;
      await this.mediator.send(new DeleteSkillCommand(userId, req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

