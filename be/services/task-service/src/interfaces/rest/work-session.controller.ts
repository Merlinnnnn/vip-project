import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import { Mediator } from '../../shared/mediator';
import {
  StartSessionCommand,
  StopSessionCommand,
  GetActiveSessionQuery,
  ListSessionsQuery,
  GetSessionStatsQuery,
} from '../../application/handlers/work-sessions.handler';

/**
 * @swagger
 * tags:
 *   name: WorkSessions
 *   description: Time tracking — work session management
 */

/**
 * @swagger
 * /api/work-sessions/start:
 *   post:
 *     summary: Bắt đầu phiên làm việc mới
 *     tags: [WorkSessions]
 *     security:
 *       - BearerAuth: []
 *       - UserIdHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskId:
 *                 type: string
 *                 format: uuid
 *               skillId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Session mới được tạo
 *       400:
 *         description: Đã có session đang chạy
 */

/**
 * @swagger
 * /api/work-sessions/{id}/stop:
 *   put:
 *     summary: Kết thúc phiên làm việc + tích luỹ giờ vào skill
 *     tags: [WorkSessions]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session đã dừng, giờ đã tích
 *       404:
 *         description: Session không tồn tại
 */

/**
 * @swagger
 * /api/work-sessions/active:
 *   get:
 *     summary: Lấy session đang chạy (dùng khi reload page để recovery timer)
 *     tags: [WorkSessions]
 *     security:
 *       - BearerAuth: []
 *       - UserIdHeader: []
 *     responses:
 *       200:
 *         description: Session đang chạy hoặc null
 */

/**
 * @swagger
 * /api/work-sessions:
 *   get:
 *     summary: Danh sách sessions (query theo thời gian)
 *     tags: [WorkSessions]
 *     security:
 *       - BearerAuth: []
 *       - UserIdHeader: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Danh sách sessions
 */

/**
 * @swagger
 * /api/work-sessions/stats:
 *   get:
 *     summary: Thống kê work sessions (today, week, month, by skill, heatmap, streak)
 *     tags: [WorkSessions]
 *     security:
 *       - BearerAuth: []
 *       - UserIdHeader: []
 *     responses:
 *       200:
 *         description: Dữ liệu thống kê aggregate
 */

export class WorkSessionController {
  public readonly router: Router;

  constructor(
    private readonly mediator: Mediator,
    authMiddleware: RequestHandler,
    writeLimiter?: RequestHandler
  ) {
    this.router = Router();
    this.router.use(authMiddleware);

    // Queries (no write limiter)
    this.router.get('/active', this.getActive);
    this.router.get('/stats', this.getStats);
    this.router.get('/', this.list);

    // Mutations (with write limiter)
    this.router.post('/start', ...(writeLimiter ? [writeLimiter] : []), this.start);
    this.router.put('/:id/stop', ...(writeLimiter ? [writeLimiter] : []), this.stop);
  }

  private start = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = res.locals.userId;
      const session = await this.mediator.send(
        new StartSessionCommand(userId, {
          taskId: req.body.taskId,
          skillId: req.body.skillId,
        })
      );
      res.status(201).json(session);
    } catch (err) {
      next(err);
    }
  };

  private stop = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = res.locals.userId;
      const session = await this.mediator.send(
        new StopSessionCommand(userId, req.params.id, {
          note: req.body.note,
        })
      );
      res.json(session);
    } catch (err) {
      next(err);
    }
  };

  private getActive = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = res.locals.userId;
      const session = await this.mediator.query(
        new GetActiveSessionQuery(userId)
      );
      res.json(session);
    } catch (err) {
      next(err);
    }
  };

  private list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = res.locals.userId;
      const from = req.query.from
        ? new Date(req.query.from as string)
        : new Date(Date.now() - 30 * 86400000); // default: last 30 days
      const to = req.query.to ? new Date(req.query.to as string) : new Date();
      const sessions = await this.mediator.query(
        new ListSessionsQuery(userId, from, to)
      );
      res.json(sessions);
    } catch (err) {
      next(err);
    }
  };

  private getStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = res.locals.userId;
      const stats = await this.mediator.query(
        new GetSessionStatsQuery(userId)
      );
      res.json(stats);
    } catch (err) {
      next(err);
    }
  };
}
