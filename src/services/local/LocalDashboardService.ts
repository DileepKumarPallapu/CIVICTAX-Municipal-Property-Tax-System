import { IDashboardService } from '../interfaces';
import {
  AdminDashboardStats,
  CitizenDashboardStats,
  OfficerDashboardStats,
  ReportFilterOptions,
} from '../../types';
import { StorageService } from '../storageService';

export class LocalDashboardService implements IDashboardService {
  async getCitizenStats(citizenId: string): Promise<CitizenDashboardStats> {
    const properties = StorageService.getProperties().filter((p) => p.ownerId === citizenId);
    const assessments = StorageService.getAssessments().filter((a) => a.ownerId === citizenId);

    const totalProperties = properties.length;
    const verifiedProperties = properties.filter((p) => p.verificationStatus === 'VERIFIED').length;
    const pendingVerification = properties.filter((p) => p.verificationStatus === 'PENDING').length;

    const totalTaxDue = assessments.reduce((sum, a) => sum + (a.outstandingBalance || 0), 0);
    const totalTaxPaid = assessments.reduce((sum, a) => sum + (a.amountPaid || 0), 0);
    const upcomingDueCount = assessments.filter((a) => (a.outstandingBalance || 0) > 0).length;

    return {
      totalProperties,
      verifiedProperties,
      pendingVerification,
      totalTaxDue,
      totalTaxPaid,
      upcomingDueCount,
    };
  }

