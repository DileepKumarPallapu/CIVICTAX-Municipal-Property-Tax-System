# CivicTax Bulk-Safe Trigger Recursion Handling

## 1. The Recursion Problem in Financial Systems

In multi-tiered municipal architectures, cascading DML operations can create unintended infinite recursion loops (e.g. `TaxPaymentTrigger` updates `Tax_Assessment__c`, which in turn triggers a recalculation that attempts to update payment records).

Simplistic anti-recursion techniques (such as a single static `Boolean isTriggerRan = false;`) introduce severe defects:
> [!CAUTION]
> A static boolean guard marks the trigger as "completed" during the first record of a bulk batch of 200, inadvertently skipping validation and rollup calculation for the remaining 199 records!

---

## 2. CivicTax Idempotent Set-Based Recursion Solution

CivicTax implements record-level state tracking via static sets:

```apex
public class CivicTaxRecursionControl {
    private static Set<Id> processedAssessmentIds = new Set<Id>();
    private static Set<Id> processedPaymentIds = new Set<Id>();

    public static Boolean isAssessmentProcessed(Id assessmentId) {
        return processedAssessmentIds.contains(assessmentId);
    }

    public static void markAssessmentProcessed(Id assessmentId) {
        processedAssessmentIds.add(assessmentId);
    }

    public static Boolean isPaymentProcessed(Id paymentId) {
        return processedPaymentIds.contains(paymentId);
    }

    public static void markPaymentProcessed(Id paymentId) {
        processedPaymentIds.add(paymentId);
    }

    // Reset method for unit tests
    @TestVisible
    public static void reset() {
        processedAssessmentIds.clear();
        processedPaymentIds.clear();
    }
}
```

### Advantages:
1. **Bulk-Safe**: Tracks individual record IDs across batches of 200 without aborting legitimate subsequent records.
2. **Context-Specific**: Differentiates between assessments and payments.
3. **Testable**: Supports explicit reset in `@TestVisible` blocks.
