trigger TaxAssessmentTrigger on Tax_Assessment__c (before insert, before update) {
    if (Trigger.isBefore && Trigger.isInsert) {
        CivicTaxAssessmentTriggerHandler.handleBeforeInsert(Trigger.new);
    } else if (Trigger.isBefore && Trigger.isUpdate) {
        CivicTaxAssessmentTriggerHandler.handleBeforeUpdate(Trigger.new, Trigger.oldMap);
    }
}
