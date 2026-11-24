import session from 'express-session';
import type { SessionData } from 'express-session';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  RedisConfigurationError,
  RedisUnavailableError,
  UpstashRedisClient,
  selectRedisTransport,
  type RedisKeyValueClient,
} from '../services/redisClient.js';
import { RedisSessionStore } from '../services/redisSessionStore.js';

class MemoryRedisClient implements RedisKeyValueClient {
  private readonly values = new Map<string, string>();
  private readonly expirations = new Map<string, number>();
  failure: Error | undefined;

  async connect(): Promise<void> {
    this.throwIfUnavailable();
  }

  async ping(): Promise<void> {
    this.throwIfUnavailable();
  }

  async get(key: string): Promise<string | null> {
    this.throwIfUnavailable();
    const expiresAt = this.expirations.get(key);
    if (expiresAt !== undefined && expiresAt <= Date.now()) {
      await this.del(key);
      return null;
    }
    return this.values.get(key) ?? null;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.throwIfUnavailable();
    this.values.set(key, value);
    this.expirations.set(key, Date.now() + ttlSeconds * 1000);
  }

  async setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number
  ): Promise<boolean> {
    this.throwIfUnavailable();
    if (await this.get(key)) return false;
    await this.set(key, value, ttlSeconds);
    return true;
  }

  async getAndDelete(key: string): Promise<string | null> {
    this.throwIfUnavailable();
    const value = await this.get(key);
    await this.del(key);
    return value;
  }

  async del(key: string): Promise<void> {
    this.throwIfUnavailable();
    this.values.delete(key);
    this.expirations.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  private throwIfUnavailable(): void {
    if (this.failure) {
      throw this.failure;
    }
  }
}

function setSession(
  store: RedisSessionStore,
  sessionId: string,
  sessionData: SessionData
): Promise<void> {
  return new Promise((resolve, reject) => {
    store.set(sessionId, sessionData, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function getSession(
  store: RedisSessionStore,
  sessionId: string
): Promise<SessionData | null> {
  return new Promise((resolve, reject) => {
    store.get(sessionId, (error, value) => {
      if (error) reject(error);
      else resolve(value ?? null);
    });
  });
}

function destroySession(
  store: RedisSessionStore,
  sessionId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    store.destroy(sessionId, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

describe('Upstash Redis REST client', () => {
  it('prefers REDIS_URL over Upstash REST credentials', () => {
    expect(
      selectRedisTransport(
        {
          redisUrl: 'rediss://tcp.example.invalid:6379',
          kvUrl: 'rediss://fallback.example.invalid:6379',
          upstashRedisRestUrl: 'https://rest.example.invalid',
          upstashRedisRestToken: 'test-token',
        },
        true
      )
    ).toEqual({
      type: 'tcp',
      url: 'rediss://tcp.example.invalid:6379',
    });
  });

  it('uses KV_URL as TCP fallback before Upstash REST', () => {
    expect(
      selectRedisTransport(
        {
          kvUrl: 'rediss://fallback.example.invalid:6379',
          upstashRedisRestUrl: 'https://rest.example.invalid',
          upstashRedisRestToken: 'test-token',
        },
        true
      )
    ).toEqual({
      type: 'tcp',
      url: 'rediss://fallback.example.invalid:6379',
    });
  });

  it('uses Upstash REST when no TCP URL is configured', () => {
    expect(
      selectRedisTransport(
        {
          upstashRedisRestUrl: 'https://rest.example.invalid',
          upstashRedisRestToken: 'test-token',
        },
        true
      )
    ).toEqual({
      type: 'upstash-rest',
      url: 'https://rest.example.invalid',
      token: 'test-token',
    });
  });

  it('rejects a partial Upstash REST configuration without exposing values', () => {
    expect(() =>
      selectRedisTransport(
        {
          upstashRedisRestUrl: 'https://rest.example.invalid',
        },
        true
      )
    ).toThrow(RedisConfigurationError);
  });

  it('fails closed in production when no Redis configuration exists', () => {
    expect(() => selectRedisTransport({}, true)).toThrow(
      'Redis configuration is required in production'
    );
    expect(selectRedisTransport({}, false)).toBeUndefined();
  });

  it('checks REST connectivity with PING', async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ result: 'PONG' }), { status: 200 })
    );
    const client = new UpstashRedisClient(
      'https://example.upstash.io',
      'test-token',
      fetcher
    );

    await client.connect();

    expect(fetcher.mock.calls[0][1]?.body).toBe(
      JSON.stringify(['PING'])
    );
  });

  it('uses authenticated REST commands with key expiration', async () => {
    const results = ['OK', 'stored-value', '1', '1'];
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ result: results.shift() }), {
        status: 200,
      })
    );
    const client = new UpstashRedisClient(
      'https://example.upstash.io',
      'test-token',
      fetcher
    );

    await client.set('session:1', 'value', 60);
    expect(await client.get('session:1')).toBe('stored-value');
    expect(await client.exists('session:1')).toBe(true);
    await client.del('session:1');

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      'https://example.upstash.io',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', 'session:1', 'value', 'EX', '60']),
      })
    );
    expect(fetcher.mock.calls[1][1]?.body).toBe(
      JSON.stringify(['GET', 'session:1'])
    );
    expect(fetcher.mock.calls[2][1]?.body).toBe(
      JSON.stringify(['EXISTS', 'session:1'])
    );
    expect(fetcher.mock.calls[3][1]?.body).toBe(
      JSON.stringify(['DEL', 'session:1'])
    );
  });

  it('uses atomic SET NX and GETDEL commands for one-time OAuth state', async () => {
    const results: Array<string | null> = ['OK', 'state-record'];
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ result: results.shift() }), {
        status: 200,
      })
    );
    const client = new UpstashRedisClient(
      'https://example.upstash.io',
      'test-token',
      fetcher
    );

    expect(
      await client.setIfNotExists('oauth:state', 'record', 600)
    ).toBe(true);
    expect(await client.getAndDelete('oauth:state')).toBe('state-record');
    expect(fetcher.mock.calls[0][1]?.body).toBe(
      JSON.stringify(['SET', 'oauth:state', 'record', 'EX', '600', 'NX'])
    );
    expect(fetcher.mock.calls[1][1]?.body).toBe(
      JSON.stringify(['GETDEL', 'oauth:state'])
    );
  });

  it('reports an unavailable Redis endpoint with a sanitized error', async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response('not authorized', { status: 401 })
    );
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const client = new UpstashRedisClient(
      'https://example.upstash.io',
      'private-test-token',
      fetcher
    );

    await expect(client.ping()).rejects.toBeInstanceOf(
      RedisUnavailableError
    );
    expect(log).toHaveBeenCalledWith(
      'Redis REST command failed (RedisUnavailableError).'
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-test-token');
    log.mockRestore();
  });

  it('requires HTTPS to protect the REST token in transit', () => {
    expect(
      () => new UpstashRedisClient('http://example.upstash.io', 'test-token')
    ).toThrow('must use HTTPS');
  });
});

