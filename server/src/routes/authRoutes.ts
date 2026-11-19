
import { Router, Request, Response } from 'express';
import { config } from '../config/index.js';
import { PKCEUtils } from '../utils/pkce.js';
import { SalesforceConnectionStore } from '../services/salesforceConnectionStore.js';
import { SalesforceClient } from '../services/salesforceClient.js';
import {
  SalesforceSessionData,
  SalesforceStatusResponse,
  CivicTaxSessionUser,
} from '../types/index.js';

declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
    codeVerifier?: string;
    salesforceSession?: SalesforceSessionData;
    civicTaxUser?: CivicTaxSessionUser;
  }
}

export const authRouter = Router();

// Demo users. Replace with a persistent user database and hashed passwords
// before production deployment.
const REGISTERED_USERS: Record<
  string,
  { passwordHash: string; user: CivicTaxSessionUser }
> = {
  'admin@civictax.demo': {
    passwordHash: 'Admin@123',
    user: {
      id: 'usr-admin-01',
      email: 'admin@civictax.demo',
      role: 'ADMIN',
      name: 'Pallapu Dileep Kumar',
    },
  },
  'officer@civictax.demo': {
    passwordHash: 'Officer@123',
    user: {
      id: 'usr-officer-01',
      email: 'officer@civictax.demo',
      role: 'OFFICER',
      name: 'Ananya Deshmukh',
    },
  },
  'citizen@civictax.demo': {
    passwordHash: 'Citizen@123',
    user: {
      id: 'usr-citizen-01',
      email: 'citizen@civictax.demo',
      role: 'CITIZEN',
      name: 'Rajesh Kumar Sharma',
    },
  },
};

function isAuthenticated(req: Request): boolean {
  return Boolean(req.session.civicTaxUser);
}

function isAdmin(req: Request): boolean {
  return req.session.civicTaxUser?.role === 'ADMIN';
}

// POST /api/auth/login
authRouter.post('/api/auth/login', (req: Request, res: Response) => {
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

  if (!record || record.passwordHash !== password) {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
    return;
  }

  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({
        success: false,
        error: 'Unable to create login session',
      });
      return;
    }

    req.session.civicTaxUser = record.user;

    req.session.save((saveError) => {
      if (saveError) {
        res.status(500).json({
          success: false,
          error: 'Unable to save login session',
        });
        return;
      }

      res.json({
        success: true,
        user: record.user,
      });
    });
  });
});

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
authRouter.post('/api/auth/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({
        success: false,
        error: 'Failed to log out',
      });
      return;
    }

    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });
});

// GET /auth/salesforce
// Only the CivicTax administrator can initiate the central connection.
authRouter.get('/auth/salesforce', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  if (!config.salesforce.clientId) {
    res.status(500).json({
      error: 'Salesforce Client ID is not configured.',
    });
    return;
  }

  const state = PKCEUtils.generateState();
  const codeVerifier = PKCEUtils.generateCodeVerifier();
  const codeChallenge = PKCEUtils.generateCodeChallenge(codeVerifier);

  req.session.oauthState = state;
  req.session.codeVerifier = codeVerifier;

  req.session.save((err) => {
    if (err) {
      res.status(500).json({
        error: 'Unable to save OAuth session',
      });
      return;
    }

    const authParams = new URLSearchParams({
      response_type: 'code',
      client_id: config.salesforce.clientId,
      redirect_uri: config.salesforce.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      scope: 'api refresh_token web',
      prompt: 'login consent',
    });

    const authorizationUrl =
      `${config.salesforce.loginUrl}/services/oauth2/authorize?${authParams.toString()}`;

    res.redirect(authorizationUrl);
  });
});

// GET /auth/salesforce/callback
authRouter.get(
  '/auth/salesforce/callback',
  async (req: Request, res: Response) => {
    const { code, state, error, error_description } = req.query;

    const adminPage = `${config.frontendUrl}/admin/salesforce`;

    if (error) {
      res.redirect(
        `${adminPage}?error=${encodeURIComponent(
          String(error_description || error)
        )}`
      );
      return;
    }

    if (!isAdmin(req)) {
      res.redirect(
        `${adminPage}?error=${encodeURIComponent('Admin_Login_Required')}`
      );
      return;
    }

    if (
      typeof code !== 'string' ||
      typeof state !== 'string'
    ) {
      res.redirect(`${adminPage}?error=Missing_Code_Or_State`);
      return;
    }

    if (!req.session.oauthState || state !== req.session.oauthState) {
      res.redirect(`${adminPage}?error=Invalid_OAuth_State`);
      return;
    }

    const verifier = req.session.codeVerifier;

    if (!verifier) {
      res.redirect(`${adminPage}?error=Missing_Code_Verifier`);
      return;
    }

    try {
      const tokenData = await SalesforceClient.exchangeCodeForToken(
        code,
        verifier
      );

      let username = '';
      let displayName = '';
      let orgId = '';
      let userId = '';

      try {
        const identity = await SalesforceClient.fetchIdentity(
          tokenData.id,
          tokenData.access_token
        );

        username = identity.username;
        displayName = identity.display_name;
        orgId = identity.organization_id;
        userId = identity.user_id;
      } catch (identityError) {
        console.error(
          'Unable to retrieve Salesforce identity:',
          identityError
        );

        const segments = tokenData.id.split('/');
        orgId = segments[segments.length - 2] || '';
        userId = segments[segments.length - 1] || '';
      }

      const sessionData: SalesforceSessionData = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        instanceUrl: tokenData.instance_url,
        identityUrl: tokenData.id,
        userId,
        orgId,
        username,
        displayName,
        connectedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };

      // Save the integration credentials centrally in encrypted Redis storage.
      await SalesforceConnectionStore.save(sessionData);

      delete req.session.oauthState;
      delete req.session.codeVerifier;

      req.session.save((saveError) => {
        if (saveError) {
          console.error('OAuth session cleanup failed:', saveError);
        }

        res.redirect(`${adminPage}?status=success`);
      });
    } catch (err: unknown) {
      console.error('Salesforce OAuth Error:', err);

      const message =
        err instanceof Error ? err.message : 'Authentication_Failed';

      res.redirect(
        `${adminPage}?error=${encodeURIComponent(message)}`
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
      console.error('Salesforce status error:', err);

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
      console.error('Salesforce disconnect error:', err);

      res.status(500).json({
        success: false,
        error: 'Failed to disconnect Salesforce',
      });
    }
  }
);
