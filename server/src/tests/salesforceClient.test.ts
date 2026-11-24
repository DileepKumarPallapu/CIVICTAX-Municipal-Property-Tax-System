import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { config } from '../config/index.js';
import { SalesforceClient } from '../services/salesforceClient.js';

const session = {
  accessToken: 'test-access-token',
  instanceUrl: 'https://example.my.salesforce.com',
  identityUrl: 'https://example.my.salesforce.com/id',
  connectedAt: '2026-01-01T00:00:00.000Z',
  lastActiveAt: '2026-01-01T00:00:00.000Z',
};

describe('Salesforce Apex request signing', () => {
  const originalClientSecret = config.salesforce.clientSecret;
  const originalGatewayKeyId = config.salesforce.gatewayKeyId;
  const originalGatewaySecret = config.salesforce.gatewaySecret;

  afterEach(() => {
    config.salesforce.clientSecret = originalClientSecret;
    config.salesforce.gatewayKeyId = originalGatewayKeyId;
    config.salesforce.gatewaySecret = originalGatewaySecret;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('signs the exact endpoint, authenticated identity, method and body', async () => {
    const secret = 'test-only-gateway-secret-0123456789abcdef';
    const keyId = 'civictax-test-key-v1';
    const timestamp = 1_767_225_600;
    const body = {
      propertyNumber: 'CT-2026-TEST',
      address: '12 Test Road, Ward 4',
    };
    config.salesforce.gatewayKeyId = keyId;
    config.salesforce.gatewaySecret = secret;
    vi.spyOn(Date, 'now').mockReturnValue(timestamp * 1000);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ Id: 'a0B000000000001AAA' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await SalesforceClient.callApexRest(
      session,
      'properties',
      'POST',
      body,
      'usr-citizen-01'
    );

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = options.headers as Record<string, string>;
    expect(headers['X-CivicTax-Nonce']).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const expectedSignature = createHmac('sha256', secret)
      .update(
        [
          String(timestamp),
          keyId,
          headers['X-CivicTax-Nonce'],
          'usr-citizen-01',
          'POST',
          'properties',
          JSON.stringify(body),
        ].join('\n'),
        'utf8'
      )
      .digest('hex');

    expect(headers['X-CivicTax-Key-Id']).toBe(keyId);
    expect(headers['X-CivicTax-User-Id']).toBe('usr-citizen-01');
    expect(headers['X-CivicTax-Timestamp']).toBe(String(timestamp));
    expect(headers['X-CivicTax-Signature']).toBe(expectedSignature);
    expect(options.body).toBe(JSON.stringify(body));
    expect(JSON.stringify(options)).not.toContain(secret);
  });

  it('fails safely without the configured secret or authenticated identity', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    config.salesforce.gatewayKeyId = 'civictax-test-key-v1';
    config.salesforce.gatewaySecret = '';

    await expect(
      SalesforceClient.callApexRest(
        session,
        'properties',
        'GET',
        undefined,
        'usr-citizen-01'
      )
    ).rejects.toThrow('CIVICTAX_GATEWAY_SHARED_SECRET');

    config.salesforce.gatewaySecret = 'test-only-gateway-secret-0123456789abcdef';
    await expect(
      SalesforceClient.callApexRest(
        session,
        'properties',
        'GET',
        undefined,
        ''
      )
    ).rejects.toThrow('authenticated CivicTax user');
    config.salesforce.gatewayKeyId = '';
    await expect(
      SalesforceClient.callApexRest(
        session,
        'properties',
        'GET',
        undefined,
        'usr-citizen-01'
      )
    ).rejects.toThrow('CIVICTAX_GATEWAY_KEY_ID');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    '../other-resource',
    'properties/../../other-resource',
    'properties/%2e%2e/other-resource',
    'properties//a0B000000000001AAA',
    'properties?query=1',
  ])('rejects endpoint paths outside the CivicTax API segment format: %s', async (path) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    config.salesforce.gatewayKeyId = 'civictax-test-key-v1';
    config.salesforce.gatewaySecret = 'test-only-gateway-secret-0123456789abcdef';

    await expect(
      SalesforceClient.callApexRest(
        session,
        path,
        'GET',
        undefined,
        'usr-citizen-01'
      )
    ).rejects.toThrow('endpoint path contains invalid segments');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not log OAuth error response contents', async () => {
    const oauthSecret = 'test-only-oauth-client-secret';
    const echoedResponse = `error includes ${oauthSecret}`;
    config.salesforce.clientSecret = oauthSecret;
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error_description: echoedResponse }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      SalesforceClient.exchangeCodeForToken(
        'test-only-authorization-code',
        'test-only-code-verifier'
      )
    ).rejects.toThrow('Salesforce token exchange failed (400).');

    expect(errorSpy.mock.calls.flat().join(' ')).not.toContain(oauthSecret);
    expect(errorSpy.mock.calls.flat().join(' ')).not.toContain(echoedResponse);
  });
});
