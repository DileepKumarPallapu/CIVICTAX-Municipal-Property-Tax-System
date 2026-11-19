
import { Router, Request, Response } from 'express';
import { BackendServiceFactory } from '../repositories/ServiceFactory.js';
import { config } from '../config/index.js';
import { SalesforceConnectionStore } from '../services/salesforceConnectionStore.js';

export const municipalApiRouter = Router();

// ============================================================
// CENTRAL REPOSITORY ACCESS
// ============================================================

const getRequestRepository = () =>
  BackendServiceFactory.getRepository();

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
          : process.env.NODE_ENV === 'production'
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

// ============================================================
// 2. PROPERTIES
// ============================================================

// GET /api/properties
municipalApiRouter.get(
  '/api/properties',
  async (req: Request, res: Response) => {
    try {
      const { category, zone, status } = req.query;

      const repository = await getRequestRepository();

      const properties = await repository.listProperties({
        category:
          typeof category === 'string' ? category : undefined,
        zone:
          typeof zone === 'string' ? zone : undefined,
        status:
          typeof status === 'string' ? status : undefined,
      });

      res.json({
        success: true,
        count: properties.length,
        data: properties,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message,
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
        propertyNumber,
        address,
        category,
        builtUpArea,
        zone,
        documentReference,
        constructionYear,
        latitude,
        longitude,
        ownerId,
        ownerName,
      } = req.body;

      if (
        !address ||
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

      const generatedPropertyNumber =
        propertyNumber ||
        `CT-${new Date().getFullYear()}-${Date.now()}`;

      const repository = await getRequestRepository();

      const created = await repository.createProperty({
        propertyNumber: generatedPropertyNumber,
        ownerId: ownerId || 'usr-citizen-01',
        ownerName: ownerName || 'Rajesh Kumar Sharma',
        address: String(address).trim(),
        category,
        builtUpArea: area,
        zone: zone || 'Z-CENTRAL',
        verificationStatus: 'PENDING',
        documentReference: documentReference || 'DOC-PENDING',
        constructionYear: constructionYear
          ? Number(constructionYear)
          : undefined,
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
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// GET /api/properties/:id
municipalApiRouter.get(
  '/api/properties/:id',
  async (req: Request, res: Response) => {
    try {
      const repository = await getRequestRepository();
      const prop = await repository.getPropertyById(req.params.id);

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
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// PATCH /api/properties/:id/verify
municipalApiRouter.patch(
  '/api/properties/:id/verify',
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

      const repository = await getRequestRepository();

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

      const repository = await getRequestRepository();

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

      const repository = await getRequestRepository();

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
      const repository = await getRequestRepository();

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

      const repository = await getRequestRepository();

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

      const repository = await getRequestRepository();

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

      const repository = await getRequestRepository();

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

      const repository = await getRequestRepository();

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

      const repository = await getRequestRepository();

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

      const repository = await getRequestRepository();

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
  async (_req: Request, res: Response) => {
    try {
      const repository = await getRequestRepository();

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
