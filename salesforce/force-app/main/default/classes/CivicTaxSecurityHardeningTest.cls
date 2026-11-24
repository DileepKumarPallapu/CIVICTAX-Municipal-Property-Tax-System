/**
 * @description Comprehensive Security Hardening Test Suite for CivicTax 10.0
 * Verifies Authorization, BOLA Prevention, Role Boundaries, Financial Integrity & Rollups
 */
@isTest
private class CivicTaxSecurityHardeningTest {

    @testSetup
    static void setupUsersAndData() {
        User citizen1;
        User citizen2;
        User officer;
        User admin;
        User vOfficer;
        User gOfficer;

        System.runAs(new User(Id = UserInfo.getUserId())) {
            citizen1 = CivicTaxTestDataFactory.createTestUser('Citizen1', 'citizen1.sec@civictax.test', 'Standard User');
            CivicTaxTestDataFactory.assignPermissionSet(citizen1.Id, 'CivicTax_Citizen');

            citizen2 = CivicTaxTestDataFactory.createTestUser('Citizen2', 'citizen2.sec@civictax.test', 'Standard User');
            CivicTaxTestDataFactory.assignPermissionSet(citizen2.Id, 'CivicTax_Citizen');

            officer = CivicTaxTestDataFactory.createTestUser('Officer', 'officer.sec@civictax.test', 'Standard User');
            CivicTaxTestDataFactory.assignPermissionSet(officer.Id, 'CivicTax_Officer');

            admin = CivicTaxTestDataFactory.createTestUser('AdminUser', 'admin.sec@civictax.test', 'Standard User');
            CivicTaxTestDataFactory.assignPermissionSet(admin.Id, 'CivicTax_Admin');

            vOfficer = CivicTaxTestDataFactory.createTestUser('VOfficer', 'vofficer.sec@civictax.test', 'Standard User');
            CivicTaxTestDataFactory.assignPermissionSet(vOfficer.Id, 'CivicTax_Verification');

            gOfficer = CivicTaxTestDataFactory.createTestUser('GOfficer', 'gofficer.sec@civictax.test', 'Standard User');
            CivicTaxTestDataFactory.assignPermissionSet(gOfficer.Id, 'CivicTax_Grievance');
        }

        // Setup property owned by citizen1
        Property__c prop1 = new Property__c(
            Name = 'SEC-PROP-001',
            Property_Number__c = 'SEC-PROP-001',
            Property_Address__c = '100 Security Boulevard',
            Property_Category__c = 'RESIDENTIAL',
            Built_Up_Area__c = 1200.0,
            Zone__c = 'Zone 01',
            Verification_Status__c = 'PENDING',
            OwnerId = citizen1.Id
        );
        insert prop1;

        // Setup assessment for prop1
        Tax_Assessment__c asm1 = new Tax_Assessment__c(
            Property__c = prop1.Id,
            Assessment_Year__c = '2026-2027',
            Base_Value__c = 12000.0,
            Total_Amount__c = 12000.0,
            Amount_Paid__c = 0.0,
            Outstanding_Amount__c = 12000.0,
            Due_Date__c = Date.today().addDays(30),
            Assessment_Status__c = 'APPROVED',
            OwnerId = citizen1.Id
        );
        insert asm1;

        // Setup grievance on prop1
        Grievance__c grv1 = new Grievance__c(
            Property__c = prop1.Id,
            Subject__c = 'Incorrect Assessment Area',
            Description__c = 'Area recorded exceeds survey document',
            Status__c = 'OPEN',
            Priority__c = 'HIGH',
            OwnerId = citizen1.Id
        );
        insert grv1;

        // Setup reassessment request on prop1
        Reassessment_Request__c rr1 = new Reassessment_Request__c(
            Property__c = prop1.Id,
            Original_Assessment__c = asm1.Id,
            Requested_Change__c = 'Adjust area from 1200 to 1000',
            Supporting_Reason__c = 'Revised municipal demarcation',
            Approval_Status__c = 'Submitted',
            OwnerId = citizen1.Id
        );
        insert rr1;

        // Setup distinct property owned by citizen2
        Property__c prop2 = new Property__c(
            Name = 'SEC-PROP-002',
            Property_Number__c = 'SEC-PROP-002',
            Property_Address__c = '200 Citizen Avenue',
            Property_Category__c = 'COMMERCIAL',
            Built_Up_Area__c = 800.0,
            Zone__c = 'Zone 02',
            Verification_Status__c = 'PENDING',
            OwnerId = citizen2.Id
        );
        insert prop2;

        Tax_Assessment__c asm2 = new Tax_Assessment__c(
            Property__c = prop2.Id,
            Assessment_Year__c = '2026-2027',
            Base_Value__c = 8000.0,
            Total_Amount__c = 8000.0,
            Amount_Paid__c = 0.0,
            Outstanding_Amount__c = 8000.0,
            Due_Date__c = Date.today().addDays(30),
            Assessment_Status__c = 'APPROVED',
            OwnerId = citizen2.Id
        );
        insert asm2;

        Grievance__c grv2 = new Grievance__c(
            Property__c = prop2.Id,
            Subject__c = 'Commercial Rate Classification',
            Description__c = 'Commercial multiplier rate dispute',
            Status__c = 'OPEN',
            Priority__c = 'MEDIUM',
            OwnerId = citizen2.Id
        );
        insert grv2;

        Reassessment_Request__c rr2 = new Reassessment_Request__c(
            Property__c = prop2.Id,
            Original_Assessment__c = asm2.Id,
            Requested_Change__c = 'Correct commercial square footage',
            Supporting_Reason__c = 'Mezzanine excluded',
            Approval_Status__c = 'Submitted',
            OwnerId = citizen2.Id
        );
        insert rr2;
    }

