/**
 * @description Comprehensive Test Suite for CivicTax 6.0 Apex Services, Triggers and Business Logic
 * @group CivicTax 6.0
 */
@isTest
private class CivicTaxSuiteTest {

    @testSetup
    static void setupTestData() {
        // Setup initial property for testing
        Property__c prop = new Property__c(
            Property_Number__c = 'TEST-PROP-001',
            Property_Address__c = '123 Test Street, Ward 4',
            Zone__c = 'Zone 01',
            Property_Category__c = 'Residential',
            Built_Up_Area__c = 1500.0,
            Verification_Status__c = 'Pending',
            Registration_Status__c = 'Submitted'
        );
        insert prop;
    }

    @isTest
    static void testPropertyRegistrationAndDuplicate() {
        Test.startTest();
        // Valid Registration
        Property__c newProp = new Property__c(
            Property_Number__c = 'TEST-PROP-002',
            Property_Address__c = '456 MG Road',
            Zone__c = 'Zone 02',
            Property_Category__c = 'Commercial',
            Built_Up_Area__c = 800.0
        );
        Property__c created = CivicTaxPropertyService.registerProperty(newProp);
        System.assertNotEquals(null, created.Id, 'Property should be registered successfully');

        // Duplicate Registration - should throw exception
        try {
            Property__c dupProp = new Property__c(
                Property_Number__c = 'TEST-PROP-002',
                Property_Address__c = 'Duplicate Street',
                Zone__c = 'Zone 02',
                Property_Category__c = 'Commercial',
                Built_Up_Area__c = 800.0
            );
            CivicTaxPropertyService.registerProperty(dupProp);
            System.assert(false, 'Should have thrown exception on duplicate property');
        } catch (Exception ex) {
            System.assert(ex.getMessage().contains('already registered'), 'Exception message should indicate duplicate');
        }
        Test.stopTest();
    }

    @isTest
    static void testPropertyVerificationAndAssessmentLifecycle() {
        Property__c prop = [SELECT Id, Property_Number__c, Verification_Status__c FROM Property__c WHERE Property_Number__c = 'TEST-PROP-001' LIMIT 1];

        Test.startTest();
        // Update Verification
        Map<Id, String> statusMap = new Map<Id, String>{ prop.Id => 'Verified' };
        List<Property__c> updated = CivicTaxPropertyService.updateVerificationStatus(statusMap);
        System.assertEquals('Verified', updated[0].Verification_Status__c, 'Status should be Verified');

        // Calculate Assessment
        Tax_Assessment__c asm = CivicTaxAssessmentService.calculateAndCreateAssessment(prop.Id, '2026-2027');
        System.assertNotEquals(null, asm.Id, 'Assessment should be generated');
        System.assert(asm.Total_Tax__c > 0, 'Total tax should be strictly positive');

        // Query Assessments
        List<Tax_Assessment__c> asms = CivicTaxAssessmentService.getAssessmentsForProperty(prop.Id);
        System.assertEquals(1, asms.size(), 'Should find 1 assessment for property');
        Test.stopTest();
    }

    @isTest
    static void testPaymentProcessingAndDuplicates() {
        Property__c prop = [SELECT Id FROM Property__c WHERE Property_Number__c = 'TEST-PROP-001' LIMIT 1];
        prop.Verification_Status__c = 'Verified';
        update prop;

        Tax_Assessment__c asm = CivicTaxAssessmentService.calculateAndCreateAssessment(prop.Id, '2026-2027');

        Test.startTest();
        // Successful Payment
        Tax_Payment__c pmt = CivicTaxPaymentService.processPayment(asm.Id, 5000.0, 'UPI', 'TXN-TEST-1001');
        System.assertNotEquals(null, pmt.Id, 'Payment should be created');
        System.assertEquals('Success', pmt.Transaction_Status__c, 'Payment status should be Success');

        // Check updated Assessment
        Tax_Assessment__c updatedAsm = [SELECT Amount_Paid__c, Outstanding_Amount__c, Assessment_Status__c FROM Tax_Assessment__c WHERE Id = :asm.Id];
        System.assertEquals(5000.0, updatedAsm.Amount_Paid__c, 'Amount paid should equal 5000');

        // Duplicate Payment prevention
        try {
            CivicTaxPaymentService.processPayment(asm.Id, 1000.0, 'UPI', 'TXN-TEST-1001');
            System.assert(false, 'Should throw duplicate transaction exception');
        } catch (Exception ex) {
            System.assert(ex.getMessage().contains('Duplicate payment detected'), 'Exception message should cite duplicate');
        }
        Test.stopTest();
    }

    @isTest
    static void testGrievanceAndReassessmentFlow() {
        Property__c prop = [SELECT Id FROM Property__c WHERE Property_Number__c = 'TEST-PROP-001' LIMIT 1];

        Test.startTest();
        // Grievance
        Grievance__c grv = CivicTaxGrievanceService.submitGrievance(prop.Id, 'Incorrect tax slab applied', 'Please re-verify residential rate', 'High');
        System.assertNotEquals(null, grv.Id, 'Grievance should be filed');

        Grievance__c resolved = CivicTaxGrievanceService.resolveGrievance(grv.Id, 'Re-verified in accordance with Ward 4 master list.');
        System.assertEquals('Resolved', resolved.Status__c, 'Grievance should be resolved');

        // Reassessment
        Reassessment_Request__c req = CivicTaxReassessmentService.submitRequest(prop.Id, null, 'Balcony enclosed +120 sq ft', 'Renovation');
        System.assertNotEquals(null, req.Id, 'Reassessment request should be created');

        Reassessment_Request__c approved = CivicTaxReassessmentService.approveReassessment(req.Id, 'Approved following ground survey inspection.');
        System.assertEquals('Approved', approved.Approval_Status__c, 'Reassessment should be approved');
        Test.stopTest();
    }

    @isTest
    static void testDashboardMetricsAndSecurity() {
        Test.startTest();
        CivicTaxDashboardService.DashboardMetrics metrics = CivicTaxDashboardService.getExecutiveMetrics();
        System.assertNotEquals(null, metrics, 'Metrics DTO should not be null');
        System.assert(metrics.totalProperties >= 1, 'Should reflect at least 1 test property');

        Boolean canRead = CivicTaxSecurityService.canReadObject('Property__c');
        System.assertEquals(true, canRead, 'Running test user should have read access to Property__c');

        CivicTaxRecursionControl.resetAll();
        System.assertEquals(false, CivicTaxRecursionControl.isPropertyTriggerRunning, 'Recursion flag should be reset');
        Test.stopTest();
    }
}
