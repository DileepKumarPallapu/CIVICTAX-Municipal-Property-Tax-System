import { createClient } from 'redis';

import { config } from '../config/index.js';

export class RedisUnavailableError extends Error {
  constructor() {
    super('Redis is unavailable.');
    this.name = 'RedisUnavailableError';
  }
}

export interface RedisKeyValueClient {
  connect(): Promise<void>;
  ping(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number
  ): Promise<boolean>;
  getAndDelete(key: string): Promise<string | null>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export interface RedisEnvironmentConfig {
  redisUrl?: string;
  kvUrl?: string;
  upstashRedisRestUrl?: string;
  upstashRedisRestToken?: string;
}

export type RedisTransport =
  | { type: 'tcp'; url: string }
  | { type: 'upstash-rest'; url: string; token: string };

export class RedisConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RedisConfigurationError';
  }
}

export function selectRedisTransport(
  settings: RedisEnvironmentConfig,
  production: boolean
): RedisTransport | undefined {
  const tcpUrl = settings.redisUrl || settings.kvUrl;
  if (tcpUrl) {
    return { type: 'tcp', url: tcpUrl };
  }

  const restUrl = settings.upstashRedisRestUrl;
  const restToken = settings.upstashRedisRestToken;
  const hasRestUrl = Boolean(restUrl);
  const hasRestToken = Boolean(restToken);
  if (hasRestUrl !== hasRestToken) {
    throw new RedisConfigurationError(
      'Both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required.'
    );
  }

  if (restUrl && restToken) {
    return {
      type: 'upstash-rest',
      url: restUrl,
      token: restToken,
    };
  }

  if (production) {
    throw new RedisConfigurationError(
      'Redis configuration is required in production. Set REDIS_URL, KV_URL, or both Upstash REST variables.'
    );
  }

  return undefined;
}

type UpstashFetch = typeof fetch;

export class UpstashRedisClient implements RedisKeyValueClient {
  private readonly endpoint: string;

  constructor(
    endpoint: string,
    private readonly token: string,
    private readonly fetcher: UpstashFetch = fetch
  ) {
    const parsedEndpoint = new URL(endpoint);
    if (parsedEndpoint.protocol !== 'https:') {
      throw new Error('Upstash Redis REST endpoint must use HTTPS.');
    }

    this.endpoint = parsedEndpoint.toString().replace(/\/$/, '');
  }

  async connect(): Promise<void> {
    await this.ping();
  }

  async ping(): Promise<void> {
    const result = await this.command<string>(['PING']);
    if (result !== 'PONG') {
      throw new RedisUnavailableError();
    }
  }

  async get(key: string): Promise<string | null> {
    return this.command<string | null>(['GET', key]);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    const ttl = Math.ceil(ttlSeconds);
    if (ttl <= 0) {
      await this.del(key);
      return;
    }

    await this.command(['SET', key, value, 'EX', String(ttl)]);
  }

  async setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number
  ): Promise<boolean> {
    const ttl = Math.ceil(ttlSeconds);
    if (ttl <= 0) return false;
    return (
      (await this.command<string | null>([
        'SET',
        key,
        value,
        'EX',
        String(ttl),
        'NX',
      ])) === 'OK'
    );
  }

  async getAndDelete(key: string): Promise<string | null> {
    return this.command<string | null>(['GETDEL', key]);
  }

  async del(key: string): Promise<void> {
    await this.command(['DEL', key]);
  }

  async exists(key: string): Promise<boolean> {
    return Number(await this.command<number | string>(['EXISTS', key])) > 0;
  }

  private async command<T>(command: Array<string>): Promise<T> {
    try {
      const response = await this.fetcher(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new RedisUnavailableError();
      }

      const payload = (await response.json()) as {
        result?: T;
        error?: unknown;
      };

      if (payload.error !== undefined || !('result' in payload)) {
        throw new RedisUnavailableError();
      }

      return payload.result as T;
    } catch (error) {
      if (error instanceof RedisUnavailableError) {
        reportRedisError('REST command', error);
        throw error;
      }

      reportRedisError('REST command', error);
      throw new RedisUnavailableError();
    }
  }
}

class NodeRedisClient implements RedisKeyValueClient {
  private readonly client;
  private connection: Promise<void> | undefined;

  constructor(url: string) {
    this.client = createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 500, 5000),
      },
    });

    this.client.on('error', (error) => {
      reportRedisError('TCP client event', error);
    });
  }

  async connect(): Promise<void> {
    if (this.client.isReady) {
      return;
    }

    if (!this.connection) {
      this.connection = this.client
        .connect()
        .then(() => undefined)
        .catch((error: unknown) => {
          this.connection = undefined;
          reportRedisError('TCP connect', error);
          throw new RedisUnavailableError();
        });
    }

    await this.connection;
  }

  async ping(): Promise<void> {
    await this.connect();
    try {
      await this.client.ping();
    } catch (error) {
      reportRedisError('TCP ping', error);
      throw new RedisUnavailableError();
    }
  }

  async get(key: string): Promise<string | null> {
    await this.connect();
    try {
      return await this.client.get(key);
    } catch (error) {
      reportRedisError('TCP get', error);
      throw new RedisUnavailableError();
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) {
      await this.del(key);
      return;
    }
    await this.connect();
    try {
      await this.client.set(key, value, { EX: Math.ceil(ttlSeconds) });
    } catch (error) {
      reportRedisError('TCP set', error);
      throw new RedisUnavailableError();
    }
  }

  async setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number
  ): Promise<boolean> {
    if (ttlSeconds <= 0) return false;
    await this.connect();
    try {
      return (
        (await this.client.set(key, value, {
          EX: Math.ceil(ttlSeconds),
          NX: true,
        })) === 'OK'
      );
    } catch (error) {
      reportRedisError('TCP set-if-absent', error);
      throw new RedisUnavailableError();
    }
  }

  async getAndDelete(key: string): Promise<string | null> {
    await this.connect();
    try {
      return await this.client.getDel(key);
    } catch (error) {
      reportRedisError('TCP get-and-delete', error);
      throw new RedisUnavailableError();
    }
  }

  async del(key: string): Promise<void> {
    await this.connect();
    try {
      await this.client.del(key);
    } catch (error) {
      reportRedisError('TCP delete', error);
      throw new RedisUnavailableError();
    }
  }

  async exists(key: string): Promise<boolean> {
    await this.connect();
    try {
      return (await this.client.exists(key)) > 0;
    } catch (error) {
      reportRedisError('TCP exists', error);
      throw new RedisUnavailableError();
    }
  }
}

let redisClient: RedisKeyValueClient | undefined;
let configurationChecked = false;

export function getRedisClient(
  production = config.isProduction
): RedisKeyValueClient | undefined {
  if (configurationChecked) {
    return redisClient;
  }

  const transport = selectRedisTransport(config, production);
  if (transport?.type === 'tcp') {
    redisClient = new NodeRedisClient(transport.url);
  } else if (transport?.type === 'upstash-rest') {
    redisClient = new UpstashRedisClient(transport.url, transport.token);
  }

  configurationChecked = true;
  return redisClient;
}

export function reportRedisError(operation: string, error: unknown): void {
  const errorType =
    error instanceof Error ? error.name : 'UnknownError';
  console.error(`Redis ${operation} failed (${errorType}).`);
}
