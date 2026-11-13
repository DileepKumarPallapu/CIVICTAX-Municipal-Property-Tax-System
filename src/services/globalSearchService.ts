import { User, UserRole, GlobalSearchResultItem } from '../types';
import { StorageService } from './storageService';

export class GlobalSearchService {
  public static search(query: string, user: User | null): GlobalSearchResultItem[] {
    if (!query || query.trim().length < 2 || !user) return [];

    const q = query.toLowerCase().trim();
    const results: GlobalSearchResultItem[] = [];

    // 1. Properties
    const properties = StorageService.getProperties();
    const filteredProps =
      user.role === 'CITIZEN' ? properties.filter((p) => p.ownerId === user.id) : properties;

    for (const p of filteredProps) {
      if (
        p.propertyNumber.toLowerCase().includes(q) ||
        p.ownerName.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.documentReference.toLowerCase().includes(q)
      ) {
        results.push({
          id: p.id,
          category: 'PROPERTY',
          title: `${p.propertyNumber} — ${p.ownerName}`,
          subtitle: `${p.address} • ${p.builtUpArea} sq ft (${p.category})`,
          status: p.verificationStatus,
          linkUrl:
            user.role === 'CITIZEN'
              ? `/citizen/properties`
              : user.role === 'OFFICER'
              ? `/officer/assigned-properties`
              : `/admin/properties`,
          date: p.registrationDate,
        });
      }
    }

    // 2. Assessments
    const assessments = StorageService.getAssessments();
    const filteredAssessments =
      user.role === 'CITIZEN' ? assessments.filter((a) => a.ownerId === user.id) : assessments;

    for (const a of filteredAssessments) {
      if (
        a.assessmentNumber.toLowerCase().includes(q) ||
        a.propertyNumber.toLowerCase().includes(q) ||
        a.ownerName.toLowerCase().includes(q)
      ) {
        results.push({
          id: a.id,
          category: 'ASSESSMENT',
          title: `${a.assessmentNumber} (FY ${a.assessmentYear})`,
          subtitle: `${a.propertyNumber} • Total: ₹${a.totalTax.toLocaleString('en-IN')} (Due: ₹${a.outstandingBalance.toLocaleString('en-IN')})`,
          status: a.status,
          linkUrl:
            user.role === 'CITIZEN'
              ? `/citizen/assessments`
              : user.role === 'OFFICER'
              ? `/officer/assessments`
              : `/admin/assessments`,
          date: a.generatedDate,
        });
      }
    }

    // 3. Payments
    const payments = StorageService.getPayments();
    const filteredPayments =
      user.role === 'CITIZEN' ? payments.filter((p) => p.payerId === user.id) : payments;

    for (const p of filteredPayments) {
      if (
        p.transactionId.toLowerCase().includes(q) ||
        p.receiptNumber.toLowerCase().includes(q) ||
        p.assessmentNumber.toLowerCase().includes(q) ||
        p.payerName.toLowerCase().includes(q)
      ) {
        results.push({
          id: p.id,
          category: 'PAYMENT',
          title: `Receipt ${p.receiptNumber} (${p.transactionId})`,
          subtitle: `Amount: ₹${p.amountPaid.toLocaleString('en-IN')} via ${p.paymentMethod} • ${p.assessmentNumber}`,
          status: p.paymentStatus,
          linkUrl:
            user.role === 'CITIZEN'
              ? `/citizen/payments`
              : user.role === 'OFFICER'
              ? `/officer/payments`
              : `/admin/payments`,
          date: p.paymentDate,
        });
      }
    }

    // 4. Grievances
    const grievances = StorageService.getGrievances();
    const filteredGrievances =
      user.role === 'CITIZEN' ? grievances.filter((g) => g.citizenId === user.id) : grievances;

    for (const g of filteredGrievances) {
      if (
        g.grievanceNumber.toLowerCase().includes(q) ||
        g.subject.toLowerCase().includes(q) ||
        g.propertyNumber.toLowerCase().includes(q)
      ) {
        results.push({
          id: g.id,
          category: 'GRIEVANCE',
          title: `${g.grievanceNumber}: ${g.subject}`,
          subtitle: `Property: ${g.propertyNumber} • Priority: ${g.priority}`,
          status: g.status,
          linkUrl:
            user.role === 'CITIZEN'
              ? `/citizen/grievances`
              : user.role === 'OFFICER'
              ? `/officer/grievances`
              : `/admin/grievances`,
          date: g.submissionDate,
        });
      }
    }

    // Return top 15 matches
    return results.slice(0, 15);
  }
}
