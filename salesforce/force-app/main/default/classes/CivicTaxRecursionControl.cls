/**
 * @description Centralized recursion governance for CivicTax triggers.
 * Prevents infinite trigger re-entry while remaining 100% bulk-safe across 200-record batches.
 */
public class CivicTaxRecursionControl {
    private static Set<Id> processedAssessmentIds = new Set<Id>();
    private static Set<Id> processedPaymentIds = new Set<Id>();
    private static Set<Id> processedPropertyIds = new Set<Id>();

    public static Boolean isAssessmentProcessed(Id assessmentId) {
        return processedAssessmentIds.contains(assessmentId);
    }

    public static void markAssessmentProcessed(Id assessmentId) {
        if (assessmentId != null) {
            processedAssessmentIds.add(assessmentId);
        }
    }

    public static Boolean isPaymentProcessed(Id paymentId) {
        return processedPaymentIds.contains(paymentId);
    }

    public static void markPaymentProcessed(Id paymentId) {
        if (paymentId != null) {
            processedPaymentIds.add(paymentId);
        }
    }

    public static Boolean isPropertyProcessed(Id propertyId) {
        return processedPropertyIds.contains(propertyId);
    }

    public static void markPropertyProcessed(Id propertyId) {
        if (propertyId != null) {
            processedPropertyIds.add(propertyId);
        }
    }

    @TestVisible
    public static void reset() {
        processedAssessmentIds.clear();
        processedPaymentIds.clear();
        processedPropertyIds.clear();
    }
}
