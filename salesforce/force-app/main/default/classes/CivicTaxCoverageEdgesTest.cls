@IsTest
private class CivicTaxCoverageEdgesTest {

    private static Account createAccount() {
        Account account = new Account(Name = 'CivicTax Coverage Account');
        insert account;
        return account;
    }

    private static Contact createContact(Account account) {
        Contact contact = new Contact(
            LastName = 'Coverage Citizen',
            AccountId = account.Id
        );
        insert contact;
        return contact;
    }

    private static CivicTax_User__c createIdentity(
        Account account,
        Contact contact,
        String civicTaxId,
        String role,
        String status,
        String contactId
    ) {
        CivicTax_User__c user = new CivicTax_User__c(
            CivicTax_ID__c = civicTaxId,
            Salesforce_Contact_ID__c = contactId,
            Full_Name__c = 'Coverage Citizen',
            Email__c = civicTaxId + '@example.invalid',
            Role__c = role,
            Account_Status__c = status
        );
        insert user;
        return user;
    }

    @IsTest
    static void identityMappingFailuresAreRejected() {
        CivicTaxSecurityService.clearRequestIdentity();

        Boolean missingIdentity = false;
        try {
            CivicTaxSecurityService.getCurrentCivicTaxUser();
        } catch (CivicTaxSecurityService.SecurityException ex) {
            missingIdentity = ex.getMessage().contains('not been initialized');
        }
        System.assertEquals(true, missingIdentity);

        CivicTaxSecurityService.setRequestIdentity('missing-identity');
        Boolean noMapping = false;
        try {
            CivicTaxSecurityService.getCurrentCivicTaxUser();
        } catch (CivicTaxSecurityService.SecurityException ex) {
            noMapping = ex.getMessage().contains('No CivicTax user mapping');
        }
        System.assertEquals(true, noMapping);

        Account account = createAccount();
        Contact contact = createContact(account);
        createIdentity(account, contact, 'inactive-identity', 'CITIZEN', 'INACTIVE', String.valueOf(contact.Id));
        CivicTaxSecurityService.setRequestIdentity('inactive-identity');
        Boolean inactive = false;
        try {
            CivicTaxSecurityService.getCurrentCivicTaxUser();
        } catch (CivicTaxSecurityService.SecurityException ex) {
            inactive = ex.getMessage().contains('not active');
        }
        System.assertEquals(true, inactive);

        createIdentity(account, contact, 'officer-identity', 'OFFICER', 'ACTIVE', String.valueOf(contact.Id));
        CivicTaxSecurityService.setRequestIdentity('officer-identity');
        System.assertEquals(true, CivicTaxSecurityService.isOfficerOrAdmin());
        System.assertEquals(false, CivicTaxSecurityService.isCitizen());
        System.assertEquals(true, CivicTaxSecurityService.canResolveGrievance());
        System.assertEquals(true, CivicTaxSecurityService.canApproveReassessment());

        CivicTaxSecurityService.clearRequestIdentity();
    }

    @IsTest
    static void invalidIdentityContactMappingsAreRejected() {
        Account account = createAccount();
        Contact contact = createContact(account);

        createIdentity(account, contact, 'blank-contact', 'CITIZEN', 'ACTIVE', '');
        CivicTaxSecurityService.setRequestIdentity('blank-contact');
        Boolean blankContact = false;
        try {
            CivicTaxSecurityService.getCurrentCitizenContactId();
        } catch (CivicTaxSecurityService.SecurityException ex) {
            blankContact = ex.getMessage().contains('not linked');
        }
        System.assertEquals(true, blankContact);

        createIdentity(account, contact, 'invalid-contact', 'CITIZEN', 'ACTIVE', 'not-an-id');
        CivicTaxSecurityService.setRequestIdentity('invalid-contact');
        Boolean invalidContact = false;
        try {
            CivicTaxSecurityService.getCurrentCitizenContactId();
        } catch (CivicTaxSecurityService.SecurityException ex) {
            invalidContact = ex.getMessage().contains('invalid');
        }
        System.assertEquals(true, invalidContact);

        createIdentity(account, contact, 'missing-contact', 'CITIZEN', 'ACTIVE', '001000000000000AAA');
        CivicTaxSecurityService.setRequestIdentity('missing-contact');
        Boolean missingContact = false;
        try {
            CivicTaxSecurityService.getCurrentCitizenContactId();
        } catch (CivicTaxSecurityService.SecurityException ex) {
            missingContact = ex.getMessage().contains('does not exist');
        }
        System.assertEquals(true, missingContact);

        CivicTaxSecurityService.clearRequestIdentity();
    }

