import { Router, Request, Response, NextFunction } from 'express';
import { SalesforceClient } from '../services/salesforceClient.js';

export const salesforceApiRouter = Router();

// Middleware: Require active Salesforce session for proxy and verification calls
const requireSalesforceSession = (req: Request, res: Response, next: NextFunction) => {
  const sfSession = req.session.salesforceSession;
  if (!sfSession || !sfSession.accessToken) {
    res.status(401).json({
      error: 'UNAUTHORIZED_SALESFORCE_SESSION',
      message: 'Active Salesforce connection required. Please connect via /admin/salesforce.',
    });
    return;
  }
  next();
};

// GET /api/salesforce/verify - Live Connectivity Test
salesforceApiRouter.get('/api/salesforce/verify', requireSalesforceSession, async (req: Request, res: Response) => {
  try {
    const session = req.session.salesforceSession!;
    const identity = await SalesforceClient.fetchIdentity(session.identityUrl, session.accessToken);
    session.lastActiveAt = new Date().toISOString();

    res.json({
      success: true,
      verified: true,
      orgId: identity.organization_id,
      userId: identity.user_id,
      username: identity.username,
      displayName: identity.display_name,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(502).json({
      success: false,
      error: 'Salesforce API Verification Failed',
      message: err.message,
    });
  }
});

// Generic Apex REST Proxy: GET /api/salesforce/proxy/*
salesforceApiRouter.all('/api/salesforce/proxy/*', requireSalesforceSession, async (req: Request, res: Response) => {
  try {
    const session = req.session.salesforceSession!;
    const endpointPath = req.params[0] || '';
    const method = req.method as 'GET' | 'POST' | 'PATCH' | 'DELETE';
    const body = req.body;

    const data = await SalesforceClient.callApexRest(session, endpointPath, method, body);
    session.lastActiveAt = new Date().toISOString();
    res.json(data);
  } catch (err: any) {
    console.error('Apex Proxy Error:', err);
    res.status(500).json({
      error: 'APEX_REST_PROXY_ERROR',
      message: err.message,
    });
  }
});