describe('Redis-backed Express sessions', () => {
  let client: MemoryRedisClient;
  let store: RedisSessionStore;

  beforeEach(() => {
    client = new MemoryRedisClient();
    store = new RedisSessionStore(client);
  });

  it('persists sessions across store instances and deletes them on destroy', async () => {
    const value = {
      cookie: new session.Cookie({ maxAge: 60_000 }),
      civicTaxUser: { id: 'citizen-1', role: 'CITIZEN' },
    } as SessionData;
    await setSession(store, 'session-1', value);

    const otherInstance = new RedisSessionStore(client);
    await expect(getSession(otherInstance, 'session-1')).resolves.toMatchObject({
      civicTaxUser: { id: 'citizen-1', role: 'CITIZEN' },
    });

    await destroySession(otherInstance, 'session-1');
    await expect(getSession(store, 'session-1')).resolves.toBeNull();
  });

  it('expires sessions according to the cookie lifetime and refreshes on touch', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-01-01T00:00:00.000Z');
    vi.setSystemTime(now);
    try {
      const value = {
        cookie: new session.Cookie({ maxAge: 2_000 }),
        civicTaxUser: { id: 'citizen-2', role: 'CITIZEN' },
      } as SessionData;
      await setSession(store, 'session-2', value);

      vi.setSystemTime(new Date(now.getTime() + 1_000));
      expect(await getSession(store, 'session-2')).not.toBeNull();

      await new Promise<void>((resolve, reject) => {
        store.touch('session-2', value, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      vi.setSystemTime(new Date(now.getTime() + 2_001));
      await expect(getSession(store, 'session-2')).resolves.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('surfaces Redis outages without falling back to memory or logging details', async () => {
    client.failure = new Error(
      'request contained https://secret.example and private-token'
    );
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(getSession(store, 'session-3')).rejects.toBeInstanceOf(
      RedisUnavailableError
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-token');
    expect(JSON.stringify(log.mock.calls)).not.toContain('secret.example');
    log.mockRestore();
  });
});
