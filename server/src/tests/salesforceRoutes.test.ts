import { afterEach, describe, expect, it, vi } from 'vitest';
import { SalesforceConnectionStore } from '../services/salesforceConnectionStore.js';
import {
  SalesforceApiError,
  SalesforceClient,
} from '../services/salesforceClient.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Salesforce proxy error handling', () => {
  it('does not expose upstream error details in client responses', async () => {
    const { salesforceApiRouter } = await import('../routes/salesforceRoutes.js');
    vi.spyOn(SalesforceConnectionStore, 'get').mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      instanceUrl: 'https://example.my.salesforce.com',
      identityUrl: 'https://example.my.salesforce.com/id',
      userId: '005000000000001',
      orgId: '00D000000000001',
      username: 'test@example.invalid',
      displayName: 'Test Admin',
      connectedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    });
    vi.spyOn(SalesforceClient, 'callApexRest').mockRejectedValue(
      new SalesforceApiError(
        409,
        'DUPLICATE_VALUE',
        'sensitive-upstream-detail'
      )
    );

    const proxyLayer = salesforceApiRouter.stack.find(
      (layer: any) =>
        layer.route && layer.route.path === '/api/salesforce/proxy/*'
    );
    expect(proxyLayer).toBeTruthy();

    let responseStatus = 200;
    let responseData: any;
    let completeResponse: () => void = () => undefined;
    const req: any = {
      method: 'POST',
      headers: { 'x-civictax-csrf': '1' },
      params: { 0: 'properties' },
      body: {},
      session: {
        civicTaxUser: {
          id: 'usr-officer-01',
          role: 'OFFICER',
        },
        authProvider: 'demo',
      },
    };
    const res: any = {
      locals: {},
      status(code: number) {
        responseStatus = code;
        return this;
      },
      json(data: any) {
        responseData = data;
        completeResponse();
        return this;
      },
    };

    await new Promise<void>((resolve, reject) => {
      completeResponse = resolve;
      let handlerIndex = 0;
      const runNext = () => {
        const handler = proxyLayer.route.stack[handlerIndex++]?.handle;
        if (!handler) {
          resolve();
          return;
        }

        try {
          const result = handler(req, res, runNext);
          if (result && typeof result.then === 'function') {
            result.catch(reject);
          }
        } catch (error) {
          reject(error);
        }
      };

      runNext();
    });

    expect(responseStatus).toBe(409);
    expect(responseData.message).toBe('The requested record already exists.');
    expect(JSON.stringify(responseData)).not.toContain(
      'sensitive-upstream-detail'
    );
  });
});