    // 1. Citizen Cannot Verify Property via Apex REST (BOLA Protection)
    @isTest
    static void testCitizenCannotVerifyPropertyRest() {
        User citizen = [SELECT Id FROM User WHERE Email = 'citizen1.sec@civictax.test' LIMIT 1];
        Property__c prop = [SELECT Id, Property_Number__c FROM Property__c WHERE Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(citizen) {
            Test.startTest();
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/civictax/v1/properties';
            req.httpMethod = 'PATCH';
            req.requestBody = Blob.valueOf('{"propertyId":"' + prop.Property_Number__c + '","status":"VERIFIED","notes":"Citizen self-verification"}');
            RestContext.request = req;
            RestContext.response = res;

            CivicTaxRestResource.handlePatch();
            Test.stopTest();

            System.assertEquals(403, res.statusCode, 'Citizen must receive 403 Forbidden on property verification');
        }
    }

    // 2. Municipal Officer Can Verify Property via Apex REST
    @isTest
    static void testOfficerCanVerifyPropertyRest() {
        User officer = [SELECT Id FROM User WHERE Email = 'officer.sec@civictax.test' LIMIT 1];
        Property__c prop = [SELECT Id, Property_Number__c FROM Property__c WHERE Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(officer) {
            Test.startTest();
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/civictax/v1/properties';
            req.httpMethod = 'PATCH';
            req.requestBody = Blob.valueOf('{"propertyId":"' + prop.Property_Number__c + '","status":"VERIFIED","notes":"Officer field audit completed"}');
            RestContext.request = req;
            RestContext.response = res;

            CivicTaxRestResource.handlePatch();
            Test.stopTest();

            System.assertEquals(200, res.statusCode, 'Officer verification should succeed with 200 OK');
        }
    }

    // 3. Citizen Cannot Call Apex Property Verification Service
    @isTest
    static void testCitizenCannotVerifyPropertyApex() {
        User citizen = [SELECT Id FROM User WHERE Email = 'citizen1.sec@civictax.test' LIMIT 1];
        Property__c prop = [SELECT Id, Property_Number__c FROM Property__c WHERE Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(citizen) {
            Test.startTest();
            try {
                PropertyService.updateVerificationStatus(prop.Id, 'VERIFIED', 'Unauthorized');
                System.assert(false, 'Should throw SecurityException for citizen');
            } catch (Exception ex) {
                System.assert(ex.getMessage().contains('restricted to Property Verification Officers') || ex.getMessage().contains('Access Denied'));
            }
            Test.stopTest();
        }
    }

    // 4. Citizen Cannot Resolve Grievances (Officer-Only Operation)
    @isTest
    static void testCitizenCannotResolveGrievance() {
        User citizen = [SELECT Id FROM User WHERE Email = 'citizen1.sec@civictax.test' LIMIT 1];
        Grievance__c grv = [SELECT Id FROM Grievance__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(citizen) {
            Test.startTest();
            try {
                CivicTaxGrievanceService.resolveGrievance(grv.Id, 'Self resolution by citizen');
                System.assert(false, 'Citizen must not be allowed to resolve grievances');
            } catch (Exception ex) {
                System.assert(ex.getMessage().contains('restricted to Grievance Redressal Officers') || ex.getMessage().contains('Access Denied'));
            }
            Test.stopTest();
        }
    }

    // 5. Officer Can Resolve Grievance
    @isTest
    static void testOfficerCanResolveGrievance() {
        User officer = [SELECT Id FROM User WHERE Email = 'officer.sec@civictax.test' LIMIT 1];
        Grievance__c grv = [SELECT Id FROM Grievance__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(officer) {
            Test.startTest();
            Grievance__c resolved = CivicTaxGrievanceService.resolveGrievance(grv.Id, 'Audited and resolved by ward officer');
            Test.stopTest();

            System.assertEquals('RESOLVED', resolved.Status__c, 'Officer should successfully resolve grievance');
        }
    }

    // 6. Citizen Cannot Approve Reassessments
    @isTest
    static void testCitizenCannotApproveReassessment() {
        User citizen = [SELECT Id FROM User WHERE Email = 'citizen1.sec@civictax.test' LIMIT 1];
        Reassessment_Request__c rr = [SELECT Id FROM Reassessment_Request__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(citizen) {
            Test.startTest();
            try {
                CivicTaxReassessmentService.approveReassessment(rr.Id, 'Self approval');
                System.assert(false, 'Citizen must not be allowed to approve reassessments');
            } catch (Exception ex) {
                System.assert(ex.getMessage().contains('restricted to Valuation Reassessment Officers') || ex.getMessage().contains('Access Denied'));
            }
            Test.stopTest();
        }
    }

    // 7. Officer Can Approve Reassessment
    @isTest
    static void testOfficerCanApproveReassessment() {
        User officer = [SELECT Id FROM User WHERE Email = 'officer.sec@civictax.test' LIMIT 1];
        Reassessment_Request__c rr = [SELECT Id FROM Reassessment_Request__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(officer) {
            Test.startTest();
            Reassessment_Request__c approved = CivicTaxReassessmentService.approveReassessment(rr.Id, 'Approved after survey');
            Test.stopTest();

            System.assertEquals('Approved', approved.Approval_Status__c, 'Officer should successfully approve reassessment');
        }
    }

    // 8. Prevent Direct Status Tampering to PAID Without Payment
    @isTest
    static void testPreventDirectPaidWithoutPayment() {
        Tax_Assessment__c asm = [SELECT Id, Assessment_Status__c, Amount_Paid__c FROM Tax_Assessment__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];
        asm.Assessment_Status__c = 'DRAFT';
        update asm;

        Test.startTest();
        try {
            // Attempt to directly mark PAID without any payment recorded
            asm.Assessment_Status__c = 'PAID';
            update asm;
            System.assert(false, 'Should prevent transitioning to PAID without verified payment');
        } catch (DmlException ex) {
            System.assert(ex.getMessage().contains('without a verified payment transaction'));
        }
        Test.stopTest();
    }

    // 9. Payment Immutability & Deletion Prevention
    @isTest
    static void testPaymentImmutabilityAndNoDelete() {
        Tax_Assessment__c asm = [SELECT Id FROM Tax_Assessment__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        Test.startTest();
        Tax_Payment__c pmt = new Tax_Payment__c(
            Assessment__c = asm.Id,
            Amount_Paid__c = 5000.0,
            Amount__c = 5000.0,
            Payment_Method__c = 'UPI',
            Transaction_ID__c = 'SEC-TXN-IMMUTABLE-01',
            Transaction_Status__c = 'Success',
            Payment_Status__c = 'SUCCESS'
        );
        insert pmt;

        // Try to modify completed payment
        try {
            pmt.Amount_Paid__c = 2000.0;
            update pmt;
            System.assert(false, 'Should prevent modifying completed payment');
        } catch (DmlException ex) {
            System.assert(ex.getMessage().contains('immutable and cannot be modified'));
        }

        // Try to delete completed payment
        try {
            delete pmt;
            System.assert(false, 'Should prevent deleting completed payment');
        } catch (DmlException ex) {
            System.assert(ex.getMessage().contains('cannot be deleted due to statutory financial audit'));
        }
        Test.stopTest();
    }

    // 10. Bulk Payment Trigger Rollup Recalculates Balances Atomically
    @isTest
    static void testBulkPaymentRollup() {
        Tax_Assessment__c asm = [SELECT Id, Total_Amount__c, Amount_Paid__c, Outstanding_Amount__c FROM Tax_Assessment__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        Test.startTest();
        List<Tax_Payment__c> payments = new List<Tax_Payment__c>();
        for (Integer i = 0; i < 4; i++) {
            payments.add(new Tax_Payment__c(
                Assessment__c = asm.Id,
                Amount_Paid__c = 3000.0,
                Amount__c = 3000.0,
                Payment_Method__c = 'NET_BANKING',
                Payment_Reference__c = 'SEC-BULK-REF-' + i,
                Transaction_ID__c = 'SEC-BULK-TXN-' + i,
                Transaction_Status__c = 'Success',
                Payment_Status__c = 'SUCCESS'
            ));
        }
        insert payments;
        Test.stopTest();

        Tax_Assessment__c updatedAsm = [SELECT Id, Amount_Paid__c, Outstanding_Amount__c, Assessment_Status__c FROM Tax_Assessment__c WHERE Id = :asm.Id];
        System.assertEquals(12000.0, updatedAsm.Amount_Paid__c, 'Rollup should sum 4 payments of 3000 to 12000');
        System.assertEquals(0.0, updatedAsm.Outstanding_Amount__c, 'Outstanding should be 0');
        System.assertEquals('PAID', updatedAsm.Assessment_Status__c, 'Assessment should automatically transition to PAID via trigger rollup');
    }

    // 11. Citizen Cannot Access Another Citizen's Property via REST (IDOR/BOLA Protection)
    @isTest
    static void testCitizenCannotAccessAnotherCitizensPropertyViaRest() {
        User citizen2 = [SELECT Id FROM User WHERE Email = 'citizen2.sec@civictax.test' LIMIT 1];
        Property__c prop1 = [SELECT Id, Property_Number__c FROM Property__c WHERE Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(citizen2) {
            Test.startTest();
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/civictax/v1/properties/' + prop1.Property_Number__c;
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = res;

            CivicTaxRestResource.handleGet();
            Test.stopTest();

            System.assertEquals(403, res.statusCode, 'Citizen 2 must receive 403 Forbidden accessing Citizen 1 property');
        }
    }

    // 12. Citizen Cannot Access Dashboard Analytics
    @isTest
    static void testCitizenCannotViewDashboardAnalytics() {
        User citizen = [SELECT Id FROM User WHERE Email = 'citizen1.sec@civictax.test' LIMIT 1];

        System.runAs(citizen) {
            Test.startTest();
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/civictax/v1/dashboard';
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = res;

            CivicTaxRestResource.handleGet();
            Test.stopTest();

            System.assertEquals(403, res.statusCode, 'Citizen must receive 403 Forbidden on dashboard analytics');
        }
    }

    // 13. Municipal Officer Can Access Dashboard Analytics
    @isTest
    static void testOfficerCanViewDashboardAnalytics() {
        User officer = [SELECT Id FROM User WHERE Email = 'officer.sec@civictax.test' LIMIT 1];

        System.runAs(officer) {
            Test.startTest();
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/civictax/v1/dashboard';
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = res;

            CivicTaxRestResource.handleGet();
            Test.stopTest();

            System.assertEquals(200, res.statusCode, 'Officer should successfully receive dashboard analytics');
        }
    }

    // 14. Security Service Helpers & CRUD Verification
    @isTest
    static void testSecurityServiceHelpers() {
        Property__c prop = [SELECT Id FROM Property__c WHERE Property_Number__c = 'SEC-PROP-001' LIMIT 1];
        User citizen = [SELECT Id FROM User WHERE Email = 'citizen1.sec@civictax.test' LIMIT 1];

        Test.startTest();
        System.assert(CivicTaxSecurityService.canReadObject('Property__c'));
        System.assert(CivicTaxSecurityService.canCreateObject('Property__c'));
        System.assert(CivicTaxSecurityService.canUpdateObject('Property__c'));
        System.assertEquals(false, CivicTaxSecurityService.canReadObject('InvalidObject__xyz'));
        System.assertEquals(false, CivicTaxSecurityService.canCreateObject('InvalidObject__xyz'));
        System.assertEquals(false, CivicTaxSecurityService.canUpdateObject('InvalidObject__xyz'));

        List<Property__c> sanitized = (List<Property__c>) CivicTaxSecurityService.sanitizeRecords(
            AccessType.READABLE, 
            [SELECT Id, Name FROM Property__c WHERE Property_Number__c = 'SEC-PROP-001' LIMIT 1]
        );
        System.assertNotEquals(null, sanitized);
        System.assertEquals(null, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, null));

        System.assertEquals(false, CivicTaxSecurityService.canAccessProperty(null));
        System.assert(CivicTaxSecurityService.canAccessProperty(prop.Id));

        // Test citizen calling requireAdmin
        System.runAs(citizen) {
            System.assertEquals(false, CivicTaxSecurityService.isAdmin());
            try {
                CivicTaxSecurityService.requireAdmin();
                System.assert(false, 'Should throw SecurityException for non-admin');
            } catch (CivicTaxSecurityService.SecurityException se) {
                System.assert(se.getMessage().contains('restricted to Municipal Administrators'));
            }
        }
        Test.stopTest();
    }

    // 15. REST Health, List and Error Routing
    @isTest
    static void testRestHealthAndListEndpoints() {
        Test.startTest();
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/civictax/v1/health';
        req.httpMethod = 'GET';
        RestContext.request = req;
        RestContext.response = res;
        CivicTaxRestResource.handleGet();
        System.assertEquals(200, res.statusCode);

        // Test assessments endpoint
        req.requestURI = '/services/apexrest/civictax/v1/assessments';
        res = new RestResponse();
        RestContext.response = res;
        CivicTaxRestResource.handleGet();
        System.assertEquals(200, res.statusCode);

        // Test 404 unknown GET endpoint
        req.requestURI = '/services/apexrest/civictax/v1/unknown-endpoint';
        res = new RestResponse();
        RestContext.response = res;
        CivicTaxRestResource.handleGet();
        System.assertEquals(404, res.statusCode);

        // Test 404 unknown POST endpoint
        req.requestURI = '/services/apexrest/civictax/v1/unknown-post';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf('{}');
        res = new RestResponse();
        RestContext.response = res;
        CivicTaxRestResource.handlePost();
        System.assertEquals(404, res.statusCode);

        // Test 404 unknown PATCH endpoint
        req.requestURI = '/services/apexrest/civictax/v1/unknown-patch';
        req.httpMethod = 'PATCH';
        req.requestBody = Blob.valueOf('{}');
        res = new RestResponse();
        RestContext.response = res;
        CivicTaxRestResource.handlePatch();
        System.assertEquals(404, res.statusCode);
        Test.stopTest();
    }

    // 16. REST POST Resource Operations
    @isTest
    static void testRestPostEndpoints() {
        Tax_Assessment__c asm = [SELECT Id FROM Tax_Assessment__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        Test.startTest();
        // POST properties
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/civictax/v1/properties';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf('{"propertyNumber":"REST-PROP-999","address":"999 Rest Rd","category":"COMMERCIAL","builtUpArea":1500,"zone":"NORTH"}');
        RestContext.request = req;
        RestContext.response = res;
        CivicTaxRestResource.handlePost();
        System.assertEquals(201, res.statusCode);

        // POST payments
        req.requestURI = '/services/apexrest/civictax/v1/payments';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf('{"assessmentId":"' + asm.Id + '","amountPaid":1000.0,"paymentMethod":"UPI","transactionId":"TXN-REST-999"}');
        res = new RestResponse();
        RestContext.response = res;
        CivicTaxRestResource.handlePost();
        System.assertEquals(201, res.statusCode);
        Test.stopTest();
    }

    // 17. Citizen Cannot File Grievance on Another Citizen's Property
    @isTest
    static void testCitizenCannotFileGrievanceOnAnotherCitizensProperty() {
        User citizen2 = [SELECT Id FROM User WHERE Email = 'citizen2.sec@civictax.test' LIMIT 1];
        Property__c prop1 = [SELECT Id FROM Property__c WHERE Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(citizen2) {
            Test.startTest();
            try {
                CivicTaxGrievanceService.submitGrievance(prop1.Id, 'Illegal Extension', 'Neighbor built on setback', 'HIGH');
                System.assert(false, 'Citizen2 should be forbidden from filing grievance on Citizen1 property');
            } catch (CivicTaxSecurityService.SecurityException se) {
                System.assert(se.getMessage().contains('Access Denied'));
            }
            Test.stopTest();
        }
    }

    // 18. Citizen Can File Grievance on Own Property
    @isTest
    static void testCitizenCanFileGrievanceOnOwnProperty() {
        User citizen1 = [SELECT Id FROM User WHERE Email = 'citizen1.sec@civictax.test' LIMIT 1];
        Property__c prop1 = [SELECT Id FROM Property__c WHERE Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(citizen1) {
            Test.startTest();
            Grievance__c grv = CivicTaxGrievanceService.submitGrievance(prop1.Id, 'Bill Discrepancy', 'Meter calculation issue', 'MEDIUM');
            Test.stopTest();

            System.assertNotEquals(null, grv.Id, 'Citizen should successfully file grievance on own property');
            System.assertEquals('OPEN', grv.Status__c);
        }
    }

    // 19. Citizen Cannot File Reassessment on Another Citizen's Property
    @isTest
    static void testCitizenCannotFileReassessmentOnAnotherCitizensProperty() {
        User citizen2 = [SELECT Id FROM User WHERE Email = 'citizen2.sec@civictax.test' LIMIT 1];
        Property__c prop1 = [SELECT Id FROM Property__c WHERE Property_Number__c = 'SEC-PROP-001' LIMIT 1];
        Tax_Assessment__c asm1 = [SELECT Id FROM Tax_Assessment__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(citizen2) {
            Test.startTest();
            try {
                CivicTaxReassessmentService.submitRequest(prop1.Id, asm1.Id, 'Demolished wing', 'Wing removed');
                System.assert(false, 'Citizen2 should be forbidden from submitting reassessment on Citizen1 property');
            } catch (CivicTaxSecurityService.SecurityException se) {
                System.assert(se.getMessage().contains('Access Denied'));
            }
            Test.stopTest();
        }
    }

    // 20. Citizen Can File Reassessment on Own Property
    @isTest
    static void testCitizenCanFileReassessmentOnOwnProperty() {
        User citizen1 = [SELECT Id FROM User WHERE Email = 'citizen1.sec@civictax.test' LIMIT 1];
        Property__c prop1 = [SELECT Id FROM Property__c WHERE Property_Number__c = 'SEC-PROP-001' LIMIT 1];
        Tax_Assessment__c asm1 = [SELECT Id FROM Tax_Assessment__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(citizen1) {
            Test.startTest();
            Reassessment_Request__c rr = CivicTaxReassessmentService.submitRequest(prop1.Id, asm1.Id, 'Reduce area', 'Demolished shed');
            Test.stopTest();

            System.assertNotEquals(null, rr.Id, 'Citizen should successfully submit reassessment on own property');
            System.assertEquals('Submitted', rr.Approval_Status__c);
        }
    }

    // 21. Payment Financial Validation: Positive Amount Enforcement
    @isTest
    static void testPaymentAmountMustBePositive() {
        Tax_Assessment__c asm = [SELECT Id FROM Tax_Assessment__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        Test.startTest();
        try {
            Tax_Payment__c pmt = new Tax_Payment__c(
                Assessment__c = asm.Id,
                Amount_Paid__c = 0.0,
                Amount__c = 0.0,
                Payment_Method__c = 'UPI',
                Transaction_ID__c = 'SEC-ZERO-AMT-01'
            );
            insert pmt;
            System.assert(false, 'Should prevent inserting payment with zero or negative amount');
        } catch (DmlException ex) {
            System.assert(ex.getMessage().contains('strictly greater than zero'));
        }
        Test.stopTest();
    }

    // 22. Payment Financial Validation: Cannot Exceed Outstanding Assessment Balance
    @isTest
    static void testPaymentCannotExceedOutstandingBalance() {
        Tax_Assessment__c asm = [SELECT Id, Outstanding_Amount__c FROM Tax_Assessment__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        Test.startTest();
        try {
            Tax_Payment__c pmt = new Tax_Payment__c(
                Assessment__c = asm.Id,
                Amount_Paid__c = 999999.0,
                Amount__c = 999999.0,
                Payment_Method__c = 'UPI',
                Transaction_ID__c = 'SEC-EXCESS-BAL-01'
            );
            insert pmt;
            System.assert(false, 'Should prevent payment exceeding outstanding balance');
        } catch (DmlException ex) {
            System.assert(ex.getMessage().contains('exceeds the outstanding assessment balance'));
        }
        Test.stopTest();
    }

    // 23. Payment Security: Ownership Cannot Be Altered Once Created
    @isTest
    static void testPaymentOwnershipCannotBeModified() {
        Tax_Assessment__c asm = [SELECT Id FROM Tax_Assessment__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];
        User citizen2 = [SELECT Id FROM User WHERE Email = 'citizen2.sec@civictax.test' LIMIT 1];

        Tax_Payment__c pmt = new Tax_Payment__c(
            Assessment__c = asm.Id,
            Amount_Paid__c = 1000.0,
            Amount__c = 1000.0,
            Payment_Method__c = 'UPI',
            Transaction_ID__c = 'SEC-OWNERSHIP-TEST-01'
        );
        insert pmt;

        Test.startTest();
        try {
            pmt.OwnerId = citizen2.Id;
            update pmt;
            System.assert(false, 'Payment record ownership modification must be prevented');
        } catch (DmlException ex) {
            System.assert(ex.getMessage().contains('ownership cannot be modified'));
        }
        Test.stopTest();
    }

    // 24. Payment Security: Unauthorized User Cannot Promote Status to SUCCESS
    @isTest
    static void testNonOfficerCannotManipulatePaymentStatusToSuccess() {
        User citizen = [SELECT Id FROM User WHERE Email = 'citizen1.sec@civictax.test' LIMIT 1];
        Tax_Assessment__c asm = [SELECT Id FROM Tax_Assessment__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        Tax_Payment__c pmt = new Tax_Payment__c(
            Assessment__c = asm.Id,
            Amount_Paid__c = 1000.0,
            Amount__c = 1000.0,
            Payment_Method__c = 'UPI',
            Transaction_ID__c = 'SEC-STATUS-TAMPER-01',
            Transaction_Status__c = 'Initiated',
            Payment_Status__c = 'PENDING'
        );
        insert pmt;

        System.runAs(citizen) {
            Test.startTest();
            try {
                pmt.Payment_Status__c = 'SUCCESS';
                pmt.Transaction_Status__c = 'Success';
                update pmt;
                System.assert(false, 'Citizen must be blocked from manipulating payment status to SUCCESS');
            } catch (DmlException ex) {
                System.assert(ex.getMessage().contains('Unauthorized status change') || ex.getMessage().contains('INSUFFICIENT_ACCESS'));
            }
            Test.stopTest();
        }
    }

    // 25. Citizen Cannot Pay For Another Citizen's Assessment via REST
    @isTest
    static void testCitizenCannotPayForAnotherCitizensAssessmentViaRest() {
        User citizen2 = [SELECT Id FROM User WHERE Email = 'citizen2.sec@civictax.test' LIMIT 1];
        Tax_Assessment__c asm1 = [SELECT Id FROM Tax_Assessment__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(citizen2) {
            Test.startTest();
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/civictax/v1/payments';
            req.httpMethod = 'POST';
            req.requestBody = Blob.valueOf('{"assessmentId":"' + asm1.Id + '","amountPaid":1000.0,"paymentMethod":"UPI","transactionId":"TXN-CROSS-CITIZEN-01"}');
            RestContext.request = req;
            RestContext.response = res;

            CivicTaxRestResource.handlePost();
            Test.stopTest();

            System.assertEquals(403, res.statusCode, 'Citizen 2 must be forbidden (403) from paying for Citizen 1 assessment');
        }
    }

    // 26. Property Service Access Control
    @isTest
    static void testPropertyServiceAccessControlForCitizen() {
        User citizen2 = [SELECT Id FROM User WHERE Email = 'citizen2.sec@civictax.test' LIMIT 1];
        Property__c prop1 = [SELECT Id FROM Property__c WHERE Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(citizen2) {
            Test.startTest();
            try {
                PropertyService.getProperty(prop1.Id);
                System.assert(false, 'Citizen 2 must not be able to get Citizen 1 property');
            } catch (Exception ex) {
                System.assert(ex.getMessage().contains('Access Denied') || ex.getMessage().contains('not found'));
            }
            Test.stopTest();
        }
    }

    // 27. Property Service List Filters To Citizen's Own Properties
    @isTest
    static void testPropertyServiceListFiltersToCitizenProperties() {
        User citizen1 = [SELECT Id FROM User WHERE Email = 'citizen1.sec@civictax.test' LIMIT 1];
        Property__c expectedProperty = [
            SELECT Id
            FROM Property__c
            WHERE Property_Number__c = 'SEC-PROP-001'
            LIMIT 1
        ];

        System.runAs(citizen1) {
            Test.startTest();
            List<Property__c> props = PropertyService.listProperties(null, null, null);
            Test.stopTest();

            System.assertEquals(1, props.size(), 'Citizen 1 should only see their 1 owned property');
            System.assertEquals(expectedProperty.Id, props[0].Id);
        }
    }

    // 28. Assessment Service Access Control
    @isTest
    static void testAssessmentServiceAccessControl() {
        User citizen2 = [SELECT Id FROM User WHERE Email = 'citizen2.sec@civictax.test' LIMIT 1];
        User citizen1 = [SELECT Id FROM User WHERE Email = 'citizen1.sec@civictax.test' LIMIT 1];
        Property__c prop1 = [SELECT Id FROM Property__c WHERE Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(citizen2) {
            try {
                CivicTaxAssessmentService.getAssessmentsForProperty(prop1.Id);
                System.assert(false, 'Citizen 2 must not access Citizen 1 assessments');
            } catch (CivicTaxSecurityService.SecurityException se) {
                System.assert(se.getMessage().contains('Access Denied'));
            }
        }

        System.runAs(citizen1) {
            Test.startTest();
            List<Tax_Assessment__c> asms = CivicTaxAssessmentService.getAssessmentsForProperty(prop1.Id);
            Test.stopTest();
            System.assertEquals(1, asms.size(), 'Citizen 1 should view their own assessment');
        }
    }

    // 29. Dashboard Service Access Control
    @isTest
    static void testDashboardServiceAccessControl() {
        User citizen = [SELECT Id FROM User WHERE Email = 'citizen1.sec@civictax.test' LIMIT 1];
        User officer = [SELECT Id FROM User WHERE Email = 'officer.sec@civictax.test' LIMIT 1];

        System.runAs(citizen) {
            try {
                CivicTaxDashboardService.getExecutiveMetrics();
                System.assert(false, 'Citizen must not access executive dashboard metrics');
            } catch (CivicTaxSecurityService.SecurityException se) {
                System.assert(se.getMessage().contains('Access Denied'));
            }
        }

        System.runAs(officer) {
            Test.startTest();
            CivicTaxDashboardService.DashboardMetrics m = CivicTaxDashboardService.getExecutiveMetrics();
            Test.stopTest();
            System.assertNotEquals(null, m);
            System.assert(m.totalProperties >= 1);
        }
    }

    // 30. Additional Coverage for CivicTaxPaymentService validations & listing
    @isTest
    static void testPaymentServiceCoverage() {
        Tax_Assessment__c asm = [SELECT Id, Outstanding_Amount__c FROM Tax_Assessment__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        Test.startTest();
        // Null assessmentId
        try {
            CivicTaxPaymentService.processPayment(null, 1000.0, 'UPI', 'TXN-COV-01');
            System.assert(false);
        } catch (CivicTaxPaymentService.PaymentException ex) {
            System.assert(ex.getMessage().contains('Assessment ID is required'));
        }

        // Invalid amount <= 0
        try {
            CivicTaxPaymentService.processPayment(asm.Id, -50.0, 'UPI', 'TXN-COV-02');
            System.assert(false);
        } catch (CivicTaxPaymentService.PaymentException ex) {
            System.assert(ex.getMessage().contains('strictly greater than zero'));
        }

        // Blank transactionId
        try {
            CivicTaxPaymentService.processPayment(asm.Id, 100.0, 'UPI', '');
            System.assert(false);
        } catch (CivicTaxPaymentService.PaymentException ex) {
            System.assert(ex.getMessage().contains('Gateway Transaction ID is mandatory'));
        }

        // Exceeds outstanding balance
        try {
            CivicTaxPaymentService.processPayment(asm.Id, 999999.0, 'UPI', 'TXN-COV-03');
            System.assert(false);
        } catch (CivicTaxPaymentService.PaymentException ex) {
            System.assert(ex.getMessage().contains('cannot exceed total outstanding dues'));
        }

        // List payments for assessment
        List<Tax_Payment__c> emptyList = CivicTaxPaymentService.getPaymentsForAssessment(null);
        System.assertEquals(0, emptyList.size());

        List<Tax_Payment__c> pmts = CivicTaxPaymentService.getPaymentsForAssessment(asm.Id);
        System.assertNotEquals(null, pmts);
        Test.stopTest();
    }

    // 31. Additional REST Citizen & Error Routing Coverage
    @isTest
    static void testRestCitizenRoutesAndErrorBranches() {
        User citizen1 = [SELECT Id FROM User WHERE Email = 'citizen1.sec@civictax.test' LIMIT 1];
        Property__c prop1 = [SELECT Id, Property_Number__c FROM Property__c WHERE Property_Number__c = 'SEC-PROP-001' LIMIT 1];

        System.runAs(citizen1) {
            Test.startTest();
            // Citizen GET properties list
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/civictax/v1/properties';
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = res;
            CivicTaxRestResource.handleGet();
            System.assertEquals(200, res.statusCode);

            // Citizen GET own property by ID
            req.requestURI = '/services/apexrest/civictax/v1/properties/' + prop1.Id;
            res = new RestResponse();
            RestContext.response = res;
            CivicTaxRestResource.handleGet();
            System.assertEquals(200, res.statusCode);

            // Citizen GET assessments list
            req.requestURI = '/services/apexrest/civictax/v1/assessments';
            res = new RestResponse();
            RestContext.response = res;
            CivicTaxRestResource.handleGet();
            System.assertEquals(200, res.statusCode);

            // POST with invalid body to exercise catch blocks
            req.requestURI = '/services/apexrest/civictax/v1/properties';
            req.httpMethod = 'POST';
            req.requestBody = Blob.valueOf('{"invalid":"json');
            res = new RestResponse();
            RestContext.response = res;
            CivicTaxRestResource.handlePost();
            System.assertEquals(400, res.statusCode);

            // PATCH with invalid body to exercise catch blocks
            req.requestURI = '/services/apexrest/civictax/v1/properties';
            req.httpMethod = 'PATCH';
            req.requestBody = Blob.valueOf('{"invalid":"json');
            res = new RestResponse();
            RestContext.response = res;
            CivicTaxRestResource.handlePatch();
            System.assertEquals(403, res.statusCode);
            Test.stopTest();
        }
    }

    // 32. Payment Status Transition from Pending to Success Rolls Up Balance
    @isTest
    static void testPaymentStatusTransitionPendingToSuccessRollsUpBalance() {
        Tax_Assessment__c asm = [
            SELECT Id, Total_Amount__c, Amount_Paid__c, Outstanding_Amount__c, Assessment_Status__c 
            FROM Tax_Assessment__c 
            WHERE Property__r.Property_Number__c = 'SEC-PROP-001' 
            LIMIT 1
        ];
        User admin = [SELECT Id FROM User WHERE Email = 'admin.sec@civictax.test' LIMIT 1];

        Tax_Payment__c pmt = new Tax_Payment__c(
            Assessment__c = asm.Id,
            Amount_Paid__c = 5000.0,
            Amount__c = 5000.0,
            Payment_Method__c = 'UPI',
            Transaction_ID__c = 'SEC-LIFECYCLE-TRANS-01',
            Transaction_Status__c = 'Initiated',
            Payment_Status__c = 'PENDING',
            OwnerId = admin.Id
        );
        insert pmt;

        // Prior to success transition, assessment balance remains unaffected
        Tax_Assessment__c asmInitial = [
            SELECT Amount_Paid__c, Outstanding_Amount__c, Assessment_Status__c 
            FROM Tax_Assessment__c 
            WHERE Id = :asm.Id
        ];
        System.assertEquals(0.0, asmInitial.Amount_Paid__c);
        System.assertEquals(12000.0, asmInitial.Outstanding_Amount__c);

        // Municipal Administrator transitions payment to Success
        System.runAs(admin) {
            Test.startTest();
            pmt.Transaction_Status__c = 'Success';
            pmt.Payment_Status__c = 'SUCCESS';
            update pmt;
            Test.stopTest();
        }

        // Verify assessment rollup automatically updated
        Tax_Assessment__c asmUpdated = [
            SELECT Amount_Paid__c, Outstanding_Amount__c, Assessment_Status__c 
            FROM Tax_Assessment__c 
            WHERE Id = :asm.Id
        ];
        System.assertEquals(5000.0, asmUpdated.Amount_Paid__c, 'Assessment Amount_Paid__c must roll up to 5000');
        System.assertEquals(7000.0, asmUpdated.Outstanding_Amount__c, 'Outstanding balance must reduce to 7000');
        System.assertEquals('PARTIALLY_PAID', asmUpdated.Assessment_Status__c, 'Assessment status must transition to PARTIALLY_PAID');
    }

    // 33. Reparenting Payment Recalculates Both Source and Target Assessments
    @isTest
    static void testPaymentAssessmentReparentingRollsUpBothAssessments() {
        Tax_Assessment__c asm1 = [
            SELECT Id, Total_Amount__c, Amount_Paid__c, Outstanding_Amount__c 
            FROM Tax_Assessment__c 
            WHERE Property__r.Property_Number__c = 'SEC-PROP-001' 
            LIMIT 1
        ];
        Tax_Assessment__c asm2 = [
            SELECT Id, Total_Amount__c, Amount_Paid__c, Outstanding_Amount__c 
            FROM Tax_Assessment__c 
            WHERE Property__r.Property_Number__c = 'SEC-PROP-002' 
            LIMIT 1
        ];
        User admin = [SELECT Id FROM User WHERE Email = 'admin.sec@civictax.test' LIMIT 1];

        // Insert pending payment on asm1
        Tax_Payment__c pmt = new Tax_Payment__c(
            Assessment__c = asm1.Id,
            Amount_Paid__c = 3000.0,
            Amount__c = 3000.0,
            Payment_Method__c = 'CARD',
            Transaction_ID__c = 'SEC-REPARENT-TXN-01',
            Transaction_Status__c = 'Initiated',
            Payment_Status__c = 'PENDING',
            OwnerId = admin.Id
        );
        insert pmt;

        // Admin reparents payment to asm2 and marks SUCCESS
        System.runAs(admin) {
            Test.startTest();
            pmt.Assessment__c = asm2.Id;
            pmt.Transaction_Status__c = 'Success';
            pmt.Payment_Status__c = 'SUCCESS';
            update pmt;
            Test.stopTest();
        }

        // Verify asm1 has 0 paid, 12000 outstanding
        Tax_Assessment__c updatedAsm1 = [
            SELECT Amount_Paid__c, Outstanding_Amount__c, Assessment_Status__c 
            FROM Tax_Assessment__c 
            WHERE Id = :asm1.Id
        ];
        System.assertEquals(0.0, updatedAsm1.Amount_Paid__c);
        System.assertEquals(12000.0, updatedAsm1.Outstanding_Amount__c);

        // Verify asm2 has 3000 paid, 5000 outstanding, PARTIALLY_PAID
        Tax_Assessment__c updatedAsm2 = [
            SELECT Amount_Paid__c, Outstanding_Amount__c, Assessment_Status__c 
            FROM Tax_Assessment__c 
            WHERE Id = :asm2.Id
        ];
        System.assertEquals(3000.0, updatedAsm2.Amount_Paid__c);
        System.assertEquals(5000.0, updatedAsm2.Outstanding_Amount__c);
        System.assertEquals('PARTIALLY_PAID', updatedAsm2.Assessment_Status__c);
    }

    // 34. Specialist Permission Sets: Separate Grievance and Verification Capabilities
    @isTest
    static void testSpecialistPermissionSetSeparation() {
        User vOfficer = [SELECT Id FROM User WHERE Email = 'vofficer.sec@civictax.test' LIMIT 1];
        User gOfficer = [SELECT Id FROM User WHERE Email = 'gofficer.sec@civictax.test' LIMIT 1];
        Property__c prop1 = [SELECT Id FROM Property__c WHERE Property_Number__c = 'SEC-PROP-001' LIMIT 1];
        Property__c prop2 = [SELECT Id FROM Property__c WHERE Property_Number__c = 'SEC-PROP-002' LIMIT 1];
        Grievance__c grv1 = [SELECT Id FROM Grievance__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];
        Grievance__c grv2 = [SELECT Id FROM Grievance__c WHERE Property__r.Property_Number__c = 'SEC-PROP-002' LIMIT 1];

        // 1. Verification specialist CAN verify property, but CANNOT resolve grievance
        System.runAs(vOfficer) {
            Test.startTest();
            // Can verify
            Property__c verifiedProp = PropertyService.updateVerificationStatus(prop1.Id, 'VERIFIED', 'Field survey passed');
            System.assertEquals('VERIFIED', verifiedProp.Verification_Status__c);

            // Cannot resolve grievance
            try {
                CivicTaxGrievanceService.resolveGrievance(grv1.Id, 'Unauthorized grievance attempt');
                System.assert(false, 'Verification specialist must not be allowed to resolve grievances');
            } catch (CivicTaxSecurityService.SecurityException se) {
                System.assert(se.getMessage().contains('Grievance Redressal Officers'));
            }
            Test.stopTest();
        }

        // 2. Grievance specialist CAN resolve grievance, but CANNOT verify property
        System.runAs(gOfficer) {
            // Can resolve grievance
            Grievance__c resolved = CivicTaxGrievanceService.resolveGrievance(grv2.Id, 'Resolution by grievance specialist');
            System.assertEquals('RESOLVED', resolved.Status__c);

            // Cannot verify property
            try {
                PropertyService.updateVerificationStatus(prop2.Id, 'VERIFIED', 'Unauthorized verification attempt');
                System.assert(false, 'Grievance specialist must not be allowed to verify properties');
            } catch (CivicTaxSecurityService.SecurityException se) {
                System.assert(se.getMessage().contains('Property Verification Officers'));
            }
        }
    }

    // 35. Uncompleted Payment Deletion Safely Executes After-Delete Rollup
    @isTest
    static void testUncompletedPaymentDeletionRollup() {
        Tax_Assessment__c asm = [
            SELECT Id, Outstanding_Amount__c, Total_Amount__c 
            FROM Tax_Assessment__c 
            WHERE Property__r.Property_Number__c = 'SEC-PROP-001' 
            LIMIT 1
        ];

        Tax_Payment__c pendingPmt = new Tax_Payment__c(
            Assessment__c = asm.Id,
            Amount_Paid__c = 2000.0,
            Amount__c = 2000.0,
            Payment_Method__c = 'NET_BANKING',
            Transaction_ID__c = 'SEC-DEL-PENDING-01',
            Transaction_Status__c = 'Initiated',
            Payment_Status__c = 'PENDING'
        );
        insert pendingPmt;

        Test.startTest();
        delete pendingPmt;
        Test.stopTest();

        Tax_Assessment__c updatedAsm = [
            SELECT Amount_Paid__c, Outstanding_Amount__c, Assessment_Status__c 
            FROM Tax_Assessment__c 
            WHERE Id = :asm.Id
        ];
        System.assertEquals(0.0, updatedAsm.Amount_Paid__c);
        System.assertEquals(12000.0, updatedAsm.Outstanding_Amount__c);
    }

    // 36. Payment Trigger Handler Guard Clauses and Recursion Protection Coverage
    @isTest
    static void testPaymentTriggerHandlerCoverage() {
        Test.startTest();
        // Guard clauses
        CivicTaxPaymentTriggerHandler.rollupAssessmentBalances(null);
        CivicTaxPaymentTriggerHandler.rollupAssessmentBalances(new Set<Id>());

        // Recursion prevention branches
        CivicTaxRecursionControl.isPaymentTriggerRunning = true;
        CivicTaxPaymentTriggerHandler.handleAfterInsert(new List<Tax_Payment__c>());
        CivicTaxPaymentTriggerHandler.handleAfterUpdate(new List<Tax_Payment__c>(), new Map<Id, Tax_Payment__c>());
        CivicTaxPaymentTriggerHandler.handleAfterDelete(new List<Tax_Payment__c>());
        CivicTaxRecursionControl.isPaymentTriggerRunning = false;

        // Insert payment without explicit reference or status to cover defaults
        Tax_Assessment__c asm = [SELECT Id FROM Tax_Assessment__c WHERE Property__r.Property_Number__c = 'SEC-PROP-001' LIMIT 1];
        Tax_Payment__c defaultPmt = new Tax_Payment__c(
            Assessment__c = asm.Id,
            Amount_Paid__c = 500.0,
            Payment_Method__c = 'CASH_COUNTER',
            Transaction_ID__c = 'SEC-COV-TXN-01'
        );
        insert defaultPmt;

        Tax_Payment__c queriedPmt = [SELECT Payment_Reference__c, Transaction_Status__c FROM Tax_Payment__c WHERE Id = :defaultPmt.Id];
        System.assertNotEquals(null, queriedPmt.Payment_Reference__c);
        System.assertEquals('Initiated', queriedPmt.Transaction_Status__c);
        Test.stopTest();
    }
}