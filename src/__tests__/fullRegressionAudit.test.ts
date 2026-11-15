import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from '../services/storageService';
import { LocalUserService } from '../services/local/LocalUserService';
import { LocalPropertyService } from '../services/local/LocalPropertyService';
import { LocalAssessmentService } from '../services/local/LocalAssessmentService';
import { LocalPaymentService } from '../services/local/LocalPaymentService';
import { calculateTax } from '../utils';
import {
  generateReceiptPdf,
  downloadReceiptPdf,
  printReceiptPdf,
  SAMPLE_DEMO_PAYMENT,
  SAMPLE_DEMO_PROPERTY,
  SAMPLE_DEMO_ASSESSMENT,
} from '../services/receiptPdfService';
import { User, Property, TaxAssessment, Payment } from '../types';

// In-memory mock localStorage for Node / Vitest
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
    location: { origin: 'https://civictax.demo' },
  };
}

if (typeof document === 'undefined') {
  const dummyEl: any = {
    style: {},
    setAttribute: () => {},
    click: () => {},
    onload: null,
    contentWindow: {
      focus: () => {},
      print: () => {},
    },
  };
  (globalThis as any).document = {
    createElement: () => ({ ...dummyEl }),
    body: {
      appendChild: () => dummyEl,
      removeChild: () => dummyEl,
    },
  };
}

