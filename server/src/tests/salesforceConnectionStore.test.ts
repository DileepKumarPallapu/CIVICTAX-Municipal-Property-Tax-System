import { beforeEach, describe, expect, it, vi } from 'vitest';

const redis = vi.hoisted(() => {
  const values = new Map<string, string>();
  const expirations = new Map<string, number>();

  return {
    values,
    expirations,
    client: {
      connect: vi.fn(async () => {}),
      ping: vi.fn(async () => {}),
      get: vi.fn(async (key: string) => values.get(key) ?? null),
      set: vi.fn(async (key: string, value: string, ttl: number) => {
        values.set(key, value);
        expirations.set(key, ttl);
      }),
      del: vi.fn(async (key: string) => {
        values.delete(key);
        expirations.delete(key);
      }),
      exists: vi.fn(async (key: string) => values.has(key)),
    },
  };
});

vi.mock('../services/redisClient.js', () => ({
  getRedisClient: () => redis.client,
}));

import { SalesforceConnectionStore } from '../services/salesforceConnectionStore.js';

describe('SalesforceConnectionStore', () => {
  beforeEach(() => {
    redis.values.clear();
    redis.expirations.clear();
    vi.clearAllMocks();
  });

  it('encrypts credentials, preserves expiration, and round-trips isolated data', async () => {
    const data = {
      accessToken: 'isolated-test-access-token',
      refreshToken: 'isolated-test-refresh-token',
      instanceUrl: 'https://example.my.salesforce.com',
      identityUrl: 'https://example.my.salesforce.com/id/org/user',
      orgId: '00D000000000001',
      username: 'test@example.invalid',
      connectedAt: '2026-01-01T00:00:00.000Z',
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    };

    await SalesforceConnectionStore.save(data);

    expect(redis.values.size).toBe(1);
    const [storedValue] = redis.values.values();
    expect(storedValue).not.toContain(data.accessToken);
    expect(storedValue).not.toContain(data.refreshToken);
    expect([...redis.expirations.values()]).toEqual([60 * 60 * 24 * 30]);
    await expect(SalesforceConnectionStore.get()).resolves.toEqual(data);
    await expect(SalesforceConnectionStore.isConnected()).resolves.toBe(true);

    await SalesforceConnectionStore.disconnect();
    await expect(SalesforceConnectionStore.get()).resolves.toBeNull();
    await expect(SalesforceConnectionStore.isConnected()).resolves.toBe(false);
  });
});
