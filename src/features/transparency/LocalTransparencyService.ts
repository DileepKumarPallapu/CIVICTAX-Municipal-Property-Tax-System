import { PublicTransparencyMetrics, Property, TaxAssessment, Payment, Grievance, MunicipalZone } from '../../types';
import { StorageService } from '../../services/storageService';

export class LocalTransparencyService {
  public static getPublicMetrics(): PublicTransparencyMetrics {
    const properties = StorageService.getProperties();
    const assessments = StorageService.getAssessments();
    const payments = StorageService.getPayments().filter((p: Payment) => p.paymentStatus === 'SUCCESS');
    const grievances = StorageService.getGrievances();
    const zones = StorageService.getZones();

    const totalAssessed = assessments.reduce((acc: number, curr: TaxAssessment) => acc + curr.totalTax, 0);
    const totalCollected = assessments.reduce((acc: number, curr: TaxAssessment) => acc + curr.amountPaid, 0);
    const totalOutstanding = Math.max(0, totalAssessed - totalCollected);
    const efficiency = totalAssessed > 0 ? Math.round((totalCollected / totalAssessed) * 100) : 0;

    const resolvedGrievances = grievances.filter((g: Grievance) => g.status === 'RESOLVED').length;
    const grievanceResolutionRate =
      grievances.length > 0 ? Math.round((resolvedGrievances / grievances.length) * 100) : 100;

    // Zone Performance Aggregations (Safe: No individual names or addresses)
    const zonePerformance = zones.map((z: MunicipalZone) => {
      const zoneProps = properties.filter((p: Property) => p.zoneId === z.id);
      const zoneAssessments = assessments.filter((a: TaxAssessment) => a.zoneId === z.id);
      const zoneAssessed = zoneAssessments.reduce((acc: number, curr: TaxAssessment) => acc + curr.totalTax, 0);
      const zoneCollected = zoneAssessments.reduce((acc: number, curr: TaxAssessment) => acc + curr.amountPaid, 0);

      return {
        zoneName: z.name,
        propertiesCount: zoneProps.length,
        assessed: zoneAssessed,
        collected: zoneCollected,
        efficiency: zoneAssessed > 0 ? Math.round((zoneCollected / zoneAssessed) * 100) : 0,
      };
    });

    // Monthly Collection Trends (Safe aggregate totals)
    const monthlyMap: Record<string, number> = {};
    for (const p of payments) {
      const monthKey = p.paymentDate.slice(0, 7);
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + p.amountPaid;
    }

    const monthlyTrends = Object.keys(monthlyMap)
      .sort()
      .map((m) => ({
        month: m,
        amount: monthlyMap[m],
      }));

    return {
      totalRegisteredProperties: properties.length,
      aggregateAssessedTax: totalAssessed,
      aggregateCollections: totalCollected,
      aggregateOutstanding: totalOutstanding,
      overallCollectionEfficiency: efficiency,
      totalGrievancesLogged: grievances.length,
      totalGrievancesResolved: resolvedGrievances,
      resolutionPercentage: grievanceResolutionRate,
      zonePerformance,
      monthlyCollectionTrends: monthlyTrends,
      reportingPeriod: 'FY 2024-2025 (Active)',
      lastUpdated: new Date().toISOString(),
    };
  }
}
