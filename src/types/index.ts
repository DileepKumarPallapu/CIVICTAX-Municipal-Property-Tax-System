// ==========================================
// CIVICTAX CENTRAL TYPE DEFINITIONS (V7.0 SMART CITY INTELLIGENCE)
// ==========================================

export type UserRole = 'CITIZEN' | 'OFFICER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatarUrl?: string;
  zoneId?: string;
  zoneName?: string;
  address?: string;
  designation?: string;
  department?: string;
  isActive?: boolean;
  createdAt: string;
}

export type PropertyCategory = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL';

export type PropertyVerificationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'RESUBMISSION_REQUIRED';

export interface MunicipalZone {
  id: string;
  code: string;
  name: string;
  description: string;
  wardCoverage: string;
  officerInChargeId: string;
  officerInChargeName: string;
  activePropertiesCount: number;
  totalRevenueTarget: number;
  centerCoordinates?: [number, number]; // [lat, lng]
}

export interface PropertyRevision {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  remarks?: string;
}

export interface Property {
  id: string;
  propertyNumber: string; // e.g. CT-PROP-2024-001
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  address: string;
  category: PropertyCategory;
  zoneId: string;
  zoneName: string;
  builtUpArea: number; // in sq ft
  constructionYear: number;
  documentReference: string; // deed/title registration number
  contactDetails: string;
  description: string;
  verificationStatus: PropertyVerificationStatus;
  verificationDate?: string;
  verifiedByOfficerId?: string;
  verifiedByOfficerName?: string;
  verificationComments?: string;
  rejectionReason?: string;
  registrationDate: string;
  updatedAt: string;
  revisions?: PropertyRevision[];
  // GIS V7.0 Coordinates
  latitude?: number;
  longitude?: number;
  geospatialVerificationStatus?: 'UNVERIFIED' | 'SYNTHETIC_DEMO' | 'FIELD_VERIFIED';
}

