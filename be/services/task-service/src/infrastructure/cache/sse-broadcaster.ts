import { createClient, type RedisClientType } from 'redis';
import { envConfig } from '../../config/env.config';

const CHANNEL = 'sse:notifications';

/**
 * SSEBroadcaster — giải quyết vấn đề SSE với nhiều replicas.
 *
 * Vấn đề:
 *   Mỗi instance giữ danh sách SSE clients riêng (in-memory).
 *   Khi event xảy ra ở instance A nhưng client kết nối SSE tới instance B,
 *   instance B không biết → client không nhận được event.
 *
 * Giải pháp:
 *   Dùng Redis Pub/Sub làm "bus" giữa các instances.
 *   - Khi có event mới: publish lên Redis channel
 *   - Tất cả instances subscribe channel → nhận message → broadcast tới local SSE clients
 *
 * Lưu ý:
 *   Redis Pub/Sub cần 2 connections riêng biệt (subscriber không thể dùng chung connection
 *   với các lệnh Redis khác).
 */
export class SSEBroadcaster {
  private subClient: RedisClientType;
  private pubClient: RedisClientType;
  private ready = false;

  constructor() {
    const { redisUrl } = envConfig();
    // Subscriber cần connection riêng — Redis protocol yêu cầu
    this.subClient = createClient({ url: redisUrl });
    this.pubClient = createClient({ url: redisUrl });

    this.subClient.on('error', (err) =>
      console.error('[SSE-BROADCASTER] Sub client error:', err.message)
    );
    this.pubClient.on('error', (err) =>
      console.error('[SSE-BROADCASTER] Pub client error:', err.message)
    );
  }

  /**
   * Khởi tạo connections và subscribe channel.
   * @param onMessage - callback khi nhận message từ bất kỳ instance nào
   */
  async start(onMessage: (message: string) => void): Promise<void> {
    if (this.ready) return;

    await this.subClient.connect();
    await this.pubClient.connect();

    await this.subClient.subscribe(CHANNEL, (message) => {
      onMessage(message);
    });

    this.ready = true;
    console.log(`[SSE-BROADCASTER] Subscribed to Redis channel: "${CHANNEL}"`);
  }

  /**
   * Publish message lên Redis channel → tất cả instances nhận được.
   */
  async publish(message: object): Promise<void> {
    if (!this.ready) {
      console.warn('[SSE-BROADCASTER] Not ready yet, skipping publish.');
      return;
    }

    try {
      await this.pubClient.publish(CHANNEL, JSON.stringify(message));
    } catch (err) {
      console.error('[SSE-BROADCASTER] Failed to publish:', (err as Error).message);
    }
  }

  async stop(): Promise<void> {
    try {
      await this.subClient.unsubscribe(CHANNEL);
      await this.subClient.quit();
      await this.pubClient.quit();
      this.ready = false;
    } catch {
      // ignore close errors
    }
  }
}

/** Singleton */
export const sseBroadcaster = new SSEBroadcaster();
