import { prisma } from '../persistence/prisma/prisma.client';
import { RabbitMQPublisher } from './rabbitmq.publisher';

export class OutboxWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private readonly publisher: RabbitMQPublisher,
    private readonly pollIntervalMs: number = 5000,
    private readonly maxAttempts: number = 5
  ) {}

  start(): void {
    if (this.intervalId) return;
    console.log('[OutboxWorker][TASK] Starting worker...');
    this.intervalId = setInterval(() => {
      this.processEvents().catch((err) => {
        console.error('[OutboxWorker][TASK] Error processing outbox events:', err);
      });
    }, this.pollIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[OutboxWorker][TASK] Worker stopped.');
    }
  }

  private async processEvents(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Find pending outbox events
      const events = await prisma.outboxEvent.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        take: 10, // Process in batches
      });

      if (events.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`[OutboxWorker][TASK] Found ${events.length} pending events to process.`);

      for (const event of events) {
        try {
          // Attempt to publish
          await this.publisher.publish(event.routingKey, event.payload as Record<string, unknown>);

          // Update status to 'sent'
          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: 'sent',
              attempts: event.attempts + 1,
              processedAt: new Date(),
            },
          });
        } catch (publishErr) {
          console.error(`[OutboxWorker][TASK] Failed to publish event ${event.id}:`, publishErr);
          const nextAttempts = event.attempts + 1;
          const status = nextAttempts >= this.maxAttempts ? 'failed' : 'pending';

          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status,
              attempts: nextAttempts,
            },
          });
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}
