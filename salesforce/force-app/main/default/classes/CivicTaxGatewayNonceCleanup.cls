global without sharing class CivicTaxGatewayNonceCleanup
    implements Database.Batchable<SObject>, Schedulable {

    global void execute(SchedulableContext context) {
        Database.executeBatch(new CivicTaxGatewayNonceCleanup(), 200);
    }

    global Database.QueryLocator start(Database.BatchableContext context) {
        return Database.getQueryLocator([
            SELECT Id
            FROM CivicTax_Gateway_Nonce__c
            WHERE Expires_At__c < :System.now()
        ]);
    }

    global void execute(Database.BatchableContext context, List<SObject> scope) {
        delete scope;
    }

    global void finish(Database.BatchableContext context) {}
}
