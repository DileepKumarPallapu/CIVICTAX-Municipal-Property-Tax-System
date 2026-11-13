// PropertyTrigger.trigger
// CivicTax 8.0 Property Object Trigger
trigger PropertyTrigger on Property__c (before insert, before update, after insert, after update) {
    if (Trigger.isBefore && Trigger.isInsert) {
        for (Property__c p : Trigger.new) {
            if (p.Registration_Date__c == null) {
                p.Registration_Date__c = System.now();
            }
            if (String.isBlank(p.Verification_Status__c)) {
                p.Verification_Status__c = 'PENDING';
            }
        }
    }
}
