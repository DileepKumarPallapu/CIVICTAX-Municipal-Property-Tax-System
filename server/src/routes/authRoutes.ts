
import { Router, Request, Response } from 'express';
import { config } from '../config/index.js';
import { verifyCsrf } from '../middleware/csrf.js';
import {
  getAuthenticatedUser,
  SESSION_COOKIE_NAME,
} from '../middleware/auth.js';
import { PKCEUtils } from '../utils/pkce.js';
import { SalesforceConnectionStore } from '../services/salesforceConnectionStore.js';
import { SalesforceClient } from '../services/salesforceClient.js';
import {
  oauthStateStore,
  type OAuthFlow,
  type OAuthStateRecord,
} from '../services/oauthStateStore.js';
import {
  SalesforceSessionData,
  SalesforceStatusResponse,
  CivicTaxSessionUser,
} from '../types/index.js';

declare module 'express-session' {
  interface SessionData {
    salesforceSession?: SalesforceSessionData;
    civicTaxUser?: CivicTaxSessionUser;
    authProvider?: 'salesforce' | 'demo';
    authenticatedAt?: number;
    lastActivityAt?: number;
    oauthStartedAt?: number;
  }
}

export const authRouter = Router();

// Development fixtures only. Production authentication always uses Salesforce OAuth.
const REGISTERED_USERS: Record<
  string,
  { password: string; user: CivicTaxSessionUser }
> = {
  'admin@civictax.demo': {
    password: 'Admin@123',
    user: {
      id: 'usr-admin-01',
      email: 'admin@civictax.demo',
      role: 'ADMIN',
      name: 'Pallapu Dileep Kumar',
    },
  },
  'officer@civictax.demo': {
    password: 'Officer@123',
    user: {
      id: 'usr-officer-01',
      email: 'officer@civictax.demo',
      role: 'OFFICER',
      name: 'Ananya Deshmukh',
    },
  },
  'citizen@civictax.demo': {
    password: 'Citizen@123',
    user: {
      id: 'usr-citizen-01',
      email: 'citizen@civictax.demo',
      role: 'CITIZEN',
      name: 'Rajesh Kumar Sharma',
    },
  },
};

function isAuthenticated(req: Request): boolean {
  return Boolean(getAuthenticatedUser(req));
}

function isAdmin(req: Request): boolean {
  return getAuthenticatedUser(req)?.role === 'ADMIN';
}

function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function authorizationUrl(
  state: string,
  codeVerifier: string,
  flow: OAuthFlow
): string {
  const codeChallenge = PKCEUtils.generateCodeChallenge(codeVerifier);
  const parameters = new URLSearchParams({
    response_type: 'code',
    client_id: config.salesforce.clientId,
    redirect_uri: config.salesforce.redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    scope:
      flow === 'central-salesforce'
      ? 'api id refresh_token'
        : 'api id',
  });
  if (flow === 'central-salesforce') {
    parameters.set('prompt', 'login consent');
  } else {
    parameters.set('prompt', 'login');
  }
  return `${config.salesforce.loginUrl}/services/oauth2/authorize?${parameters.toString()}`;
}

