import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storageService';
import { LocalUserService } from '../services/local/LocalUserService';
import { LocalPropertyService } from '../services/local/LocalPropertyService';
import { LocalAssessmentService } from '../services/local/LocalAssessmentService';
import { LocalPaymentService } from '../services/local/LocalPaymentService';

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

// Mock window event dispatcher for node environment
if (typeof window === 'undefined') {
  (globalThis as any).window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

describe('Storage & Service Persistence Layer', () => {
  beforeEach(() => {
    localStorageMock.clear();
    StorageService.initialize();
  });

  it('initializes local storage with comprehensive seed properties and users', () => {
    const users = StorageService.getUsers();
    expect(users.length).toBeGreaterThanOrEqual(4);

    const properties = StorageService.getProperties();
    expect(properties.length).toBe(20);

    const assessments = StorageService.getAssessments();
    expect(assessments.length).toBe(15);
  });

  it('authenticates demo admin, officer, and citizen accounts accurately', async () => {
    const userService = new LocalUserService();
    
    const admin = await userService.login('admin@civictax.demo', 'Admin@123');
    expect(admin).not.toBeNull();
    expect(admin?.role).toBe('ADMIN');

    const officer = await userService.login('officer@civictax.demo', 'Officer@123');
    expect(officer).not.toBeNull();
    expect(officer?.role).toBe('OFFICER');

    const citizen = await userService.login('citizen@civictax.demo', 'Citizen@123');
    expect(citizen).not.toBeNull();
    expect(citizen?.role).toBe('CITIZEN');

    await expect(userService.login('unknown@email.com', 'wrongpassword')).rejects.toThrow();
  });

  it('persists a new property registration and retrieves it correctly', async () => {
    const propertyService = new LocalPropertyService();
    const newProperty = await propertyService.createProperty({
      ownerId: 'user-citizen-1',
      ownerName: 'Test Owner',
      ownerEmail: 'testowner@civictax.demo',
      ownerPhone: '9876543210',
      address: 'Plot 99, Tech Zone, Civic Nagar',
      category: 'RESIDENTIAL',
      zoneId: 'zone-1',
      zoneName: 'Zone 1 - Central Urban Core',
      builtUpArea: 1500,
      constructionYear: 2022,
      documentReference: 'DOC-MH-TEST-999',
      contactDetails: 'testowner@civictax.demo | 9876543210',
      description: 'Test residential flat',
    });

    expect(newProperty.id).toBeTruthy();
    expect(newProperty.propertyNumber).toBeTruthy();
    const fetched = await propertyService.getPropertyById(newProperty.id);
    expect(fetched?.ownerName).toBe('Test Owner');
    expect(fetched?.verificationStatus).toBe('PENDING');
  });

  it('records a tax payment and updates assessment balance to zero', async () => {
    const assessmentService = new LocalAssessmentService();
    const paymentService = new LocalPaymentService();

    // Get any assessment with outstanding balance
    const allAssessments = await assessmentService.getAssessments();
    const pendingAssessment = allAssessments.find((a) => a.outstandingBalance > 0);
    expect(pendingAssessment).toBeDefined();

    if (pendingAssessment) {
      const amountToPay = pendingAssessment.outstandingBalance;
      const payment = await paymentService.processSimulatedPayment({
        assessmentId: pendingAssessment.id,
        payerId: pendingAssessment.ownerId,
        payerName: pendingAssessment.ownerName,
        payerEmail: 'payer@civictax.demo',
        payerPhone: '9876543210',
        amountPaid: amountToPay,
        paymentMethod: 'UPI',
        bankOrVpaDetails: 'civic@okhdfcbank',
      });

      expect(payment.paymentStatus).toBe('SUCCESS');
      expect(payment.receiptNumber).toBeTruthy();

      const updatedAssessment = await assessmentService.getAssessmentById(pendingAssessment.id);
      expect(updatedAssessment?.status).toBe('PAID');
      expect(updatedAssessment?.outstandingBalance).toBe(0);
    }
  });
});
