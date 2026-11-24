import { afterEach, describe, expect, it } from 'vitest';
import { config } from '../config/index.js';
import {
  enforceSessionLifetime,
  getAuthenticatedUser,
  requireRole,
  SESSION_COOKIE_NAME,
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_ABSOLUTE_TIMEOUT_MS,
} from '../middleware/auth.js';

const originalIsProduction = config.isProduction;

afterEach(() => {
  config.isProduction = originalIsProduction;
});

describe('CivicTax authentication middleware', () => {
  it('accepts Salesforce-backed sessions and rejects demo sessions in production', () => {
    config.isProduction = true;
    const user = {
      id: 'civictax-user-001',
      name: 'Mapped Citizen',
      email: 'citizen@example.invalid',
      role: 'CITIZEN' as const,
    };

    expect(
      getAuthenticatedUser({
        session: { civicTaxUser: user, authProvider: 'salesforce' },
      } as any)
    ).toEqual(user);
    expect(
      getAuthenticatedUser({
        session: { civicTaxUser: user, authProvider: 'demo' },
      } as any)
    ).toBeUndefined();
  });

  it('rejects roles not authorized for a route', () => {
    const middleware = requireRole(['OFFICER', 'ADMIN']);
    const req: any = {
      session: {
        civicTaxUser: {
          id: 'citizen-1',
          role: 'CITIZEN',
        },
        authProvider: 'demo',
      },
    };
    let statusCode = 200;
    let response: any;
    let nextCalled = false;
    middleware(
      req,
      {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(value: unknown) {
          response = value;
        },
      } as any,
      () => {
        nextCalled = true;
      }
    );

    expect(statusCode).toBe(403);
    expect(response.error).toBe('FORBIDDEN');
    expect(nextCalled).toBe(false);
  });

  it('revokes sessions after idle or absolute timeout and refreshes valid activity', () => {
    const expiredSession = {
      civicTaxUser: { id: 'citizen-1', role: 'CITIZEN' },
      authProvider: 'salesforce',
      authenticatedAt: Date.now() - 60_000,
      lastActivityAt: Date.now() - SESSION_IDLE_TIMEOUT_MS - 1,
      destroy(callback: (error?: Error) => void) {
        this.destroyed = true;
        callback();
      },
      destroyed: false,
    };
    let statusCode = 200;
    let clearedCookie: string | undefined;
    enforceSessionLifetime(
      { session: expiredSession } as any,
      {
        clearCookie(name: string) {
          clearedCookie = name;
        },
        status(code: number) {
          statusCode = code;
          return this;
        },
        json() {},
      } as any,
      () => {}
    );

    expect(expiredSession.destroyed).toBe(true);
    expect(statusCode).toBe(401);
    expect(clearedCookie).toBe(SESSION_COOKIE_NAME);

    const absoluteExpired = {
      civicTaxUser: { id: 'citizen-1', role: 'CITIZEN' },
      authProvider: 'salesforce',
      authenticatedAt: Date.now() - SESSION_ABSOLUTE_TIMEOUT_MS - 1,
      lastActivityAt: Date.now(),
    };
    let absoluteStatus = 200;
    enforceSessionLifetime(
      {
        session: {
          ...absoluteExpired,
          destroy(callback: (error?: Error) => void) {
            callback();
          },
        },
      } as any,
      {
        clearCookie() {},
        status(code: number) {
          absoluteStatus = code;
          return this;
        },
        json() {},
      } as any,
      () => {}
    );
    expect(absoluteStatus).toBe(401);

    const activeSession: any = {
      civicTaxUser: { id: 'citizen-1', role: 'CITIZEN' },
      authProvider: 'salesforce',
      authenticatedAt: Date.now(),
      lastActivityAt: Date.now(),
      cookie: {},
    };
    let nextCalled = false;
    enforceSessionLifetime(
      { session: activeSession } as any,
      {} as any,
      () => {
        nextCalled = true;
      }
    );
    expect(nextCalled).toBe(true);
    expect(activeSession.lastActivityAt).toBeGreaterThan(0);
    expect(activeSession.cookie.maxAge).toBe(SESSION_IDLE_TIMEOUT_MS);
  });
});
