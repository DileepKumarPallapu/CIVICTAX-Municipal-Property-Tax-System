import { TaxAssessment, AssessmentFilterOptions } from '../../types';
import { IAssessmentService } from '../interfaces';
import { StorageService } from '../storageService';
import { generateAssessmentNumber } from '../../utils';
import { AssessmentRules } from '../businessRules';

export class LocalAssessmentService implements IAssessmentService {
  public async getAssessments(filter?: AssessmentFilterOptions): Promise<TaxAssessment[]> {
    let assessments = StorageService.getAssessments();

    if (!filter) return assessments;

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      assessments = assessments.filter(
        (a) =>
          a.assessmentNumber.toLowerCase().includes(q) ||
          a.propertyNumber.toLowerCase().includes(q) ||
          a.ownerName.toLowerCase().includes(q) ||
          a.assessmentYear.toLowerCase().includes(q)
      );
    }

    if (filter.status && filter.status !== 'ALL') {
      assessments = assessments.filter((a) => a.status === filter.status);
    }

    if (filter.year && filter.year !== 'ALL') {
      assessments = assessments.filter((a) => a.assessmentYear === filter.year);
    }

    if (filter.category && filter.category !== 'ALL') {
      assessments = assessments.filter((a) => a.category === filter.category);
    }

    if (filter.ownerId) {
      assessments = assessments.filter((a) => a.ownerId === filter.ownerId);
    }

    return assessments;
  }

  public async getAssessmentById(id: string): Promise<TaxAssessment | null> {
    const assessments = StorageService.getAssessments();
    return assessments.find((a) => a.id === id) || null;
  }

  public async getAssessmentsByPropertyId(propertyId: string): Promise<TaxAssessment[]> {
    const assessments = StorageService.getAssessments();
    return assessments.filter((a) => a.propertyId === propertyId);
  }

  public async generateAssessment(
    propertyId: string,
    assessmentYear: string,
    penalty: number = 0,
    discount: number = 0,
    notes?: string
  ): Promise<TaxAssessment> {
    const properties = StorageService.getProperties();
    const property = properties.find((p) => p.id === propertyId);

    if (!property) {
      throw new Error(`Property with id ${propertyId} not found.`);
    }

    // 1. Find active tax rate for this category and zone
    const taxRates = StorageService.getTaxRates();
    const activeRate =
      taxRates.find((r) => r.category === property.category && r.zoneId === property.zoneId && r.isActive) ||
      taxRates.find((r) => r.category === property.category && r.isActive);

    // 2. Validate Business Rules
    AssessmentRules.validateGeneration(property, activeRate);

    const ratePerSqFt = activeRate!.ratePerSqFt;
    const calc = AssessmentRules.calculateSafeTax(property.builtUpArea, ratePerSqFt, penalty, discount);

    const assessments = StorageService.getAssessments();
    const id = `asm-${Date.now()}`;
    const assessmentNumber = generateAssessmentNumber(assessments.length);
    const now = new Date().toISOString();

    // Default due date: Dec 31 of current financial year
    const currentYear = new Date().getFullYear();
    const dueDate = `${currentYear}-12-31`;

    const newAssessment: TaxAssessment = {
      id,
      assessmentNumber,
      propertyId: property.id,
      propertyNumber: property.propertyNumber,
      ownerId: property.ownerId,
      ownerName: property.ownerName,
      ownerEmail: property.ownerEmail,
      assessmentYear,
      category: property.category,
      zoneId: property.zoneId,
      zoneName: property.zoneName,
      builtUpArea: property.builtUpArea,
      appliedRatePerSqFt: ratePerSqFt,
      baseTax: calc.baseTax,
      penalty: calc.penalty,
      discount: calc.discount,
      totalTax: calc.totalTax,
      amountPaid: 0,
      outstandingBalance: calc.totalTax,
      status: 'APPROVED',
      dueDate,
      generatedDate: now,
      approvedDate: now,
      approvedBy: 'Municipal Revenue Officer',
      notes: notes || `Annual assessment generated for ${property.category} parcel at ₹${ratePerSqFt}/sq ft.`,
    };

    StorageService.setAssessments([newAssessment, ...assessments]);

    // Notification
    const notifications = StorageService.getNotifications();
    StorageService.setNotifications([
      {
        id: `notif-${Date.now()}`,
        userId: property.ownerId,
        title: 'New Tax Assessment Generated',
        message: `Assessment ${assessmentNumber} for FY ${assessmentYear} (Amount: ₹${calc.totalTax.toLocaleString('en-IN')}) is now available for review and online payment.`,
        category: 'ASSESSMENT',
        isRead: false,
        timestamp: now,
        linkUrl: `/citizen/assessments`,
      },
      ...notifications,
    ]);

    // Audit Log
    StorageService.recordAuditLog({
      actorId: 'usr-officer-01',
      actorName: 'Municipal Revenue Inspector',
      actorRole: 'OFFICER',
      action: 'GENERATE_ASSESSMENT',
      recordType: 'ASSESSMENT',
      recordId: id,
      newStatus: 'APPROVED',
      description: `Generated assessment ${assessmentNumber} for ${property.propertyNumber} (Base: ₹${calc.baseTax}, Total: ₹${calc.totalTax}).`,
    });

    return newAssessment;
  }

  public async updateAssessmentStatus(
    id: string,
    status: TaxAssessment['status'],
    approvedBy?: string
  ): Promise<TaxAssessment> {
    const assessments = StorageService.getAssessments();
    const index = assessments.findIndex((a) => a.id === id);

    if (index === -1) {
      throw new Error(`Assessment with id ${id} not found.`);
    }

    const existing = assessments[index];
    const now = new Date().toISOString();

    const updated: TaxAssessment = {
      ...existing,
      status,
      approvedBy: approvedBy || existing.approvedBy,
      approvedDate: status === 'APPROVED' ? now : existing.approvedDate,
    };

    assessments[index] = updated;
    StorageService.setAssessments([...assessments]);

    // Audit Log
    StorageService.recordAuditLog({
      actorId: 'usr-officer-01',
      actorName: approvedBy || 'Officer',
      actorRole: 'OFFICER',
      action: `ASSESSMENT_STATUS_${status}`,
      recordType: 'ASSESSMENT',
      recordId: id,
      previousStatus: existing.status,
      newStatus: status,
      description: `Assessment ${existing.assessmentNumber} status updated to ${status}.`,
    });

    return updated;
  }

  public async calculateOutstandingBalance(assessmentId: string): Promise<number> {
    const assessment = await this.getAssessmentById(assessmentId);
    if (!assessment) return 0;
    return Math.max(0, assessment.totalTax - assessment.amountPaid);
  }
}