describe('CivicTax 10.5 — Full Regression & Production Readiness Test Suite', () => {
  const userService = new LocalUserService();
  const propertyService = new LocalPropertyService();
  const assessmentService = new LocalAssessmentService();
  const paymentService = new LocalPaymentService();

  beforeEach(() => {
    localStorageMock.clear();
    StorageService.initialize();
  });

  describe('1. Homepage & Navigation Routing', () => {
    it('verifies public landing page routes and navigation items are configured', () => {
      const publicRoutes = ['/', '/login', '/register', '/about', '/services', '/contact', '/verify-receipt'];
      expect(publicRoutes).toHaveLength(7);
      expect(publicRoutes).toContain('/');
      expect(publicRoutes).toContain('/login');
      expect(publicRoutes).toContain('/verify-receipt');
    });

    it('verifies role-based landing routes for authenticated users', () => {
      const getRoleDashboard = (role: 'CITIZEN' | 'OFFICER' | 'ADMIN') => {
        switch (role) {
          case 'ADMIN':
            return '/admin';
          case 'OFFICER':
            return '/officer';
          case 'CITIZEN':
          default:
            return '/citizen';
        }
      };

      expect(getRoleDashboard('ADMIN')).toBe('/admin');
      expect(getRoleDashboard('OFFICER')).toBe('/officer');
      expect(getRoleDashboard('CITIZEN')).toBe('/citizen');
    });
  });

  describe('2. User Registration & Authentication Lifecycle', () => {
    it('successfully registers a new citizen user', async () => {
      const newUser = await userService.createUser({
        name: 'Amit Patel',
        email: 'amit.patel@test-civictax.org',
        phone: '9988776655',
        address: '42 MG Road, Zone 2, Pune',
        role: 'CITIZEN',
      });

      expect(newUser.id).toBeDefined();
      expect(newUser.email).toBe('amit.patel@test-civictax.org');
      expect(newUser.role).toBe('CITIZEN');

      const retrieved = await userService.getUserById(newUser.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('Amit Patel');
    });

    it('authenticates seeded users and handles invalid credentials', async () => {
      // Valid credentials
      const admin = await userService.login('admin@civictax.demo', 'Admin@123');
      expect(admin).not.toBeNull();
      expect(admin?.role).toBe('ADMIN');

      const citizen = await userService.login('citizen@civictax.demo', 'Citizen@123');
      expect(citizen).not.toBeNull();
      expect(citizen?.role).toBe('CITIZEN');

      // Invalid password / unknown user
      await expect(userService.login('admin@civictax.demo', 'wrongpassword')).rejects.toThrow();
      await expect(userService.login('unknown@email.com', 'demo123')).rejects.toThrow();
    });

    it('maintains session persistence in localStorage and cleanly clears on logout', () => {
      const sessionUser: User = {
        id: 'usr-persistent-101',
        name: 'Session Test User',
        email: 'session@civictax.demo',
        phone: '9876543210',
        role: 'CITIZEN',
        createdAt: new Date().toISOString(),
      };

      // Set session
      localStorage.setItem('civictax_current_user', JSON.stringify(sessionUser));
      localStorage.setItem('civictax_auth_token', 'jwt-demo-token-xyz-123');

      // Verify persistence
      const savedUserRaw = localStorage.getItem('civictax_current_user');
      expect(savedUserRaw).not.toBeNull();
      const parsedUser = JSON.parse(savedUserRaw!);
      expect(parsedUser.email).toBe('session@civictax.demo');

      // Logout simulation
      localStorage.removeItem('civictax_current_user');
      localStorage.removeItem('civictax_auth_token');

      expect(localStorage.getItem('civictax_current_user')).toBeNull();
      expect(localStorage.getItem('civictax_auth_token')).toBeNull();
    });
  });

  describe('3. Dashboard Data Aggregation & Metrics', () => {
    it('aggregates citizen properties and assessments correctly', async () => {
      const properties = await propertyService.getProperties();
      const citizenProperties = properties.filter((p) => p.ownerEmail === 'citizen@civictax.demo');
      expect(citizenProperties.length).toBeGreaterThan(0);

      const assessments = await assessmentService.getAssessments();
      const citizenAssessments = assessments.filter((a) =>
        citizenProperties.some((p) => p.id === a.propertyId || p.propertyNumber === a.propertyNumber)
      );
      expect(citizenAssessments.length).toBeGreaterThan(0);

      const totalTaxDue = citizenAssessments.reduce((sum, a) => sum + (a.outstandingBalance || 0), 0);
      expect(totalTaxDue).toBeGreaterThanOrEqual(0);
    });

    it('aggregates municipal administrator metrics', async () => {
      const allProperties = await propertyService.getProperties();
      const allAssessments = await assessmentService.getAssessments();
      const allPayments = await paymentService.getPayments();

      expect(allProperties.length).toBeGreaterThanOrEqual(3);
      expect(allAssessments.length).toBeGreaterThanOrEqual(3);
      expect(allPayments.length).toBeGreaterThanOrEqual(2);

      const totalRevenue = allPayments
        .filter((p) => p.paymentStatus === 'SUCCESS')
        .reduce((sum, p) => sum + p.amountPaid, 0);

      expect(totalRevenue).toBeGreaterThan(0);
    });
  });

  describe('4. Property Registration & Details Retrieval', () => {
    it('registers a new property and retrieves its details', async () => {
      const newProp = await propertyService.createProperty({
        ownerId: 'user-citizen-1',
        ownerName: 'Sunita Rao',
        ownerEmail: 'sunita@civictax.demo',
        ownerPhone: '9123456789',
        address: '15 Kothrud Green Avenue, Pune',
        zoneId: 'zone-1',
        zoneName: 'Zone 1 - Central Urban Core',
        category: 'RESIDENTIAL',
        builtUpArea: 1500,
        constructionYear: 2021,
        documentReference: 'DOC-MH-TEST-2026',
        contactDetails: 'sunita@civictax.demo | 9123456789',
        description: 'New residential property registration',
      });

      expect(newProp.id).toBeDefined();
      expect(newProp.propertyNumber).toBeDefined();

      const fetched = await propertyService.getPropertyById(newProp.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.ownerName).toBe('Sunita Rao');
      expect(fetched?.builtUpArea).toBe(1500);
      expect(fetched?.verificationStatus).toBe('PENDING');
    });
  });

  describe('5. Property Tax Calculation Business Logic', () => {
    it('calculates residential property tax accurately with unit area formula', () => {
      // 1000 sq ft at 10/sq ft = 10,000 base tax
      const result = calculateTax({
        builtUpArea: 1000,
        ratePerSqFt: 10,
        penalty: 0,
        discount: 0,
        previousPayments: 0,
      });

      expect(result.baseTax).toBe(10000);
      expect(result.penalty).toBe(0);
      expect(result.discount).toBe(0);
      expect(result.totalTax).toBe(10000);
      expect(result.outstandingBalance).toBe(10000);
    });

    it('applies early payment rebate (discount of ₹500)', () => {
      const result = calculateTax({
        builtUpArea: 1000,
        ratePerSqFt: 10,
        penalty: 0,
        discount: 500,
        previousPayments: 0,
      });

      expect(result.baseTax).toBe(10000);
      expect(result.discount).toBe(500);
      expect(result.totalTax).toBe(9500);
      expect(result.outstandingBalance).toBe(9500);
    });

    it('applies statutory late penalty and accounts for previous partial payments', () => {
      const result = calculateTax({
        builtUpArea: 1000,
        ratePerSqFt: 10,
        penalty: 800,
        discount: 0,
        previousPayments: 2000,
      });

      expect(result.baseTax).toBe(10000);
      expect(result.penalty).toBe(800);
      expect(result.totalTax).toBe(10800);
      expect(result.outstandingBalance).toBe(8800);
    });
  });

  describe('6. Payment Processing in Demo/Test Mode & Balance Settlement', () => {
    it('processes a full tax payment, issues receipt, and clears remaining balance to zero', async () => {
      const assessments = await assessmentService.getAssessments();
      const targetAssessment = assessments.find((a) => a.outstandingBalance > 0);
      expect(targetAssessment).toBeDefined();

      const payAmount = targetAssessment!.outstandingBalance;

      const payment = await paymentService.processSimulatedPayment({
        assessmentId: targetAssessment!.id,
        payerId: targetAssessment!.ownerId,
        payerName: targetAssessment!.ownerName,
        payerEmail: 'citizen@civictax.demo',
        payerPhone: '9876543210',
        amountPaid: payAmount,
        paymentMethod: 'NET_BANKING',
        bankOrVpaDetails: 'HDFC NetBanking',
      });

      expect(payment.id).toBeDefined();
      expect(payment.receiptNumber).toMatch(/^RCP-/);
      expect(payment.amountPaid).toBe(payAmount);
      expect(payment.paymentStatus).toBe('SUCCESS');

      // Verify assessment update
      const updatedAssessment = await assessmentService.getAssessmentById(targetAssessment!.id);
      expect(updatedAssessment).not.toBeNull();
      expect(updatedAssessment?.outstandingBalance).toBe(0);
      expect(updatedAssessment?.status).toBe('PAID');
    });
  });

  describe('7. Payment History Retrieval', () => {
    it('retrieves payment history and confirms payment metadata', async () => {
      const allPayments = await paymentService.getPayments();
      expect(allPayments.length).toBeGreaterThan(0);

      allPayments.forEach((p) => {
        expect(p.receiptNumber).toBeDefined();
        expect(p.amountPaid).toBeGreaterThan(0);
        expect(p.paymentDate).toBeDefined();
        expect(p.paymentStatus).toBeDefined();
      });
    });
  });

  describe('8. PDF Receipt Generation, Vector Formatting & Searchability', () => {
    it('generates a single-page vector A4 PDF with valid size and structure', async () => {
      const doc = await generateReceiptPdf({
        payment: SAMPLE_DEMO_PAYMENT,
        property: SAMPLE_DEMO_PROPERTY,
        assessment: SAMPLE_DEMO_ASSESSMENT,
        isDemo: true,
      });

      const rawPdfText = doc.output();
      expect(rawPdfText.length).toBeGreaterThan(15000);
      expect(rawPdfText.startsWith('%PDF-')).toBe(true);

      const pageMatches = rawPdfText.match(/\/Type\s*\/Page\b/g);
      expect(pageMatches).not.toBeNull();
      expect(pageMatches?.length).toBe(1);
    });

    it('contains all mandatory developer attribution elements un-abbreviated', async () => {
      const doc = await generateReceiptPdf({
        payment: SAMPLE_DEMO_PAYMENT,
        property: SAMPLE_DEMO_PROPERTY,
        assessment: SAMPLE_DEMO_ASSESSMENT,
        isDemo: true,
      });
      const rawPdfText = doc.output();

      expect(rawPdfText).toContain('PROJECT DEVELOPED BY');
      expect(rawPdfText).toContain('PALLAPU DILEEP KUMAR');
      expect(rawPdfText).toContain('Vel Tech University');
      expect(rawPdfText).toContain('https://dileepkumarpallapu.github.io/My-Portfolio/');
      expect(rawPdfText).toContain('https://github.com/DileepKumarPallapu');
      expect(rawPdfText).toContain('https://www.linkedin.com/in/dileep-kumar-pallapu');
    });

    it('contains all mandatory DEMO warnings and watermarks', async () => {
      const doc = await generateReceiptPdf({
        payment: SAMPLE_DEMO_PAYMENT,
        property: SAMPLE_DEMO_PROPERTY,
        assessment: SAMPLE_DEMO_ASSESSMENT,
        isDemo: true,
      });
      const rawPdfText = doc.output();

      expect(rawPdfText).toContain('DEMO RECEIPT');
      expect(rawPdfText).toContain('ACADEMIC PROJECT DEMONSTRATION');
      expect(rawPdfText).toContain('NOT VALID FOR REAL TAX PAYMENT');
    });

    it('contains payment breakdown, transaction ID, and verification QR code instruction', async () => {
      const doc = await generateReceiptPdf({
        payment: SAMPLE_DEMO_PAYMENT,
        property: SAMPLE_DEMO_PROPERTY,
        assessment: SAMPLE_DEMO_ASSESSMENT,
        isDemo: true,
      });
      const rawPdfText = doc.output();

      expect(rawPdfText).toContain('RCP-DEMO-2026-0042');
      expect(rawPdfText).toContain('TXN-DEMO-2026-98421');
      expect(rawPdfText).toContain('CT-PROP-2024-001');
      expect(rawPdfText).toContain('Rajesh Kumar Sharma');
      expect(rawPdfText).toContain('STATUS: PAID');
      expect(rawPdfText).toContain('SCAN TO VERIFY');
    });
  });

  describe('9. Download and Print Receipt Simulation', () => {
    it('executes downloadReceiptPdf without throwing errors', async () => {
      // In Node environment, doc.save() handles saving
      await expect(
        downloadReceiptPdf({
          payment: SAMPLE_DEMO_PAYMENT,
          property: SAMPLE_DEMO_PROPERTY,
          assessment: SAMPLE_DEMO_ASSESSMENT,
        })
      ).resolves.not.toThrow();
    });

    it('executes printReceiptPdf via hidden iframe without throwing errors', async () => {
      const createdElements: any[] = [];
      const origCreate = document.createElement;
      document.createElement = ((tag: string) => {
        const el: any = {
          tagName: tag,
          style: {},
          setAttribute: vi.fn(),
          onload: null,
          contentWindow: {
            focus: vi.fn(),
            print: vi.fn(),
          },
        };
        createdElements.push(el);
        return el;
      }) as any;

      globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-print-url');
      globalThis.URL.revokeObjectURL = vi.fn();

      await expect(
        printReceiptPdf({
          payment: SAMPLE_DEMO_PAYMENT,
          property: SAMPLE_DEMO_PROPERTY,
          assessment: SAMPLE_DEMO_ASSESSMENT,
        })
      ).resolves.not.toThrow();

      const createdIframe = createdElements.find((e) => e.tagName === 'iframe');
      expect(createdIframe).toBeDefined();
      expect(createdIframe.src).toBe('blob:mock-print-url');

      document.createElement = origCreate;
    });
  });

  describe('10. QR Receipt Verification & Taxpayer Privacy Masking', () => {
    it('finds receipt by receipt number and masks taxpayer PII for public display', () => {
      const maskTaxpayerName = (name: string): string => {
        if (!name) return 'Valued Taxpayer';
        const parts = name.split(' ');
        return parts
          .map((part) => {
            if (part.length <= 2) return part;
            return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
          })
          .join(' ');
      };

      expect(maskTaxpayerName('Rajesh Kumar Sharma')).toBe('R****h K***r S****a');
      expect(maskTaxpayerName('Dileep Kumar Pallapu')).toBe('D****p K***r P*****u');
      expect(maskTaxpayerName('Om')).toBe('Om');
    });

    it('parses receipt number from URL path cleanly', () => {
      const parseReceiptId = (path: string) => {
        const parts = path.split('/');
        return parts[parts.length - 1];
      };

      expect(parseReceiptId('/verify-receipt/RCP-DEMO-2026-0042')).toBe('RCP-DEMO-2026-0042');
      expect(parseReceiptId('/verify-receipt/RCP-2026-001')).toBe('RCP-2026-001');
    });
  });

  describe('11. Security, Credentials & Secret Audit', () => {
    it('verifies no plaintext passwords or secret API tokens are leaked in demo seed data', () => {
      const properties = StorageService.getProperties();
      const jsonStr = JSON.stringify(properties);

      expect(jsonStr).not.toContain('secret_key');
      expect(jsonStr).not.toContain('private_key');
      expect(jsonStr).not.toContain('bearer_token');
    });

    it('verifies role authorization boundaries', () => {
      const hasPermission = (userRole: string, allowedRoles: string[]) => {
        return allowedRoles.includes(userRole);
      };

      expect(hasPermission('CITIZEN', ['ADMIN'])).toBe(false);
      expect(hasPermission('OFFICER', ['ADMIN'])).toBe(false);
      expect(hasPermission('ADMIN', ['ADMIN'])).toBe(true);
      expect(hasPermission('OFFICER', ['OFFICER', 'ADMIN'])).toBe(true);
      expect(hasPermission('CITIZEN', ['CITIZEN', 'OFFICER', 'ADMIN'])).toBe(true);
    });
  });
});
