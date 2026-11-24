@IsTest
private class CivicTaxGatewayAuthTest {
    private static final String SECRET = 'civictax-unit-test-secret-2026-with-more-than-32-bytes';

    private static CivicTax_User__c createCitizen() {
        Account account = new Account(Name = 'CivicTax Gateway Test Account');
        insert account;
        Contact contact = new Contact(LastName = 'Gateway Test Citizen', AccountId = account.Id);
        insert contact;
        CivicTax_User__c citizen = new CivicTax_User__c(
            CivicTax_ID__c = 'gateway-test-citizen',
            Salesforce_Contact_ID__c = String.valueOf(contact.Id),
            Full_Name__c = 'Gateway Test Citizen',
            Email__c = 'gateway-test@example.invalid',
            Role__c = 'CITIZEN',
            Account_Status__c = 'ACTIVE'
        );
        insert citizen;
        return citizen;
    }

    private static void configureSecret() {
        CivicTax_Gateway_Config__c settings = new CivicTax_Gateway_Config__c(
            SetupOwnerId = UserInfo.getOrganizationId(),
            Shared_Secret__c = SECRET
        );
        upsert settings;
    }

    private static RestRequest buildRequest(String userId, String timestamp, String signature) {
        RestRequest request = new RestRequest();
        request.requestURI = '/services/apexrest/civictax/v1/properties';
        request.httpMethod = 'GET';
        request.addHeader('X-CivicTax-User-Id', userId);
        request.addHeader('X-CivicTax-Timestamp', timestamp);
        request.addHeader('X-CivicTax-Signature', signature);
        return request;
    }

    @IsTest
    static void nodeHmacCompatibilityVector() {
        // Fixed vector generated with Node.js createHmac('sha256', secret).
        String secret = 'civictax-hmac-cross-language-test-secret-2026';
        String canonical = '1730000000\ntest-user\nGET\nproperties\n';
        String signature = EncodingUtil.convertToHex(
            Crypto.generateMac('hmacSHA256', Blob.valueOf(canonical), Blob.valueOf(secret))
        );
        System.assertEquals(
            '34824edc7ad96eb8e1e9d2999c312c33e208fb7dfe6e02e8a03889118d044710',
            signature,
            'Apex HMAC must match the Node.js backend HMAC-SHA256 output.'
        );
    }

    @IsTest
    static void validSignatureSetsExternalIdentity() {
        CivicTax_User__c citizen = createCitizen();
        configureSecret();
        String timestamp = String.valueOf(DateTime.now().getTime() / 1000);
        String canonical = String.join(new List<String>{ timestamp, citizen.CivicTax_ID__c, 'GET', 'properties', '' }, '\n');
        String signature = EncodingUtil.convertToHex(
            Crypto.generateMac('hmacSHA256', Blob.valueOf(canonical), Blob.valueOf(SECRET))
        );

        Test.startTest();
        CivicTaxGatewayAuth.authenticate(buildRequest(citizen.CivicTax_ID__c, timestamp, signature), 'properties', '');
        Test.stopTest();

        System.assertEquals(citizen.CivicTax_ID__c, CivicTaxSecurityService.getRequestIdentity());
        System.assertEquals('CITIZEN', CivicTaxSecurityService.getCurrentCivicTaxUser().Role__c);
    }

    @IsTest
    static void invalidSignatureIsRejected() {
        createCitizen();
        configureSecret();
        String timestamp = String.valueOf(DateTime.now().getTime() / 1000);
        RestRequest request = buildRequest('gateway-test-citizen', timestamp, 'not-a-valid-signature');
        Boolean rejected = false;
        Test.startTest();
        try {
            CivicTaxGatewayAuth.authenticate(request, 'properties', '');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            rejected = true;
        }
        Test.stopTest();
        System.assertEquals(true, rejected, 'An invalid HMAC must be rejected.');
    }

    @IsTest
    static void staleTimestampIsRejected() {
        createCitizen();
        configureSecret();
        String timestamp = String.valueOf((DateTime.now().getTime() / 1000) - 1000);
        String canonical = String.join(new List<String>{ timestamp, 'gateway-test-citizen', 'GET', 'properties', '' }, '\n');
        String signature = EncodingUtil.convertToHex(
            Crypto.generateMac('hmacSHA256', Blob.valueOf(canonical), Blob.valueOf(SECRET))
        );
        Boolean rejected = false;
        try {
            CivicTaxGatewayAuth.authenticate(buildRequest('gateway-test-citizen', timestamp, signature), 'properties', '');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            rejected = true;
        }
        System.assertEquals(true, rejected, 'A stale request signature must be rejected.');
    }

    @IsTest
    static void missingIdentityHeadersAreRejected() {
        RestRequest request = new RestRequest();
        request.requestURI = '/services/apexrest/civictax/v1/properties';
        request.httpMethod = 'GET';
        request.addHeader('X-CivicTax-User-Id', 'gateway-test-citizen');

        Boolean rejected = false;
        try {
            CivicTaxGatewayAuth.authenticate(request, 'properties', '');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            rejected = true;
        }

        System.assertEquals(true, rejected, 'Missing gateway identity headers must be rejected.');
    }

    @IsTest
    static void invalidTimestampIsRejected() {
        RestRequest request = buildRequest(
            'gateway-test-citizen',
            'not-a-timestamp',
            'not-a-signature'
        );

        Boolean rejected = false;
        try {
            CivicTaxGatewayAuth.authenticate(request, 'properties', '');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            rejected = ex.getMessage().contains('timestamp');
        }

        System.assertEquals(true, rejected, 'Invalid gateway timestamps must be rejected.');
    }

    @IsTest
    static void missingConfiguredSecretIsRejected() {
        String timestamp = String.valueOf(DateTime.now().getTime() / 1000);
        RestRequest request = buildRequest('gateway-test-citizen', timestamp, 'signature');

        Boolean rejected = false;
        try {
            CivicTaxGatewayAuth.authenticate(request, 'properties', '');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            rejected = ex.getMessage().contains('secret is not configured');
        }

        System.assertEquals(true, rejected, 'An unconfigured gateway secret must be rejected.');
    }
}
