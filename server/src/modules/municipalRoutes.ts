
import { Router, Request, Response } from 'express';
import { BackendServiceFactory } from '../repositories/ServiceFactory.js';
import { IPropertyDetailsUpdate } from '../repositories/types.js';
import { config } from '../config/index.js';
import { verifyCsrf } from '../middleware/csrf.js';
import {
  getAuthenticatedUser,
  requireCivicTaxUser,
  requireRole,
} from '../middleware/auth.js';
import { SalesforceConnectionStore } from '../services/salesforceConnectionStore.js';
import { SalesforceApiError } from '../services/salesforceClient.js';

export const municipalApiRouter = Router();

// ============================================================
// CENTRAL REPOSITORY ACCESS
// ============================================================

const getRequestRepository = (req: Request) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    throw new Error('CIVICTAX_UNAUTHENTICATED');
  }
  return BackendServiceFactory.getRepository(user.id);
};

// ============================================================
// 1. HEALTH & SYSTEM STATUS
// ============================================================

// GET /api/health
municipalApiRouter.get(
  '/api/health',
  async (_req: Request, res: Response) => {
    try {
      const session = await SalesforceConnectionStore.get();

      res.json({
        status: 'HEALTHY',
        service: 'CivicTax Municipal Backend Gateway',
        timestamp: new Date().toISOString(),
        dataProvider: session
          ? 'SalesforceRepository (Central Salesforce Connection)'
          : config.isProduction
            ? 'Salesforce Not Connected'
            : 'LocalRepository (Development Only)',
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'UNAVAILABLE',
        service: 'CivicTax Municipal Backend Gateway',
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// GET /api/salesforce/health
municipalApiRouter.get(
  '/api/salesforce/health',
  async (_req: Request, res: Response) => {
    try {
      const sfSession = await SalesforceConnectionStore.get();

      res.json({
        status: 'HEALTHY',
        service: 'CivicTax Salesforce Gateway',
        salesforceConnected: Boolean(
          sfSession?.accessToken && sfSession?.instanceUrl
        ),
        apiVersion: config.salesforce.apiVersion,
        loginUrl: config.salesforce.loginUrl,
        orgId: sfSession?.orgId ?? null,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'UNAVAILABLE',
        service: 'CivicTax Salesforce Gateway',
        salesforceConnected: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

municipalApiRouter.use(
  '/api',
  verifyCsrf,
  requireCivicTaxUser
);

// ============================================================
// 2. PROPERTIES
// ============================================================

// GET /api/properties
municipalApiRouter.get(
  '/api/properties',
  async (req: Request, res: Response) => {
    try {
      const { category, zone, status } = req.query;
      const user = req.session.civicTaxUser!;

      const repository = await getRequestRepository(req);

      const properties = await repository.listProperties({
        category:
          typeof category === 'string' ? category : undefined,
        zone:
          typeof zone === 'string' ? zone : undefined,
        status:
          typeof status === 'string' ? status : undefined,
        ownerId: user.role === 'CITIZEN' ? user.id : undefined,
      });

      res.json({
        success: true,
        count: properties.length,
        data: properties,
      });
    } catch (err: any) {
      const status = err instanceof SalesforceApiError
        ? err.statusCode
        : 500;
      res.status(status).json({
        success: false,
        error: status === 403 ? 'FORBIDDEN' : 'PROPERTY_LIST_FAILED',
        message: status === 403
          ? 'You do not have permission to list these properties.'
          : err instanceof Error
            ? err.message
            : 'Unable to retrieve properties.',
      });
    }
  }
);

// POST /api/properties
municipalApiRouter.post(
  '/api/properties',
  async (req: Request, res: Response) => {
    try {
      const {
        address,
        category,
        builtUpArea,
        zone,
        documentReference,
        constructionYear,
        latitude,
        longitude,
      } = req.body;

      const user = req.session.civicTaxUser!;
      if (user.role !== 'CITIZEN') {
        res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Only authenticated citizens can register their properties.',
        });
        return;
      }

      if (
        typeof address !== 'string' ||
        address.trim().length < 10 ||
        !category ||
        builtUpArea === undefined ||
        builtUpArea === null ||
        builtUpArea === ''
      ) {
        res.status(400).json({
          success: false,
          error: 'Missing mandatory property registration fields',
        });
        return;
      }

      const validCategories = [
        'RESIDENTIAL',
        'COMMERCIAL',
        'INDUSTRIAL',
        'AGRICULTURAL',
      ];

      if (!validCategories.includes(category)) {
        res.status(400).json({
          success: false,
          error: 'Invalid property category',
        });
        return;
      }

      const area = Number(builtUpArea);

      if (!Number.isFinite(area) || area <= 0) {
        res.status(400).json({
          success: false,
          error: 'Built-up area must be strictly greater than zero',
        });
        return;
      }

      const currentYear = new Date().getFullYear();
      const parsedConstructionYear = Number(constructionYear);
      if (
        !Number.isInteger(parsedConstructionYear) ||
        parsedConstructionYear < 1900 ||
        parsedConstructionYear > currentYear
      ) {
        res.status(400).json({
          success: false,
          error: `Construction year must be between 1900 and ${currentYear}`,
        });
        return;
      }

      if (typeof zone !== 'string' || !zone.trim()) {
        res.status(400).json({
          success: false,
          error: 'Municipal zone is required',
        });
        return;
      }

      if (
        typeof documentReference !== 'string' ||
        documentReference.trim().length < 5
      ) {
        res.status(400).json({
          success: false,
          error: 'Ownership document reference must be at least 5 characters',
        });
        return;
      }

      const generatedPropertyNumber =
        `CT-${currentYear}-${Date.now()}`;

      const repository = await getRequestRepository(req);

      const created = await repository.createProperty({
        propertyNumber: generatedPropertyNumber,
        ownerId: user.id,
        ownerName: user.name,
        address: String(address).trim(),
        category,
        builtUpArea: area,
        zone: zone.trim(),
        verificationStatus: 'PENDING',
        documentReference: documentReference.trim(),
        constructionYear: parsedConstructionYear,
        latitude:
          latitude !== undefined ? Number(latitude) : undefined,
        longitude:
          longitude !== undefined ? Number(longitude) : undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Property registered successfully',
        data: created,
      });
    } catch (err: any) {
      const message = err instanceof Error
        ? err.message
        : 'Salesforce property registration failed.';
      const duplicate = /already registered|already exists|DUPLICATE_VALUE/i.test(
        message
      );
      const status = duplicate
        ? 409
        : err instanceof SalesforceApiError
          ? err.statusCode
          : 502;
      res.status(status).json({
        success: false,
        error: status === 409
          ? 'PROPERTY_ALREADY_REGISTERED'
          : status === 400
            ? 'PROPERTY_VALIDATION_FAILED'
            : status === 403
              ? 'FORBIDDEN'
              : 'PROPERTY_REGISTRATION_FAILED',
        message,
      });
    }
  }
);

// GET /api/properties/:id
municipalApiRouter.get(
  '/api/properties/:id',
  async (req: Request, res: Response) => {
    try {
      const repository = await getRequestRepository(req);
      const prop = await repository.getPropertyById(
        req.params.id,
        req.session.civicTaxUser!.id
      );

      if (!prop) {
        res.status(404).json({
          success: false,
          error: 'Property not found',
        });
        return;
      }

      res.json({
        success: true,
        data: prop,
      });
    } catch (err: any) {
      const message = err instanceof Error ? err.message : '';
      const status = err instanceof SalesforceApiError
        ? err.statusCode
        : message.includes('Access Denied')
          ? 403
          : 500;
      res.status(status).json({
        success: false,
        error: status === 403
          ? 'FORBIDDEN'
          : status === 404
            ? 'PROPERTY_NOT_FOUND'
            : 'PROPERTY_LOOKUP_FAILED',
        message: status === 403
          ? 'You do not have permission to access this property.'
          : status === 404
            ? 'Property not found.'
            : 'Unable to retrieve property details.',
      });
    }
  }
);

// PATCH /api/properties/:id
municipalApiRouter.patch(
  '/api/properties/:id',
  async (req: Request, res: Response) => {
    const body = req.body ?? {};
    const updates: IPropertyDetailsUpdate = {};
    const validCategories = [
      'RESIDENTIAL',
      'COMMERCIAL',
      'INDUSTRIAL',
      'AGRICULTURAL',
    ];

    if (body.address !== undefined) {
      if (typeof body.address !== 'string' || body.address.trim().length < 10) {
        res.status(400).json({
          success: false,
          error: 'Property address must be at least 10 characters',
        });
        return;
      }
      updates.address = body.address.trim();
    }

    if (body.category !== undefined) {
      if (!validCategories.includes(body.category)) {
        res.status(400).json({
          success: false,
          error: 'Invalid property category',
        });
        return;
      }
      updates.category = body.category;
    }

    if (body.builtUpArea !== undefined) {
      const area = Number(body.builtUpArea);
      if (!Number.isFinite(area) || area <= 0) {
        res.status(400).json({
          success: false,
          error: 'Built-up area must be strictly greater than zero',
        });
        return;
      }
      updates.builtUpArea = area;
    }

    if (body.zone !== undefined) {
      if (typeof body.zone !== 'string' || !body.zone.trim()) {
        res.status(400).json({
          success: false,
          error: 'Municipal zone is required',
        });
        return;
      }
      updates.zone = body.zone.trim();
    }

    if (body.documentReference !== undefined) {
      if (
        typeof body.documentReference !== 'string' ||
        body.documentReference.trim().length < 5
      ) {
        res.status(400).json({
          success: false,
          error: 'Ownership document reference must be at least 5 characters',
        });
        return;
      }
      updates.documentReference = body.documentReference.trim();
    }

    if (body.constructionYear !== undefined) {
      const year = Number(body.constructionYear);
      if (
        !Number.isInteger(year) ||
        year < 1900 ||
        year > new Date().getFullYear()
      ) {
        res.status(400).json({
          success: false,
          error: 'Construction year is invalid',
        });
        return;
      }
      updates.constructionYear = year;
    }

    for (const coordinate of ['latitude', 'longitude'] as const) {
      if (body[coordinate] !== undefined) {
        const value = Number(body[coordinate]);
        if (!Number.isFinite(value)) {
          res.status(400).json({
            success: false,
            error: `${coordinate} must be numeric`,
          });
          return;
        }
        updates[coordinate] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        error: 'At least one supported property field must be provided',
      });
      return;
    }

    try {
      const repository = await getRequestRepository(req);
      const updated = await repository.updatePropertyDetails(
        req.params.id,
        updates,
        req.session.civicTaxUser!.id
      );
      res.json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      const status = err instanceof SalesforceApiError
        ? err.statusCode
        : 502;
      res.status(status).json({
        success: false,
        error: status === 403
          ? 'FORBIDDEN'
          : status === 404
            ? 'PROPERTY_NOT_FOUND'
            : status === 409
              ? 'PROPERTY_UPDATE_CONFLICT'
              : 'PROPERTY_UPDATE_FAILED',
        message: status === 403
          ? 'You do not have permission to modify this property.'
          : err instanceof Error
            ? err.message
            : 'Unable to update property details.',
      });
    }
  }
);

// PATCH /api/properties/:id/verify
municipalApiRouter.patch(
  '/api/properties/:id/verify',
  requireRole(['OFFICER', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { status } = req.body;

      const validStatuses = [
        'PENDING',
        'VERIFIED',
        'RESUBMISSION_REQUIRED',
        'REJECTED',
      ];

      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid property verification status',
        });
        return;
      }

      const repository = await getRequestRepository(req);

      const updated = await repository.updatePropertyStatus(
        req.params.id,
        status
      );

      res.json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// ============================================================
// 3. ASSESSMENTS
// ============================================================

// GET /api/assessments
municipalApiRouter.get(
  '/api/assessments',
  async (req: Request, res: Response) => {
    try {
      const propertyId =
        typeof req.query.propertyId === 'string'
          ? req.query.propertyId
          : undefined;

      const repository = await getRequestRepository(req);

      const assessments = await repository.listAssessments(propertyId);

      res.json({
        success: true,
        count: assessments.length,
        data: assessments,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// POST /api/assessments
municipalApiRouter.post(
  '/api/assessments',
  requireRole(['OFFICER', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const {
        propertyId,
        assessmentYear,
        category,
        builtUpArea,
        appliedRatePerSqFt,
      } = req.body;

      if (!propertyId || !assessmentYear || !builtUpArea) {
        res.status(400).json({
          success: false,
          error: 'Missing mandatory assessment parameters',
        });
        return;
      }

      const area = Number(builtUpArea);
      const rate = Number(appliedRatePerSqFt) || 10;

      if (
        !Number.isFinite(area) ||
        area <= 0 ||
        !Number.isFinite(rate) ||
        rate <= 0
      ) {
        res.status(400).json({
          success: false,
          error: 'Invalid built-up area or tax rate',
        });
        return;
      }

      const baseTax = Math.round(area * rate * 100) / 100;
      const discount = Math.round(baseTax * 0.05 * 100) / 100;
      const penalty = 0;
      const totalTax = Math.round(
        (baseTax - discount + penalty) * 100
      ) / 100;

      const repository = await getRequestRepository(req);

      const assessment = await repository.createAssessment({
        assessmentNumber: `CT-ASM-${Date.now()}`,
        propertyId,
        assessmentYear,
        category: category || 'RESIDENTIAL',
        builtUpArea: area,
        appliedRatePerSqFt: rate,
        baseTax,
        penalty,
        discount,
        totalTax,
        amountPaid: 0,
        outstandingBalance: totalTax,
        status: 'APPROVED',
        dueDate: new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000
        ).toISOString().split('T')[0],
      });

      res.status(201).json({
        success: true,
        data: assessment,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// GET /api/assessments/:id
municipalApiRouter.get(
  '/api/assessments/:id',
  async (req: Request, res: Response) => {
    try {
      const repository = await getRequestRepository(req);

      const assessment = await repository.getAssessmentById(
        req.params.id
      );

      if (!assessment) {
        res.status(404).json({
          success: false,
          error: 'Assessment not found',
        });
        return;
      }

      res.json({
        success: true,
        data: assessment,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// ============================================================
// 4. PAYMENTS
// ============================================================

// GET /api/payments
municipalApiRouter.get(
  '/api/payments',
  async (req: Request, res: Response) => {
    try {
      const assessmentId =
        typeof req.query.assessmentId === 'string'
          ? req.query.assessmentId
          : undefined;

      const repository = await getRequestRepository(req);

      const payments = await repository.listPayments(assessmentId);

      res.json({
        success: true,
        count: payments.length,
        data: payments,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// POST /api/payments
municipalApiRouter.post(
  '/api/payments',
  async (req: Request, res: Response) => {
    try {
      const {
        assessmentId,
        amountPaid,
        paymentMethod,
        transactionId,
      } = req.body;

      if (!assessmentId || amountPaid === undefined || !transactionId) {
        res.status(400).json({
          success: false,
          error: 'Missing required payment fields',
        });
        return;
      }

      const amount = Number(amountPaid);

      if (!Number.isFinite(amount) || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Payment amount must be greater than zero',
        });
        return;
      }

      const repository = await getRequestRepository(req);

      const result = await repository.createPayment({
        assessmentId,
        amountPaid: amount,
        paymentMethod: paymentMethod || 'UPI',
        transactionId,
        paymentDate: new Date().toISOString(),
        paymentStatus: 'SUCCESS',
      });

      res.status(201).json({
        success: true,
        data: result.payment,
        assessment: result.assessment,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// ============================================================
// 5. GRIEVANCES
// ============================================================

// GET /api/grievances
municipalApiRouter.get(
  '/api/grievances',
  async (req: Request, res: Response) => {
    try {
      const citizenId =
        typeof req.query.citizenId === 'string'
          ? req.query.citizenId
          : undefined;

      const repository = await getRequestRepository(req);

      const grievances = await repository.listGrievances(citizenId);

      res.json({
        success: true,
        count: grievances.length,
        data: grievances,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// POST /api/grievances
municipalApiRouter.post(
  '/api/grievances',
  async (req: Request, res: Response) => {
    try {
      const {
        propertyId,
        subject,
        description,
        priority,
      } = req.body;

      if (!subject || !description) {
        res.status(400).json({
          success: false,
          error: 'Subject and description are mandatory',
        });
        return;
      }

      const validPriorities = [
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL',
      ];

      const selectedPriority = priority || 'MEDIUM';

      if (!validPriorities.includes(selectedPriority)) {
        res.status(400).json({
          success: false,
          error: 'Invalid grievance priority',
        });
        return;
      }

      const repository = await getRequestRepository(req);

      const grievance = await repository.createGrievance({
        propertyId,
        citizenId:
          req.session.civicTaxUser?.id || 'usr-citizen-01',
        subject,
        description,
        priority: selectedPriority,
        status: 'OPEN',
      });

      res.status(201).json({
        success: true,
        data: grievance,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// ============================================================
// 6. REASSESSMENTS
// ============================================================

// GET /api/reassessments
municipalApiRouter.get(
  '/api/reassessments',
  async (req: Request, res: Response) => {
    try {
      const propertyId =
        typeof req.query.propertyId === 'string'
          ? req.query.propertyId
          : undefined;

      const repository = await getRequestRepository(req);

      const items = await repository.listReassessments(propertyId);

      res.json({
        success: true,
        count: items.length,
        data: items,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// POST /api/reassessments
municipalApiRouter.post(
  '/api/reassessments',
  async (req: Request, res: Response) => {
    try {
      const {
        propertyId,
        originalAssessmentId,
        requestedChange,
        supportingReason,
      } = req.body;

      if (!propertyId || !requestedChange) {
        res.status(400).json({
          success: false,
          error: 'Property ID and requested changes are mandatory',
        });
        return;
      }

      const repository = await getRequestRepository(req);

      const item = await repository.createReassessment({
        propertyId,
        originalAssessmentId,
        requestedChange,
        supportingReason:
          supportingReason || 'Municipal survey revision',
        approvalStatus: 'SUBMITTED',
      });

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// ============================================================
// 7. DASHBOARD
// ============================================================

// GET /api/dashboard
municipalApiRouter.get(
  '/api/dashboard',
  async (req: Request, res: Response) => {
    try {
      const repository = await getRequestRepository(req);

      const metrics = await repository.getDashboardMetrics();

      res.json({
        success: true,
        data: metrics,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);
