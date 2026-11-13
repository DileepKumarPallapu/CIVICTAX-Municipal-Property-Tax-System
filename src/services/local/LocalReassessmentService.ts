import { ReassessmentRequest, ReassessmentStatus, TaxAssessment } from '../../types';
import { IReassessmentService } from '../interfaces';
import { StorageService } from '../storageService';
import { generateReassessmentNumber } from '../../utils';

export class LocalReassessmentService implements IReassessmentService {
  public async getReassessments(citizenId?: string): Promise<ReassessmentRequest[]> {
    let requests = StorageService.getReassessments();
    if (citizenId) {
      requests = requests.filter((r) => r.citizenId === citizenId);
    }
    return requests;
  }

  public async getReassessmentById(id: string): Promise<ReassessmentRequest | null> {
    const requests = StorageService.getReassessments();
    return requests.find((r) => r.id === id) || null;
  }

  public async createReassessment(
    data: Omit<ReassessmentRequest, 'id' | 'requestNumber' | 'submissionDate' | 'status'>
  ): Promise<ReassessmentRequest> {
    return this.submitReassessment(data);
  }

  public async submitReassessment(
    data: Omit<ReassessmentRequest, 'id' | 'requestNumber' | 'submissionDate' | 'status'>
  ): Promise<ReassessmentRequest> {
    const requests = StorageService.getReassessments();
    const id = `rasm-${Date.now()}`;
    const requestNumber = generateReassessmentNumber();
    const now = new Date().toISOString();

    const newRequest: ReassessmentRequest = {
      ...data,
      id,
      requestNumber,
      submissionDate: now,
      status: 'SUBMITTED',
    };

    StorageService.setReassessments([newRequest, ...requests]);

    // Notification
    const notifications = StorageService.getNotifications();
    StorageService.setNotifications([
      {
        id: `notif-${Date.now()}`,
        userId: data.citizenId,
        title: 'Reassessment Dispute Lodged',
        message: `Dispute ${requestNumber} for Assessment ${data.assessmentNumber} submitted for municipal valuation review.`,
        category: 'REASSESSMENT',
        isRead: false,
        timestamp: now,
        linkUrl: `/citizen/reassessments`,
      },
      ...notifications,
    ]);

    // Audit Log
    StorageService.recordAuditLog({
      actorId: data.citizenId,
      actorName: data.citizenName,
      actorRole: 'CITIZEN',
      action: 'SUBMIT_REASSESSMENT',
      recordType: 'REASSESSMENT',
      recordId: id,
      newStatus: 'SUBMITTED',
      description: `Citizen submitted reassessment claim ${requestNumber} on assessment ${data.assessmentNumber} (Claimed area: ${data.requestedBuiltUpArea || 'N/A'}).`,
    });

    return newRequest;
  }

  public async reviewReassessment(
    id: string,
    status: ReassessmentStatus,
    officerId: string,
    officerName: string,
    comments?: string
  ): Promise<ReassessmentRequest> {
    const requests = StorageService.getReassessments();
    const index = requests.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new Error(`Reassessment request with id ${id} not found.`);
    }

    const existing = requests[index];
    const now = new Date().toISOString();
    let revisedAssessmentId: string | undefined = undefined;

    // If APPROVED, generate a traceable revised assessment rather than silently modifying historical records
    if (status === 'APPROVED') {
      const assessments = StorageService.getAssessments();
      const original = assessments.find((a) => a.id === existing.assessmentId);

      if (original) {
        const revisedArea = existing.requestedBuiltUpArea || original.builtUpArea;
        const revisedBaseTax = Math.round(revisedArea * original.appliedRatePerSqFt);
        const revisedTotalTax = Math.max(0, revisedBaseTax + original.penalty - original.discount);
        const remainingBalance = Math.max(0, revisedTotalTax - original.amountPaid);

        const newAssessmentId = `asm-rev-${Date.now()}`;
        revisedAssessmentId = newAssessmentId;

        const revisedAssessment: TaxAssessment = {
          ...original,
          id: newAssessmentId,
          assessmentNumber: `${original.assessmentNumber}-R`,
          builtUpArea: revisedArea,
          baseTax: revisedBaseTax,
          totalTax: revisedTotalTax,
          outstandingBalance: remainingBalance,
          status: remainingBalance === 0 ? 'PAID' : 'APPROVED',
          isReassessed: true,
          previousAssessmentId: original.id,
          notes: `Traceable revised assessment generated following dispute ${existing.requestNumber}. Approved by ${officerName}.`,
        };

        StorageService.setAssessments([revisedAssessment, ...assessments]);
      }
    }

    const updated: ReassessmentRequest = {
      ...existing,
      status,
      reviewedByOfficerId: officerId,
      reviewedByOfficerName: officerName,
      officerComments: comments,
      reviewDate: now,
      revisedAssessmentId,
    };

    requests[index] = updated;
    StorageService.setReassessments([...requests]);

    // Citizen Notification
    const notifications = StorageService.getNotifications();
    StorageService.setNotifications([
      {
        id: `notif-${Date.now()}`,
        userId: existing.citizenId,
        title: `Reassessment Dispute ${status}`,
        message:
          status === 'APPROVED'
            ? `Your dispute ${existing.requestNumber} was APPROVED by Officer ${officerName}. A revised assessment has been issued.`
            : `Your dispute ${existing.requestNumber} was reviewed: ${comments || 'No adjustment approved.'}`,
        category: 'REASSESSMENT',
        isRead: false,
        timestamp: now,
        linkUrl: `/citizen/reassessments`,
      },
      ...notifications,
    ]);

    // Audit Log
    StorageService.recordAuditLog({
      actorId: officerId,
      actorName: officerName,
      actorRole: 'OFFICER',
      action: `REVIEW_REASSESSMENT_${status}`,
      recordType: 'REASSESSMENT',
      recordId: id,
      previousStatus: existing.status,
      newStatus: status,
      description: `Dispute ${existing.requestNumber} decided as ${status}. Comments: ${comments || 'None'}.`,
    });

    return updated;
  }
}
