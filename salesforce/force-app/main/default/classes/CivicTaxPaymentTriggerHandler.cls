/**
 * @description Handler for TaxPaymentTrigger managing payment status updates, ownership protection, lifecycle rollups, and financial integrity
 * @group CivicTax 6.0 & 10.0
 */
public with sharing class CivicTaxPaymentTriggerHandler {
    
    private static Boolean isSuccessful(Tax_Payment__c pmt) {
        if (pmt == null) return false;
        return (pmt.Transaction_Status__c == 'Success' || 
                pmt.Payment_Status__c == 'SUCCESS' ||
                pmt.Payment_Status__c == 'Success');
    }

    public static void handleBeforeInsert(List<Tax_Payment__c> newList) {
        Integer seq = 0;
        Set<Id> assessmentIds = new Set<Id>();

        for (Tax_Payment__c pmt : newList) {
            seq++;
            Decimal amt = pmt.Amount_Paid__c != null ? pmt.Amount_Paid__c : pmt.Amount__c;
            if (amt == null || amt <= 0) {
                pmt.addError('Payment amount must be strictly greater than zero.');
                continue;
            }

            if (pmt.Payment_Date__c == null) {
                pmt.Payment_Date__c = System.now();
            }
            if (String.isBlank(pmt.Transaction_Status__c)) {
                pmt.Transaction_Status__c = 'Initiated';
            }
            if (String.isBlank(pmt.Payment_Reference__c)) {
                pmt.Payment_Reference__c = 'RCT-' + String.valueOf(System.currentTimeMillis()).right(6) + '-' + seq + '-' + Math.abs(Crypto.getRandomInteger());
            }

            if (pmt.Assessment__c != null) {
                assessmentIds.add(pmt.Assessment__c);
            }
        }

        // Validate payment amounts against parent assessment balances
        if (!assessmentIds.isEmpty()) {
            Map<Id, Tax_Assessment__c> asstMap = new Map<Id, Tax_Assessment__c>([
                SELECT Id, Outstanding_Amount__c, Total_Amount__c 
                FROM Tax_Assessment__c 
                WHERE Id IN :assessmentIds
            ]);

            for (Tax_Payment__c pmt : newList) {
                if (pmt.Assessment__c != null && asstMap.containsKey(pmt.Assessment__c)) {
                    Tax_Assessment__c targetAsm = asstMap.get(pmt.Assessment__c);
                    Decimal maxAllowed = targetAsm.Outstanding_Amount__c != null 
                        ? targetAsm.Outstanding_Amount__c 
                        : (targetAsm.Total_Amount__c != null ? targetAsm.Total_Amount__c : 0.0);
                    
                    Decimal amt = pmt.Amount_Paid__c != null ? pmt.Amount_Paid__c : pmt.Amount__c;
                    if (amt != null && maxAllowed > 0 && amt > maxAllowed) {
                        pmt.addError('Payment amount (₹' + amt + ') exceeds the outstanding assessment balance (₹' + maxAllowed + ').');
                    }
                }
            }
        }
    }

    public static void handleAfterInsert(List<Tax_Payment__c> newList) {
        if (CivicTaxRecursionControl.isPaymentTriggerRunning) {
            return;
        }
        CivicTaxRecursionControl.isPaymentTriggerRunning = true;

        try {
            Set<Id> assessmentIds = new Set<Id>();
            for (Tax_Payment__c pmt : newList) {
                if (pmt.Assessment__c != null && isSuccessful(pmt)) {
                    assessmentIds.add(pmt.Assessment__c);
                }
            }
            if (!assessmentIds.isEmpty()) {
                rollupAssessmentBalances(assessmentIds);
            }
        } finally {
            CivicTaxRecursionControl.isPaymentTriggerRunning = false;
        }
    }

    public static void handleBeforeUpdate(List<Tax_Payment__c> newList, Map<Id, Tax_Payment__c> oldMap) {
        for (Tax_Payment__c pmt : newList) {
            Tax_Payment__c oldPmt = oldMap.get(pmt.Id);

            // 1. Prevent ownership modification on financial records
            if (pmt.OwnerId != oldPmt.OwnerId) {
                pmt.addError('Payment record ownership cannot be modified once created.');
                continue;
            }

            // 2. Prevent unauthorized status transitions to SUCCESS
            Boolean wasSuccess = isSuccessful(oldPmt);
            Boolean nowSuccess = isSuccessful(pmt);
            if (!wasSuccess && nowSuccess) {
                if (!CivicTaxSecurityService.isOfficerOrAdmin()) {
                    pmt.addError('Unauthorized status change: Only municipal officers and authorized payment services can mark payments as SUCCESS.');
                    continue;
                }
            }

            // 3. Completed payments are immutable financial records
            if (wasSuccess) {
                if (pmt.Amount_Paid__c != oldPmt.Amount_Paid__c || 
                    pmt.Amount__c != oldPmt.Amount__c || 
                    pmt.Assessment__c != oldPmt.Assessment__c || 
                    pmt.Transaction_ID__c != oldPmt.Transaction_ID__c ||
                    pmt.Payment_Method__c != oldPmt.Payment_Method__c ||
                    pmt.Payment_Reference__c != oldPmt.Payment_Reference__c) {
                    pmt.addError('Completed payment transactions are immutable and cannot be modified. Issue a reversal or adjustment record instead.');
                }
            }
        }
    }

    public static void handleAfterUpdate(List<Tax_Payment__c> newList, Map<Id, Tax_Payment__c> oldMap) {
        if (CivicTaxRecursionControl.isPaymentTriggerRunning) {
            return;
        }
        CivicTaxRecursionControl.isPaymentTriggerRunning = true;

        try {
            Set<Id> assessmentIds = new Set<Id>();

            for (Tax_Payment__c pmt : newList) {
                Tax_Payment__c oldPmt = oldMap.get(pmt.Id);
                Boolean wasSuccess = isSuccessful(oldPmt);
                Boolean nowSuccess = isSuccessful(pmt);

                // Status transition to/from SUCCESS
                if (wasSuccess != nowSuccess) {
                    if (pmt.Assessment__c != null) assessmentIds.add(pmt.Assessment__c);
                    if (oldPmt.Assessment__c != null) assessmentIds.add(oldPmt.Assessment__c);
                }
                // Amount modification on successful payment
                else if (nowSuccess && (pmt.Amount_Paid__c != oldPmt.Amount_Paid__c || pmt.Amount__c != oldPmt.Amount__c)) {
                    if (pmt.Assessment__c != null) assessmentIds.add(pmt.Assessment__c);
                }
                // Assessment relationship change (reparenting)
                else if (pmt.Assessment__c != oldPmt.Assessment__c) {
                    if (pmt.Assessment__c != null) assessmentIds.add(pmt.Assessment__c);
                    if (oldPmt.Assessment__c != null) assessmentIds.add(oldPmt.Assessment__c);
                }
            }

            if (!assessmentIds.isEmpty()) {
                rollupAssessmentBalances(assessmentIds);
            }
        } finally {
            CivicTaxRecursionControl.isPaymentTriggerRunning = false;
        }
    }

    public static void handleBeforeDelete(List<Tax_Payment__c> oldList) {
        for (Tax_Payment__c pmt : oldList) {
            // Completed payments cannot be deleted
            if (isSuccessful(pmt)) {
                pmt.addError('Completed tax payment records cannot be deleted due to statutory financial audit regulations.');
            }
        }
    }

    public static void handleAfterDelete(List<Tax_Payment__c> oldList) {
        if (CivicTaxRecursionControl.isPaymentTriggerRunning) {
            return;
        }
        CivicTaxRecursionControl.isPaymentTriggerRunning = true;

        try {
            Set<Id> assessmentIds = new Set<Id>();
            for (Tax_Payment__c pmt : oldList) {
                if (pmt.Assessment__c != null) {
                    assessmentIds.add(pmt.Assessment__c);
                }
            }
            if (!assessmentIds.isEmpty()) {
                rollupAssessmentBalances(assessmentIds);
            }
        } finally {
            CivicTaxRecursionControl.isPaymentTriggerRunning = false;
        }
    }

    public static void rollupAssessmentBalances(Set<Id> assessmentIds) {
        if (assessmentIds == null || assessmentIds.isEmpty()) {
            return;
        }
        new SystemElevatedRollup().executeRollup(assessmentIds);
    }

    /**
     * @description System-level elevated context for statutory assessment balance recalculations.
     * Assessment balance rollups must succeed atomically for any recorded payment transaction
     * regardless of individual record ownership partitions.
     */
    private without sharing class SystemElevatedRollup {
        public void executeRollup(Set<Id> assessmentIds) {
            Map<Id, Decimal> paidMap = new Map<Id, Decimal>();
            for (AggregateResult ar : [
                SELECT Assessment__c asmId, SUM(Amount_Paid__c) totalPaid 
                FROM Tax_Payment__c 
                WHERE Assessment__c IN :assessmentIds 
                  AND (Transaction_Status__c = 'Success' OR Payment_Status__c = 'SUCCESS' OR Payment_Status__c = 'Success')
                GROUP BY Assessment__c
            ]) {
                paidMap.put((Id) ar.get('asmId'), (Decimal) ar.get('totalPaid'));
            }

            List<Tax_Assessment__c> asmsToUpdate = new List<Tax_Assessment__c>();
            for (Tax_Assessment__c asm : [
                SELECT Id, Total_Amount__c, Amount_Paid__c, Outstanding_Amount__c, Assessment_Status__c 
                FROM Tax_Assessment__c 
                WHERE Id IN :assessmentIds
            ]) {
                Decimal totalPaid = paidMap.containsKey(asm.Id) ? paidMap.get(asm.Id) : 0.0;
                Decimal totalDemand = asm.Total_Amount__c != null ? asm.Total_Amount__c : 0.0;
                Decimal outstanding = totalDemand - totalPaid;
                if (outstanding < 0) {
                    outstanding = 0.0;
                }

                asm.Amount_Paid__c = totalPaid;
                asm.Outstanding_Amount__c = outstanding;
                if (outstanding <= 0 && totalPaid > 0) {
                    asm.Assessment_Status__c = 'PAID';
                } else if (totalPaid > 0) {
                    asm.Assessment_Status__c = 'PARTIALLY_PAID';
                } else {
                    asm.Assessment_Status__c = 'APPROVED';
                }
                asmsToUpdate.add(asm);
            }

            if (!asmsToUpdate.isEmpty()) {
                update asmsToUpdate;
            }
        }
    }
}