export interface TaxRate {
  id: string;
  category: PropertyCategory;
  ratePerSqFt: number; // in INR ₹
  effectiveStartDate: string; // YYYY-MM-DD
  effectiveEndDate?: string | null;
  isActive: boolean;
  zoneId?: string | null; // null if universal
  zoneName?: string | null;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type AssessmentStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE';

export interface TaxAssessment {
  id: string;
  assessmentNumber: string; // e.g. CT-ASM-2024-001
  propertyId: string;
  propertyNumber: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  assessmentYear: string; // e.g. 2024-2025
  category: PropertyCategory;
  zoneId: string;
  zoneName: string;
  builtUpArea: number;
  appliedRatePerSqFt: number;
  baseTax: number;
  penalty: number;
  discount: number;
  totalTax: number;
  amountPaid: number;
  outstandingBalance: number;
  status: AssessmentStatus;
  dueDate: string; // YYYY-MM-DD
  generatedDate: string;
  approvedDate?: string;
  approvedBy?: string;
  isReassessed?: boolean;
  previousAssessmentId?: string;
  notes?: string;
}

export type PaymentMethod = 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING';
export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';

export interface Payment {
  id: string;
  transactionId: string; // e.g. TXN-2024-98421
  receiptNumber: string; // e.g. RCP-2024-0042
  assessmentId: string;
  assessmentNumber: string;
  propertyId: string;
  propertyNumber: string;
  payerId: string;
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  amountPaid: number;
  totalAssessment: number;
  remainingBalance: number;
  paymentDate: string; // ISO String
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  gatewayRef: string;
  assessmentYear: string;
  bankOrVpaDetails?: string;
  remarks?: string;
}

export type GrievanceCategory =
  | 'INCORRECT_CALCULATION'
  | 'PROPERTY_INFO_ISSUE'
  | 'PAYMENT_ISSUE'
  | 'OWNERSHIP_ISSUE'
  | 'ASSESSMENT_ISSUE'
  | 'OTHER';

export type GrievancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type GrievanceStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'
  | 'REOPENED';

export interface GrievanceTimelineEvent {
  status: GrievanceStatus;
  timestamp: string;
  updatedBy: string;
  comment: string;
  internalOnly?: boolean;
}

export interface Grievance {
  id: string;
  grievanceNumber: string; // e.g. GRV-2024-0012
  propertyId: string;
  propertyNumber: string;
  citizenId: string;
  citizenName: string;
  citizenEmail: string;
  citizenPhone: string;
  subject: string;
  category: GrievanceCategory;
  description: string;
  priority: GrievancePriority;
  submissionDate: string;
  status: GrievanceStatus;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  internalRemarks?: string;
  resolutionComments?: string;
  resolvedDate?: string;
  timeline: GrievanceTimelineEvent[];
}

export type ReassessmentStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface ReassessmentRequest {
  id: string;
  requestNumber: string; // e.g. RASM-2024-0008
  assessmentId: string;
  assessmentNumber: string;
  propertyId: string;
  propertyNumber: string;
  citizenId: string;
  citizenName: string;
  currentBuiltUpArea: number;
  requestedBuiltUpArea?: number;
  currentCategory: PropertyCategory;
  requestedCategory?: PropertyCategory;
  currentTotalTax: number;
  reason: string;
  documentReference: string;
  submissionDate: string;
  status: ReassessmentStatus;
  reviewedByOfficerId?: string;
  reviewedByOfficerName?: string;
  officerComments?: string;
  reviewDate?: string;
  revisedAssessmentId?: string;
}

export type NotificationCategory =
  | 'PROPERTY'
  | 'ASSESSMENT'
  | 'PAYMENT'
  | 'GRIEVANCE'
  | 'REASSESSMENT'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  isRead: boolean;
  timestamp: string;
  linkUrl?: string;
  priority?: 'NORMAL' | 'HIGH' | 'CRITICAL';
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  recordType: 'PROPERTY' | 'ASSESSMENT' | 'PAYMENT' | 'GRIEVANCE' | 'REASSESSMENT' | 'TAX_RATE' | 'USER' | 'ZONE' | 'SYSTEM' | 'RECOVERY' | 'COMPLIANCE';
  recordId: string;
  previousStatus?: string;
  newStatus?: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ==================== CIVICTAX 7.0 SMART CITY EXTENSIONS ====================

// 1. Revenue Recovery Case Model
export type RecoveryCaseStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'CONTACT_ATTEMPTED'
  | 'FOLLOW_UP_REQUIRED'
  | 'PARTIALLY_RECOVERED'
  | 'FULLY_RECOVERED'
  | 'CLOSED';

export type AgingBucket = 'NOT_DUE' | '1_30_DAYS' | '31_60_DAYS' | '61_90_DAYS' | 'OVER_90_DAYS';

export interface RecoveryCase {
  id: string;
  caseNumber: string; // e.g. REC-2024-001
  assessmentId: string;
  assessmentNumber: string;
  propertyId: string;
  propertyNumber: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  zoneId: string;
  zoneName: string;
  totalTax: number;
  outstandingAmount: number;
  dueDate: string;
  overdueDays: number;
  agingBucket: AgingBucket;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedOfficerId: string;
  assignedOfficerName: string;
  status: RecoveryCaseStatus;
  followUpDate?: string;
  officerNotes?: string;
  lastActionDate: string;
  simulatedCommunications: {
    id: string;
    type: 'SMS_NOTICE' | 'EMAIL_DEMAND' | 'PHYSICAL_NOTICE';
    sentDate: string;
    details: string;
  }[];
}

// 2. Risk and Compliance Alert Model
export type ComplianceSeverity = 'INFORMATIONAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ComplianceStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';

export interface ComplianceAlert {
  id: string;
  alertId: string; // e.g. CMP-2024-01
  recordReference: string; // e.g. CT-PROP-2024-001
  category: 'PROPERTY_INTEGRITY' | 'ASSESSMENT_MISMATCH' | 'PAYMENT_ANOMALY' | 'SLA_BREACH';
  severity: ComplianceSeverity;
  detectionRule: string;
  explanation: string;
  detectionTimestamp: string;
  recommendedAction: string;
  status: ComplianceStatus;
  investigationNotes?: string;
  reviewedBy?: string;
  reviewedDate?: string;
}

// 3. Municipal Operations Task Model
export interface MunicipalTask {
  id: string;
  taskNumber: string; // e.g. TSK-2024-001
  title: string;
  category: 'PROPERTY_VERIFICATION' | 'ASSESSMENT_REVIEW' | 'GRIEVANCE_PROCESSING' | 'REASSESSMENT_REVIEW' | 'RECOVERY_CASE';
  relatedRecordId: string;
  relatedRecordNumber: string;
  zoneId: string;
  zoneName: string;
  assignedOfficerId: string;
  assignedOfficerName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  startDate: string;
  dueDate: string;
  completedDate?: string;
  slaTargetHours: number;
  isBreached: boolean;
  remarks?: string;
}

// 4. Municipal Revenue Forecasting Models
export type ForecastModelType = 'MOVING_AVERAGE' | 'WEIGHTED_MOVING_AVERAGE' | 'LINEAR_TREND';
export type ForecastHorizon = 'NEXT_MONTH' | 'NEXT_QUARTER' | 'NEXT_HALF_YEAR' | 'NEXT_FINANCIAL_YEAR';

export interface ForecastPoint {
  period: string; // e.g. "Q1 2025" or "Jul 2025"
  historicalActual?: number;
  forecastedRevenue: number;
  lowerConfidenceBound: number;
  upperConfidenceBound: number;
}

export interface RevenueForecastResult {
  modelType: ForecastModelType;
  horizon: ForecastHorizon;
  historicalObservationsCount: number;
  forecastPoints: ForecastPoint[];
  assumptions: string[];
  limitations: string;
  generatedDate: string;
}

// 5. Public Transparency Aggregation
export interface PublicTransparencyMetrics {
  totalRegisteredProperties: number;
  aggregateAssessedTax: number;
  aggregateCollections: number;
  aggregateOutstanding: number;
  overallCollectionEfficiency: number;
  totalGrievancesLogged: number;
  totalGrievancesResolved: number;
  resolutionPercentage: number;
  zonePerformance: {
    zoneName: string;
    propertiesCount: number;
    assessed: number;
    collected: number;
    efficiency: number;
  }[];
  monthlyCollectionTrends: {
    month: string;
    amount: number;
  }[];
  reportingPeriod: string;
  lastUpdated: string;
}

// KPI and Dashboard Statistics Interfaces
export interface CitizenDashboardStats {
  totalProperties: number;
  verifiedProperties: number;
  pendingVerification: number;
  totalTaxDue: number;
  totalTaxPaid: number;
  upcomingDueCount: number;
}

export interface OfficerDashboardStats {
  totalAssignedProperties: number;
  pendingVerification: number;
  approvedProperties: number;
  pendingAssessments: number;
  pendingReassessments: number;
  openGrievances: number;
}

export interface AdminDashboardStats {
  totalRegisteredProperties: number;
  verifiedProperties: number;
  pendingVerification: number;
  totalTaxAssessed: number;
  totalRevenueCollected: number;
  outstandingTax: number;
  totalGrievances: number;
  pendingReassessments: number;
}

// Filter Options
export interface PropertyFilterOptions {
  search?: string;
  category?: PropertyCategory | 'ALL';
  zoneId?: string | 'ALL';
  verificationStatus?: PropertyVerificationStatus | 'ALL';
  ownerId?: string;
}

export interface AssessmentFilterOptions {
  search?: string;
  status?: AssessmentStatus | 'ALL';
  year?: string | 'ALL';
  category?: PropertyCategory | 'ALL';
  ownerId?: string;
}

export interface PaymentFilterOptions {
  search?: string;
  method?: PaymentMethod | 'ALL';
  status?: PaymentStatus | 'ALL';
  startDate?: string;
  endDate?: string;
  payerId?: string;
}

export interface GrievanceFilterOptions {
  search?: string;
  status?: GrievanceStatus | 'ALL';
  priority?: GrievancePriority | 'ALL';
  category?: GrievanceCategory | 'ALL';
  citizenId?: string;
  officerId?: string;
  filterView?: 'ALL' | 'NEW' | 'HIGH_PRIORITY' | 'OVERDUE' | 'ASSIGNED_TO_ME' | 'RESOLVED';
}

export interface ReportFilterOptions {
  startDate?: string;
  endDate?: string;
  zoneId?: string | 'ALL';
  category?: PropertyCategory | 'ALL';
  status?: string | 'ALL';
}

export interface GlobalSearchResultItem {
  id: string;
  category: 'PROPERTY' | 'ASSESSMENT' | 'PAYMENT' | 'GRIEVANCE' | 'REASSESSMENT';
  title: string;
  subtitle: string;
  status: string;
  linkUrl: string;
  date: string;
}
