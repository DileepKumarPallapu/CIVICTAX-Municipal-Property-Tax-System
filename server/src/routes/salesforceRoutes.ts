
import { Router, Request, Response, NextFunction } from 'express';
import {
  SalesforceApiError,
  SalesforceClient,
} from '../services/salesforceClient.js';
import { SalesforceConnectionStore } from '../services/salesforceConnectionStore.js';
import { SalesforceSessionData } from '../types/index.js';
import { verifyCsrf } from '../middleware/csrf.js';
import { getAuthenticatedUser } from '../middleware/auth.js';

export const salesforceApiRouter = Router();

function logError(context: string, error: unknown): void {
  const errorType = error instanceof Error ? error.name : 'UnknownError';
  console.error(`${context} (${errorType}).`);
}

function getPublicProxyError(
  error: unknown,
  fallback: string
): { status: number; message: string } {
  if (!(error instanceof SalesforceApiError)) {
    return { status: 502, message: fallback };
  }

  if (error.statusCode === 404) {
    return { status: 404, message: 'The requested record was not found.' };
  }
  if (error.statusCode === 409) {
    return { status: 409, message: 'The requested record already exists.' };
  }
  if (error.statusCode === 403) {
    return { status: 403, message: 'The authenticated user is not authorized.' };
  }
  if (error.statusCode === 400) {
    return { status: 400, message: 'The request could not be processed.' };
  }

  return { status: 502, message: fallback };
}

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
    logError('Central Salesforce connection error', err);

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
  const user = getAuthenticatedUser(req);

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
    const user = getAuthenticatedUser(req);

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
        session.accessToken,
        session.instanceUrl
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
    } catch (err: unknown) {
      logError('Salesforce verification failed', err);

      res.status(502).json({
        success: false,
        error: 'SALESFORCE_VERIFICATION_FAILED',
        message: 'Unable to verify Salesforce connection.',
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
        req.body,
        req.session.civicTaxUser!.id
      );

      await updateSalesforceActivity(res);

      res.json(data);
    } catch (err: unknown) {
      logError('Property Apex proxy error', err);
      const publicError = getPublicProxyError(
        err,
        'Property verification failed.'
      );

      res.status(publicError.status).json({
        error: 'APEX_REST_PROXY_ERROR',
        message: publicError.message,
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
        'GET',
        undefined,
        req.session.civicTaxUser!.id
      );

      await updateSalesforceActivity(res);

      res.json(data);
    } catch (err: unknown) {
      logError('Dashboard Apex proxy error', err);
      const publicError = getPublicProxyError(
        err,
        'Dashboard request failed.'
      );

      res.status(publicError.status).json({
        error: 'APEX_REST_PROXY_ERROR',
        message: publicError.message,
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
        req.body,
        req.session.civicTaxUser!.id
      );

      await updateSalesforceActivity(res);

      res.json(data);
    } catch (err: unknown) {
      logError('Assessment Apex proxy error', err);
      const publicError = getPublicProxyError(
        err,
        'Assessment request failed.'
      );

      res.status(publicError.status).json({
        error: 'APEX_REST_PROXY_ERROR',
        message: publicError.message,
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
        body,
        user.id
      );

      await updateSalesforceActivity(res);

      res.json(data);
    } catch (err: unknown) {
      logError('Generic Apex proxy error', err);
      const publicError = getPublicProxyError(
        err,
        'Salesforce request failed.'
      );

      res.status(publicError.status).json({
        error: 'APEX_REST_PROXY_ERROR',
        message: publicError.message,
      });
    }
  }
);
