import session from 'express-session';
import type { SessionData } from 'express-session';

import type { RedisKeyValueClient } from './redisClient.js';
import {
  RedisUnavailableError,
  reportRedisError,
} from './redisClient.js';

const DEFAULT_TTL_SECONDS = 8 * 60 * 60;

export class RedisSessionStore extends session.Store {
  constructor(
    private readonly client: RedisKeyValueClient,
    private readonly prefix = 'civictax:sess:',
    private readonly ttlSeconds = DEFAULT_TTL_SECONDS
  ) {
    super();
  }

  get(
    sessionId: string,
    callback: (error: unknown, session?: SessionData | null) => void
  ): void {
    void this.run('get', async () => {
      const stored = await this.client.get(this.key(sessionId));
      return stored === null
        ? null
        : (JSON.parse(stored) as SessionData);
    }).then(
      (value) => callback(null, value),
      (error: unknown) => callback(error)
    );
  }

  set(
    sessionId: string,
    sessionData: SessionData,
    callback?: (error?: unknown) => void
  ): void {
    void this.run('set', async () => {
      const ttl = this.getTtl(sessionData);
      if (ttl <= 0) {
        await this.client.del(this.key(sessionId));
      } else {
        await this.client.set(
          this.key(sessionId),
          JSON.stringify(sessionData),
          ttl
        );
      }
    }).then(
      () => callback?.(),
      (error: unknown) => callback?.(error)
    );
  }

  destroy(sessionId: string, callback?: (error?: unknown) => void): void {
    void this.run('destroy', async () => {
      await this.client.del(this.key(sessionId));
    }).then(
      () => callback?.(),
      (error: unknown) => callback?.(error)
    );
  }

  touch(
    sessionId: string,
    sessionData: SessionData,
    callback?: (error?: unknown) => void
  ): void {
    void this.run('touch', async () => {
      const ttl = this.getTtl(sessionData);
      if (ttl <= 0) {
        await this.client.del(this.key(sessionId));
      } else {
        await this.client.set(
          this.key(sessionId),
          JSON.stringify(sessionData),
          ttl
        );
      }
    }).then(
      () => callback?.(),
      (error: unknown) => callback?.(error)
    );
  }

  private key(sessionId: string): string {
    return `${this.prefix}${sessionId}`;
  }

  private getTtl(sessionData: SessionData): number {
    const expires = sessionData.cookie?.expires;
    if (expires) {
      const expirationTime =
        expires instanceof Date ? expires.getTime() : Date.parse(expires);
      if (Number.isFinite(expirationTime)) {
        return Math.ceil((expirationTime - Date.now()) / 1000);
      }
    }

    const maxAge = sessionData.cookie?.maxAge;
    if (typeof maxAge === 'number' && Number.isFinite(maxAge)) {
      return Math.ceil(maxAge / 1000);
    }

    return this.ttlSeconds;
  }

  private async run<T>(
    operation: string,
    action: () => Promise<T>
  ): Promise<T> {
    try {
      return await action();
    } catch (error) {
      reportRedisError(`session ${operation}`, error);
      throw new RedisUnavailableError();
    }
  }
}
