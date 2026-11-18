// server/src/modules/municipalRoutes.ts
import { Router, Request, Response } from 'express';
import { BackendServiceFactory } from '../repositories/ServiceFactory.js';
import { config } from '../config/index.js';

export const municipalApiRouter = Router();
const getRequestRepository = (req: Request) =>
  BackendServiceFactory.getRepository(req.session.salesforceSession);



// 1. HEALTH & SYSTEM STATUS
// GET /api/health
municipalApiRouter.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'CivicTax Municipal Backend Gateway',
    timestamp: new Date().toISOString(),
    dataProvider: 'LocalRepository (Authoritative In-Memory Schema)',
  });
});

// GET /api/salesforce/health
municipalApiRouter.get('/api/salesforce/health', (req: Request, res: Response) => {
  const sfSession = req.session.salesforceSession;
  res.json({
    status: 'HEALTHY',
    service: 'CivicTax Salesforce Gateway',
    salesforceConnected: Boolean(sfSession && sfSession.accessToken),
    apiVersion: config.salesforce.apiVersion,
    loginUrl: config.salesforce.loginUrl,
    orgId: sfSession ? sfSession.orgId : null,
    timestamp: new Date().toISOString(),
  });
});

// 2. PROPERTIES
// GET /api/properties
municipalApiRouter.get('/api/properties', async (req: Request, res: Response) => {
  try {
    const { category, zone, status } = req.query;
    const properties = await getRequestRepository(req).listProperties({
      category: category as string,
      zone: zone as string,
      status: status as any,
    });
    res.json({ success: true, count: properties.length, data: properties });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/properties
municipalApiRouter.post('/api/properties', async (req: Request, res: Response) => {
  try {
    const { propertyNumber, address, category, builtUpArea, zone, documentReference, constructionYear, latitude, longitude, ownerId, ownerName } = req.body;
    
    if (!propertyNumber || !address || !category || !builtUpArea) {
      res.status(400).json({ success: false, error: 'Missing mandatory property registration fields' });
      return;
    }

    if (Number(builtUpArea) <= 0) {
      res.status(400).json({ success: false, error: 'Built-up area must be strictly greater than zero' });
      return;
    }

    const created = await getRequestRepository(req).createProperty({
      propertyNumber,
      ownerId: ownerId || 'usr-citizen-01',
      ownerName: ownerName || 'Rajesh Kumar Sharma',
      address,
      category,
      builtUpArea: Number(builtUpArea),
      zone: zone || 'Z-CENTRAL',
      verificationStatus: 'PENDING',
      documentReference: documentReference || 'DOC-PENDING',
      constructionYear: constructionYear ? Number(constructionYear) : undefined,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
    });

    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/properties/:id
municipalApiRouter.get('/api/properties/:id', async (req: Request, res: Response) => {
  try {
    const prop = await getRequestRepository(req).getPropertyById(req.params.id);
    if (!prop) {
      res.status(404).json({ success: false, error: 'Property not found' });
      return;
    }
    res.json({ success: true, data: prop });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/properties/:id/verify
municipalApiRouter.patch('/api/properties/:id/verify', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updated = await getRequestRepository(req).updatePropertyStatus(req.params.id, status);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. ASSESSMENTS
// GET /api/assessments
municipalApiRouter.get('/api/assessments', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.query;
    const asms = await getRequestRepository(req).listAssessments(propertyId as string);
    res.json({ success: true, count: asms.length, data: asms });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/assessments
municipalApiRouter.post('/api/assessments', async (req: Request, res: Response) => {
  try {
    const { propertyId, assessmentYear, category, builtUpArea, appliedRatePerSqFt } = req.body;

    if (!propertyId || !assessmentYear || !builtUpArea) {
      res.status(400).json({ success: false, error: 'Missing mandatory assessment parameters' });
      return;
    }

    const rate = Number(appliedRatePerSqFt) || 10;
    const area = Number(builtUpArea);
    const baseTax = Math.round(area * rate * 100) / 100;
    const discount = Math.round(baseTax * 0.05 * 100) / 100; // 5% prompt discount
    const penalty = 0;
    const totalTax = Math.round((baseTax - discount) * 100) / 100;

    const asm = await getRequestRepository(req).createAssessment({
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
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    res.status(201).json({ success: true, data: asm });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/assessments/:id
municipalApiRouter.get('/api/assessments/:id', async (req: Request, res: Response) => {
  try {
    const asm = await getRequestRepository(req).getAssessmentById(req.params.id);
    if (!asm) {
      res.status(404).json({ success: false, error: 'Assessment not found' });
      return;
    }
    res.json({ success: true, data: asm });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. PAYMENTS
// GET /api/payments
municipalApiRouter.get('/api/payments', async (req: Request, res: Response) => {
  try {
    const { assessmentId } = req.query;
    const payments = await getRequestRepository(req).listPayments(assessmentId as string);
    res.json({ success: true, count: payments.length, data: payments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payments
municipalApiRouter.post('/api/payments', async (req: Request, res: Response) => {
  try {
    const { assessmentId, amountPaid, paymentMethod, transactionId } = req.body;
    
    if (!assessmentId || !amountPaid || !transactionId) {
      res.status(400).json({ success: false, error: 'Missing required payment fields' });
      return;
    }

    const result = await getRequestRepository(req).createPayment({
      assessmentId,
      amountPaid: Number(amountPaid),
      paymentMethod: paymentMethod || 'UPI',
      transactionId,
      paymentDate: new Date().toISOString(),
      paymentStatus: 'SUCCESS',
    });

    res.status(201).json({ success: true, data: result.payment, assessment: result.assessment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. GRIEVANCES
// GET /api/grievances
municipalApiRouter.get('/api/grievances', async (req: Request, res: Response) => {
  try {
    const { citizenId } = req.query;
    const grievances = await getRequestRepository(req).listGrievances(citizenId as string);
    res.json({ success: true, count: grievances.length, data: grievances });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/grievances
municipalApiRouter.post('/api/grievances', async (req: Request, res: Response) => {
  try {
    const { propertyId, citizenId, subject, description, priority } = req.body;
    if (!subject || !description) {
      res.status(400).json({ success: false, error: 'Subject and description are mandatory' });
      return;
    }

    const grv = await getRequestRepository(req).createGrievance({
      propertyId,
      citizenId: citizenId || 'usr-citizen-01',
      subject,
      description,
      priority: priority || 'MEDIUM',
      status: 'OPEN',
    });

    res.status(201).json({ success: true, data: grv });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. REASSESSMENTS
// GET /api/reassessments
municipalApiRouter.get('/api/reassessments', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.query;
    const items = await getRequestRepository(req).listReassessments(propertyId as string);
    res.json({ success: true, count: items.length, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reassessments
municipalApiRouter.post('/api/reassessments', async (req: Request, res: Response) => {
  try {
    const { propertyId, originalAssessmentId, requestedChange, supportingReason } = req.body;
    if (!propertyId || !requestedChange) {
      res.status(400).json({ success: false, error: 'Property ID and requested changes are mandatory' });
      return;
    }

    const item = await getRequestRepository(req).createReassessment({
      propertyId,
      originalAssessmentId,
      requestedChange,
      supportingReason: supportingReason || 'Municipal survey revision',
      approvalStatus: 'SUBMITTED',
    });

    res.status(201).json({ success: true, data: item });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. DASHBOARD
// GET /api/dashboard
municipalApiRouter.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
    const metrics = await getRequestRepository(req).getDashboardMetrics();
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
