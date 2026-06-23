import { prisma } from '../persistence/prisma/prisma.client';
import { RabbitMQPublisher } from './rabbitmq.publisher';

export class OutboxWorker {
  private pollIntervalId: NodeJS.Timeout | null = null;
  private cleanupIntervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  // Cleanup chạy mỗi 1 giờ
  private static readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

  constructor(
    private readonly publisher: RabbitMQPublisher,
    private readonly pollIntervalMs: number = 5000,
    private readonly maxAttempts: number = 5,
    private readonly cleanupRetentionDays: number = 7
  ) {}

  start(): void {
    if (this.pollIntervalId) return;
    console.log('[OutboxWorker][AUTH] Starting worker...');

    // Poll pending events
    this.pollIntervalId = setInterval(() => {
      this.processEvents().catch((err) => {
        console.error('[OutboxWorker][AUTH] Error processing outbox events:', err);
      });
    }, this.pollIntervalMs);

    // Cleanup old sent/failed events
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupOldEvents().catch((err) => {
        console.error('[OutboxWorker][AUTH] Error cleaning up old outbox events:', err);
      });
    }, OutboxWorker.CLEANUP_INTERVAL_MS);

    // Run cleanup once on startup
    this.cleanupOldEvents().catch((err) => {
      console.error('[OutboxWorker][AUTH] Error during initial cleanup:', err);
    });
  }

  stop(): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    console.log('[OutboxWorker][AUTH] Worker stopped.');
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

      console.log(`[OutboxWorker][AUTH] Found ${events.length} pending events to process.`);

      for (const event of events) {
        try {
          // Attempt to publish. Prisma JSON payload needs to be cast to Record<string, unknown>
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
          console.error(`[OutboxWorker][AUTH] Failed to publish event ${event.id}:`, publishErr);
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

  /**
   * Xóa các event đã gửi thành công ('sent') hoặc thất bại vĩnh viễn ('failed')
   * mà đã cũ hơn số ngày cấu hình (mặc định: 7 ngày).
   */
  private async cleanupOldEvents(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.cleanupRetentionDays * 24 * 60 * 60 * 1000);

    const result = await prisma.outboxEvent.deleteMany({
      where: {
        status: { in: ['sent', 'failed'] },
        createdAt: { lt: cutoffDate },
      },
    });

    if (result.count > 0) {
      console.log(
        `[OutboxWorker][AUTH] Cleanup: deleted ${result.count} old events (older than ${this.cleanupRetentionDays} days).`
      );
    }
  }
}
