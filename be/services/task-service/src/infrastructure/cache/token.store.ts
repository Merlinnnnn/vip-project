import { envConfig } from '../../config/env.config';
import { ensureRedisConnection, redisClient } from './redis.client';

type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

type StoredCredentials = {
  username: string;
  password: string;
};

export class TokenStore {
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;

  constructor() {
    const { accessTokenTtlSeconds, refreshTokenTtlSeconds } = envConfig();
    this.accessTtlSeconds = accessTokenTtlSeconds;
    this.refreshTtlSeconds = refreshTokenTtlSeconds;
  }

  async saveTokens(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    await ensureRedisConnection();
    const tx = redisClient.multi();

    tx.set(this.accessKey(accessToken), userId, { EX: this.accessTtlSeconds });
    tx.set(this.refreshKey(refreshToken), userId, { EX: this.refreshTtlSeconds });
    tx.set(this.userKey(userId), JSON.stringify({ accessToken, refreshToken }), {
      EX: this.refreshTtlSeconds
    });

    await tx.exec();
  }

  async saveCredentials(userId: string, username: string, password: string): Promise<void> {
    await ensureRedisConnection();
    await redisClient.set(
      this.credentialsKey(userId),
      JSON.stringify({ username, password }),
      { EX: this.refreshTtlSeconds }
    );
  }

  async getCredentials(userId: string): Promise<{ username: string; password: string } | null> {
    const raw = await this.getString(this.credentialsKey(userId));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<StoredCredentials>;
      if (!parsed.username || !parsed.password) return null;
      return { username: parsed.username, password: parsed.password };
    } catch (err) {
      console.error('[REDIS] failed to parse cached credentials', err);
      return null;
    }
  }

  async getUserIdByAccessToken(token: string): Promise<string | null> {
    return this.getString(this.accessKey(token));
  }

  async getUserIdByRefreshToken(refreshToken: string): Promise<string | null> {
    return this.getString(this.refreshKey(refreshToken));
  }

  async getTokensForUser(userId: string): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const raw = await this.getString(this.userKey(userId));
    if (!raw) return { accessToken: null, refreshToken: null };

    try {
      const parsed = JSON.parse(raw) as Partial<StoredTokens>;
      return {
        accessToken: parsed.accessToken ?? null,
        refreshToken: parsed.refreshToken ?? null
      };
    } catch (err) {
      console.error('[REDIS] failed to parse cached tokens', err);
      return { accessToken: null, refreshToken: null };
    }
  }

  async revokeUserTokens(userId: string): Promise<void> {
    const raw = await this.getString(this.userKey(userId));
    let parsed: Partial<StoredTokens> = {};

    try {
      parsed = raw ? (JSON.parse(raw) as Partial<StoredTokens>) : {};
    } catch {
      parsed = {};
    }

    const keysToDelete: string[] = [this.userKey(userId)];
    if (parsed.accessToken) keysToDelete.push(this.accessKey(parsed.accessToken));
    if (parsed.refreshToken) keysToDelete.push(this.refreshKey(parsed.refreshToken));

    if (!keysToDelete.length) {
      await this.deleteCredentials(userId);
      return;
    }

    await ensureRedisConnection();
    await Promise.all(keysToDelete.map((key) => redisClient.del(key)));
    await this.deleteCredentials(userId);
  }

  private accessKey(token: string) {
    return `access-token:${token}`;
  }

  private refreshKey(token: string) {
    return `refresh-token:${token}`;
  }

  private userKey(userId: string) {
    return `user-tokens:${userId}`;
  }

  private credentialsKey(userId: string) {
    return `user-credentials:${userId}`;
  }

  private async getString(key: string): Promise<string | null> {
    await ensureRedisConnection();
    const value = await redisClient.get(key);
    return typeof value === 'string' ? value : null;
  }

  private async deleteCredentials(userId: string): Promise<void> {
    await ensureRedisConnection();
    await redisClient.del(this.credentialsKey(userId));
  }
}
