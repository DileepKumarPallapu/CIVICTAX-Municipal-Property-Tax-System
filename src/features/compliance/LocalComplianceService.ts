import { ComplianceAlert, ComplianceSeverity, Payment } from '../../types';
import { StorageService } from '../../services/storageService';

export class LocalComplianceService {
  // Evaluates application records against explainable rule checks
  public static runComplianceScan(): ComplianceAlert[] {
    const alerts: ComplianceAlert[] = [];
    const properties = StorageService.getProperties();
    const assessments = StorageService.getAssessments();
    const payments = StorageService.getPayments();
    const now = new Date().toISOString();

    // 1. Property Rule Check: Missing document deed reference
    for (const p of properties) {
      if (!p.documentReference || p.documentReference.trim().length < 4) {
        alerts.push({
          id: `cmp-prop-${p.id}`,
          alertId: `CMP-${p.propertyNumber.replace('CT-PROP-', '')}-DEED`,
          recordReference: p.propertyNumber,
          category: 'PROPERTY_INTEGRITY',
          severity: 'HIGH',
          detectionRule: 'RULE_PROP_DEED_CHECK',
          explanation: `Property ${p.propertyNumber} lacks mandatory title deed registration reference.`,
          detectionTimestamp: now,
          recommendedAction: 'Request citizen title deed resubmission before approving verification.',
          status: 'OPEN',
        });
      }
    }

    // 2. Assessment Rule Check: Discrepancy between base tax and area * rate
    for (const a of assessments) {
      const calculatedExpected = Math.round(a.builtUpArea * a.appliedRatePerSqFt);
      if (Math.abs(calculatedExpected - a.baseTax) > 5) {
        alerts.push({
          id: `cmp-asm-${a.id}`,
          alertId: `CMP-${a.assessmentNumber.replace('CT-ASM-', '')}-MATH`,
          recordReference: a.assessmentNumber,
          category: 'ASSESSMENT_MISMATCH',
          severity: 'CRITICAL',
          detectionRule: 'RULE_BASE_TAX_CONSISTENCY',
          explanation: `Assessment ${a.assessmentNumber} base tax (₹${a.baseTax}) differs from area × rate (₹${calculatedExpected}).`,
          detectionTimestamp: now,
          recommendedAction: 'Audit historical rate gazette and issue revised assessment bill.',
          status: 'OPEN',
        });
      }
    }

    // 3. Payment Rule Check: Total payments exceeding assessment total tax
    for (const a of assessments) {
      const relatedPayments = payments.filter((pay: Payment) => pay.assessmentId === a.id && pay.paymentStatus === 'SUCCESS');
      const sumPaid = relatedPayments.reduce((acc: number, curr: Payment) => acc + curr.amountPaid, 0);

      if (sumPaid > a.totalTax) {
        alerts.push({
          id: `cmp-pay-${a.id}`,
          alertId: `CMP-${a.assessmentNumber.replace('CT-ASM-', '')}-OVERPAY`,
          recordReference: a.assessmentNumber,
          category: 'PAYMENT_ANOMALY',
          severity: 'CRITICAL',
          detectionRule: 'RULE_OVERPAYMENT_DETECTION',
          explanation: `Total successful payments (₹${sumPaid}) exceed assessed total tax (₹${a.totalTax}).`,
          detectionTimestamp: now,
          recommendedAction: 'Initiate municipal treasury credit note or refund workflow.',
          status: 'OPEN',
        });
      }
    }

    // Save and merge with existing acknowledgements
    const existing = this.getAlerts();
    const merged = alerts.map((newAlert) => {
      const found = existing.find((e) => e.alertId === newAlert.alertId);
      return found ? found : newAlert;
    });

    // Also include any previously acknowledged alerts that are still tracked
    for (const ex of existing) {
      if (!merged.some((m) => m.alertId === ex.alertId)) {
        merged.push(ex);
      }
    }

    // If perfectly clean demo data, synthesize demonstration audit samples so officers can test compliance triage
    if (merged.length === 0) {
      merged.push(
        {
          id: 'cmp-demo-01',
          alertId: 'CMP-DEMO-001-DEED',
          recordReference: 'CT-PROP-DEMO-UNREG',
          category: 'PROPERTY_INTEGRITY',
          severity: 'HIGH',
          detectionRule: 'RULE_PROP_DEED_CHECK',
          explanation: 'Demonstration rule alert: Sample deed index verification pending registrar confirmation.',
          detectionTimestamp: now,
          recommendedAction: 'Request citizen title deed resubmission before approving verification.',
          status: 'OPEN',
        },
        {
          id: 'cmp-demo-02',
          alertId: 'CMP-DEMO-002-MATH',
          recordReference: 'CT-ASM-DEMO-RATE',
          category: 'ASSESSMENT_MISMATCH',
          severity: 'CRITICAL',
          detectionRule: 'RULE_BASE_TAX_CONSISTENCY',
          explanation: 'Demonstration rule alert: Historic gazette rate deviation detected on legacy assessment.',
          detectionTimestamp: now,
          recommendedAction: 'Audit historical rate gazette and issue revised assessment bill.',
          status: 'OPEN',
        }
      );
    }

    localStorage.setItem('civictax_compliance_alerts', JSON.stringify(merged));
    return merged;
  }

  public static getAlerts(): ComplianceAlert[] {
    try {
      const raw = localStorage.getItem('civictax_compliance_alerts');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static updateAlertStatus(
    alertId: string,
    status: ComplianceAlert['status'],
    officerNotes?: string
  ): ComplianceAlert {
    const alerts = this.getAlerts();
    const idx = alerts.findIndex((a) => a.alertId === alertId);
    if (idx === -1) throw new Error('Alert not found');

    const updated = {
      ...alerts[idx],
      status,
      investigationNotes: officerNotes || alerts[idx].investigationNotes,
      reviewedBy: 'Municipal Compliance Auditor',
      reviewedDate: new Date().toISOString(),
    };
    alerts[idx] = updated;
    localStorage.setItem('civictax_compliance_alerts', JSON.stringify(alerts));

    StorageService.recordAuditLog({
      actorId: 'usr-admin-01',
      actorName: 'Compliance Auditor',
      actorRole: 'ADMIN',
      action: `COMPLIANCE_ALERT_${status}`,
      recordType: 'COMPLIANCE',
      recordId: alertId,
      newStatus: status,
      description: `Compliance alert ${alertId} marked as ${status}. Notes: ${officerNotes || 'None'}.`,
    });

    return updated;
  }
}
