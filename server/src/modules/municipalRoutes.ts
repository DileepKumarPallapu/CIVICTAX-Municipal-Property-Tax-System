// server/src/modules/municipalRoutes.ts
import { Router, Request, Response } from 'express';
import { BackendServiceFactory } from '../repositories/ServiceFactory.js';

export const municipalApiRouter = Router();
const repo = BackendServiceFactory.getRepository();

// GET /api/health
municipalApiRouter.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'CivicTax Municipal Backend Services',
    timestamp: new Date().toISOString(),
    dataProvider: 'LocalRepository (Authoritative In-Memory/SQLite Schema)',
  });
});

// PROPERTIES
// GET /api/properties
municipalApiRouter.get('/api/properties', async (req: Request, res: Response) => {
  try {
    const { category, zone, status } = req.query;
    const properties = await repo.listProperties({
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

    if (builtUpArea <= 0) {
      res.status(400).json({ success: false, error: 'Built-up area must be strictly greater than zero' });
      return;
    }

    const created = await repo.createProperty({
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
    const prop = await repo.getPropertyById(req.params.id);
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
    const updated = await repo.updatePropertyStatus(req.params.id, status);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ASSESSMENTS
// GET /api/assessments
municipalApiRouter.get('/api/assessments', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.query;
    const asms = await repo.listAssessments(propertyId as string);
    res.json({ success: true, count: asms.length, data: asms });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/assessments/:id
municipalApiRouter.get('/api/assessments/:id', async (req: Request, res: Response) => {
  try {
    const asm = await repo.getAssessmentById(req.params.id);
    if (!asm) {
      res.status(404).json({ success: false, error: 'Assessment not found' });
      return;
    }
    res.json({ success: true, data: asm });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PAYMENTS
// GET /api/payments
municipalApiRouter.get('/api/payments', async (req: Request, res: Response) => {
  try {
    const { assessmentId } = req.query;
    const payments = await repo.listPayments(assessmentId as string);
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

    const result = await repo.createPayment({
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

// GRIEVANCES
// GET /api/grievances
municipalApiRouter.get('/api/grievances', async (req: Request, res: Response) => {
  try {
    const grievances = await repo.listGrievances();
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

    const grv = await repo.createGrievance({
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
