/**
 * @description Enterprise Service for Municipal Executive Dashboard KPI Aggregation
 * @group CivicTax 6.0
 */
public with sharing class CivicTaxDashboardService {

    public class DashboardMetrics {
        @AuraEnabled public Integer totalProperties { get; set; }
        @AuraEnabled public Integer verifiedProperties { get; set; }
        @AuraEnabled public Integer pendingVerifications { get; set; }
        @AuraEnabled public Decimal totalTaxAssessed { get; set; }
        @AuraEnabled public Decimal totalRevenueCollected { get; set; }
        @AuraEnabled public Decimal totalOutstandingDues { get; set; }
        @AuraEnabled public Decimal collectionEfficiencyRate { get; set; }
        @AuraEnabled public Integer openGrievances { get; set; }
    }

    /**
     * @description Computes live municipal KPI metrics directly from Salesforce records (Officer / Admin Only)
     */
    public static DashboardMetrics getExecutiveMetrics() {
        CivicTaxSecurityService.requireCanViewExecutiveDashboard();

        DashboardMetrics metrics = new DashboardMetrics();

        // Property aggregates
        metrics.totalProperties = [SELECT count() FROM Property__c];
        metrics.verifiedProperties = [SELECT count() FROM Property__c WHERE Verification_Status__c = 'VERIFIED' OR Verification_Status__c = 'Verified'];
        metrics.pendingVerifications = [SELECT count() FROM Property__c WHERE Verification_Status__c = 'PENDING' OR Verification_Status__c = 'Pending'];

        // Financial aggregates
        AggregateResult[] assessmentAgg = [
            SELECT SUM(Total_Amount__c) totalAssessed, SUM(Amount_Paid__c) totalPaid, SUM(Outstanding_Amount__c) totalDue 
            FROM Tax_Assessment__c
        ];

        metrics.totalTaxAssessed = 0.0;
        metrics.totalRevenueCollected = 0.0;
        metrics.totalOutstandingDues = 0.0;

        if (!assessmentAgg.isEmpty()) {
            AggregateResult ar = assessmentAgg[0];
            metrics.totalTaxAssessed = ar.get('totalAssessed') != null ? (Decimal) ar.get('totalAssessed') : 0.0;
            metrics.totalRevenueCollected = ar.get('totalPaid') != null ? (Decimal) ar.get('totalPaid') : 0.0;
            metrics.totalOutstandingDues = ar.get('totalDue') != null ? (Decimal) ar.get('totalDue') : 0.0;
        }

        if (metrics.totalTaxAssessed > 0) {
            metrics.collectionEfficiencyRate = ((metrics.totalRevenueCollected / metrics.totalTaxAssessed) * 100).setScale(2);
        } else {
            metrics.collectionEfficiencyRate = 0.0;
        }

        // Grievances
        metrics.openGrievances = [SELECT count() FROM Grievance__c WHERE Status__c = 'OPEN' OR Status__c = 'Open'];

        return metrics;
    }
}
