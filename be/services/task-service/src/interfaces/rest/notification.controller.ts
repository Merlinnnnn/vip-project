import { Router, Request, Response } from 'express';
import { Mediator } from '../../shared/mediator';
import { TaskScheduledEvent } from '../../application/events/task-events';

export class NotificationController {
  public readonly router = Router();
  private clients: Response[] = [];

  constructor(private readonly mediator: Mediator) {
    this.router.get('/stream', this.stream.bind(this));
    
    // Subscribe to events
    this.mediator.subscribe(TaskScheduledEvent, (event) => {
      this.broadcast({
        type: 'TASK_SCHEDULED',
        data: event
      });
    });
  }

  private stream(req: Request, res: Response) {
    // Basic SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    this.clients.push(res);
    console.log('[NOTIFICATION] Client connected. Total clients:', this.clients.length);

    req.on('close', () => {
      this.clients = this.clients.filter(c => c !== res);
      console.log('[NOTIFICATION] Client disconnected. Total clients:', this.clients.length);
    });
  }

  private broadcast(message: any) {
    const data = `data: ${JSON.stringify(message)}\n\n`;
    this.clients.forEach(client => client.write(data));
  }
}
