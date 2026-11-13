// TaxPaymentTrigger.trigger
// CivicTax 8.0 Tax Payment Object Trigger
trigger TaxPaymentTrigger on Tax_Payment__c (after insert) {
    Set<Id> assessmentIds = new Set<Id>();
    for (Tax_Payment__c p : Trigger.new) {
        if (p.Payment_Status__c == 'SUCCESS' && p.Assessment__c != null) {
            assessmentIds.add(p.Assessment__c);
        }
    }

    if (!assessmentIds.isEmpty()) {
        List<Tax_Assessment__c> asms = [
            SELECT Id, Total_Amount__c, (SELECT Amount_Paid__c FROM Tax_Payments__r WHERE Payment_Status__c = 'SUCCESS')
            FROM Tax_Assessment__c 
            WHERE Id IN :assessmentIds
        ];

        for (Tax_Assessment__c a : asms) {
            Decimal totalPaid = 0;
            for (Tax_Payment__c pay : a.Tax_Payments__r) {
                totalPaid += (pay.Amount_Paid__c != null ? pay.Amount_Paid__c : 0);
            }
            a.Amount_Paid__c = totalPaid;
            a.Outstanding_Amount__c = (a.Total_Amount__c - totalPaid).setScale(2, System.RoundingMode.HALF_UP);
            if (a.Outstanding_Amount__c <= 0) {
                a.Assessment_Status__c = 'PAID';
            } else {
                a.Assessment_Status__c = 'PARTIALLY_PAID';
            }
        }
        update as user asms;
    }
}