async function beginOAuthFlow(
  req: Request,
  res: Response,
  flow: OAuthFlow
): Promise<void> {
  if (!config.salesforce.clientId || !config.salesforce.redirectUri) {
    res.status(503).json({
      error: 'SALESFORCE_OAUTH_NOT_CONFIGURED',
      message: 'Salesforce authentication is not configured.',
    });
    return;
  }

  const state = PKCEUtils.generateState();
  const codeVerifier = PKCEUtils.generateCodeVerifier();
  await oauthStateStore.create(state, {
    sessionId: req.sessionID,
    flow,
    codeVerifier,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
  req.session.oauthStartedAt = Date.now();
  await saveSession(req);
  res.redirect(authorizationUrl(state, codeVerifier, flow));
}

// POST /api/auth/login
authRouter.post(
  '/api/auth/login',
  verifyCsrf,
  (req: Request, res: Response) => {
    if (config.isProduction) {
      res.status(503).json({
        success: false,
        error: 'AUTHENTICATION_NOT_CONFIGURED',
        message: 'Production authentication has not been configured.',
      });
      return;
    }

    const { email, password } = req.body ?? {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    const record = REGISTERED_USERS[email.toLowerCase().trim()];

    if (!record || record.password !== password) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    void regenerateSession(req)
      .then(() => {
        req.session.civicTaxUser = record.user;
        req.session.authProvider = 'demo';
        req.session.authenticatedAt = Date.now();
        req.session.lastActivityAt = Date.now();
        return saveSession(req);
      })
      .then(() => {
        res.json({
          success: true,
          user: record.user,
        });
      })
      .catch(() => {
        res.status(500).json({
          success: false,
          error: 'Unable to create login session',
        });
      });
  }
);

// GET /api/auth/me
authRouter.get('/api/auth/me', (req: Request, res: Response) => {
  if (!isAuthenticated(req)) {
    res.status(401).json({
      authenticated: false,
      user: null,
    });
    return;
  }

  res.json({
    authenticated: true,
    user: req.session.civicTaxUser,
  });
});

// POST /api/auth/logout
authRouter.post(
  '/api/auth/logout',
  verifyCsrf,
  (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({
          success: false,
          error: 'Failed to log out',
        });
        return;
      }

      res.clearCookie(SESSION_COOKIE_NAME, {
        path: '/',
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.isProduction ? 'none' : 'lax',
      });
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  }
);

// GET /auth/salesforce/login
// Salesforce authenticates the user; CivicTax authorization follows mapping.
authRouter.get('/auth/salesforce/login', async (req: Request, res: Response) => {
  try {
    await beginOAuthFlow(req, res, 'civictax-login');
  } catch (err) {
    const errorType = err instanceof Error ? err.name : 'UnknownError';
    console.error(`CivicTax OAuth initialization failed (${errorType}).`);
    res.status(503).json({
      error: 'SALESFORCE_OAUTH_UNAVAILABLE',
      message: 'Salesforce sign-in could not be started.',
    });
  }
});

// GET /auth/salesforce
// Only an authenticated CivicTax administrator can connect the service account.
authRouter.get('/auth/salesforce', async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  try {
    await beginOAuthFlow(req, res, 'central-salesforce');
  } catch (err) {
    const errorType = err instanceof Error ? err.name : 'UnknownError';
    console.error(`Central Salesforce OAuth initialization failed (${errorType}).`);
    res.status(503).json({
      error: 'SALESFORCE_OAUTH_UNAVAILABLE',
      message: 'Salesforce connection could not be started.',
    });
  }
});

// GET /auth/salesforce/callback
authRouter.get(
  '/auth/salesforce/callback',
  async (req: Request, res: Response) => {
    const { code, state, error } = req.query;
    const adminPage = `${config.frontendUrl}/admin/salesforce`;
    const loginPage = `${config.frontendUrl}/login`;
    const errorRedirect = (code: string) => {
      res.redirect(
        isAdmin(req)
          ? `${adminPage}?error=${encodeURIComponent(code)}`
          : `${loginPage}?auth_error=${encodeURIComponent(code)}`
      );
    };

    if (typeof state !== 'string') {
      errorRedirect('Invalid_OAuth_State');
      return;
    }

    let stateRecord: OAuthStateRecord | null;
    try {
      stateRecord = await oauthStateStore.consume(state, req.sessionID);
    } catch (stateError) {
      const errorType =
        stateError instanceof Error ? stateError.name : 'UnknownError';
      console.error(`OAuth state verification failed (${errorType}).`);
      res.redirect(`${loginPage}?auth_error=Authentication_Unavailable`);
      return;
    }
    if (!stateRecord) {
      errorRedirect('Invalid_OAuth_State');
      return;
    }

    if (error) {
      errorRedirect('Salesforce_Consent_Failed');
      return;
    }
    if (typeof code !== 'string' || !code) {
      errorRedirect('Missing_Authorization_Code');
      return;
    }

    if (
      stateRecord.flow === 'central-salesforce' &&
      !isAdmin(req)
    ) {
      errorRedirect('Admin_Login_Required');
      return;
    }

    try {
      const tokenData = await SalesforceClient.exchangeCodeForToken(
        code,
        stateRecord.codeVerifier
      );
      if (stateRecord.flow === 'central-salesforce') {
        if (!tokenData.refresh_token) {
          throw new Error('Central Salesforce authorization needs refresh access.');
        }

        const identity = await SalesforceClient.fetchIdentity(
          tokenData.id,
          tokenData.access_token,
          tokenData.instance_url
        );
        const now = new Date().toISOString();
        const sessionData: SalesforceSessionData = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          instanceUrl: tokenData.instance_url,
          identityUrl: tokenData.id,
          userId: identity.user_id,
          orgId: identity.organization_id,
          username: identity.username,
          displayName: identity.display_name,
          connectedAt: now,
          lastActiveAt: now,
        };
        await SalesforceConnectionStore.save(sessionData);
        delete req.session.oauthStartedAt;
        await saveSession(req);
        res.redirect(`${adminPage}?status=success`);
        return;
      }

      const civicTaxUser =
        await SalesforceClient.resolveAuthenticatedCivicTaxUser(tokenData);
      await regenerateSession(req);
      const now = Date.now();
      req.session.civicTaxUser = civicTaxUser;
      req.session.authProvider = 'salesforce';
      req.session.authenticatedAt = now;
      req.session.lastActivityAt = now;
      await saveSession(req);
      res.redirect(`${loginPage}?auth=success`);
    } catch (err: unknown) {
      const errorType = err instanceof Error ? err.name : 'UnknownError';
      console.error(`Salesforce OAuth callback failed (${errorType}).`);
      errorRedirect(
        err instanceof Error && err.name === 'SalesforceApiError'
          ? 'CivicTax_Account_Not_Authorized'
          : 'Salesforce_Authentication_Failed'
      );
    }
  }
);

