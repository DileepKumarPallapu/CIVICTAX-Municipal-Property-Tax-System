/**
 * @description Comprehensive Test Suite for CivicTax 6.0 & 9.0 Apex Services, Triggers and Business Logic
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
            Property_Category__c = 'RESIDENTIAL',
            Built_Up_Area__c = 1500.0,
            Verification_Status__c = 'PENDING',
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
            Property_Category__c = 'COMMERCIAL',
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
                Property_Category__c = 'COMMERCIAL',
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
        Map<Id, String> statusMap = new Map<Id, String>{ prop.Id => 'VERIFIED' };
        List<Property__c> updated = CivicTaxPropertyService.updateVerificationStatus(statusMap);
        System.assertEquals('VERIFIED', updated[0].Verification_Status__c, 'Status should be VERIFIED');

        // Test rejection status and filtering
        CivicTaxPropertyService.updateVerificationStatus(new Map<Id, String>{ prop.Id => 'Rejected' });
        CivicTaxPropertyService.getPropertiesByFilter('Zone 01', 'RESIDENTIAL');
        CivicTaxPropertyService.getPropertiesByFilter(null, null);

        // Reset to Verified for Assessment test
        CivicTaxPropertyService.updateVerificationStatus(new Map<Id, String>{ prop.Id => 'Verified' });

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
        prop.Verification_Status__c = 'VERIFIED';
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

        // Alternate Payment Service
        Tax_Payment__c altPmt = PaymentService.recordPayment(asm.Id, 1000.0, 'NET_BANKING', 'TXN-TEST-1002');
        System.assertNotEquals(null, altPmt.Id);

        // Integration Service Payment
        Map<String, Object> pmtPayload = new Map<String, Object>{
            'assessmentId' => asm.Id,
            'amount' => 500.0,
            'method' => 'CASH',
            'transactionId' => 'TXN-TEST-1003'
        };
        CivicTaxIntegrationService.handleInboundRequest('PAYMENT', 'RECORD', pmtPayload);

        Test.stopTest();
    }

    @isTest
    static void testGrievanceAndReassessmentFlow() {
        Property__c prop = [SELECT Id FROM Property__c WHERE Property_Number__c = 'TEST-PROP-001' LIMIT 1];

        Test.startTest();
        // Grievance
        Grievance__c grv = CivicTaxGrievanceService.submitGrievance(prop.Id, 'Incorrect tax slab applied', 'Please re-verify residential rate', 'HIGH');
        System.assertNotEquals(null, grv.Id, 'Grievance should be filed');

        Grievance__c resolved = CivicTaxGrievanceService.resolveGrievance(grv.Id, 'Re-verified in accordance with Ward 4 master list.');
        System.assertEquals('RESOLVED', resolved.Status__c, 'Grievance should be resolved');

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
        CivicTaxSecurityService.canCreateObject('Property__c');
        CivicTaxSecurityService.canUpdateObject('Property__c');
        CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<Property__c>());

        CivicTaxRecursionControl.resetAll();
        System.assertEquals(false, CivicTaxRecursionControl.isPropertyTriggerRunning, 'Recursion flag should be reset');
        CivicTaxRecursionControl.isAssessmentTriggerRunning = true;
        CivicTaxRecursionControl.isPaymentTriggerRunning = true;
        CivicTaxRecursionControl.markAssessmentProcessed(null);
        CivicTaxRecursionControl.isAssessmentProcessed(null);
        CivicTaxRecursionControl.markPaymentProcessed(null);
        CivicTaxRecursionControl.isPaymentProcessed(null);
        CivicTaxRecursionControl.markPropertyProcessed(null);
        CivicTaxRecursionControl.isPropertyProcessed(null);

        // Search Service coverage
        CivicTaxSearchService.getZoneAnalytics('Zone 01');
        CivicTaxSearchService.searchCivicTaxRecords('TEST');

        // Tax Calculation coverage
        TaxCalculationService.calculateTax(1000, 10);
        TaxCalculationService.calculateTax('RESIDENTIAL', 1000, false, false);

        // Integration Service coverage
        Map<String, Object> propPayload = new Map<String, Object>{
            'propertyNumber' => 'TEST-PROP-INT-01',
            'address' => 'Integration Lane',
            'zone' => 'Zone 01',
            'category' => 'RESIDENTIAL',
            'builtUpArea' => 1000
        };
        CivicTaxIntegrationService.handleInboundRequest('PROPERTY', 'CREATE', propPayload);
        CivicTaxIntegrationService.handleInboundRequest('UNKNOWN', 'TEST', new Map<String, Object>());

        // PropertyService coverage
        Property__c propRec = [SELECT Id FROM Property__c WHERE Property_Number__c = 'TEST-PROP-001' LIMIT 1];
        PropertyService.getProperty(propRec.Id);
        PropertyService.listProperties('RESIDENTIAL', 'Zone 01', 'VERIFIED');
        PropertyService.listProperties('', '', '');
        PropertyService.updateVerificationStatus(propRec.Id, 'VERIFIED', 'OK');

        Test.stopTest();
    }

    @isTest
    static void testAsyncJobsExecution() {
        Property__c prop = [SELECT Id FROM Property__c WHERE Property_Number__c = 'TEST-PROP-001' LIMIT 1];
        Tax_Assessment__c asm = new Tax_Assessment__c(
            Property__c = prop.Id,
            Assessment_Year__c = '2023-2024',
            Base_Value__c = 10000.0,
            Total_Amount__c = 10000.0,
            Outstanding_Amount__c = 10000.0,
            Due_Date__c = Date.today().addDays(-10),
            Assessment_Status__c = 'DRAFT'
        );
        insert asm;

        Test.startTest();
        // Queueable dispatch
        System.enqueueJob(new CivicTaxAsyncJobs.NotificationQueueable(new List<Id>{ prop.Id }));

        // Batch execution
        Database.executeBatch(new CivicTaxOverdueAssessmentBatch(), 50);

        // Schedulable test
        CivicTaxAsyncJobs.OverdueAssessmentScheduler scheduler = new CivicTaxAsyncJobs.OverdueAssessmentScheduler();
        String cron = '0 0 0 15 3 ? 2030';
        System.schedule('TestOverdueAssessmentScheduler', cron, scheduler);
        scheduler.execute(null);
        Test.stopTest();

        Tax_Assessment__c updatedAsm = [SELECT Id, Assessment_Status__c FROM Tax_Assessment__c WHERE Id = :asm.Id];
        System.assertEquals('OVERDUE', updatedAsm.Assessment_Status__c, 'Overdue batch should transition overdue assessment');
    }

    @isTest
    static void testRestResourceEndpoints() {
        Property__c prop = [SELECT Id, Property_Number__c FROM Property__c WHERE Property_Number__c = 'TEST-PROP-001' LIMIT 1];

        Test.startTest();
        // 1. GET Health
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/civictax/v1/health';
        req.httpMethod = 'GET';
        RestContext.request = req;
        RestContext.response = res;
        CivicTaxRestResource.handleGet();
        System.assertEquals(200, res.statusCode, 'Health endpoint should return 200');

        // 2. GET Properties list
        req.requestURI = '/services/apexrest/civictax/v1/properties';
        CivicTaxRestResource.handleGet();
        System.assertNotEquals(null, res.responseBody, 'Should return properties list');

        // 3. GET Single Property
        req.requestURI = '/services/apexrest/civictax/v1/properties/' + prop.Property_Number__c;
        CivicTaxRestResource.handleGet();
        System.assertNotEquals(null, res.responseBody, 'Should return single property');

        // 4. GET Dashboard metrics
        req.requestURI = '/services/apexrest/civictax/v1/dashboard';
        CivicTaxRestResource.handleGet();
        System.assertNotEquals(null, res.responseBody, 'Should return dashboard metrics');

        // 5. PATCH Property status
        RestRequest patchReq = new RestRequest();
        RestResponse patchRes = new RestResponse();
        patchReq.requestURI = '/services/apexrest/civictax/v1/properties';
        patchReq.httpMethod = 'PATCH';
        patchReq.requestBody = Blob.valueOf('{"propertyId":"' + prop.Property_Number__c + '","status":"VERIFIED","notes":"Ground survey confirmed"}');
        RestContext.request = patchReq;
        RestContext.response = patchRes;
        CivicTaxRestResource.handlePatch();
        System.assertEquals(200, patchRes.statusCode, 'Patch status should succeed');

        // 6. POST Property
        RestRequest postReq = new RestRequest();
        RestResponse postRes = new RestResponse();
        postReq.requestURI = '/services/apexrest/civictax/v1/properties';
        postReq.httpMethod = 'POST';
        postReq.requestBody = Blob.valueOf('{"propertyNumber":"PROP-REST-POST-1","address":"456 Rest Way","category":"RESIDENTIAL","builtUpArea":1200,"zone":"Zone 01"}');
        RestContext.request = postReq;
        RestContext.response = postRes;
        CivicTaxRestResource.handlePost();
        System.assertEquals(201, postRes.statusCode, 'POST property should succeed');

        // 7. GET Assessments
        RestRequest getAsmReq = new RestRequest();
        RestResponse getAsmRes = new RestResponse();
        getAsmReq.requestURI = '/services/apexrest/civictax/v1/assessments';
        RestContext.request = getAsmReq;
        RestContext.response = getAsmRes;
        CivicTaxRestResource.handleGet();

        // 8. 404 GET
        RestRequest notFoundGetReq = new RestRequest();
        RestResponse notFoundGetRes = new RestResponse();
        notFoundGetReq.requestURI = '/services/apexrest/civictax/v1/unknown';
        RestContext.request = notFoundGetReq;
        RestContext.response = notFoundGetRes;
        CivicTaxRestResource.handleGet();
        System.assertEquals(404, notFoundGetRes.statusCode);

        // 9. 404 PATCH
        RestRequest notFoundPatchReq = new RestRequest();
        RestResponse notFoundPatchRes = new RestResponse();
        notFoundPatchReq.requestURI = '/services/apexrest/civictax/v1/unknown';
        RestContext.request = notFoundPatchReq;
        RestContext.response = notFoundPatchRes;
        CivicTaxRestResource.handlePatch();
        System.assertEquals(404, notFoundPatchRes.statusCode);

        // 10. 404 POST
        RestRequest notFoundPostReq = new RestRequest();
        RestResponse notFoundPostRes = new RestResponse();
        notFoundPostReq.requestURI = '/services/apexrest/civictax/v1/unknown';
        RestContext.request = notFoundPostReq;
        RestContext.response = notFoundPostRes;
        CivicTaxRestResource.handlePost();
        System.assertEquals(404, notFoundPostRes.statusCode);

        Test.stopTest();
    }

    @isTest
    static void testAssessmentTriggerScenarios() {
        Property__c prop = [SELECT Id FROM Property__c WHERE Property_Number__c = 'TEST-PROP-001' LIMIT 1];
        Test.startTest();
        // Insert with null status to test default to Draft
        Tax_Assessment__c draftAsm = new Tax_Assessment__c(
            Property__c = prop.Id,
            Assessment_Year__c = '2026-2027',
            Base_Value__c = 5000.0,
            Due_Date__c = Date.today().addDays(30),
            Total_Tax__c = 5000.0
        );
        insert draftAsm;
        Tax_Assessment__c queriedDraft = [SELECT Assessment_Status__c, Total_Amount__c, Outstanding_Amount__c FROM Tax_Assessment__c WHERE Id = :draftAsm.Id];
        System.assertEquals('DRAFT', queriedDraft.Assessment_Status__c);
        System.assertEquals(5000.0, queriedDraft.Total_Amount__c);

        // Transition to Paid via verified payment transaction
        Tax_Payment__c pmt = new Tax_Payment__c(
            Assessment__c = queriedDraft.Id,
            Amount_Paid__c = 5000.0,
            Amount__c = 5000.0,
            Payment_Method__c = 'UPI',
            Payment_Reference__c = 'RCT-SUITE-PAID-001',
            Transaction_Status__c = 'Success',
            Payment_Status__c = 'SUCCESS',
            Transaction_ID__c = 'TXN-SUITE-PAID-001'
        );
        insert pmt;

        queriedDraft = [SELECT Assessment_Status__c, Total_Amount__c, Outstanding_Amount__c, Amount_Paid__c FROM Tax_Assessment__c WHERE Id = :draftAsm.Id];
        System.assertEquals('PAID', queriedDraft.Assessment_Status__c);

        // Try reverting Paid to Draft
        try {
            queriedDraft.Assessment_Status__c = 'DRAFT';
            update queriedDraft;
            System.assert(false, 'Should prevent reverting Paid assessment to Draft');
        } catch (Exception ex) {
            System.assert(ex.getMessage().contains('Cannot revert a Paid assessment to Draft state'));
        }
        Test.stopTest();
    }
}
