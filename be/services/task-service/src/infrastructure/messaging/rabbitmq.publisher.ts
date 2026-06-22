import amqplib from 'amqplib';

const EXCHANGE_NAME = 'app.events';
const EXCHANGE_TYPE = 'topic';

/**
 * RabbitMQPublisher — publish domain events lên exchange app.events (topic exchange).
 *
 * Pattern: Fire-and-forget với lazy connect.
 *   - Kết nối được thực hiện lần đầu khi publish, tái sử dụng sau đó.
 *   - Nếu publish thất bại (RabbitMQ down), chỉ log warning, KHÔNG throw — để tránh
 *     làm gián đoạn flow chính (task CRUD vẫn thành công dù notification fail).
 */
export class RabbitMQPublisher {
  private conn: Awaited<ReturnType<typeof amqplib.connect>> | null = null;
  private ch: Awaited<ReturnType<Awaited<ReturnType<typeof amqplib.connect>>['createChannel']>> | null = null;
  private connecting = false;

  constructor(private readonly url: string) {}

  private async connect(): Promise<void> {
    if (this.ch) return;
    if (this.connecting) return;

    this.connecting = true;
    try {
      this.conn = await amqplib.connect(this.url);
      this.ch = await this.conn.createChannel();
      await this.ch.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

      this.conn.on('error', (err: Error) => {
        console.error('[RABBITMQ-PUB][TASK] Connection error:', err.message);
        this.conn = null;
        this.ch = null;
      });

      this.conn.on('close', () => {
        console.warn('[RABBITMQ-PUB][TASK] Connection closed. Will reconnect on next publish.');
        this.conn = null;
        this.ch = null;
      });

      console.log('[RABBITMQ-PUB][TASK] Connected to RabbitMQ.');
    } catch (err) {
      this.conn = null;
      this.ch = null;
      throw err;
    } finally {
      this.connecting = false;
    }
  }

  /**
   * Publish một event lên exchange app.events với routingKey cho trước.
   * Fire-and-forget: lỗi chỉ được log, không throw ra ngoài.
   */
  async publish(routingKey: string, payload: Record<string, unknown>): Promise<void> {
    try {
      if (!this.ch) {
        await this.connect();
      }

      const buffer = Buffer.from(JSON.stringify(payload));
      const success = this.ch!.publish(EXCHANGE_NAME, routingKey, buffer, {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
      });

      if (!success) {
        throw new Error('Channel publish returned false (buffer full/channel closed)');
      }

      console.log(`[RABBITMQ-PUB][TASK] Published event: ${routingKey}`, payload);
    } catch (err) {
      console.warn(`[RABBITMQ-PUB][TASK] Failed to publish event "${routingKey}":`, (err as Error).message);
      throw err;
    }
  }

  async close(): Promise<void> {
    try {
      await this.ch?.close();
      await this.conn?.close();
    } catch {
      // ignore close errors
    }
  }
}
