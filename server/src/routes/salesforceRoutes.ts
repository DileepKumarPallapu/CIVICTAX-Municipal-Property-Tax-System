import { Router, Request, Response, NextFunction } from 'express';
import { SalesforceClient } from '../services/salesforceClient.js';
import { config } from '../config/index.js';

export const salesforceApiRouter = Router();

// 1. CSRF Protection Middleware for state-changing HTTP requests
const verifyCsrf = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    const origin = req.headers['origin'] || req.headers['referer'];
    const customHeader = req.headers['x-requested-with'] || req.headers['x-civictax-csrf'];
    
    // In automated testing or same-origin browser calls with custom header, pass validation
    if (customHeader) {
      return next();
    }

    if (origin) {
      const allowedOrigins = [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'];
      const matches = allowedOrigins.some((allowed) => String(origin).startsWith(allowed));
      if (!matches) {
        res.status(403).json({
          error: 'CSRF_VALIDATION_FAILED',
          message: 'Cross-origin state-changing requests are prohibited.',
        });
        return;
      }
    }
  }
  next();
};

// 2. Middleware: Require active Salesforce gateway connection
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

// 3. Middleware: Require authenticated CivicTax user session
const requireCivicTaxUser = (req: Request, res: Response, next: NextFunction) => {
  const user = req.session.civicTaxUser;
  if (!user) {
    res.status(401).json({
      error: 'UNAUTHENTICATED',
      message: 'CivicTax user login required. Please authenticate before invoking municipal gateway services.',
    });
    return;
  }
  next();
};

// 4. Middleware: Route-level Role-Based Access Control (RBAC)
const requireRole = (allowedRoles: Array<'CITIZEN' | 'OFFICER' | 'ADMIN'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.session.civicTaxUser;
    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Operation restricted to authorized roles: ${allowedRoles.join(', ')}. Your role: ${user ? user.role : 'ANONYMOUS'}`,
      });
      return;
    }
    next();
  };
};

// GET /api/salesforce/verify - Live Connectivity Test (Admin Only)
salesforceApiRouter.get(
  '/api/salesforce/verify',
  requireCivicTaxUser,
  requireRole(['ADMIN']),
  requireSalesforceSession,
  async (req: Request, res: Response) => {
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
  }
);

// SENSITIVE PROXY ROUTE: PATCH /api/salesforce/proxy/properties* (Verification - Officers & Admins Only)
salesforceApiRouter.patch(
  '/api/salesforce/proxy/properties*',
  verifyCsrf,
  requireCivicTaxUser,
  requireRole(['OFFICER', 'ADMIN']),
  requireSalesforceSession,
  async (req: Request, res: Response) => {
    try {
      const session = req.session.salesforceSession!;
      const endpointPath = 'properties' + (req.params[0] || '');
      const data = await SalesforceClient.callApexRest(session, endpointPath, 'PATCH', req.body);
      session.lastActiveAt = new Date().toISOString();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'APEX_REST_PROXY_ERROR', message: err.message });
    }
  }
);

// SENSITIVE PROXY ROUTE: GET /api/salesforce/proxy/dashboard* (Revenue Analytics - Officers & Admins Only)
salesforceApiRouter.get(
  '/api/salesforce/proxy/dashboard*',
  requireCivicTaxUser,
  requireRole(['OFFICER', 'ADMIN']),
  requireSalesforceSession,
  async (req: Request, res: Response) => {
    try {
      const session = req.session.salesforceSession!;
      const endpointPath = 'dashboard' + (req.params[0] || '');
      const data = await SalesforceClient.callApexRest(session, endpointPath, 'GET');
      session.lastActiveAt = new Date().toISOString();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'APEX_REST_PROXY_ERROR', message: err.message });
    }
  }
);

// SENSITIVE PROXY ROUTE: POST /api/salesforce/proxy/assessments* (Assessment Generation - Officers & Admins Only)
salesforceApiRouter.post(
  '/api/salesforce/proxy/assessments*',
  verifyCsrf,
  requireCivicTaxUser,
  requireRole(['OFFICER', 'ADMIN']),
  requireSalesforceSession,
  async (req: Request, res: Response) => {
    try {
      const session = req.session.salesforceSession!;
      const endpointPath = 'assessments' + (req.params[0] || '');
      const data = await SalesforceClient.callApexRest(session, endpointPath, 'POST', req.body);
      session.lastActiveAt = new Date().toISOString();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'APEX_REST_PROXY_ERROR', message: err.message });
    }
  }
);

// GENERIC APEX REST PROXY: /api/salesforce/proxy/* (Protected by Authentication, CSRF & Role Guards)
salesforceApiRouter.all(
  '/api/salesforce/proxy/*',
  verifyCsrf,
  requireCivicTaxUser,
  requireSalesforceSession,
  async (req: Request, res: Response) => {
    try {
      const user = req.session.civicTaxUser!;
      const endpointPath = req.params[0] || '';
      const method = req.method as 'GET' | 'POST' | 'PATCH' | 'DELETE';
      const body = req.body;

      // Prevent citizen sessions from attempting unauthorized state-changing operations
      if (user.role === 'CITIZEN' && ['PATCH', 'DELETE'].includes(method)) {
        res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Citizens are not authorized to execute administrative modifications via proxy.',
        });
        return;
      }

      // Restrict citizen POST actions to allowed citizen self-service endpoints
      if (user.role === 'CITIZEN' && method === 'POST') {
        const allowedCitizenPostEndpoints = ['properties', 'payments', 'grievances', 'reassessments'];
        const isAllowed = allowedCitizenPostEndpoints.some((ep) => endpointPath.startsWith(ep));
        if (!isAllowed) {
          res.status(403).json({
            error: 'FORBIDDEN',
            message: 'Citizens are not authorized to post to this administrative endpoint.',
          });
          return;
        }
      }

      // Restrict citizen GET actions on executive analytics
      if (user.role === 'CITIZEN' && method === 'GET' && endpointPath.startsWith('dashboard')) {
        res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Executive analytics dashboard is restricted to Municipal Officers and Administrators.',
        });
        return;
      }

      const data = await SalesforceClient.callApexRest(sessionUser(req), endpointPath, method, body);
      req.session.salesforceSession!.lastActiveAt = new Date().toISOString();
      res.json(data);
    } catch (err: any) {
      const sanitizedMessage = String(err?.message || 'Apex Proxy Error').replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, 'Bearer [REDACTED]');
      res.status(500).json({
        error: 'APEX_REST_PROXY_ERROR',
        message: sanitizedMessage,
      });
    }
  }
);

function sessionUser(req: Request) {
  return req.session.salesforceSession!;
}