  async getOfficerStats(officerId: string, zoneId?: string): Promise<OfficerDashboardStats> {
    const allProps = StorageService.getProperties();
    // Filter by zone if officer is zone-specific, else include relevant
    const properties = zoneId ? allProps.filter((p) => p.zoneId === zoneId) : allProps;
    const assessments = StorageService.getAssessments();
    const reassessments = StorageService.getReassessments();
    const grievances = StorageService.getGrievances();

    return {
      totalAssignedProperties: properties.length,
      pendingVerification: properties.filter((p) => p.verificationStatus === 'PENDING').length,
      approvedProperties: properties.filter((p) => p.verificationStatus === 'VERIFIED').length,
      pendingAssessments: assessments.filter((a) => a.status === 'PENDING_APPROVAL').length,
      pendingReassessments: reassessments.filter(
        (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'
      ).length,
      openGrievances: grievances.filter(
        (g) => g.status !== 'RESOLVED' && g.status !== 'REJECTED'
      ).length,
    };
  }

  async getAdminStats(): Promise<AdminDashboardStats> {
    const properties = StorageService.getProperties();
    const assessments = StorageService.getAssessments();
    const payments = StorageService.getPayments();
    const grievances = StorageService.getGrievances();
    const reassessments = StorageService.getReassessments();

    const totalRegisteredProperties = properties.length;
    const verifiedProperties = properties.filter((p) => p.verificationStatus === 'VERIFIED').length;
    const pendingVerification = properties.filter((p) => p.verificationStatus === 'PENDING').length;

    const totalTaxAssessed = assessments.reduce((sum, a) => sum + (a.totalTax || 0), 0);
    const totalRevenueCollected = payments
      .filter((p) => p.paymentStatus === 'SUCCESS')
      .reduce((sum, p) => sum + p.amountPaid, 0);
    const outstandingTax = assessments.reduce((sum, a) => sum + (a.outstandingBalance || 0), 0);

    const totalGrievances = grievances.length;
    const pendingReassessments = reassessments.filter(
      (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'
    ).length;

    return {
      totalRegisteredProperties,
      verifiedProperties,
      pendingVerification,
      totalTaxAssessed,
      totalRevenueCollected,
      outstandingTax,
      totalGrievances,
      pendingReassessments,
    };
  }

  async getRevenueAnalytics(filter?: ReportFilterOptions): Promise<{
    monthlyRevenue: Array<{ month: string; amount: number; transactions: number }>;
    zoneRevenue: Array<{ zone: string; amount: number; percentage: number }>;
    categoryRevenue: Array<{ category: string; amount: number }>;
    paymentMethodDistribution: Array<{ method: string; count: number; amount: number }>;
  }> {
    let payments = StorageService.getPayments().filter((p) => p.paymentStatus === 'SUCCESS');
    const properties = StorageService.getProperties();
    const zones = StorageService.getZones();

    if (filter?.startDate) {
      payments = payments.filter((p) => p.paymentDate >= filter.startDate!);
    }
    if (filter?.endDate) {
      payments = payments.filter((p) => p.paymentDate <= filter.endDate!);
    }

    // Monthly revenue aggregation
    const monthMap: Record<string, { amount: number; transactions: number }> = {
      'Jan': { amount: 0, transactions: 0 },
      'Feb': { amount: 0, transactions: 0 },
      'Mar': { amount: 0, transactions: 0 },
      'Apr': { amount: 0, transactions: 0 },
      'May': { amount: 35000, transactions: 2 },
      'Jun': { amount: 274000, transactions: 3 },
      'Jul': { amount: 266000, transactions: 3 },
      'Aug': { amount: 8400, transactions: 1 },
      'Sep': { amount: 0, transactions: 0 },
      'Oct': { amount: 0, transactions: 0 },
      'Nov': { amount: 0, transactions: 0 },
      'Dec': { amount: 0, transactions: 0 },
    };

    payments.forEach((p) => {
      try {
        const d = new Date(p.paymentDate);
        const monthKey = d.toLocaleString('en-US', { month: 'short' });
        if (monthMap[monthKey]) {
          monthMap[monthKey].amount += p.amountPaid;
          monthMap[monthKey].transactions += 1;
        }
      } catch (e) {
        // ignore date parse issue
      }
    });

    const monthlyRevenue = Object.entries(monthMap).map(([month, val]) => ({
      month,
      amount: val.amount,
      transactions: val.transactions,
    }));

    // Zone revenue
    const totalRev = payments.reduce((sum, p) => sum + p.amountPaid, 0) || 1;
    const zoneMap: Record<string, number> = {};
    zones.forEach((z) => {
      zoneMap[z.name] = 0;
    });

    payments.forEach((p) => {
      const prop = properties.find((pr) => pr.id === p.propertyId || pr.propertyNumber === p.propertyNumber);
      const zoneName = prop ? prop.zoneName : 'Zone 1 - Central Urban Core';
      zoneMap[zoneName] = (zoneMap[zoneName] || 0) + p.amountPaid;
    });

    const zoneRevenue = Object.entries(zoneMap).map(([zone, amount]) => ({
      zone: zone.replace('Zone ', 'Z'),
      amount,
      percentage: Math.round((amount / totalRev) * 100),
    }));

    // Category revenue
    const catMap: Record<string, number> = {
      Residential: 0,
      Commercial: 0,
      Industrial: 0,
    };
    payments.forEach((p) => {
      const prop = properties.find((pr) => pr.id === p.propertyId || pr.propertyNumber === p.propertyNumber);
      if (prop?.category === 'RESIDENTIAL') catMap['Residential'] += p.amountPaid;
      else if (prop?.category === 'COMMERCIAL') catMap['Commercial'] += p.amountPaid;
      else if (prop?.category === 'INDUSTRIAL') catMap['Industrial'] += p.amountPaid;
      else catMap['Residential'] += p.amountPaid;
    });

    const categoryRevenue = Object.entries(catMap).map(([category, amount]) => ({
      category,
      amount,
    }));

    // Payment methods
    const methodMap: Record<string, { count: number; amount: number }> = {
      UPI: { count: 0, amount: 0 },
      NetBanking: { count: 0, amount: 0 },
      CreditCard: { count: 0, amount: 0 },
      DebitCard: { count: 0, amount: 0 },
    };

    payments.forEach((p) => {
      const mKey =
        p.paymentMethod === 'NET_BANKING'
          ? 'NetBanking'
          : p.paymentMethod === 'CREDIT_CARD'
          ? 'CreditCard'
          : p.paymentMethod === 'DEBIT_CARD'
          ? 'DebitCard'
          : 'UPI';
      if (!methodMap[mKey]) methodMap[mKey] = { count: 0, amount: 0 };
      methodMap[mKey].count += 1;
      methodMap[mKey].amount += p.amountPaid;
    });

    const paymentMethodDistribution = Object.entries(methodMap).map(([method, val]) => ({
      method,
      count: val.count,
      amount: val.amount,
    }));

    return {
      monthlyRevenue,
      zoneRevenue,
      categoryRevenue,
      paymentMethodDistribution,
    };
  }
}
