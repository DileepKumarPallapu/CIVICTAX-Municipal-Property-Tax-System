import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storageService';
import { LocalPropertyService } from '../services/local/LocalPropertyService';
import { LocalAssessmentService } from '../services/local/LocalAssessmentService';
import { LocalPaymentService } from '../services/local/LocalPaymentService';
import { LocalGrievanceService } from '../services/local/LocalGrievanceService';
import { LocalReassessmentService } from '../services/local/LocalReassessmentService';
import { GlobalSearchService } from '../services/globalSearchService';
import { User } from '../types';

// In-memory mock localStorage for Node / test environment
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

describe('CivicTax 6.0 Complete Lifecycle & Search Integration Tests', () => {
  beforeEach(() => {
    StorageService.initialize();
    StorageService.resetToSeedData();
  });

  it('executes full property registration, verification, assessment and payment workflow', async () => {
    const propService = new LocalPropertyService();
    const asmService = new LocalAssessmentService();
    const payService = new LocalPaymentService();

    // 1. Citizen registers a new parcel
    const newProp = await propService.createProperty({
      ownerId: 'usr-citizen-01',
      ownerName: 'Rajesh Kumar Sharma',
      ownerEmail: 'citizen@civictax.demo',
      ownerPhone: '+91 98765 43210',
      address: 'Plot 777, Golden Crest, Baner Road',
      category: 'RESIDENTIAL',
      zoneId: 'zone-1',
      zoneName: 'Zone 1 - Central Urban Core',
      builtUpArea: 1500,
      constructionYear: 2021,
      documentReference: 'DOC-MH-TEST-E2E-777',
      contactDetails: 'citizen@civictax.demo',
      description: 'Newly constructed 3BHK flat',
    });

    expect(newProp.id).toBeTruthy();
    expect(newProp.verificationStatus).toBe('PENDING');

    // 2. Municipal Officer verifies the parcel
    const verifiedProp = await propService.verifyProperty(
      newProp.id,
      'VERIFIED',
      'usr-officer-01',
      'Priya V. Sundaram',
      'Field survey and registry title verified.'
    );
    expect(verifiedProp.verificationStatus).toBe('VERIFIED');
    expect(verifiedProp.verifiedByOfficerName).toBe('Priya V. Sundaram');

    // 3. Officer generates annual tax assessment
    // 1500 sq ft @ ₹10/sq ft (Zone 1 Residential) = ₹15,000 Base Tax
    const assessment = await asmService.generateAssessment(verifiedProp.id, '2024-2025', 0, 500, 'FY 2024-25 bill');
    expect(assessment.baseTax).toBe(15000);
    expect(assessment.discount).toBe(500);
    expect(assessment.totalTax).toBe(14500);
    expect(assessment.outstandingBalance).toBe(14500);
    expect(assessment.status).toBe('APPROVED');

    // 4. Citizen executes partial simulated payment (₹5,000)
    const payment = await payService.processSimulatedPayment({
      assessmentId: assessment.id,
      payerId: 'usr-citizen-01',
      payerName: 'Rajesh Kumar Sharma',
      payerEmail: 'citizen@civictax.demo',
      payerPhone: '+91 98765 43210',
      amountPaid: 5000,
      paymentMethod: 'UPI',
      bankOrVpaDetails: 'rajesh@okaxis',
    });

    expect(payment.paymentStatus).toBe('SUCCESS');
    expect(payment.receiptNumber).toBeTruthy();

    // 5. Verify remaining assessment balance is exactly ₹9,500
    const refreshedAsm = await asmService.getAssessmentById(assessment.id);
    expect(refreshedAsm?.amountPaid).toBe(5000);
    expect(refreshedAsm?.outstandingBalance).toBe(9500);
    expect(refreshedAsm?.status).toBe('PARTIALLY_PAID');

    // 6. Citizen pays the remaining balance (₹9,500)
    await payService.processSimulatedPayment({
      assessmentId: assessment.id,
      payerId: 'usr-citizen-01',
      payerName: 'Rajesh Kumar Sharma',
      payerEmail: 'citizen@civictax.demo',
      payerPhone: '+91 98765 43210',
      amountPaid: 9500,
      paymentMethod: 'NET_BANKING',
      bankOrVpaDetails: 'HDFC NetBanking Demo',
    });

    const settledAsm = await asmService.getAssessmentById(assessment.id);
    expect(settledAsm?.outstandingBalance).toBe(0);
    expect(settledAsm?.status).toBe('PAID');
  });

  it('handles grievance submission, assignment, and resolution lifecycle with timeline audit', async () => {
    const grvService = new LocalGrievanceService();

    // 1. Citizen lodges grievance
    const newGrv = await grvService.createGrievance({
      propertyId: 'prop-001',
      propertyNumber: 'CT-PROP-2024-001',
      citizenId: 'usr-citizen-01',
      citizenName: 'Rajesh Kumar Sharma',
      citizenEmail: 'citizen@civictax.demo',
      citizenPhone: '+91 98765 43210',
      subject: 'Inquiry regarding residential rebate calculation',
      category: 'INCORRECT_CALCULATION',
      description: 'Early payment rebate was not credited.',
      priority: 'MEDIUM',
    });

    expect(newGrv.status).toBe('SUBMITTED');
    expect(newGrv.timeline.length).toBe(1);

    // 2. Assigned to Inspector Priya Sundaram
    const assignedGrv = await grvService.assignOfficer(newGrv.id, 'usr-officer-01', 'Priya V. Sundaram');
    expect(assignedGrv.status).toBe('ASSIGNED');
    expect(assignedGrv.assignedOfficerName).toBe('Priya V. Sundaram');
    expect(assignedGrv.timeline.length).toBe(2);

    // 3. Officer marks as RESOLVED
    const resolvedGrv = await grvService.updateGrievanceStatus(
      newGrv.id,
      'RESOLVED',
      'usr-officer-01',
      'Priya V. Sundaram',
      'Rebate discrepancy resolved and balance adjusted in assessment ledger.'
    );
    expect(resolvedGrv.status).toBe('RESOLVED');
    expect(resolvedGrv.resolutionComments).toBeTruthy();
    expect(resolvedGrv.resolvedDate).toBeTruthy();
  });

  it('scopes global search results according to authenticated user permissions', () => {
    const citizenUser: User = {
      id: 'usr-citizen-01',
      name: 'Rajesh Kumar Sharma',
      email: 'citizen@civictax.demo',
      role: 'CITIZEN',
      phone: '',
      createdAt: '',
    };

    const adminUser: User = {
      id: 'usr-admin-01',
      name: 'Dr. Arvind S. Deshmukh',
      email: 'admin@civictax.demo',
      role: 'ADMIN',
      phone: '',
      createdAt: '',
    };

    // Citizen searches for "Sharma" -> Finds their properties
    const citizenResults = GlobalSearchService.search('Sharma', citizenUser);
    expect(citizenResults.length).toBeGreaterThan(0);
    citizenResults.forEach((r) => {
      expect(r.linkUrl).toContain('/citizen');
    });

    // Admin searches across corporation
    const adminResults = GlobalSearchService.search('CT-PROP', adminUser);
    expect(adminResults.length).toBeGreaterThan(0);
    adminResults.forEach((r) => {
      expect(r.linkUrl).toContain('/admin');
    });
  });
});
