import {
  User,
  MunicipalZone,
  Property,
  TaxRate,
  TaxAssessment,
  Payment,
  Grievance,
  ReassessmentRequest,
  Notification,
  CitizenDashboardStats,
  OfficerDashboardStats,
  AdminDashboardStats,
  PropertyFilterOptions,
  AssessmentFilterOptions,
  PaymentFilterOptions,
  GrievanceFilterOptions,
  ReportFilterOptions,
  PropertyVerificationStatus,
} from '../../types';

export interface IUserService {
  login(email: string, password?: string): Promise<User>;
  getCurrentUser(): Promise<User | null>;
  logout(): Promise<void>;
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  createUser(userData: Partial<User>): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
}

export interface IPropertyService {
  getProperties(filter?: PropertyFilterOptions): Promise<Property[]>;
  getPropertyById(id: string): Promise<Property | null>;
  getPropertyByNumber(propertyNumber: string): Promise<Property | null>;
  createProperty(data: Omit<Property, 'id' | 'propertyNumber' | 'registrationDate' | 'updatedAt' | 'verificationStatus'>): Promise<Property>;
  updateProperty(id: string, data: Partial<Property>): Promise<Property>;
  verifyProperty(
    id: string,
    status: PropertyVerificationStatus,
    officerId: string,
    officerName: string,
    comments?: string
  ): Promise<Property>;
  deleteProperty(id: string): Promise<boolean>;
}

export interface ITaxRateService {
  getTaxRates(): Promise<TaxRate[]>;
  getTaxRateById(id: string): Promise<TaxRate | null>;
  getActiveRateForCategory(category: Property['category']): Promise<number>;
  createTaxRate(data: Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxRate>;
  updateTaxRate(id: string, data: Partial<TaxRate>): Promise<TaxRate>;
  deactivateTaxRate(id: string): Promise<TaxRate>;
}

export interface IAssessmentService {
  getAssessments(filter?: AssessmentFilterOptions): Promise<TaxAssessment[]>;
  getAssessmentById(id: string): Promise<TaxAssessment | null>;
  getAssessmentsByPropertyId(propertyId: string): Promise<TaxAssessment[]>;
  generateAssessment(propertyId: string, assessmentYear: string, penalty?: number, discount?: number, notes?: string): Promise<TaxAssessment>;
  updateAssessmentStatus(id: string, status: TaxAssessment['status'], approvedBy?: string): Promise<TaxAssessment>;
  calculateOutstandingBalance(assessmentId: string): Promise<number>;
}

export interface IPaymentService {
  getPayments(filter?: PaymentFilterOptions): Promise<Payment[]>;
  getPaymentById(id: string): Promise<Payment | null>;
  getPaymentsByAssessmentId(assessmentId: string): Promise<Payment[]>;
  getPaymentsByPropertyId(propertyId: string): Promise<Payment[]>;
  processSimulatedPayment(data: {
    assessmentId: string;
    payerId: string;
    payerName: string;
    payerEmail: string;
    payerPhone: string;
    amountPaid: number;
    paymentMethod: Payment['paymentMethod'];
    bankOrVpaDetails?: string;
  }): Promise<Payment>;
}

export interface IGrievanceService {
  getGrievances(filter?: GrievanceFilterOptions): Promise<Grievance[]>;
  getGrievanceById(id: string): Promise<Grievance | null>;
  createGrievance(data: Omit<Grievance, 'id' | 'grievanceNumber' | 'submissionDate' | 'status' | 'timeline'>): Promise<Grievance>;
  assignOfficer(id: string, officerId: string, officerName: string): Promise<Grievance>;
  updateGrievanceStatus(
    id: string,
    status: Grievance['status'],
    updatedBy: string,
    comment: string,
    resolutionComments?: string
  ): Promise<Grievance>;
}

export interface IReassessmentService {
  getReassessments(): Promise<ReassessmentRequest[]>;
  getReassessmentById(id: string): Promise<ReassessmentRequest | null>;
  createReassessment(data: Omit<ReassessmentRequest, 'id' | 'requestNumber' | 'submissionDate' | 'status'>): Promise<ReassessmentRequest>;
  reviewReassessment(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    officerId: string,
    officerName: string,
    comments: string,
    createRevisedAssessment?: boolean
  ): Promise<ReassessmentRequest>;
}

export interface INotificationService {
  getNotifications(userId?: string, userRole?: string): Promise<Notification[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId?: string): Promise<void>;
  sendNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): Promise<Notification>;
  deleteNotification(id: string): Promise<boolean>;
}

export interface IDashboardService {
  getCitizenStats(citizenId: string): Promise<CitizenDashboardStats>;
  getOfficerStats(officerId: string, zoneId?: string): Promise<OfficerDashboardStats>;
  getAdminStats(): Promise<AdminDashboardStats>;
  getRevenueAnalytics(filter?: ReportFilterOptions): Promise<{
    monthlyRevenue: Array<{ month: string; amount: number; transactions: number }>;
    zoneRevenue: Array<{ zone: string; amount: number; percentage: number }>;
    categoryRevenue: Array<{ category: string; amount: number }>;
    paymentMethodDistribution: Array<{ method: string; count: number; amount: number }>;
  }>;
}

export interface IZoneService {
  getZones(): Promise<MunicipalZone[]>;
  getZoneById(id: string): Promise<MunicipalZone | null>;
  createZone(data: Omit<MunicipalZone, 'id'>): Promise<MunicipalZone>;
  updateZone(id: string, data: Partial<MunicipalZone>): Promise<MunicipalZone>;
}
