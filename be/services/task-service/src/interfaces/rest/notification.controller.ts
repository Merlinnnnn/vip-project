import { Router, Request, Response } from 'express';
import { Mediator } from '../../shared/mediator';
import { TaskScheduledEvent } from '../../application/events/task-events';
import { TokenStore } from '../../infrastructure/cache/token.store';
import { prisma } from '../../infrastructure/persistence/prisma/prisma.client';
import { sseBroadcaster } from '../../infrastructure/cache/sse-broadcaster';

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management & SSE streaming
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Lấy danh sách notifications (50 mới nhất)
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/notifications/stream:
 *   get:
 *     summary: SSE stream — nhận notification realtime
 *     tags: [Notifications]
 *     description: |
 *       Server-Sent Events endpoint. Truyền access token qua `Authorization: Bearer <token>` hoặc query param `?token=<token>`.
 *       Connection sẽ giữ mở vô thời hạn cho tới khi client đóng.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Access token (alternative to Authorization header)
 *     responses:
 *       200:
 *         description: SSE stream (text/event-stream)
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       401:
 *         description: Token không hợp lệ
 */

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Đánh dấu tất cả notifications đã đọc
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Đánh dấu một notification đã đọc
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 */

export class NotificationController {
  public readonly router = Router();
  private clients: { userId: string; res: Response }[] = [];

  constructor(
    private readonly mediator: Mediator,
    private readonly tokenStore?: TokenStore
  ) {
    this.router.get('/stream', this.stream.bind(this));
    this.router.get('/', this.getNotifications.bind(this));
    this.router.put('/read-all', this.markAllAsRead.bind(this));
    this.router.put('/:id/read', this.markAsRead.bind(this));

    // Subscribe to in-process events (task created/updated trên instance hiện tại)
    this.mediator.subscribe(TaskScheduledEvent, async (event) => {
      // 1. Save to DB
      try {
        const userId = event.userId;
        const message = `Task "${event.title}" scheduled for ${
          event.dueDate ? new Date(event.dueDate).toLocaleDateString() : 'N/A'
        }`;
        
        const notif = await prisma.notification.create({
          data: {
            userId,
            type: 'TASK_SCHEDULED',
            message
          }
        });

        // 2. Publish qua Redis Pub/Sub → TẤT CẢ instances nhận được
        //    (thay vì chỉ broadcast local in-memory)
        await sseBroadcaster.publish({
          type: 'TASK_SCHEDULED',
          data: {
            ...event,
            notificationId: notif.id
          }
        });
      } catch (error) {
        console.error('[NOTIFICATION] Failed to save notification to DB', error);
      }
    });

    // Khởi tạo Redis subscriber — nhận messages từ TẤT CẢ instances
    this.initRedisSub();
  }

  /**
   * Khởi tạo Redis Pub/Sub subscriber.
   * Khi nhận message từ bất kỳ instance nào, broadcast tới local SSE clients.
   */
  private initRedisSub(): void {
    sseBroadcaster.start((rawMessage: string) => {
      try {
        const message = JSON.parse(rawMessage);
        this.broadcastLocal(message);
      } catch (err) {
        console.error('[NOTIFICATION] Failed to parse Redis message:', err);
      }
    }).catch((err) => {
      console.error('[NOTIFICATION] Failed to start SSE broadcaster:', err);
    });
  }

  private async getUserIdFromReq(req: Request): Promise<string | null> {
    const bearerHeader = req.header('authorization')?.replace(/^Bearer\s*/i, '').trim();
    if (!bearerHeader || !this.tokenStore) return null;
    return await this.tokenStore.getUserIdByAccessToken(bearerHeader);
  }

  private async getNotifications(req: Request, res: Response) {
    const userId = await this.getUserIdFromReq(req);
    if (!userId) {
       res.status(401).json({ message: 'Unauthorized' });
       return;
    }

    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async markAllAsRead(req: Request, res: Response) {
    const userId = await this.getUserIdFromReq(req);
    if (!userId) {
       res.status(401).json({ message: 'Unauthorized' });
       return;
    }

    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async markAsRead(req: Request, res: Response) {
    const userId = await this.getUserIdFromReq(req);
    if (!userId) {
       res.status(401).json({ message: 'Unauthorized' });
       return;
    }

    try {
      const id = req.params.id;
      await prisma.notification.updateMany({
        where: { id, userId }, // Ensure user owns it
        data: { isRead: true }
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async stream(req: Request, res: Response) {
    // ── Authenticate ─────────────────────────────────────────────
    // Lấy token từ Authorization header hoặc query param ?token=
    const bearerHeader = req.header('authorization')?.replace(/^Bearer\s*/i, '').trim();
    const queryToken = req.query.token as string | undefined;
    const rawToken = bearerHeader ?? queryToken;

    if (!rawToken) {
      res.status(401).json({ message: 'Missing access token for SSE stream' });
      return;
    }

    let userId: string | null = null;

    if (this.tokenStore) {
      userId = await this.tokenStore.getUserIdByAccessToken(rawToken);
    }

    if (!userId) {
      res.status(401).json({ message: 'Invalid or expired access token' });
      return;
    }
    // ─────────────────────────────────────────────────────────────

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const client = { userId, res };
    this.clients.push(client);
    console.log(`[NOTIFICATION] Client connected (userId=${userId}). Total: ${this.clients.length}`);

    req.on('close', () => {
      this.clients = this.clients.filter(c => c.res !== res);
      console.log(`[NOTIFICATION] Client disconnected (userId=${userId}). Total: ${this.clients.length}`);
    });
  }

  /**
   * Broadcast tới LOCAL SSE clients trên instance hiện tại.
   * Được gọi khi nhận message từ Redis Pub/Sub (gốc từ bất kỳ instance nào).
   */
  private broadcastLocal(message: any) {
    const eventUserId = message.data?.userId;
    const data = `data: ${JSON.stringify(message)}\n\n`;

    this.clients.forEach(client => {
      if (!eventUserId || client.userId === eventUserId) {
        client.res.write(data);
      }
    });
  }
}
