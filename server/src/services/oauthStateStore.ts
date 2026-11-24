import { createHash } from 'node:crypto';
import { config } from '../config/index.js';
import {
  getRedisClient,
  RedisUnavailableError,
  type RedisKeyValueClient,
} from './redisClient.js';

export type OAuthFlow = 'civictax-login' | 'central-salesforce';

export interface OAuthStateRecord {
  sessionId: string;
  flow: OAuthFlow;
  codeVerifier: string;
  expiresAt: number;
}

const STATE_TTL_SECONDS = 10 * 60;
const STATE_PREFIX = 'civictax:oauth-state:';

function stateKey(state: string): string {
  return `${STATE_PREFIX}${createHash('sha256').update(state).digest('hex')}`;
}

export class OAuthStateStore {
  private readonly developmentRecords = new Map<
    string,
    { value: string; expiresAt: number }
  >();

  constructor(
    private readonly clientProvider: () => RedisKeyValueClient | undefined =
      () => getRedisClient(config.isProduction),
    private readonly now: () => number = Date.now
  ) {}

  async create(state: string, record: OAuthStateRecord): Promise<void> {
    if (!/^[a-f0-9]{64}$/.test(state)) {
      throw new Error('OAuth state must be a 256-bit hexadecimal token.');
    }

    const value = JSON.stringify(record);
    const client = this.clientProvider();
    if (client) {
      const created = await client.setIfNotExists(
        stateKey(state),
        value,
        STATE_TTL_SECONDS
      );
      if (!created) {
        throw new Error('Unable to allocate a unique OAuth state.');
      }
      return;
    }

    if (config.isProduction) {
      throw new RedisUnavailableError();
    }

    this.pruneDevelopmentRecords();
    const key = stateKey(state);
    if (this.developmentRecords.has(key)) {
      throw new Error('Unable to allocate a unique OAuth state.');
    }
    this.developmentRecords.set(key, {
      value,
      expiresAt: this.now() + STATE_TTL_SECONDS * 1000,
    });
  }

  async consume(
    state: string,
    sessionId: string,
    flow?: OAuthFlow
  ): Promise<OAuthStateRecord | null> {
    if (!/^[a-f0-9]{64}$/.test(state)) return null;

    const key = stateKey(state);
    const client = this.clientProvider();
    let value: string | null;
    if (client) {
      value = await client.getAndDelete(key);
    } else {
      if (config.isProduction) {
        throw new RedisUnavailableError();
      }
      const entry = this.developmentRecords.get(key);
      this.developmentRecords.delete(key);
      value =
        entry && entry.expiresAt > this.now() ? entry.value : null;
    }

    if (!value) return null;

    let record: OAuthStateRecord;
    try {
      record = JSON.parse(value) as OAuthStateRecord;
    } catch {
      return null;
    }

    if (
      record.sessionId !== sessionId ||
      (flow !== undefined && record.flow !== flow) ||
      typeof record.codeVerifier !== 'string' ||
      !record.codeVerifier ||
      !Number.isFinite(record.expiresAt) ||
      record.expiresAt <= this.now()
    ) {
      return null;
    }

    return record;
  }

  private pruneDevelopmentRecords(): void {
    const now = this.now();
    for (const [key, record] of this.developmentRecords) {
      if (record.expiresAt <= now) {
        this.developmentRecords.delete(key);
      }
    }
  }
}

export const oauthStateStore = new OAuthStateStore();
