// CivicTaxOverdueAssessmentBatch.cls
// CivicTax 9.0 Annual Assessment Generation & Overdue Escalation Batch Engine
public with sharing class CivicTaxOverdueAssessmentBatch implements Database.Batchable<sObject>, Database.Stateful {
    public Integer recordsProcessed = 0;

    public Database.QueryLocator start(Database.BatchableContext bc) {
        Date today = Date.today();
        return Database.getQueryLocator([
            SELECT Id, Assessment_Number__c, Total_Amount__c, Outstanding_Amount__c, Due_Date__c, Assessment_Status__c 
            FROM Tax_Assessment__c 
            WHERE Due_Date__c < :today 
              AND Assessment_Status__c != 'PAID'
        ]);
    }

    public void execute(Database.BatchableContext bc, List<Tax_Assessment__c> scope) {
        for (Tax_Assessment__c a : scope) {
            a.Assessment_Status__c = 'OVERDUE';
            recordsProcessed++;
        }
        update scope;
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('Overdue assessment batch completed. Total processed: ' + recordsProcessed);
    }
}
