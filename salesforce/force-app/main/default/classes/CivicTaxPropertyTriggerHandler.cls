/**
 * @description Handler for PropertyTrigger managing defaults, validation, and recursion control
 * @group CivicTax 6.0
 */
public with sharing class CivicTaxPropertyTriggerHandler {
    
    public static void handleBeforeInsert(List<Property__c> newList) {
        for (Property__c prop : newList) {
            if (prop.Registration_Date__c == null) {
                prop.Registration_Date__c = System.now();
            }
            if (String.isBlank(prop.Verification_Status__c)) {
                prop.Verification_Status__c = 'Pending';
            }
            if (String.isBlank(prop.Registration_Status__c)) {
                prop.Registration_Status__c = 'Submitted';
            }
        }
    }

    public static void handleBeforeUpdate(List<Property__c> newList, Map<Id, Property__c> oldMap) {
        for (Property__c prop : newList) {
            Property__c oldProp = oldMap.get(prop.Id);
            // State transition validation
            if (oldProp.Verification_Status__c == 'Verified' && prop.Verification_Status__c == 'Pending') {
                prop.addError('Cannot revert a Verified property back to Pending status without an approved Reassessment.');
            }
        }
    }

    public static void handleAfterUpdate(List<Property__c> newList, Map<Id, Property__c> oldMap) {
        if (CivicTaxRecursionControl.isPropertyTriggerRunning) {
            return;
        }
        CivicTaxRecursionControl.isPropertyTriggerRunning = true;

        try {
            // Trigger downstream automated actions (e.g. notify citizen when verified)
        } finally {
            CivicTaxRecursionControl.isPropertyTriggerRunning = false;
        }
    }
}
