import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storageService';
import { LocalPropertyService } from '../services/local/LocalPropertyService';
import { LocalAssessmentService } from '../services/local/LocalAssessmentService';
import { LocalPaymentService } from '../services/local/LocalPaymentService';
import { LocalGrievanceService } from '../services/local/LocalGrievanceService';
import { LocalReassessmentService } from '../services/local/LocalReassessmentService';

// Node mock localStorage environment setup
const mockStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStore[key] || null,
  setItem: (key: string, value: string) => {
    mockStore[key] = value.toString();
  },
  removeItem: (key: string) => {
    delete mockStore[key];
  },
  clear: () => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

describe('CivicTax 7.0 End-to-End Enterprise Workflows (A through E)', () => {
  beforeEach(() => {
    StorageService.initialize();
    StorageService.resetToSeedData();
  });

  // WORKFLOW A: Property Registration & Verification Lifecycle
  it('Workflow A: executes full property registration, review, verification, and audit trace', async () => {
    const propService = new LocalPropertyService();

    // 1. Citizen submits property details
    const prop = await propService.createProperty({
      ownerId: 'usr-citizen-01',
      ownerName: 'Rajesh Kumar Sharma',
      ownerEmail: 'citizen@civictax.demo',
      ownerPhone: '+91 98765 43210',
      address: 'Tower 4, Flat 12B, Skyline Residency, Zone 1',
      category: 'RESIDENTIAL',
      zoneId: 'zone-1',
      zoneName: 'Zone 1 - Central Urban Core',
      builtUpArea: 1400,
      constructionYear: 2022,
      documentReference: 'DOC-REG-2026-9901',
      contactDetails: 'citizen@civictax.demo',
      description: 'Brand new residential flat',
    });

    expect(prop.id).toBeTruthy();
    expect(prop.propertyNumber).toBeTruthy();
    expect(prop.verificationStatus).toBe('PENDING');

    // Audit log verification
    const logs = StorageService.getAuditLogs();
    const regLog = logs.find((l) => l.recordId === prop.id && l.action === 'REGISTER_PROPERTY');
    expect(regLog).toBeDefined();

    // 2. Verification officer reviews and approves
    const verified = await propService.verifyProperty(
      prop.id,
      'VERIFIED',
      'usr-officer-01',
      'Priya V. Sundaram',
      'Physical inspection complete. Dimensional check matched.'
    );

    expect(verified.verificationStatus).toBe('VERIFIED');
    expect(verified.verifiedByOfficerName).toBe('Priya V. Sundaram');

    // Re-check audit trail
    const updatedLogs = StorageService.getAuditLogs();
    const verLog = updatedLogs.find((l) => l.recordId === prop.id && l.action === 'VERIFY_PROPERTY_VERIFIED');
    expect(verLog).toBeDefined();
    expect(verLog?.newStatus).toBe('VERIFIED');
  });

  // WORKFLOW B: Tax Assessment Calculation & Publishing
  it('Workflow B: calculates tax according to rules and publishes approved bill', async () => {
    const propService = new LocalPropertyService();
    const asmService = new LocalAssessmentService();

    // Fetch verified property
    const prop = (await propService.getProperties()).find((p) => p.verificationStatus === 'VERIFIED');
    expect(prop).toBeDefined();

    // Generate assessment: BuiltUpArea * Rate
    // prop-001 has 1200 sq ft @ ₹10 = ₹12,000 base tax
    const asm = await asmService.generateAssessment(
      prop!.id,
      '2026-2027',
      0,
      600, // 5% rebate
      'FY 2026-27 Annual Statutory Tax Bill'
    );

    expect(asm.id).toBeTruthy();
    expect(asm.assessmentNumber).toBeTruthy();
    expect(asm.baseTax).toBe(12000);
    expect(asm.discount).toBe(600);
    expect(asm.totalTax).toBe(11400);
    expect(asm.outstandingBalance).toBe(11400);
    expect(asm.status).toBe('APPROVED');
    expect(asm.dueDate).toBeTruthy();
  });

  // WORKFLOW C: Simulated Tax Payment with Integrity Guards
  it('Workflow C: handles simulated payment, balance settlement, and integrity guards', async () => {
    const payService = new LocalPaymentService();
    const asmService = new LocalAssessmentService();

    // Use asm-001 (Outstanding: ₹6,500)
    const originalAsm = await asmService.getAssessmentById('asm-001');
    expect(originalAsm).toBeDefined();
    expect(originalAsm!.outstandingBalance).toBe(6500);

    // Negative payment validation check
    await expect(
      payService.processSimulatedPayment({
        assessmentId: 'asm-001',
        payerId: 'usr-citizen-01',
        payerName: 'Rajesh Kumar Sharma',
        payerEmail: 'citizen@civictax.demo',
        payerPhone: '+91 98765 43210',
        amountPaid: -500,
        paymentMethod: 'UPI',
        bankOrVpaDetails: 'test@upi',
      })
    ).rejects.toThrow();

    // Overpayment validation check (> ₹6,500)
    await expect(
      payService.processSimulatedPayment({
        assessmentId: 'asm-001',
        payerId: 'usr-citizen-01',
        payerName: 'Rajesh Kumar Sharma',
        payerEmail: 'citizen@civictax.demo',
        payerPhone: '+91 98765 43210',
        amountPaid: 10000,
        paymentMethod: 'UPI',
        bankOrVpaDetails: 'test@upi',
      })
    ).rejects.toThrow();

    // Valid partial payment of ₹3,000
    const payment = await payService.processSimulatedPayment({
      assessmentId: 'asm-001',
      payerId: 'usr-citizen-01',
      payerName: 'Rajesh Kumar Sharma',
      payerEmail: 'citizen@civictax.demo',
      payerPhone: '+91 98765 43210',
      amountPaid: 3000,
      paymentMethod: 'UPI',
      bankOrVpaDetails: 'rajesh@okaxis',
    });

    expect(payment.paymentStatus).toBe('SUCCESS');
    expect(payment.receiptNumber).toBeTruthy();
    expect(payment.receiptNumber).toContain('RCP-');

    // Balance verification
    const refreshed = await asmService.getAssessmentById('asm-001');
    expect(refreshed!.amountPaid).toBe(9000);
    expect(refreshed!.outstandingBalance).toBe(3500);
    expect(refreshed!.status).toBe('PARTIALLY_PAID');
  });

  // WORKFLOW D: Grievance Redressal Automation
  it('Workflow D: tracks grievance submission, officer assignment, resolution, and audit', async () => {
    const grvService = new LocalGrievanceService();

    // 1. Citizen lodges grievance
    const grv = await grvService.createGrievance({
      propertyId: 'prop-001',
      propertyNumber: 'CT-PROP-2024-001',
      citizenId: 'usr-citizen-01',
      citizenName: 'Rajesh Kumar Sharma',
      citizenEmail: 'citizen@civictax.demo',
      citizenPhone: '+91 98765 43210',
      subject: 'Dispute regarding commercial rate surcharge',
      category: 'INCORRECT_CALCULATION',
      description: 'Property is registered as residential, surcharge was levied in error.',
      priority: 'HIGH',
    });

    expect(grv.id).toBeTruthy();
    expect(grv.grievanceNumber).toBeTruthy();
    expect(grv.status).toBe('SUBMITTED');

    // 2. Assign to officer
    const assigned = await grvService.assignOfficer(grv.id, 'usr-officer-01', 'Priya V. Sundaram');
    expect(assigned.status).toBe('ASSIGNED');
    expect(assigned.assignedOfficerName).toBe('Priya V. Sundaram');

    // 3. Resolve grievance
    const resolved = await grvService.updateGrievanceStatus(
      grv.id,
      'RESOLVED',
      'usr-officer-01',
      'Priya V. Sundaram',
      'Rate corrected in municipal valuation records.'
    );

    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolutionComments).toContain('Rate corrected');
  });

  // WORKFLOW E: Reassessment Request & Revised Assessment Generation
  it('Workflow E: links reassessment to original assessment and generates traceable revised bill upon approval', async () => {
    const rasmService = new LocalReassessmentService();
    const asmService = new LocalAssessmentService();

    const originalAsm = await asmService.getAssessmentById('asm-001');
    expect(originalAsm).toBeDefined();

    // 1. Citizen submits reassessment request
    const req = await rasmService.submitReassessment({
      assessmentId: originalAsm!.id,
      assessmentNumber: originalAsm!.assessmentNumber,
      propertyId: originalAsm!.propertyId,
      propertyNumber: 'CT-PROP-2024-001',
      citizenId: 'usr-citizen-01',
      citizenName: 'Rajesh Kumar Sharma',
      currentBuiltUpArea: 1200,
      requestedBuiltUpArea: 1000, // Claimed 200 sq ft reduction
      currentCategory: 'RESIDENTIAL',
      currentTotalTax: originalAsm!.totalTax,
      reason: 'Demolition of dilapidated outhouse',
      documentReference: 'DOC-MH-DEMO-2026-01',
    });

    expect(req.id).toBeTruthy();
    expect(req.requestNumber).toBeTruthy();
    expect(req.status).toBe('SUBMITTED');

    // 2. Officer reviews and approves
    const approved = await rasmService.reviewReassessment(
      req.id,
      'APPROVED',
      'usr-officer-01',
      'Priya V. Sundaram',
      'Survey confirms outhouse demolition. Reassessment approved.'
    );

    expect(approved.status).toBe('APPROVED');
    expect(approved.revisedAssessmentId).toBeTruthy();

    // 3. Verify revised assessment bill exists with '-R' suffix
    const revisedAsm = await asmService.getAssessmentById(approved.revisedAssessmentId!);
    expect(revisedAsm).toBeDefined();
    expect(revisedAsm!.isReassessed).toBe(true);
    expect(revisedAsm!.builtUpArea).toBe(1000);
    // 1000 sq ft @ ₹10 = ₹10,000 base tax
    expect(revisedAsm!.baseTax).toBe(10000);
    expect(revisedAsm!.assessmentNumber).toContain('-R');
  });
});
