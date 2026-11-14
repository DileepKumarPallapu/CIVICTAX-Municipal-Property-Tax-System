/**
 * @description Handler for TaxAssessmentTrigger managing assessment status transitions and totals
 * @group CivicTax 6.0
 */
public with sharing class CivicTaxAssessmentTriggerHandler {
    
    public static void handleBeforeInsert(List<Tax_Assessment__c> newList) {
        for (Tax_Assessment__c asm : newList) {
            if (String.isBlank(asm.Assessment_Status__c)) {
                asm.Assessment_Status__c = 'Draft';
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
            // Enforce that paid assessment cannot be reverted to draft
            Tax_Assessment__c oldAsm = oldMap.get(asm.Id);
            if (oldAsm.Assessment_Status__c == 'Paid' && asm.Assessment_Status__c == 'Draft') {
                asm.addError('Cannot revert a Paid assessment to Draft state.');
            }
        }
    }
}
