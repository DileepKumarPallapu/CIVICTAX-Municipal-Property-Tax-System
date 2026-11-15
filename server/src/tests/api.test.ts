import { describe, it, expect, beforeEach } from 'vitest';
import { LocalRepository } from '../repositories/LocalRepository.js';

describe('CivicTax Server Repository & Business Rules Test Suite', () => {
  let repo: LocalRepository;

  beforeEach(() => {
    repo = new LocalRepository();
  });

  it('lists seeded properties and filters by zone/category', async () => {
    const all = await repo.listProperties();
    expect(all.length).toBeGreaterThanOrEqual(2);

    const residential = await repo.listProperties({ category: 'RESIDENTIAL' });
    expect(residential.every((p) => p.category === 'RESIDENTIAL')).toBe(true);

    const central = await repo.listProperties({ zone: 'Z-CENTRAL' });
    expect(central.length).toBeGreaterThanOrEqual(2);
  });

  it('creates property and rejects duplicates', async () => {
    const newProp = await repo.createProperty({
      propertyNumber: 'TEST-PROP-999',
      ownerId: 'usr-1',
      ownerName: 'Test Owner',
      address: '77 Test Way',
      category: 'RESIDENTIAL',
      builtUpArea: 1000,
      zone: 'Z-CENTRAL',
      verificationStatus: 'PENDING',
      documentReference: 'DOC-999',
    });

    expect(newProp.id).toBeTruthy();
    expect(newProp.propertyNumber).toBe('TEST-PROP-999');

    // Duplicate rejection
    await expect(
      repo.createProperty({
        propertyNumber: 'TEST-PROP-999',
        ownerId: 'usr-2',
        ownerName: 'Another Owner',
        address: '78 Test Way',
        category: 'COMMERCIAL',
        builtUpArea: 500,
        zone: 'Z-CENTRAL',
        verificationStatus: 'PENDING',
        documentReference: 'DOC-1000',
      })
    ).rejects.toThrow('already exists');
  });

  it('enforces payment bounds and duplicate transaction prevention', async () => {
    // Payment exceeding balance (asm-001 has 6500 outstanding)
    await expect(
      repo.createPayment({
        assessmentId: 'asm-001',
        amountPaid: 10000,
        paymentMethod: 'UPI',
        transactionId: 'TXN-INVALID-OVERPAY',
        paymentDate: new Date().toISOString(),
        paymentStatus: 'SUCCESS',
      })
    ).rejects.toThrow('exceeds remaining balance');

    // Negative payment amount
    await expect(
      repo.createPayment({
        assessmentId: 'asm-001',
        amountPaid: -100,
        paymentMethod: 'UPI',
        transactionId: 'TXN-INVALID-NEG',
        paymentDate: new Date().toISOString(),
        paymentStatus: 'SUCCESS',
      })
    ).rejects.toThrow('greater than zero');

    // Valid payment
    const result = await repo.createPayment({
      assessmentId: 'asm-001',
      amountPaid: 2000,
      paymentMethod: 'UPI',
      transactionId: 'TXN-TEST-2000',
      paymentDate: new Date().toISOString(),
      paymentStatus: 'SUCCESS',
    });

    expect(result.payment.amountPaid).toBe(2000);
    expect(result.assessment.outstandingBalance).toBe(4500);
    expect(result.assessment.status).toBe('PARTIALLY_PAID');

    // Duplicate transaction ID rejection
    await expect(
      repo.createPayment({
        assessmentId: 'asm-001',
        amountPaid: 1000,
        paymentMethod: 'UPI',
        transactionId: 'TXN-TEST-2000',
        paymentDate: new Date().toISOString(),
        paymentStatus: 'SUCCESS',
      })
    ).rejects.toThrow('Duplicate transaction ID');
  });

  it('manages grievances and records resolution', async () => {
    const grv = await repo.createGrievance({
      propertyId: 'prop-001',
      citizenId: 'usr-citizen-01',
      subject: 'Calculation inquiry',
      description: 'Need breakdown of penalty and cess',
      priority: 'LOW',
      status: 'OPEN',
    });

    expect(grv.id).toBeTruthy();
    expect(grv.status).toBe('OPEN');

    const resolved = await repo.resolveGrievance(grv.id, 'Penalty waiver applied per section 14.');
    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolutionComments).toContain('Penalty waiver applied');
  });

  it('computes aggregated dashboard metrics correctly', async () => {
    const metrics = await repo.getDashboardMetrics();
    expect(metrics.totalProperties).toBeGreaterThanOrEqual(2);
    expect(metrics.totalTaxAssessed).toBeGreaterThan(0);
    expect(metrics.totalRevenueCollected).toBeGreaterThan(0);
    expect(metrics.collectionEfficiencyRate).toBeGreaterThan(0);
    expect(metrics.collectionEfficiencyRate).toBeLessThanOrEqual(100);
  });

  describe('Security Hardening & Proxy RBAC Tests', () => {
    it('authenticates valid municipal users and establishes server session', async () => {
      const { authRouter } = await import('../routes/authRoutes.js');

      // Test valid Citizen login
      let statusCode = 200;
      let jsonResponse: any = null;
      const citizenReq: any = {
        body: { email: 'citizen@civictax.demo', password: 'Citizen@123' },
        session: {},
      };
      const citizenRes: any = {
        status: (code: number) => {
          statusCode = code;
          return citizenRes;
        },
        json: (data: any) => {
          jsonResponse = data;
        },
      };

      // Find route handler for POST /api/auth/login
      const loginLayer = authRouter.stack.find(
        (l: any) => l.route && l.route.path === '/api/auth/login' && l.route.methods.post
      );
      expect(loginLayer).toBeTruthy();
      loginLayer.route.stack[0].handle(citizenReq, citizenRes);

      expect(statusCode).toBe(200);
      expect(jsonResponse.success).toBe(true);
      expect(citizenReq.session.civicTaxUser.role).toBe('CITIZEN');

      // Test invalid password rejection
      const invalidReq: any = {
        body: { email: 'citizen@civictax.demo', password: 'WrongPassword' },
        session: {},
      };
      loginLayer.route.stack[0].handle(invalidReq, citizenRes);
      expect(statusCode).toBe(401);
      expect(jsonResponse.success).toBe(false);
    });

    it('blocks citizen sessions from calling officer/admin proxy endpoints (403 Forbidden)', async () => {
      const { salesforceApiRouter } = await import('../routes/salesforceRoutes.js');

      // Citizen attempting to verify property via PATCH /api/salesforce/proxy/properties
      const patchLayer = salesforceApiRouter.stack.find(
        (l: any) => l.route && l.route.path === '/api/salesforce/proxy/properties*' && l.route.methods.patch
      );
      expect(patchLayer).toBeTruthy();

      const citizenReq: any = {
        method: 'PATCH',
        params: ['/CT-PROP-001'],
        headers: { 'x-civictax-csrf': '1' },
        body: { status: 'VERIFIED' },
        session: {
          salesforceSession: { accessToken: 'mock-sf-token', instanceUrl: 'https://test.my.salesforce.com' },
          civicTaxUser: { id: 'usr-cit-1', email: 'citizen@civictax.demo', role: 'CITIZEN', name: 'Citizen User' },
        },
      };

      let statusCode = 200;
      let jsonResponse: any = null;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (data: any) => {
          jsonResponse = data;
        },
      };

      // Middleware chain: verifyCsrf -> requireCivicTaxUser -> requireRole(['OFFICER', 'ADMIN'])
      const csrfMiddleware = patchLayer.route.stack[0].handle;
      const userMiddleware = patchLayer.route.stack[1].handle;
      const roleMiddleware = patchLayer.route.stack[2].handle;

      csrfMiddleware(citizenReq, res, () => {
        userMiddleware(citizenReq, res, () => {
          roleMiddleware(citizenReq, res, () => {});
        });
      });

      expect(statusCode).toBe(403);
      expect(jsonResponse.error).toBe('FORBIDDEN');
      expect(jsonResponse.message).toContain('restricted to authorized roles');
    });

    it('blocks unauthenticated requests to Salesforce proxy endpoints (401 Unauthorized)', async () => {
      const { salesforceApiRouter } = await import('../routes/salesforceRoutes.js');

      const patchLayer = salesforceApiRouter.stack.find(
        (l: any) => l.route && l.route.path === '/api/salesforce/proxy/properties*' && l.route.methods.patch
      );

      const unauthReq: any = {
        method: 'PATCH',
        params: ['/CT-PROP-001'],
        headers: { 'x-civictax-csrf': '1' },
        body: { status: 'VERIFIED' },
        session: {}, // No session
      };

      let statusCode = 200;
      let jsonResponse: any = null;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (data: any) => {
          jsonResponse = data;
        },
      };

      const userMiddleware = patchLayer.route.stack[1].handle;
      userMiddleware(unauthReq, res, () => {});

      expect(statusCode).toBe(401);
      expect(jsonResponse.error).toBe('UNAUTHENTICATED');
    });
  });
});
