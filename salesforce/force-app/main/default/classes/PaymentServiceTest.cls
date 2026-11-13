/**
 * @description Unit tests for CivicTax PaymentService and payment trigger rollup logic.
 */
@isTest
private class PaymentServiceTest {

    @testSetup
    static void setupTestData() {
        Contact citizen = CivicTaxTestDataFactory.createCitizenContact('Karthik', 'Raman', 'karthik@example.com');
        Tax_Rate__c rate = CivicTaxTestDataFactory.createTaxRate('Residential', 10.00);
        Property__c prop = CivicTaxTestDataFactory.createProperty(citizen.Id, 'CHN-ZN01-WD01-00101', 'Residential', 1200, 1500);
        Tax_Assessment__c asm = CivicTaxTestDataFactory.createAssessment(prop.Id, '2025-2026', 12000.00);
    }

    @isTest
    static void testProcessSuccessfulPayment() {
        Tax_Assessment__c asm = [SELECT Id, Total_Amount__c, Amount_Paid__c, Outstanding_Amount__c FROM Tax_Assessment__c LIMIT 1];

        Test.startTest();
        Tax_Payment__c pmt = PaymentService.recordPayment(asm.Id, 12000.00, 'UPI', 'UPI-TXN-2026-9901');
        Test.stopTest();

        System.assertNotEquals(null, pmt.Id, 'Payment record must be successfully inserted');
        
        Tax_Assessment__c updatedAsm = [SELECT Id, Assessment_Status__c, Amount_Paid__c, Outstanding_Amount__c FROM Tax_Assessment__c WHERE Id = :asm.Id];
        System.assertEquals(12000.00, updatedAsm.Amount_Paid__c, 'Paid amount must be 12000.00');
        System.assertEquals(0.00, updatedAsm.Outstanding_Amount__c, 'Outstanding amount must be 0.00');
        System.assertEquals('PAID', updatedAsm.Assessment_Status__c, 'Assessment status must transition to PAID');
    }

    @isTest
    static void testPartialPaymentUpdatesStatus() {
        Tax_Assessment__c asm = [SELECT Id, Total_Amount__c, Amount_Paid__c, Outstanding_Amount__c FROM Tax_Assessment__c LIMIT 1];

        Test.startTest();
        Tax_Payment__c pmt = PaymentService.recordPayment(asm.Id, 5000.00, 'NET_BANKING', 'NET-TXN-2026-9902');
        Test.stopTest();

        System.assertNotEquals(null, pmt.Id, 'Partial payment record must be inserted');

        Tax_Assessment__c updatedAsm = [SELECT Id, Assessment_Status__c, Amount_Paid__c, Outstanding_Amount__c FROM Tax_Assessment__c WHERE Id = :asm.Id];
        System.assertEquals(5000.00, updatedAsm.Amount_Paid__c, 'Paid amount must be 5000.00');
        System.assertEquals(7000.00, updatedAsm.Outstanding_Amount__c, 'Outstanding amount must be 7000.00');
        System.assertEquals('PARTIALLY_PAID', updatedAsm.Assessment_Status__c, 'Assessment status must transition to PARTIALLY_PAID');
    }
}
