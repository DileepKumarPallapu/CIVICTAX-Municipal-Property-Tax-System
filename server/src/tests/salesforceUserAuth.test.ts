import { afterEach, describe, expect, it, vi } from 'vitest';
import { config } from '../config/index.js';
import {
  SalesforceApiError,
  SalesforceClient,
} from '../services/salesforceClient.js';
import type { SalesforceOAuthTokenResponse } from '../types/index.js';

const originalExpectedOrgId = config.salesforce.expectedOrgId;
const originalClientId = config.salesforce.clientId;

const tokenData: SalesforceOAuthTokenResponse = {
  access_token: 'test-access-token',
  instance_url: 'https://civictax.my.salesforce.com',
  id: 'https://login.salesforce.com/id/00D000000000001AAA/005000000000001AAA',
  token_type: 'Bearer',
  issued_at: '1700000000000',
};

const identityResponse = {
  id: tokenData.id,
  user_id: '005000000000001AAA',
  organization_id: '00D000000000001AAA',
  username: 'citizen@example.invalid',
  display_name: 'Mapped Citizen',
};

afterEach(() => {
  config.salesforce.expectedOrgId = originalExpectedOrgId;
  config.salesforce.clientId = originalClientId;
  vi.unstubAllGlobals();
});

describe('Salesforce user identity validation', () => {
  it('resolves only the mapping returned for the authenticated Salesforce identity', async () => {
    config.salesforce.expectedOrgId = '00D000000000001AAA';
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(identityResponse), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'civictax-user-001',
            name: 'CivicTax Citizen',
            email: 'citizen@example.invalid',
            role: 'CITIZEN',
          }),
          { status: 200 }
        )
      );
    vi.stubGlobal('fetch', fetcher);

    await expect(
      SalesforceClient.resolveAuthenticatedCivicTaxUser(tokenData)
    ).resolves.toEqual({
      id: 'civictax-user-001',
      name: 'CivicTax Citizen',
      email: 'citizen@example.invalid',
      role: 'CITIZEN',
    });
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      'https://civictax.my.salesforce.com/services/apexrest/civictax/auth/v1/me',
      expect.objectContaining({
        method: 'GET',
        headers: {
          Authorization: 'Bearer test-access-token',
          Accept: 'application/json',
        },
      })
    );
  });

  it('rejects unexpected organizations before querying CivicTax mappings', async () => {
    config.salesforce.expectedOrgId = '00D000000000002AAA';
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetcher);

    await expect(
      SalesforceClient.resolveAuthenticatedCivicTaxUser(tokenData)
    ).rejects.toThrow('unexpected organization');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects untrusted Salesforce issuer URLs and mismatched identity responses', async () => {
    config.salesforce.expectedOrgId = '00D000000000001AAA';
    const untrustedToken = {
      ...tokenData,
      id: 'https://attacker.example/id/00D000000000001AAA/005000000000001AAA',
    };
    await expect(
      SalesforceClient.resolveAuthenticatedCivicTaxUser(untrustedToken)
    ).rejects.toThrow('untrusted identity URL');

    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...identityResponse,
            user_id: '005000000000002AAA',
          }),
          { status: 200 }
        )
      )
    );
    await expect(
      SalesforceClient.resolveAuthenticatedCivicTaxUser(tokenData)
    ).rejects.toThrow('did not match');
  });

  it('rejects an unmapped Salesforce account and an invalid mapped role', async () => {
    config.salesforce.expectedOrgId = '00D000000000001AAA';
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(identityResponse), { status: 200 })
        )
        .mockResolvedValueOnce(new Response('{}', { status: 403 }))
    );
    await expect(
      SalesforceClient.resolveAuthenticatedCivicTaxUser(tokenData)
    ).rejects.toMatchObject({
      name: 'SalesforceApiError',
      statusCode: 403,
      code: 'CIVICTAX_IDENTITY_NOT_AUTHORIZED',
    });

    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(identityResponse), { status: 200 })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 'user-id', role: 'SUPERADMIN' }), {
            status: 200,
          })
        )
    );
    await expect(
      SalesforceClient.resolveAuthenticatedCivicTaxUser(tokenData)
    ).rejects.toMatchObject({
      code: 'CIVICTAX_IDENTITY_INVALID',
    });
  });

  it('sends the PKCE verifier to the token endpoint and rejects expired codes', async () => {
    config.salesforce.clientId = 'test-client-id';
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(tokenData), { status: 200 })
      );
    vi.stubGlobal('fetch', fetcher);

    const response = await SalesforceClient.exchangeCodeForToken(
      'single-use-code',
      'the-pkce-verifier'
    );
    expect(response.access_token).toBe('test-access-token');
    expect(fetcher.mock.calls[0][0]).toBe(
      'https://login.salesforce.com/services/oauth2/token'
    );
    expect(String(fetcher.mock.calls[0][1]?.body)).toContain(
      'code_verifier=the-pkce-verifier'
    );

    const expiredCodeResponse = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 })
    );
    vi.stubGlobal('fetch', expiredCodeResponse);
    await expect(
      SalesforceClient.exchangeCodeForToken(
        'expired-authorization-code',
        'the-pkce-verifier'
      )
    ).rejects.toThrow('Salesforce token exchange failed (400).');
    expect(
      JSON.stringify(expiredCodeResponse.mock.calls)
    ).not.toContain('test-access-token');
  });
});
