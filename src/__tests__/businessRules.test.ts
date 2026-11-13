import { describe, it, expect, beforeEach } from 'vitest';
import { PropertyRules, AssessmentRules, PaymentRules, BusinessRuleError } from '../services/businessRules';
import { Property, TaxAssessment, TaxRate, User } from '../types';

describe('CivicTax Enterprise Business Rules Engine', () => {
  const mockProperties: Property[] = [
    {
      id: 'prop-1',
      propertyNumber: 'CT-PROP-2024-0001',
      ownerId: 'usr-1',
      ownerName: 'Sunil Verma',
      ownerEmail: 'sunil@demo.com',
      ownerPhone: '9876543210',
      address: 'Plot 101, Model Colony',
      category: 'RESIDENTIAL',
      zoneId: 'zone-1',
      zoneName: 'Zone 1',
      builtUpArea: 1200,
      constructionYear: 2020,
      documentReference: 'DOC-MH-2020-001',
      contactDetails: '9876543210',
      description: 'Residential bungalow',
      verificationStatus: 'VERIFIED',
      registrationDate: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  it('detects duplicate property registrations by deed reference', () => {
    expect(() => {
      PropertyRules.validateRegistration(
        {
          ownerName: 'Another Owner',
          builtUpArea: 1500,
          documentReference: 'DOC-MH-2020-001', // Duplicate deed
          address: 'Different Address',
          zoneId: 'zone-1',
        },
        mockProperties
      );
    }).toThrowError(BusinessRuleError);
  });

  it('prohibits assessment generation for unverified properties', () => {
    const unverifiedProperty: Property = {
      ...mockProperties[0],
      id: 'prop-2',
      verificationStatus: 'PENDING',
    };
    const rate: TaxRate = {
      id: 'rate-1',
      category: 'RESIDENTIAL',
      ratePerSqFt: 10,
      effectiveStartDate: '2024-04-01',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    };

    expect(() => {
      AssessmentRules.validateGeneration(unverifiedProperty, rate);
    }).toThrowError(BusinessRuleError);
  });

  it('calculates safe tax and prevents discounts exceeding base tax', () => {
    // 1000 sq ft @ ₹10/sq ft = ₹10,000 Base Tax. Discount attempted: ₹15,000 -> Should clamp to ₹10,000
    const result = AssessmentRules.calculateSafeTax(1000, 10, 500, 15000);
    expect(result.baseTax).toBe(10000);
    expect(result.discount).toBe(10000); // Clamped
    expect(result.penalty).toBe(500);
    expect(result.totalTax).toBe(500); // 10000 + 500 - 10000
  });

  it('rejects overpayments beyond outstanding balance', () => {
    const mockAssessment: TaxAssessment = {
      id: 'asm-1',
      assessmentNumber: 'CT-ASM-2024-001',
      propertyId: 'prop-1',
      propertyNumber: 'CT-PROP-2024-001',
      ownerId: 'usr-1',
      ownerName: 'Sunil Verma',
      ownerEmail: 'sunil@demo.com',
      assessmentYear: '2024-2025',
      category: 'RESIDENTIAL',
      zoneId: 'zone-1',
      zoneName: 'Zone 1',
      builtUpArea: 1000,
      appliedRatePerSqFt: 10,
      baseTax: 10000,
      penalty: 0,
      discount: 0,
      totalTax: 10000,
      amountPaid: 8000,
      outstandingBalance: 2000,
      status: 'PARTIALLY_PAID',
      dueDate: '2024-12-31',
      generatedDate: '2024-04-01T00:00:00Z',
    };

    // Attempting to pay ₹3,000 when only ₹2,000 is due
    expect(() => {
      PaymentRules.validatePayment(mockAssessment, 3000);
    }).toThrowError(BusinessRuleError);

    // Paying exactly ₹2,000 succeeds
    expect(() => {
      PaymentRules.validatePayment(mockAssessment, 2000);
    }).not.toThrow();
  });
});
