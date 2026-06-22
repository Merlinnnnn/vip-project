import amqplib from 'amqplib';
import { handleUserRegistered } from '../handlers/user-registered.handler';
import { handleTaskDueSoon } from '../handlers/task-due-soon.handler';
import { handleSkillLevelUp } from '../handlers/skill-level-up.handler';

const EXCHANGE_NAME = 'app.events';
const EXCHANGE_TYPE = 'topic';
const QUEUE_NAME = 'notification-service.queue';

// Routing keys mà service này quan tâm
const BINDING_KEYS = [
  'user.registered',
  'task.due_soon',
  'skill.level_up',
];

/**
 * EventConsumer — lắng nghe events từ RabbitMQ và dispatch tới đúng handler.
 *
 * Pattern:
 *   - Durable queue: message không bị mất dù service restart
 *   - Manual ACK: chỉ ACK sau khi xử lý thành công, NACK (requeue) nếu lỗi
 *   - Prefetch = 1: không nhận message tiếp theo cho đến khi xử lý xong cái hiện tại
 */
export class EventConsumer {
  // amqplib v0.10 dùng ChannelModel (trả về từ connect())
  private conn: Awaited<ReturnType<typeof amqplib.connect>> | null = null;
  private ch: Awaited<ReturnType<Awaited<ReturnType<typeof amqplib.connect>>['createChannel']>> | null = null;

  constructor(private readonly rabbitmqUrl: string) {}

  async start(): Promise<void> {
    let retries = 0;
    const maxRetries = 10;
    const retryDelayMs = 5000;

    while (retries < maxRetries) {
      try {
        await this.connect();
        console.log('[CONSUMER] RabbitMQ consumer started successfully.');
        return;
      } catch (err) {
        retries++;
        console.warn(
          `[CONSUMER] Failed to connect to RabbitMQ (attempt ${retries}/${maxRetries}): ${(err as Error).message}`
        );
        if (retries < maxRetries) {
          console.log(`[CONSUMER] Retrying in ${retryDelayMs / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
      }
    }

    console.error('[CONSUMER] Could not connect to RabbitMQ after max retries. Consumer not started.');
  }

  private async connect(): Promise<void> {
    this.conn = await amqplib.connect(this.rabbitmqUrl);

    this.conn.on('error', (err: Error) => {
      console.error('[CONSUMER] RabbitMQ connection error:', err.message);
    });

    this.conn.on('close', () => {
      console.warn('[CONSUMER] RabbitMQ connection closed. Attempting to reconnect in 5s...');
      this.conn = null;
      this.ch = null;
      setTimeout(() => this.start(), 5000);
    });

    this.ch = await this.conn.createChannel();

    // Đảm bảo exchange tồn tại (idempotent)
    await this.ch.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

    // Tạo durable queue để không mất messages khi service restart
    await this.ch.assertQueue(QUEUE_NAME, {
      durable: true,
      arguments: {
        'x-message-ttl': 86400000, // 24h TTL để tránh đầy queue
      },
    });

    // Bind queue với tất cả routing keys
    for (const key of BINDING_KEYS) {
      await this.ch.bindQueue(QUEUE_NAME, EXCHANGE_NAME, key);
      console.log(`[CONSUMER] Bound queue "${QUEUE_NAME}" to routing key: "${key}"`);
    }

    // Prefetch = 1: xử lý tuần tự để tránh overload email SMTP
    await this.ch.prefetch(1);

    // Bắt đầu consume
    await this.ch.consume(QUEUE_NAME, this.onMessage.bind(this), { noAck: false });

    console.log(`[CONSUMER] Listening on queue: "${QUEUE_NAME}"`);
  }

  private async onMessage(msg: amqplib.ConsumeMessage | null): Promise<void> {
    if (!msg || !this.ch) return;

    const routingKey = msg.fields.routingKey;
    let payload: Record<string, unknown>;

    try {
      payload = JSON.parse(msg.content.toString());
    } catch (err) {
      console.error(`[CONSUMER] Failed to parse message for key "${routingKey}". Discarding.`);
      this.ch.nack(msg, false, false); // Discard unparseable messages
      return;
    }

    console.log(`[CONSUMER] Received event: "${routingKey}"`);

    try {
      await this.dispatch(routingKey, payload);
      this.ch.ack(msg); // Xác nhận xử lý thành công
    } catch (err) {
      console.error(`[CONSUMER] Error handling event "${routingKey}":`, (err as Error).message);
      // NACK với requeue=false để không bị lặp vô hạn
      this.ch.nack(msg, false, false);
    }
  }

  private async dispatch(routingKey: string, payload: Record<string, unknown>): Promise<void> {
    switch (routingKey) {
      case 'user.registered':
        await handleUserRegistered(payload as any);
        break;
      case 'task.due_soon':
        await handleTaskDueSoon(payload as any);
        break;
      case 'skill.level_up':
        await handleSkillLevelUp(payload as any);
        break;
      default:
        console.warn(`[CONSUMER] Unknown routing key: "${routingKey}". Skipping.`);
    }
  }

  async stop(): Promise<void> {
    try {
      await this.ch?.close();
      await this.conn?.close();
      console.log('[CONSUMER] RabbitMQ connection closed gracefully.');
    } catch {
      // ignore
    }
  }
}
