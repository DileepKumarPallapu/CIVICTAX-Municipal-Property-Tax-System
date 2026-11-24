// server/src/repositories/types.ts
export interface IProperty {
  id: string;
  propertyNumber: string;
  ownerId: string;
  ownerName: string;
  address: string;
  category: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'AGRICULTURAL';
  builtUpArea: number;
  zone: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'RESUBMISSION_REQUIRED' | 'REJECTED';
  documentReference: string;
  latitude?: number;
  longitude?: number;
  constructionYear?: number;
  registrationDate: string;
}

export type IPropertyDetailsUpdate = Partial<
  Pick<
    IProperty,
    | 'address'
    | 'category'
    | 'builtUpArea'
    | 'zone'
    | 'documentReference'
    | 'latitude'
    | 'longitude'
    | 'constructionYear'
  >
>;

export interface ITaxAssessment {
  id: string;
  assessmentNumber: string;
  propertyId: string;
  assessmentYear: string;
  category: string;
  builtUpArea: number;
  appliedRatePerSqFt: number;
  baseTax: number;
  penalty: number;
  discount: number;
  totalTax: number;
  amountPaid: number;
  outstandingBalance: number;
  status: 'DRAFT' | 'APPROVED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  dueDate: string;
}

export interface ITaxPayment {
  id: string;
  assessmentId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId: string;
  paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  receiptNumber: string;
}

export interface IGrievance {
  id: string;
  grievanceNumber: string;
  propertyId?: string;
  citizenId: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolutionComments?: string;
  resolutionDate?: string;
  createdAt: string;
}

export interface IReassessment {
  id: string;
  requestNumber: string;
  propertyId: string;
  originalAssessmentId?: string;
  requestedChange: string;
  supportingReason: string;
  approvalStatus: 'SUBMITTED' | 'UNDER_REVIEW' | 'RECOMMENDED' | 'APPROVED' | 'REJECTED';
  decisionComments?: string;
  createdAt: string;
}

export interface IDashboardMetrics {
  totalProperties: number;
  verifiedProperties: number;
  pendingVerifications: number;
  totalTaxAssessed: number;
  totalRevenueCollected: number;
  totalOutstandingDues: number;
  collectionEfficiencyRate: number;
  openGrievances: number;
}
