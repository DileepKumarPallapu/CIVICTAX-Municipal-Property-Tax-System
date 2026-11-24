import { afterEach, describe, expect, it } from 'vitest';
import { config } from '../config/index.js';
import { verifyCsrf } from '../middleware/csrf.js';

const originalIsProduction = config.isProduction;
const originalFrontendUrl = config.frontendUrl;

afterEach(() => {
  config.isProduction = originalIsProduction;
  config.frontendUrl = originalFrontendUrl;
});

describe('CSRF origin validation', () => {
  it('rejects unconfigured origins in production', () => {
    config.isProduction = true;
    config.frontendUrl =
      'https://civictax-municipal-property-tax-sys.vercel.app';

    const req: any = {
      method: 'POST',
      headers: { origin: 'https://untrusted-preview.vercel.app' },
    };
    let statusCode = 200;
    let nextCalled = false;
    const res: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json() {
        return this;
      },
    };

    verifyCsrf(req, res, () => {
      nextCalled = true;
    });

    expect(statusCode).toBe(403);
    expect(nextCalled).toBe(false);
  });

  it('accepts the exact configured production origin', () => {
    config.isProduction = true;
    config.frontendUrl =
      'https://civictax-municipal-property-tax-sys.vercel.app';

    const req: any = {
      method: 'POST',
      headers: {
        origin: 'https://civictax-municipal-property-tax-sys.vercel.app',
      },
    };
    let nextCalled = false;

    verifyCsrf(req, { status() { return this; }, json() { return this; } } as any, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
  });

  it('rejects state-changing requests without an origin or CSRF header', () => {
    config.isProduction = true;
    let statusCode = 200;
    let nextCalled = false;

    verifyCsrf(
      { method: 'POST', headers: {} } as any,
      {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json() {
          return this;
        },
      } as any,
      () => {
        nextCalled = true;
      }
    );

    expect(statusCode).toBe(403);
    expect(nextCalled).toBe(false);
  });
});
