
import { Router, Request, Response, NextFunction } from 'express';
import { SalesforceClient } from '../services/salesforceClient.js';
import { SalesforceConnectionStore } from '../services/salesforceConnectionStore.js';
import { SalesforceSessionData } from '../types/index.js';
import { config } from '../config/index.js';

export const salesforceApiRouter = Router();

// ============================================================
// 1. CSRF PROTECTION
// ============================================================

const verifyCsrf = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin;

    const customHeader =
      req.headers['x-requested-with'] ||
      req.headers['x-civictax-csrf'];

    const allowedOrigins = [
      config.frontendUrl,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ].filter(Boolean);

    if (origin) {
      let originUrl: URL;

      try {
        originUrl = new URL(origin);
      } catch {
        res.status(403).json({
          error: 'CSRF_VALIDATION_FAILED',
          message: 'Invalid request origin.',
        });
        return;
      }

      const matches = allowedOrigins.some((allowed) => {
        try {
          return new URL(allowed).origin === originUrl.origin;
        } catch {
          return false;
        }
      });

      if (!matches) {
        res.status(403).json({
          error: 'CSRF_VALIDATION_FAILED',
          message: 'Cross-origin state-changing requests are prohibited.',
        });
        return;
      }
    } else if (!customHeader) {
      res.status(403).json({
        error: 'CSRF_VALIDATION_FAILED',
        message: 'A valid request origin or CSRF header is required.',
      });
      return;
    }
  }

  next();
};

// ============================================================
// 2. CENTRAL SALESFORCE CONNECTION MIDDLEWARE
// ============================================================

const requireSalesforceSession = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sfSession = await SalesforceConnectionStore.get();

    if (
      !sfSession ||
      !sfSession.accessToken ||
      !sfSession.instanceUrl
    ) {
      res.status(503).json({
        error: 'SALESFORCE_NOT_CONNECTED',
        message:
          'The CivicTax administrator must connect Salesforce before using gateway services.',
      });
      return;
    }

    // Store the central connection for the current request.
    // Never send these credentials to the frontend.
    res.locals.salesforceSession = sfSession;

    next();
  } catch (err) {
    console.error('Central Salesforce connection error:', err);

    res.status(503).json({
      error: 'SALESFORCE_CONNECTION_UNAVAILABLE',
      message: 'Unable to retrieve the central Salesforce connection.',
    });
  }
};

// ============================================================
// 3. CIVICTAX AUTHENTICATION
// ============================================================

const requireCivicTaxUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.session.civicTaxUser;

  if (!user) {
    res.status(401).json({
      error: 'UNAUTHENTICATED',
      message:
        'CivicTax user login required. Please authenticate before invoking municipal gateway services.',
    });
    return;
  }

  next();
};

// ============================================================
// 4. ROLE-BASED ACCESS CONTROL
// ============================================================

