// server/src/repositories/ICivicTaxRepository.ts
import { IProperty, ITaxAssessment, ITaxPayment, IGrievance } from './types.js';

export interface ICivicTaxRepository {
  // Properties
  listProperties(filter?: { category?: string; zone?: string; status?: string }): Promise<IProperty[]>;
  getPropertyById(id: string): Promise<IProperty | null>;
  createProperty(property: Omit<IProperty, 'id' | 'registrationDate'>): Promise<IProperty>;
  updatePropertyStatus(id: string, status: IProperty['verificationStatus']): Promise<IProperty>;

  // Assessments
  listAssessments(propertyId?: string): Promise<ITaxAssessment[]>;
  getAssessmentById(id: string): Promise<ITaxAssessment | null>;
  createAssessment(assessment: Omit<ITaxAssessment, 'id'>): Promise<ITaxAssessment>;

  // Payments
  listPayments(assessmentId?: string): Promise<ITaxPayment[]>;
  createPayment(payment: Omit<ITaxPayment, 'id' | 'receiptNumber'>): Promise<{ payment: ITaxPayment; assessment: ITaxAssessment }>;

  // Grievances
  listGrievances(citizenId?: string): Promise<IGrievance[]>;
  createGrievance(grievance: Omit<IGrievance, 'id' | 'grievanceNumber' | 'createdAt'>): Promise<IGrievance>;
  resolveGrievance(id: string, comments: string): Promise<IGrievance>;
}
