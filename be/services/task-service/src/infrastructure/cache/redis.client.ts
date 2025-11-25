import { createClient, type RedisClientType } from 'redis';
import { envConfig } from '../../config/env.config';

const { redisUrl } = envConfig();

export const redisClient: RedisClientType = createClient({ url: redisUrl });

redisClient.on('error', (err) => {
  console.error('[REDIS] client error', err);
});

let connectPromise: Promise<RedisClientType> | null = null;

export const ensureRedisConnection = async (): Promise<void> => {
  if (redisClient.isOpen) return;

  if (!connectPromise) {
    connectPromise = redisClient.connect();
    connectPromise.catch((err) => {
      connectPromise = null;
      throw err;
    });
  }

  await connectPromise;
};
