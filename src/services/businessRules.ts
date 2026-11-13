import {
  Property,
  TaxAssessment,
  Payment,
  Grievance,
  ReassessmentRequest,
  TaxRate,
  User,
  UserRole,
} from '../types';

export class BusinessRuleError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

// 1. Property Rules
export const PropertyRules = {
  validateRegistration(data: Partial<Property>, existingProperties: Property[]): void {
    if (!data.ownerName || data.ownerName.trim().length < 3) {
      throw new BusinessRuleError('Owner full name must be at least 3 characters.', 'INVALID_OWNER_NAME');
    }
    if (!data.builtUpArea || data.builtUpArea <= 0) {
      throw new BusinessRuleError('Built-up area must be greater than 0 sq ft.', 'INVALID_AREA');
    }
    if (!data.documentReference || data.documentReference.trim().length < 4) {
      throw new BusinessRuleError('Valid ownership title deed reference is mandatory.', 'MISSING_DEED_REF');
    }

    // Duplicate property detection (Address + Zone or Document Reference)
    const duplicate = existingProperties.find(
      (p) =>
        p.id !== data.id &&
        (p.documentReference.trim().toLowerCase() === data.documentReference?.trim().toLowerCase() ||
          (p.address.trim().toLowerCase() === data.address?.trim().toLowerCase() && p.zoneId === data.zoneId))
    );

    if (duplicate) {
      throw new BusinessRuleError(
        `A property is already registered with deed reference '${data.documentReference}' or identical address in this zone (ID: ${duplicate.propertyNumber}).`,
        'DUPLICATE_PROPERTY'
      );
    }
  },

  validateVerification(property: Property, officer: User): void {
    if (officer.role !== 'OFFICER' && officer.role !== 'ADMIN') {
      throw new BusinessRuleError('Only authorized municipal officers can verify properties.', 'UNAUTHORIZED_VERIFIER');
    }
    if (property.verificationStatus === 'VERIFIED') {
      throw new BusinessRuleError('Property is already verified.', 'ALREADY_VERIFIED');
    }
  },
};

// 2. Tax Assessment Rules
export const AssessmentRules = {
  validateGeneration(property: Property, applicableRate?: TaxRate): void {
    if (property.verificationStatus !== 'VERIFIED') {
      throw new BusinessRuleError(
        'Annual tax assessments cannot be generated for unverified or rejected properties.',
        'UNVERIFIED_PROPERTY'
      );
    }
    if (!applicableRate || applicableRate.ratePerSqFt <= 0) {
      throw new BusinessRuleError(
        `Active tax rate is not configured for category '${property.category}' in zone '${property.zoneName}'.`,
        'MISSING_TAX_RATE'
      );
    }
  },

  calculateSafeTax(builtUpArea: number, ratePerSqFt: number, penalty = 0, discount = 0): {
    baseTax: number;
    penalty: number;
    discount: number;
    totalTax: number;
  } {
    const safeArea = Math.max(0, builtUpArea);
    const safeRate = Math.max(0, ratePerSqFt);
    const baseTax = Math.round(safeArea * safeRate);

    const safePenalty = Math.max(0, penalty);
    // Discount cannot exceed baseTax
    const safeDiscount = Math.min(Math.max(0, discount), baseTax);
    const totalTax = Math.max(0, baseTax + safePenalty - safeDiscount);

    return {
      baseTax,
      penalty: safePenalty,
      discount: safeDiscount,
      totalTax,
    };
  },
};

// 3. Payment Rules
export const PaymentRules = {
  validatePayment(assessment: TaxAssessment, amount: number): void {
    if (assessment.status === 'PAID' || assessment.outstandingBalance <= 0) {
      throw new BusinessRuleError('This tax assessment is already fully settled. No dues outstanding.', 'ALREADY_PAID');
    }
    if (amount <= 0) {
      throw new BusinessRuleError('Payment amount must be greater than zero.', 'INVALID_PAYMENT_AMOUNT');
    }
    // Prevent overpayment
    if (amount > assessment.outstandingBalance) {
      throw new BusinessRuleError(
        `Payment amount of ₹${amount.toLocaleString('en-IN')} exceeds the outstanding balance of ₹${assessment.outstandingBalance.toLocaleString('en-IN')}.`,
        'OVERPAYMENT_EXCEEDED'
      );
    }
  },
};

// 4. Access Control Rules
export const AccessControlRules = {
  assertRole(user: User | null, allowedRoles: UserRole[]): void {
    if (!user) {
      throw new BusinessRuleError('Authentication required. Session is invalid.', 'UNAUTHENTICATED');
    }
    if (!allowedRoles.includes(user.role)) {
      throw new BusinessRuleError(
        `Access denied. Role '${user.role}' lacks permission for this administrative operation.`,
        'FORBIDDEN'
      );
    }
  },

  assertOwnership(user: User, resourceOwnerId: string): void {
    if (user.role === 'ADMIN' || user.role === 'OFFICER') return;
    if (user.id !== resourceOwnerId) {
      throw new BusinessRuleError('Access denied. Citizens can only access their own records.', 'FORBIDDEN_RECORD');
    }
  },
};
