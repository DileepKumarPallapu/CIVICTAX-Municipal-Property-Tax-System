import { afterEach, describe, expect, it, vi } from 'vitest';
import { config } from '../config/index.js';
import { authRouter } from '../routes/authRoutes.js';
import { oauthStateStore } from '../services/oauthStateStore.js';
import { SalesforceConnectionStore } from '../services/salesforceConnectionStore.js';
import { SalesforceClient } from '../services/salesforceClient.js';

const callbackHandler = authRouter.stack.find(
  (layer: any) =>
    layer.route?.path === '/auth/salesforce/callback' &&
    layer.route?.methods.get
)?.route.stack[0].handle;
const centralLoginHandler = authRouter.stack.find(
  (layer: any) =>
    layer.route?.path === '/auth/salesforce' &&
    layer.route?.methods.get
)?.route.stack[0].handle;
const originalIsProduction = config.isProduction;
const originalClientId = config.salesforce.clientId;
const originalRedirectUri = config.salesforce.redirectUri;

function makeSession() {
  return {
    save(callback: (error?: Error) => void) {
      callback();
    },
    regenerate(callback: (error?: Error) => void) {
      callback();
    },
  };
}

function makeResponse() {
  return {
    redirectUrl: '',
    redirect(url: string) {
      this.redirectUrl = url;
    },
  };
}

afterEach(() => {
  config.isProduction = originalIsProduction;
  config.salesforce.clientId = originalClientId;
  config.salesforce.redirectUri = originalRedirectUri;
  vi.restoreAllMocks();
});

describe('Salesforce OAuth callback', () => {
  it('requests only the required scopes for the admin Salesforce connection', async () => {
    config.isProduction = false;
    config.salesforce.clientId = 'test-client-id';
    config.salesforce.redirectUri =
      'http://localhost:3001/auth/salesforce/callback';
    vi.spyOn(oauthStateStore, 'create').mockResolvedValue();
    const res = makeResponse();

    await centralLoginHandler(
      {
        sessionID: 'admin-session',
        session: {
          ...makeSession(),
          civicTaxUser: {
            id: 'civictax-admin',
            role: 'ADMIN',
          },
          authProvider: 'demo',
        },
      },
      res
    );

    expect(new URL(res.redirectUrl).searchParams.get('scope')).toBe(
      'api id refresh_token'
    );
  });

  it('rejects a missing state without exchanging the authorization code', async () => {
    const consume = vi.spyOn(oauthStateStore, 'consume');
    const exchange = vi.spyOn(SalesforceClient, 'exchangeCodeForToken');
    const res = makeResponse();

    await callbackHandler(
      {
        query: { code: 'authorization-code' },
        sessionID: 'browser-session',
        session: makeSession(),
      },
      res
    );

    expect(consume).not.toHaveBeenCalled();
    expect(exchange).not.toHaveBeenCalled();
    expect(res.redirectUrl).toContain('auth_error=Invalid_OAuth_State');
  });

  it('regenerates the browser session and stores only the mapped CivicTax user', async () => {
    const state = 'a'.repeat(64);
    vi.spyOn(oauthStateStore, 'consume').mockResolvedValue({
      sessionId: 'old-session-id',
      flow: 'civictax-login',
      codeVerifier: 'pkce-verifier',
      expiresAt: Date.now() + 60_000,
    });
    vi.spyOn(SalesforceClient, 'exchangeCodeForToken').mockResolvedValue({
      access_token: 'transient-user-access-token',
      instance_url: 'https://civictax.my.salesforce.com',
      id: 'https://login.salesforce.com/id/00D000000000001AAA/005000000000001AAA',
      token_type: 'Bearer',
      issued_at: '1700000000000',
    });
    vi.spyOn(
      SalesforceClient,
      'resolveAuthenticatedCivicTaxUser'
    ).mockResolvedValue({
      id: 'civictax-user-001',
      name: 'Mapped Citizen',
      email: 'citizen@example.invalid',
      role: 'CITIZEN',
    });

    const oldSession = makeSession();
    let sessionRegenerated = false;
    const req: any = {
      query: { code: 'single-use-code', state },
      sessionID: 'old-session-id',
      session: oldSession,
    };
    req.session.regenerate = (callback: (error?: Error) => void) => {
      sessionRegenerated = true;
      req.session = makeSession();
      callback();
    };
    const res = makeResponse();

    await callbackHandler(req, res);

    expect(sessionRegenerated).toBe(true);
    expect(oldSession.civicTaxUser).toBeUndefined();
    expect(req.session).toMatchObject({
      civicTaxUser: {
        id: 'civictax-user-001',
        role: 'CITIZEN',
      },
      authProvider: 'salesforce',
    });
    expect(JSON.stringify(req.session)).not.toContain(
      'transient-user-access-token'
    );
    expect(res.redirectUrl).toContain('/login?auth=success');
  });

  it('keeps the admin service-connection flow separate from user login', async () => {
    config.isProduction = false;
    const state = 'b'.repeat(64);
    vi.spyOn(oauthStateStore, 'consume').mockResolvedValue({
      sessionId: 'admin-session',
      flow: 'central-salesforce',
      codeVerifier: 'central-pkce-verifier',
      expiresAt: Date.now() + 60_000,
    });
    vi.spyOn(SalesforceClient, 'exchangeCodeForToken').mockResolvedValue({
      access_token: 'central-access-token',
      refresh_token: 'central-refresh-token',
      instance_url: 'https://civictax.my.salesforce.com',
      id: 'https://login.salesforce.com/id/00D000000000001AAA/005000000000001AAA',
      token_type: 'Bearer',
      issued_at: '1700000000000',
    });
    vi.spyOn(SalesforceClient, 'fetchIdentity').mockResolvedValue({
      username: 'admin@example.invalid',
      display_name: 'CivicTax Admin',
      organization_id: '00D000000000001AAA',
      user_id: '005000000000001AAA',
    });
    const save = vi.spyOn(SalesforceConnectionStore, 'save').mockResolvedValue();
    const session: any = {
      ...makeSession(),
      civicTaxUser: {
        id: 'civictax-admin',
        role: 'ADMIN',
      },
      authProvider: 'demo',
    };
    const res = makeResponse();

    await callbackHandler(
      {
        query: { code: 'central-code', state },
        sessionID: 'admin-session',
        session,
      },
      res
    );

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'central-access-token',
        refreshToken: 'central-refresh-token',
      })
    );
    expect(res.redirectUrl).toContain('/admin/salesforce?status=success');
    expect(session.civicTaxUser.id).toBe('civictax-admin');
  });
});
