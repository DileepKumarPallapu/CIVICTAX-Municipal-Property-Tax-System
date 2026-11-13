import { Payment, PaymentFilterOptions } from '../../types';
import { IPaymentService } from '../interfaces';
import { StorageService } from '../storageService';
import { generateTransactionId, generateReceiptNumber } from '../../utils';
import { PaymentRules } from '../businessRules';

export class LocalPaymentService implements IPaymentService {
  public async getPayments(filter?: PaymentFilterOptions): Promise<Payment[]> {
    let payments = StorageService.getPayments();

    if (!filter) return payments;

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      payments = payments.filter(
        (p) =>
          p.transactionId.toLowerCase().includes(q) ||
          p.receiptNumber.toLowerCase().includes(q) ||
          p.assessmentNumber.toLowerCase().includes(q) ||
          p.payerName.toLowerCase().includes(q) ||
          p.propertyNumber.toLowerCase().includes(q)
      );
    }

    if (filter.method && filter.method !== 'ALL') {
      payments = payments.filter((p) => p.paymentMethod === filter.method);
    }

    if (filter.status && filter.status !== 'ALL') {
      payments = payments.filter((p) => p.paymentStatus === filter.status);
    }

    if (filter.payerId) {
      payments = payments.filter((p) => p.payerId === filter.payerId);
    }

    return payments;
  }

  public async getPaymentById(id: string): Promise<Payment | null> {
    const payments = StorageService.getPayments();
    return payments.find((p) => p.id === id) || null;
  }

  public async getPaymentsByAssessmentId(assessmentId: string): Promise<Payment[]> {
    const payments = StorageService.getPayments();
    return payments.filter((p) => p.assessmentId === assessmentId);
  }

  public async getPaymentsByPropertyId(propertyId: string): Promise<Payment[]> {
    const payments = StorageService.getPayments();
    return payments.filter((p) => p.propertyId === propertyId);
  }

  public async processSimulatedPayment(data: {
    assessmentId: string;
    payerId: string;
    payerName: string;
    payerEmail: string;
    payerPhone: string;
    amountPaid: number;
    paymentMethod: Payment['paymentMethod'];
    bankOrVpaDetails?: string;
  }): Promise<Payment> {
    const assessments = StorageService.getAssessments();
    const assessmentIndex = assessments.findIndex((a) => a.id === data.assessmentId);

    if (assessmentIndex === -1) {
      throw new Error(`Assessment with id ${data.assessmentId} not found.`);
    }

    const assessment = assessments[assessmentIndex];

    // 1. Validate Business Rules (validate balance, positive amount, prevent overpayment)
    PaymentRules.validatePayment(assessment, data.amountPaid);

    const now = new Date().toISOString();
    const payments = StorageService.getPayments();
    const id = `pay-${Date.now()}`;
    const transactionId = generateTransactionId();
    const receiptNumber = generateReceiptNumber();

    // 2. Safe transaction calculation
    const newAmountPaid = assessment.amountPaid + data.amountPaid;
    const remainingBalance = Math.max(0, assessment.totalTax - newAmountPaid);
    const newStatus: 'PAID' | 'PARTIALLY_PAID' = remainingBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

    // 3. Create Payment Record
    const newPayment: Payment = {
      id,
      transactionId,
      receiptNumber,
      assessmentId: assessment.id,
      assessmentNumber: assessment.assessmentNumber,
      propertyId: assessment.propertyId,
      propertyNumber: assessment.propertyNumber,
      payerId: data.payerId,
      payerName: data.payerName,
      payerEmail: data.payerEmail,
      payerPhone: data.payerPhone,
      amountPaid: data.amountPaid,
      totalAssessment: assessment.totalTax,
      remainingBalance,
      paymentDate: now,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'SUCCESS',
      gatewayRef: `GW-SIM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      assessmentYear: assessment.assessmentYear,
      bankOrVpaDetails: data.bankOrVpaDetails,
      remarks: remainingBalance === 0 ? 'Full property tax settlement' : 'Partial tax installment',
    };

    // Staged update: Save payment and update assessment together
    StorageService.setPayments([newPayment, ...payments]);

    const updatedAssessment = {
      ...assessment,
      amountPaid: newAmountPaid,
      outstandingBalance: remainingBalance,
      status: newStatus,
    };
    assessments[assessmentIndex] = updatedAssessment;
    StorageService.setAssessments([...assessments]);

    // 4. Automated Notification
    const notifications = StorageService.getNotifications();
    StorageService.setNotifications([
      {
        id: `notif-${Date.now()}`,
        userId: data.payerId,
        title: 'Tax Payment Successful',
        message: `Your payment of ₹${data.amountPaid.toLocaleString('en-IN')} for Assessment ${assessment.assessmentNumber} has been received. Official Receipt: ${receiptNumber}.`,
        category: 'PAYMENT',
        isRead: false,
        timestamp: now,
        linkUrl: `/citizen/payments`,
        priority: 'HIGH',
      },
      ...notifications,
    ]);

    // 5. Immutable Audit Log
    StorageService.recordAuditLog({
      actorId: data.payerId,
      actorName: data.payerName,
      actorRole: 'CITIZEN',
      action: 'PROCESS_PAYMENT',
      recordType: 'PAYMENT',
      recordId: id,
      newStatus: 'SUCCESS',
      description: `Payment of ₹${data.amountPaid.toLocaleString('en-IN')} recorded for ${assessment.assessmentNumber} via ${data.paymentMethod} (Txn: ${transactionId}, Receipt: ${receiptNumber}).`,
    });

    return newPayment;
  }
}
