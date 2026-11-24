import { afterEach, describe, expect, it } from 'vitest';
import { config } from '../config/index.js';
import { OAuthStateStore } from '../services/oauthStateStore.js';

const originalIsProduction = config.isProduction;

afterEach(() => {
  config.isProduction = originalIsProduction;
});

describe('OAuthStateStore', () => {
  it('binds state to the initiating session and consumes it once', async () => {
    let now = 1_700_000_000_000;
    const store = new OAuthStateStore(() => undefined, () => now);
    const state = 'a'.repeat(64);

    await store.create(state, {
      sessionId: 'session-one',
      flow: 'civictax-login',
      codeVerifier: 'pkce-verifier',
      expiresAt: now + 600_000,
    });

    expect(
      await store.consume(state, 'session-two', 'civictax-login')
    ).toBeNull();
    expect(
      await store.consume(state, 'session-one', 'civictax-login')
    ).toBeNull();

    const nextState = 'b'.repeat(64);
    await store.create(nextState, {
      sessionId: 'session-one',
      flow: 'civictax-login',
      codeVerifier: 'pkce-verifier',
      expiresAt: now + 600_000,
    });
    expect(
      await store.consume(nextState, 'session-one', 'civictax-login')
    ).toMatchObject({
      sessionId: 'session-one',
      flow: 'civictax-login',
      codeVerifier: 'pkce-verifier',
    });
    expect(
      await store.consume(nextState, 'session-one', 'civictax-login')
    ).toBeNull();

    now += 600_001;
    const expiredState = 'c'.repeat(64);
    await store.create(expiredState, {
      sessionId: 'session-one',
      flow: 'civictax-login',
      codeVerifier: 'pkce-verifier',
      expiresAt: now - 1,
    });
    expect(
      await store.consume(expiredState, 'session-one', 'civictax-login')
    ).toBeNull();
  });

  it('does not fall back to in-memory state storage in production', async () => {
    config.isProduction = true;
    const store = new OAuthStateStore(() => undefined);

    await expect(
      store.create('d'.repeat(64), {
        sessionId: 'session-one',
        flow: 'civictax-login',
        codeVerifier: 'pkce-verifier',
        expiresAt: Date.now() + 600_000,
      })
    ).rejects.toThrow('Redis is unavailable.');
  });
});