const requireRole = (
  allowedRoles: Array<'CITIZEN' | 'OFFICER' | 'ADMIN'>
) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const user = req.session.civicTaxUser;

    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Operation restricted to authorized roles: ${allowedRoles.join(
          ', '
        )}. Your role: ${user ? user.role : 'ANONYMOUS'}`,
      });
      return;
    }

    next();
  };
};

// ============================================================
// 5. CENTRAL SESSION HELPERS
// ============================================================

function getSalesforceSession(res: Response): SalesforceSessionData {
  const session = res.locals.salesforceSession as
    | SalesforceSessionData
    | undefined;

  if (!session) {
    throw new Error('Central Salesforce connection is unavailable.');
  }

  return session;
}

async function updateSalesforceActivity(res: Response): Promise<void> {
  const session = getSalesforceSession(res);

  session.lastActiveAt = new Date().toISOString();

  // Persist updated activity and credentials centrally.
  await SalesforceConnectionStore.save(session);
}

// ============================================================
// 6. SALESFORCE CONNECTIVITY VERIFICATION
// ADMIN ONLY
// ============================================================

// GET /api/salesforce/verify

salesforceApiRouter.get(
  '/api/salesforce/verify',
  requireCivicTaxUser,
  requireRole(['ADMIN']),
  requireSalesforceSession,
  async (_req: Request, res: Response) => {
    try {
      const session = getSalesforceSession(res);

      const identity = await SalesforceClient.fetchIdentity(
        session.identityUrl,
        session.accessToken
      );

      await updateSalesforceActivity(res);

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
      console.error('Salesforce verification failed:', err);

      res.status(502).json({
        success: false,
        error: 'SALESFORCE_VERIFICATION_FAILED',
        message: err.message || 'Unable to verify Salesforce connection.',
      });
    }
  }
);

// ============================================================
// 7. PROPERTY VERIFICATION PROXY
// OFFICERS AND ADMINS ONLY
// ============================================================

// PATCH /api/salesforce/proxy/properties*

salesforceApiRouter.patch(
  '/api/salesforce/proxy/properties*',
  verifyCsrf,
  requireCivicTaxUser,
  requireRole(['OFFICER', 'ADMIN']),
  requireSalesforceSession,
  async (req: Request, res: Response) => {
    try {
      const session = getSalesforceSession(res);

      const endpointPath =
        'properties' + (req.params[0] || '');

      const data = await SalesforceClient.callApexRest(
        session,
        endpointPath,
        'PATCH',
        req.body
      );

      await updateSalesforceActivity(res);

      res.json(data);
    } catch (err: any) {
      console.error('Property Apex proxy error:', err);

      res.status(502).json({
        error: 'APEX_REST_PROXY_ERROR',
        message: err.message || 'Property verification failed.',
      });
    }
  }
);

// ============================================================
// 8. DASHBOARD ANALYTICS PROXY
// OFFICERS AND ADMINS ONLY
// ============================================================

// GET /api/salesforce/proxy/dashboard*

salesforceApiRouter.get(
  '/api/salesforce/proxy/dashboard*',
  requireCivicTaxUser,
  requireRole(['OFFICER', 'ADMIN']),
  requireSalesforceSession,
  async (req: Request, res: Response) => {
    try {
      const session = getSalesforceSession(res);

      const endpointPath =
        'dashboard' + (req.params[0] || '');

      const data = await SalesforceClient.callApexRest(
        session,
        endpointPath,
        'GET'
      );

      await updateSalesforceActivity(res);

      res.json(data);
    } catch (err: any) {
      console.error('Dashboard Apex proxy error:', err);

      res.status(502).json({
        error: 'APEX_REST_PROXY_ERROR',
        message: err.message || 'Dashboard request failed.',
      });
    }
  }
);

// ============================================================
// 9. ASSESSMENT GENERATION PROXY
// OFFICERS AND ADMINS ONLY
// ============================================================

// POST /api/salesforce/proxy/assessments*

salesforceApiRouter.post(
  '/api/salesforce/proxy/assessments*',
  verifyCsrf,
  requireCivicTaxUser,
  requireRole(['OFFICER', 'ADMIN']),
  requireSalesforceSession,
  async (req: Request, res: Response) => {
    try {
      const session = getSalesforceSession(res);

      const endpointPath =
        'assessments' + (req.params[0] || '');

      const data = await SalesforceClient.callApexRest(
        session,
        endpointPath,
        'POST',
        req.body
      );

      await updateSalesforceActivity(res);

      res.json(data);
    } catch (err: any) {
      console.error('Assessment Apex proxy error:', err);

      res.status(502).json({
        error: 'APEX_REST_PROXY_ERROR',
        message: err.message || 'Assessment request failed.',
      });
    }
  }
);

// ============================================================
// 10. GENERIC APEX REST PROXY
// CIVICTAX AUTHENTICATION + ROLE RESTRICTIONS
// ============================================================

// /api/salesforce/proxy/*

salesforceApiRouter.all(
  '/api/salesforce/proxy/*',
  verifyCsrf,
  requireCivicTaxUser,
  requireSalesforceSession,
  async (req: Request, res: Response) => {
    try {
      const user = req.session.civicTaxUser!;

      const session = getSalesforceSession(res);

      const endpointPath = req.params[0] || '';

      const method = req.method as
        | 'GET'
        | 'POST'
        | 'PATCH'
        | 'DELETE';

      const body = req.body;

      // Citizens cannot perform administrative modifications.
      if (
        user.role === 'CITIZEN' &&
        ['PATCH', 'DELETE'].includes(method)
      ) {
        res.status(403).json({
          error: 'FORBIDDEN',
          message:
            'Citizens are not authorized to execute administrative modifications via proxy.',
        });
        return;
      }

      // Restrict citizen POST operations.
      if (user.role === 'CITIZEN' && method === 'POST') {
        const allowedCitizenPostEndpoints = [
          'properties',
          'payments',
          'grievances',
          'reassessments',
        ];

        const isAllowed = allowedCitizenPostEndpoints.some(
          (endpoint) => endpointPath.startsWith(endpoint)
        );

        if (!isAllowed) {
          res.status(403).json({
            error: 'FORBIDDEN',
            message:
              'Citizens are not authorized to post to this administrative endpoint.',
          });
          return;
        }
      }

      // Citizens cannot access executive analytics.
      if (
        user.role === 'CITIZEN' &&
        method === 'GET' &&
        endpointPath.startsWith('dashboard')
      ) {
        res.status(403).json({
          error: 'FORBIDDEN',
          message:
            'Executive analytics dashboard is restricted to Municipal Officers and Administrators.',
        });
        return;
      }

      const data = await SalesforceClient.callApexRest(
        session,
        endpointPath,
        method,
        body
      );

      await updateSalesforceActivity(res);

      res.json(data);
    } catch (err: any) {
      console.error('Generic Apex proxy error:', err);

      const sanitizedMessage = String(
        err?.message || 'Apex Proxy Error'
      ).replace(
        /Bearer\s+[A-Za-z0-9._-]+/gi,
        'Bearer [REDACTED]'
      );

      res.status(502).json({
        error: 'APEX_REST_PROXY_ERROR',
        message: sanitizedMessage,
      });
    }
  }
);
