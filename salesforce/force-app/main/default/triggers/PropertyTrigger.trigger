trigger PropertyTrigger on Property__c (before insert, before update, after insert, after update) {
    if (Trigger.isBefore && Trigger.isInsert) {
        CivicTaxPropertyTriggerHandler.handleBeforeInsert(Trigger.new);
    } else if (Trigger.isBefore && Trigger.isUpdate) {
        CivicTaxPropertyTriggerHandler.handleBeforeUpdate(Trigger.new, Trigger.oldMap);
    } else if (Trigger.isAfter && Trigger.isUpdate) {
        CivicTaxPropertyTriggerHandler.handleAfterUpdate(Trigger.new, Trigger.oldMap);
    }
}
