import { Router, Request, Response } from 'express';
import { config } from '../config/index.js';
import { PKCEUtils } from '../utils/pkce.js';
import { SalesforceClient } from '../services/salesforceClient.js';
import { SalesforceSessionData, SalesforceStatusResponse } from '../types/index.js';

// Augment express-session type
declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
    codeVerifier?: string;
    salesforceSession?: SalesforceSessionData;
  }
}

export const authRouter = Router();

// GET /auth/salesforce - Initiate OAuth 2.0 PKCE flow
authRouter.get('/auth/salesforce', (req: Request, res: Response) => {
  if (!config.salesforce.clientId) {
    res.status(500).json({
      error: 'Salesforce Client ID not configured in server environment. Please set SF_CLIENT_ID.',
    });
    return;
  }

  const state = PKCEUtils.generateState();
  const codeVerifier = PKCEUtils.generateCodeVerifier();
  const codeChallenge = PKCEUtils.generateCodeChallenge(codeVerifier);

  // Store state and verifier securely in server-side session
  req.session.oauthState = state;
  req.session.codeVerifier = codeVerifier;

  const authParams = new URLSearchParams({
    response_type: 'code',
    client_id: config.salesforce.clientId,
    redirect_uri: config.salesforce.redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
    scope: 'api refresh_token id web',
    prompt: 'login consent',
  });

  const authorizationUrl = `${config.salesforce.loginUrl}/services/oauth2/authorize?${authParams.toString()}`;
  res.redirect(authorizationUrl);
});

// GET /auth/salesforce/callback - OAuth 2.0 PKCE Callback Handler
authRouter.get('/auth/salesforce/callback', async (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    res.redirect(`${config.frontendUrl}/admin/salesforce?error=${encodeURIComponent(String(error_description || error))}`);
    return;
  }

  if (!code || !state) {
    res.redirect(`${config.frontendUrl}/admin/salesforce?error=Missing_Code_Or_State`);
    return;
  }

  // Validate state against CSRF
  if (state !== req.session.oauthState) {
    res.redirect(`${config.frontendUrl}/admin/salesforce?error=Invalid_OAuth_State`);
    return;
  }

  const verifier = req.session.codeVerifier;
  if (!verifier) {
    res.redirect(`${config.frontendUrl}/admin/salesforce?error=Missing_Code_Verifier`);
    return;
  }

  try {
    const tokenData = await SalesforceClient.exchangeCodeForToken(String(code), verifier);

    // Fetch user identity
    let username = '';
    let displayName = '';
    let orgId = '';
    let userId = '';

    try {
      const identity = await SalesforceClient.fetchIdentity(tokenData.id, tokenData.access_token);
      username = identity.username;
      displayName = identity.display_name;
      orgId = identity.organization_id;
      userId = identity.user_id;
    } catch {
      // Identity URL parsing fallback
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

    req.session.salesforceSession = sessionData;
    delete req.session.oauthState;
    delete req.session.codeVerifier;

    res.redirect(`${config.frontendUrl}/admin/salesforce?status=success`);
  } catch (err: any) {
    console.error('Salesforce OAuth Error:', err);
    res.redirect(`${config.frontendUrl}/admin/salesforce?error=${encodeURIComponent(err.message || 'Authentication_Failed')}`);
  }
});

// GET /api/salesforce/status - Retrieve Connection Status (Without exposing any secrets or tokens)
authRouter.get('/api/salesforce/status', (req: Request, res: Response) => {
  const sfSession = req.session.salesforceSession;

  if (!sfSession || !sfSession.accessToken) {
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
});

// POST /auth/salesforce/logout - Revoke Session & Disconnect
authRouter.post('/auth/salesforce/logout', (req: Request, res: Response) => {
  delete req.session.salesforceSession;
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to clear session' });
      return;
    }
    res.clearCookie('civictax.sid');
    res.json({ success: true, message: 'Salesforce session disconnected' });
  });
});
