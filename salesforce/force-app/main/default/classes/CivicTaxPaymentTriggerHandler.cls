/**
 * @description Handler for TaxPaymentTrigger managing payment status updates and financial consistency
 * @group CivicTax 6.0
 */
public with sharing class CivicTaxPaymentTriggerHandler {
    
    public static void handleBeforeInsert(List<Tax_Payment__c> newList) {
        for (Tax_Payment__c pmt : newList) {
            if (pmt.Payment_Date__c == null) {
                pmt.Payment_Date__c = System.now();
            }
            if (String.isBlank(pmt.Transaction_Status__c)) {
                pmt.Transaction_Status__c = 'Initiated';
            }
            if (String.isBlank(pmt.Payment_Reference__c)) {
                pmt.Payment_Reference__c = 'RCT-' + String.valueOf(System.currentTimeMillis()).right(6);
            }
        }
    }

    public static void handleAfterInsert(List<Tax_Payment__c> newList) {
        if (CivicTaxRecursionControl.isPaymentTriggerRunning) {
            return;
        }
        CivicTaxRecursionControl.isPaymentTriggerRunning = true;

        try {
            // Bulk update parent assessment balances
            Set<Id> assessmentIds = new Set<Id>();
            for (Tax_Payment__c pmt : newList) {
                if (pmt.Assessment__c != null && pmt.Transaction_Status__c == 'Success') {
                    assessmentIds.add(pmt.Assessment__c);
                }
            }
            // Trigger any asynchronous jobs if necessary
        } finally {
            CivicTaxRecursionControl.isPaymentTriggerRunning = false;
        }
    }
}
