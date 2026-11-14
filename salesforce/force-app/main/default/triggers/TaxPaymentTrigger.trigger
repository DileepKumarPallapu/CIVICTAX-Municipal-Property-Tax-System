trigger TaxPaymentTrigger on Tax_Payment__c (before insert, after insert) {
    if (Trigger.isBefore && Trigger.isInsert) {
        CivicTaxPaymentTriggerHandler.handleBeforeInsert(Trigger.new);
    } else if (Trigger.isAfter && Trigger.isInsert) {
        CivicTaxPaymentTriggerHandler.handleAfterInsert(Trigger.new);
    }
}