    @IsTest
    static void reassessmentAndGrievanceRejectInvalidInputs() {
        Boolean reassessmentNullProperty = false;
        try {
            CivicTaxReassessmentService.submitRequest(null, null, 'Change', 'Reason');
        } catch (CivicTaxReassessmentService.ReassessmentException ex) {
            reassessmentNullProperty = ex.getMessage().contains('mandatory');
        }
        System.assertEquals(true, reassessmentNullProperty);

        Property__c propertyRecord = new Property__c(
            Property_Number__c = 'EDGE-PROP-001',
            Property_Address__c = '1 Edge Street',
            Zone__c = 'Zone 01',
            Property_Category__c = 'RESIDENTIAL',
            Built_Up_Area__c = 1000.0
        );
        insert propertyRecord;

        Boolean reassessmentBlankChange = false;
        try {
            CivicTaxReassessmentService.submitRequest(propertyRecord.Id, null, '', 'Reason');
        } catch (CivicTaxReassessmentService.ReassessmentException ex) {
            reassessmentBlankChange = ex.getMessage().contains('dimensional');
        }
        System.assertEquals(true, reassessmentBlankChange);

        Boolean reassessmentNullApproval = false;
        try {
            CivicTaxReassessmentService.approveReassessment(null, 'Approved');
        } catch (CivicTaxReassessmentService.ReassessmentException ex) {
            reassessmentNullApproval = ex.getMessage().contains('cannot be null');
        }
        System.assertEquals(true, reassessmentNullApproval);

        Boolean grievanceBlankFields = false;
        try {
            CivicTaxGrievanceService.submitGrievance(propertyRecord.Id, '', '', 'HIGH');
        } catch (CivicTaxGrievanceService.GrievanceException ex) {
            grievanceBlankFields = ex.getMessage().contains('mandatory');
        }
        System.assertEquals(true, grievanceBlankFields);

        Boolean grievanceNullResolution = false;
        try {
            CivicTaxGrievanceService.resolveGrievance(null, 'Resolved');
        } catch (CivicTaxGrievanceService.GrievanceException ex) {
            grievanceNullResolution = ex.getMessage().contains('cannot be null');
        }
        System.assertEquals(true, grievanceNullResolution);

        Boolean grievanceBlankResolution = false;
        try {
            CivicTaxGrievanceService.resolveGrievance(propertyRecord.Id, '');
        } catch (CivicTaxGrievanceService.GrievanceException ex) {
            grievanceBlankResolution = ex.getMessage().contains('Mandatory');
        }
        System.assertEquals(true, grievanceBlankResolution);
    }