// GET /api/salesforce/status
// Authenticated CivicTax users can view the shared connection status.
authRouter.get(
  '/api/salesforce/status',
  async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      res.status(401).json({
        connected: false,
        error: 'CivicTax login required',
      });
      return;
    }

    try {
      const sfSession = await SalesforceConnectionStore.get();

      if (!sfSession?.accessToken) {
        const response: SalesforceStatusResponse = {
          connected: false,
          apiVersion: config.salesforce.apiVersion,
          authMode: 'PKCE_EXTERNAL_CLIENT_APP',
        };

        res.json(response);
        return;
      }

      const response: SalesforceStatusResponse = {
        connected: true,
        instanceUrl: sfSession.instanceUrl,
        orgId: sfSession.orgId,
        username: sfSession.username,
        displayName: sfSession.displayName,
        apiVersion: config.salesforce.apiVersion,
        authMode: 'PKCE_EXTERNAL_CLIENT_APP',
        lastSync: sfSession.lastActiveAt,
      };

      res.json(response);
    } catch (err) {
      const errorType = err instanceof Error ? err.name : 'UnknownError';
      console.error(`Salesforce status failed (${errorType}).`);

      res.status(503).json({
        connected: false,
        error: 'Unable to retrieve central Salesforce connection status',
      });
    }
  }
);

// POST /auth/salesforce/logout
// Disconnect the shared Salesforce integration. CivicTax login remains active.
authRouter.post(
  '/auth/salesforce/logout',
  verifyCsrf,
  async (req: Request, res: Response) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    try {
      await SalesforceConnectionStore.disconnect();

      delete req.session.salesforceSession;

      res.json({
        success: true,
        message: 'Central Salesforce connection disconnected.',
      });
    } catch (err) {
      const errorType = err instanceof Error ? err.name : 'UnknownError';
      console.error(`Salesforce disconnect failed (${errorType}).`);

      res.status(500).json({
        success: false,
        error: 'Failed to disconnect Salesforce',
      });
    }
  }
);
