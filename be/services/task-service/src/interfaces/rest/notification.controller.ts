import { Router, Request, Response } from 'express';
import { Mediator } from '../../shared/mediator';
import { TaskScheduledEvent } from '../../application/events/task-events';
import { TokenStore } from '../../infrastructure/cache/token.store';

export class NotificationController {
  public readonly router = Router();
  private clients: { userId: string; res: Response }[] = [];

  constructor(
    private readonly mediator: Mediator,
    private readonly tokenStore?: TokenStore
  ) {
    this.router.get('/stream', this.stream.bind(this));

    // Subscribe to events
    this.mediator.subscribe(TaskScheduledEvent, (event) => {
      this.broadcast({
        type: 'TASK_SCHEDULED',
        data: event
      });
    });
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

  private broadcast(message: any) {
    const eventUserId = message.data?.userId;
    const data = `data: ${JSON.stringify(message)}\n\n`;

    this.clients.forEach(client => {
      if (!eventUserId || client.userId === eventUserId) {
        client.res.write(data);
      }
    });
  }
}
