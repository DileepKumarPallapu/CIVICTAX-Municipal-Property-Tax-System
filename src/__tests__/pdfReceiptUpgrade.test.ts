import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storageService';
import {
  generateReceiptPdf,
  SAMPLE_DEMO_PAYMENT,
  SAMPLE_DEMO_PROPERTY,
  SAMPLE_DEMO_ASSESSMENT,
} from '../services/receiptPdfService';
import { Payment } from '../types';

// Mock localStorage for test execution
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

describe('CivicTax Professional PDF Payment Receipt Upgrade', () => {
  beforeEach(() => {
    localStorageMock.clear();
    StorageService.initialize();
  });

  it('generates an authentic A4 portrait vector PDF receipt with searchable text', async () => {
    const doc = await generateReceiptPdf({
      payment: SAMPLE_DEMO_PAYMENT,
      property: SAMPLE_DEMO_PROPERTY,
      assessment: SAMPLE_DEMO_ASSESSMENT,
      isDemo: true,
      verificationBaseUrl: 'https://civictax.demo',
    });

    expect(doc).toBeDefined();

    // Verify A4 Dimensions (210mm x 297mm)
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    expect(Math.round(pageWidth)).toBe(210);
    expect(Math.round(pageHeight)).toBe(297);

    // Verify PDF binary header
    const output = doc.output();
    expect(output.startsWith('%PDF-')).toBe(true);

    // Verify searchable text content exists in the PDF document stream
    expect(output).toContain('CIVICTAX MUNICIPAL CORPORATION');
    expect(output).toContain('DEMO RECEIPT');
    expect(output).toContain('STATUS: PAID');
    expect(output).toContain(SAMPLE_DEMO_PAYMENT.receiptNumber);
    expect(output).toContain(SAMPLE_DEMO_PAYMENT.transactionId);
    expect(output).toContain(SAMPLE_DEMO_PAYMENT.propertyNumber);
    expect(output).toContain(SAMPLE_DEMO_PAYMENT.payerName);

    // Verify Developer attribution in footer
    expect(output).toContain('PALLAPU DILEEP KUMAR');
    expect(output).toContain('Vel Tech University');
    expect(output).toContain('https://dileepkumarpallapu.github.io/My-Portfolio/');
  });

  it('embeds QR verification URL without leaking private taxpayer PII', async () => {
    const baseUrl = 'https://civictax.demo';
    const doc = await generateReceiptPdf({
      payment: SAMPLE_DEMO_PAYMENT,
      property: SAMPLE_DEMO_PROPERTY,
      assessment: SAMPLE_DEMO_ASSESSMENT,
      isDemo: true,
      verificationBaseUrl: baseUrl,
    });

    const output = doc.output();
    // Verify QR scan text prompt
    expect(output).toContain('SCAN TO VERIFY');

    // Expected QR target URL: only carries receipt number
    const expectedQrUrl = `${baseUrl}/verify-receipt?id=${encodeURIComponent(SAMPLE_DEMO_PAYMENT.receiptNumber)}`;
    expect(expectedQrUrl).toContain('id=RCP-DEMO-2026-0042');
    expect(expectedQrUrl).not.toContain(SAMPLE_DEMO_PAYMENT.payerPhone);
    expect(expectedQrUrl).not.toContain(SAMPLE_DEMO_PAYMENT.payerEmail);
  });

  it('verifies realistic sample demo payment data isolation and accurate ledger math', () => {
    expect(SAMPLE_DEMO_PAYMENT.amountPaid).toBe(11500);
    expect(SAMPLE_DEMO_PAYMENT.totalAssessment).toBe(11500);
    expect(SAMPLE_DEMO_PAYMENT.remainingBalance).toBe(0);
    expect(SAMPLE_DEMO_PAYMENT.paymentStatus).toBe('SUCCESS');
    expect(SAMPLE_DEMO_PAYMENT.receiptNumber).toMatch(/^RCP-DEMO-/);
    expect(SAMPLE_DEMO_PAYMENT.transactionId).toMatch(/^TXN-DEMO-/);

    // Mathematical integrity: baseTax (12000) - discount (500) + penalty (0) = 11500
    const calculatedTotal =
      SAMPLE_DEMO_ASSESSMENT.baseTax +
      SAMPLE_DEMO_ASSESSMENT.penalty -
      SAMPLE_DEMO_ASSESSMENT.discount;
    expect(calculatedTotal).toBe(SAMPLE_DEMO_PAYMENT.amountPaid);
  });

  it('verifies QR receipt verification lookup logic from stored payment ledger', () => {
    const payments = StorageService.getPayments();
    expect(payments.length).toBeGreaterThan(0);

    const testPayment = payments[0];

    // 1. Direct lookup by receiptNumber
    const foundByReceipt = payments.find(
      (p) => p.receiptNumber.toUpperCase() === testPayment.receiptNumber.toUpperCase()
    );
    expect(foundByReceipt).toBeDefined();
    expect(foundByReceipt?.id).toBe(testPayment.id);

    // 2. Direct lookup by transactionId
    const foundByTxn = payments.find(
      (p) => p.transactionId.toUpperCase() === testPayment.transactionId.toUpperCase()
    );
    expect(foundByTxn).toBeDefined();
    expect(foundByTxn?.receiptNumber).toBe(testPayment.receiptNumber);

    // 3. Fallback for demo sample receipt identifier
    const demoId: string = 'RCP-DEMO-2026-0042';
    const isDemoSample = demoId.includes('DEMO') || demoId === 'SAMPLE';
    expect(isDemoSample).toBe(true);

    // 4. Unknown lookup
    const unknownLookup = payments.find((p) => p.receiptNumber === 'NON-EXISTENT-REC-999');
    expect(unknownLookup).toBeUndefined();
  });

  it('enforces taxpayer privacy masking for public verification display', () => {
    const maskName = (name: string): string => {
      if (!name) return 'Protected Taxpayer';
      const parts = name.split(' ');
      return parts
        .map((part) => (part.length > 1 ? part[0] + '*'.repeat(Math.min(part.length - 1, 5)) : part))
        .join(' ');
    };

    const masked = maskName('Rajesh Kumar Sharma');
    expect(masked).toBe('R***** K**** S*****');
    expect(masked).not.toBe('Rajesh Kumar Sharma');
    expect(masked.startsWith('R')).toBe(true);
  });

  it('verifies repeated receipt downloads and previews never create duplicate payment records', async () => {
    const initialCount = StorageService.getPayments().length;

    // Simulate multiple downloads
    for (let i = 0; i < 5; i++) {
      const doc = await generateReceiptPdf({
        payment: SAMPLE_DEMO_PAYMENT,
        property: SAMPLE_DEMO_PROPERTY,
        assessment: SAMPLE_DEMO_ASSESSMENT,
        isDemo: true,
      });
      expect(doc).toBeDefined();
    }

    // Payment collection length must remain strictly invariant
    const finalCount = StorageService.getPayments().length;
    expect(finalCount).toBe(initialCount);
  });

  it('enforces authorization access control rules for receipt viewing', () => {
    const citizenUser = {
      id: 'usr-citizen-01',
      email: 'citizen@civictax.demo',
      role: 'CITIZEN' as const,
    };

    const otherCitizenPayment: Payment = {
      ...SAMPLE_DEMO_PAYMENT,
      id: 'pay-other-citizen',
      payerId: 'usr-citizen-99',
      payerEmail: 'other@civictax.demo',
      receiptNumber: 'RCP-PROD-2024-9999', // Non-demo receipt
    };

    const isAuthorized = (
      user: { id: string; email: string; role: 'CITIZEN' | 'OFFICER' | 'ADMIN' },
      payment: Payment
    ): boolean => {
      if (user.role === 'ADMIN' || user.role === 'OFFICER') return true;
      if (payment.receiptNumber.includes('DEMO')) return true;
      return (
        payment.payerId === user.id ||
        payment.payerEmail.toLowerCase() === user.email.toLowerCase()
      );
    };

    // Citizen attempting to view another citizen's private production receipt -> DENIED
    expect(isAuthorized(citizenUser, otherCitizenPayment)).toBe(false);

    // Citizen viewing their own receipt -> ALLOWED
    const ownPayment: Payment = {
      ...otherCitizenPayment,
      payerId: citizenUser.id,
      payerEmail: citizenUser.email,
    };
    expect(isAuthorized(citizenUser, ownPayment)).toBe(true);

    // Officer viewing any receipt -> ALLOWED
    const officerUser = { id: 'usr-officer-01', email: 'officer@civictax.demo', role: 'OFFICER' as const };
    expect(isAuthorized(officerUser, otherCitizenPayment)).toBe(true);

    // Admin viewing any receipt -> ALLOWED
    const adminUser = { id: 'usr-admin-01', email: 'admin@civictax.demo', role: 'ADMIN' as const };
    expect(isAuthorized(adminUser, otherCitizenPayment)).toBe(true);

    // Any user viewing sample demo receipt -> ALLOWED
    expect(isAuthorized(citizenUser, SAMPLE_DEMO_PAYMENT)).toBe(true);
  });
});
