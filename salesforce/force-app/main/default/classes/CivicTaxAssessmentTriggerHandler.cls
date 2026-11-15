/**
 * @description Handler for TaxAssessmentTrigger managing assessment status transitions and totals
 * @group CivicTax 6.0
 */
public with sharing class CivicTaxAssessmentTriggerHandler {
    
    public static void handleBeforeInsert(List<Tax_Assessment__c> newList) {
        for (Tax_Assessment__c asm : newList) {
            if (String.isBlank(asm.Assessment_Status__c)) {
                asm.Assessment_Status__c = 'DRAFT';
            }
            if (asm.Total_Amount__c == null && asm.Total_Tax__c != null) {
                asm.Total_Amount__c = asm.Total_Tax__c;
            }
            if (asm.Outstanding_Amount__c == null && asm.Total_Amount__c != null) {
                asm.Outstanding_Amount__c = asm.Total_Amount__c;
            }
        }
    }

    public static void handleBeforeUpdate(List<Tax_Assessment__c> newList, Map<Id, Tax_Assessment__c> oldMap) {
        for (Tax_Assessment__c asm : newList) {
            Tax_Assessment__c oldAsm = oldMap.get(asm.Id);

            // 1. Enforce that paid assessment cannot be reverted to draft
            if ((oldAsm.Assessment_Status__c == 'PAID' || oldAsm.Assessment_Status__c == 'Paid') && 
                (asm.Assessment_Status__c == 'DRAFT' || asm.Assessment_Status__c == 'Draft')) {
                asm.addError('Cannot revert a Paid assessment to Draft state.');
            }

            // 2. Prevent manual / unauthorized transition to PAID without a verified payment
            if ((asm.Assessment_Status__c == 'PAID' || asm.Assessment_Status__c == 'Paid') && 
                (oldAsm.Assessment_Status__c != 'PAID' && oldAsm.Assessment_Status__c != 'Paid')) {
                if (!CivicTaxRecursionControl.isPaymentTriggerRunning) {
                    if (asm.Amount_Paid__c == null || asm.Amount_Paid__c <= 0) {
                        asm.addError('Cannot mark assessment as PAID without a verified payment transaction totaling the assessment demand.');
                    } else if (asm.Outstanding_Amount__c != null && asm.Outstanding_Amount__c > 0) {
                        asm.addError('Cannot mark assessment as PAID while an outstanding balance remains.');
                    }
                }
            }
        }
    }
}
