import { RecoveryCase, AgingBucket, TaxAssessment, Property } from '../../types';
import { StorageService } from '../../services/storageService';

export class LocalRecoveryService {
  // Calculate aging days from assessment due date
  public static calculateAgingBucket(dueDateStr: string): { overdueDays: number; bucket: AgingBucket } {
    const due = new Date(dueDateStr).getTime();
    const now = Date.now();
    const diffDays = Math.floor((now - due) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return { overdueDays: 0, bucket: 'NOT_DUE' };
    if (diffDays <= 30) return { overdueDays: diffDays, bucket: '1_30_DAYS' };
    if (diffDays <= 60) return { overdueDays: diffDays, bucket: '31_60_DAYS' };
    if (diffDays <= 90) return { overdueDays: diffDays, bucket: '61_90_DAYS' };
    return { overdueDays: diffDays, bucket: 'OVER_90_DAYS' };
  }

  // Generate automated recovery cases from overdue assessments
  public static syncRecoveryCases(): RecoveryCase[] {
    const assessments = StorageService.getAssessments();
    const properties = StorageService.getProperties();
    const existingCases = this.getRecoveryCases();

    const updatedCases: RecoveryCase[] = [...existingCases];

    for (const asm of assessments) {
      if (asm.outstandingBalance > 0) {
        const { overdueDays, bucket } = this.calculateAgingBucket(asm.dueDate);

        // Only create/update case if overdue or partially paid
        if (overdueDays > 0 || asm.status === 'PARTIALLY_PAID') {
          const prop = properties.find((p: Property) => p.id === asm.propertyId);
          const caseIndex = updatedCases.findIndex((c) => c.assessmentId === asm.id);

          const priority =
            asm.outstandingBalance > 50000 || overdueDays > 60
              ? 'CRITICAL'
              : asm.outstandingBalance > 20000 || overdueDays > 30
              ? 'HIGH'
              : 'MEDIUM';

          if (caseIndex !== -1) {
            // Update existing case
            updatedCases[caseIndex] = {
              ...updatedCases[caseIndex],
              outstandingAmount: asm.outstandingBalance,
              overdueDays,
              agingBucket: bucket,
              status: asm.outstandingBalance === 0 ? 'FULLY_RECOVERED' : updatedCases[caseIndex].status,
              lastActionDate: new Date().toISOString(),
            };
          } else {
            // Create new recovery case
            const newCase: RecoveryCase = {
              id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              caseNumber: `REC-${new Date().getFullYear()}-${String(updatedCases.length + 1).padStart(3, '0')}`,
              assessmentId: asm.id,
              assessmentNumber: asm.assessmentNumber,
              propertyId: asm.propertyId,
              propertyNumber: asm.propertyNumber,
              ownerName: asm.ownerName,
              ownerPhone: prop?.ownerPhone || '+91 98765 43210',
              ownerEmail: asm.ownerEmail,
              zoneId: asm.zoneId,
              zoneName: asm.zoneName,
              totalTax: asm.totalTax,
              outstandingAmount: asm.outstandingBalance,
              dueDate: asm.dueDate,
              overdueDays,
              agingBucket: bucket,
              priority,
              assignedOfficerId: 'usr-officer-01',
              assignedOfficerName: 'Priya V. Sundaram',
              status: 'NEW',
              lastActionDate: new Date().toISOString(),
              simulatedCommunications: [
                {
                  id: `comm-1`,
                  type: 'EMAIL_DEMAND',
                  sentDate: new Date().toISOString(),
                  details: `Automated demand notice dispatched for outstanding dues of ₹${asm.outstandingBalance.toLocaleString('en-IN')}.`,
                },
              ],
            };
            updatedCases.push(newCase);
          }
        }
      }
    }

    localStorage.setItem('civictax_recovery_cases', JSON.stringify(updatedCases));
    return updatedCases;
  }

  public static getRecoveryCases(): RecoveryCase[] {
    try {
      const raw = localStorage.getItem('civictax_recovery_cases');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static updateCase(id: string, updates: Partial<RecoveryCase>): RecoveryCase {
    const cases = this.getRecoveryCases();
    const idx = cases.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Recovery case not found');

    const updated = {
      ...cases[idx],
      ...updates,
      lastActionDate: new Date().toISOString(),
    };
    cases[idx] = updated;
    localStorage.setItem('civictax_recovery_cases', JSON.stringify(cases));

    StorageService.recordAuditLog({
      actorId: 'usr-officer-01',
      actorName: 'Recovery Officer',
      actorRole: 'OFFICER',
      action: 'UPDATE_RECOVERY_CASE',
      recordType: 'RECOVERY',
      recordId: id,
      newStatus: updated.status,
      description: `Recovery case ${updated.caseNumber} updated: status ${updated.status}, notes: ${updated.officerNotes || 'None'}.`,
    });

    return updated;
  }
}
