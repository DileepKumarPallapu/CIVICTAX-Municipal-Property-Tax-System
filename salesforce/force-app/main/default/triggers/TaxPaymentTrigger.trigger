trigger TaxPaymentTrigger on Tax_Payment__c (before insert, after insert, before update, after update, before delete, after delete) {
    if (Trigger.isBefore && Trigger.isInsert) {
        CivicTaxPaymentTriggerHandler.handleBeforeInsert(Trigger.new);
    } else if (Trigger.isAfter && Trigger.isInsert) {
        CivicTaxPaymentTriggerHandler.handleAfterInsert(Trigger.new);
    } else if (Trigger.isBefore && Trigger.isUpdate) {
        CivicTaxPaymentTriggerHandler.handleBeforeUpdate(Trigger.new, Trigger.oldMap);
    } else if (Trigger.isAfter && Trigger.isUpdate) {
        CivicTaxPaymentTriggerHandler.handleAfterUpdate(Trigger.new, Trigger.oldMap);
    } else if (Trigger.isBefore && Trigger.isDelete) {
        CivicTaxPaymentTriggerHandler.handleBeforeDelete(Trigger.old);
    } else if (Trigger.isAfter && Trigger.isDelete) {
        CivicTaxPaymentTriggerHandler.handleAfterDelete(Trigger.old);
    }
}