    @IsTest
    static void propertyAndTriggerEdgeCasesAreHandled() {
        Property__c propertyRecord = new Property__c(
            Property_Number__c = 'EDGE-PROP-002',
            Property_Address__c = '2 Edge Street',
            Zone__c = 'Zone 02',
            Property_Category__c = 'COMMERCIAL',
            Built_Up_Area__c = 2000.0
        );
        insert propertyRecord;

        propertyRecord.Verification_Status__c = 'VERIFIED';
        update propertyRecord;

        Boolean revertBlocked = false;
        try {
            propertyRecord.Verification_Status__c = 'PENDING';
            update propertyRecord;
        } catch (DmlException ex) {
            revertBlocked = ex.getMessage().contains('Cannot revert');
        }
        System.assertEquals(true, revertBlocked);

        Property__c missingNumber = new Property__c(
            Property_Address__c = 'Missing Number',
            Zone__c = 'Zone 01',
            Property_Category__c = 'RESIDENTIAL',
            Built_Up_Area__c = 100.0
        );
        Boolean mandatoryNumber = false;
        try {
            CivicTaxPropertyService.registerProperty(missingNumber);
        } catch (CivicTaxPropertyService.PropertyServiceException ex) {
            mandatoryNumber = ex.getMessage().contains('mandatory');
        }
        System.assertEquals(true, mandatoryNumber);

        Property__c invalidArea = new Property__c(
            Property_Number__c = 'EDGE-PROP-003',
            Property_Address__c = '3 Edge Street',
            Zone__c = 'Zone 01',
            Property_Category__c = 'RESIDENTIAL',
            Built_Up_Area__c = 0.0
        );
        Boolean invalidAreaRejected = false;
        try {
            CivicTaxPropertyService.registerProperty(invalidArea);
        } catch (CivicTaxPropertyService.PropertyServiceException ex) {
            invalidAreaRejected = ex.getMessage().contains('greater than zero');
        }
        System.assertEquals(true, invalidAreaRejected);
    }

    @IsTest
    static void restPayloadInvalidInputIsRejectedSafely() {
        RestRequest request = new RestRequest();
        RestResponse response = new RestResponse();
        request.requestURI = '/services/apexrest/civictax/v1/properties';
        request.httpMethod = 'POST';
        request.requestBody = Blob.valueOf(
            '{"propertyNumber":"EDGE-PROP-004","address":"4 Edge Street","category":"RESIDENTIAL","builtUpArea":"not-a-number","zone":"Zone 01"}'
        );
        RestContext.request = request;
        RestContext.response = response;

        CivicTaxRestResource.handlePost();

        System.assertEquals(400, response.statusCode);
        System.assert(response.responseBody.toString().contains('BAD_REQUEST'));
    }

    @IsTest
    static void restRejectsInvalidIdentifiersWithSafeValidationErrors() {
        RestRequest request = new RestRequest();
        RestResponse response = new RestResponse();
        request.requestURI = '/services/apexrest/civictax/v1/reassessments/not-an-id';
        request.httpMethod = 'GET';
        RestContext.request = request;
        RestContext.response = response;

        CivicTaxRestResource.handleGet();

        String responseText = response.responseBody.toString();
        System.assertEquals(400, response.statusCode);
        System.assert(responseText.contains('Property ID is invalid.'));
        System.assertEquals(false, responseText.contains('System.TypeException'));
    }

    @IsTest
    static void recursionControlCanBeResetAndMarked() {
        CivicTaxRecursionControl.resetAll();
        Property__c propertyRecord = new Property__c(
            Property_Number__c = 'EDGE-PROP-005',
            Property_Address__c = '5 Edge Street',
            Zone__c = 'Zone 01',
            Property_Category__c = 'RESIDENTIAL',
            Built_Up_Area__c = 100.0
        );
        insert propertyRecord;

        CivicTaxRecursionControl.markPropertyProcessed(null);
        CivicTaxRecursionControl.markPropertyProcessed(propertyRecord.Id);
        System.assertEquals(false, CivicTaxRecursionControl.isPropertyProcessed(null));
        System.assertEquals(true, CivicTaxRecursionControl.isPropertyProcessed(propertyRecord.Id));

        CivicTaxRecursionControl.markAssessmentProcessed(propertyRecord.Id);
        CivicTaxRecursionControl.markPaymentProcessed(propertyRecord.Id);
        CivicTaxRecursionControl.reset();
        System.assertEquals(false, CivicTaxRecursionControl.isAssessmentProcessed(propertyRecord.Id));
        System.assertEquals(false, CivicTaxRecursionControl.isPaymentProcessed(propertyRecord.Id));
    }
}
