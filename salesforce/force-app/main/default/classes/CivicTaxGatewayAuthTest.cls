@IsTest
private class CivicTaxGatewayAuthTest {
    private static final String ACTIVE_KEY_ID = 'civictax-test-key-v2';
    private static final String ACTIVE_SECRET = 'test-only-active-key-0123456789abcdef';
    private static final String PREVIOUS_KEY_ID = 'civictax-test-key-v1';
    private static final String PREVIOUS_SECRET = 'test-only-previous-key-0123456789';

    private static CivicTax_User__c createCitizen(String civicTaxId, String displayName) {
        Account account = new Account(Name = displayName + ' Account');
        insert account;
        Contact contact = new Contact(LastName = displayName, AccountId = account.Id);
        insert contact;
        CivicTax_User__c citizen = new CivicTax_User__c(
            CivicTax_ID__c = civicTaxId,
            Salesforce_Contact_ID__c = String.valueOf(contact.Id),
            Full_Name__c = displayName,
            Email__c = civicTaxId + '@example.invalid',
            Role__c = 'CITIZEN',
            Account_Status__c = 'ACTIVE'
        );
        insert citizen;
        return citizen;
    }

    private static CivicTax_User__c createCitizen() {
        return createCitizen('gateway-test-citizen', 'Gateway Test Citizen');
    }

    private static void configureKeys(
        String activeKeyId,
        String activeSecret,
        String previousKeyId,
        String previousSecret,
        Datetime previousKeyExpiresAt
    ) {
        upsert new CivicTax_Gateway_Config__c(
            SetupOwnerId = UserInfo.getOrganizationId(),
            Key_Id__c = activeKeyId,
            Shared_Secret__c = activeSecret,
            Previous_Key_Id__c = previousKeyId,
            Previous_Shared_Secret__c = previousSecret,
            Previous_Key_Expires_At__c = previousKeyExpiresAt
        );
    }

    private static String buildSignature(
        String secret,
        String keyId,
        String nonce,
        String userId,
        String timestamp,
        String method,
        String endpoint,
        String bodyText
    ) {
        String canonical = String.join(
            new List<String>{
                timestamp,
                keyId,
                nonce,
                userId,
                method,
                endpoint,
                bodyText
            },
            '\n'
        );
        return EncodingUtil.convertToHex(
            Crypto.generateMac('hmacSHA256', Blob.valueOf(canonical), Blob.valueOf(secret))
        );
    }

    private static RestRequest buildRequest(
        String keyId,
        String nonce,
        String userId,
        String timestamp,
        String signature
    ) {
        RestRequest request = new RestRequest();
        request.requestURI = '/services/apexrest/civictax/v1/properties';
        request.httpMethod = 'GET';
        request.addHeader('X-CivicTax-Key-Id', keyId);
        request.addHeader('X-CivicTax-Nonce', nonce);
        request.addHeader('X-CivicTax-User-Id', userId);
        request.addHeader('X-CivicTax-Timestamp', timestamp);
        request.addHeader('X-CivicTax-Signature', signature);
        return request;
    }

    private static RestRequest signedCurrentRequest(String nonce) {
        String userId = 'gateway-test-citizen';
        String timestamp = String.valueOf(DateTime.now().getTime() / 1000);
        return buildRequest(
            ACTIVE_KEY_ID,
            nonce,
            userId,
            timestamp,
            buildSignature(
                ACTIVE_SECRET,
                ACTIVE_KEY_ID,
                nonce,
                userId,
                timestamp,
                'GET',
                'properties',
                ''
            )
        );
    }

    @IsTest
    static void nodeHmacCompatibilityVector() {
        String secret = 'test-only-cross-language-hmac-key-2026';
        String canonical = '1730000000\ntest-key-v1\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\ntest-user\nGET\nproperties\n';
        String signature = EncodingUtil.convertToHex(
            Crypto.generateMac('hmacSHA256', Blob.valueOf(canonical), Blob.valueOf(secret))
        );
        System.assertEquals(
            'dc86a1673d250e50d2d339bf7ee6b5537c5c5b4b494642d1d16bcb55491e0cdd',
            signature,
            'Apex HMAC must match the Node.js backend HMAC-SHA256 output.'
        );
    }

    @IsTest
    static void validSignatureAuthenticatesMappedIdentity() {
        CivicTax_User__c citizen = createCitizen();
        configureKeys(ACTIVE_KEY_ID, ACTIVE_SECRET, null, null, null);
        RestRequest request = signedCurrentRequest('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');

        Test.startTest();
        CivicTaxGatewayAuth.authenticate(request, 'properties', '');
        Test.stopTest();

        System.assertEquals(citizen.CivicTax_ID__c, CivicTaxSecurityService.getRequestIdentity());
        System.assertEquals('CITIZEN', CivicTaxSecurityService.getCurrentCivicTaxUser().Role__c);
        System.assertEquals(1, [SELECT count() FROM CivicTax_Gateway_Nonce__c]);
    }

    @IsTest
    static void restResourceUsesOnlySignatureVerifiedIdentity() {
        CivicTax_User__c citizen = createCitizen();
        configureKeys(ACTIVE_KEY_ID, ACTIVE_SECRET, null, null, null);
        RestContext.request = signedCurrentRequest(
            'IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII'
        );
        RestContext.response = new RestResponse();

        CivicTaxRestResource.handleGet();

        System.assertEquals(200, RestContext.response.statusCode);
        System.assertEquals(
            citizen.CivicTax_ID__c,
            CivicTaxSecurityService.getRequestIdentity()
        );
    }

    @IsTest
    static void externalCitizenCannotReadAnotherCitizensProperty() {
        CivicTax_User__c citizen = createCitizen('gateway-citizen-one', 'First Citizen');
        CivicTax_User__c otherCitizen = createCitizen('gateway-citizen-two', 'Second Citizen');
        Contact otherContact = [
            SELECT Id
            FROM Contact
            WHERE Id = :otherCitizen.Salesforce_Contact_ID__c
        ];
        Property__c otherProperty = new Property__c(
            Name = 'GATEWAY-FOREIGN-PROPERTY',
            Property_Number__c = 'GATEWAY-FOREIGN-PROPERTY',
            Property_Address__c = '200 Other Citizen Street',
            Property_Category__c = 'RESIDENTIAL',
            Built_Up_Area__c = 900,
            Zone__c = 'Zone 02',
            Verification_Status__c = 'PENDING',
            OwnerId = UserInfo.getUserId(),
            Owner__c = otherContact.Id,
            Property_Owner__c = otherContact.Id
        );
        insert otherProperty;

        CivicTaxSecurityService.setRequestIdentity(citizen.CivicTax_ID__c);
        Boolean rejected = false;
        try {
            PropertyService.getProperty(otherProperty.Property_Number__c);
        } catch (CivicTaxSecurityService.SecurityException ex) {
            rejected = true;
        }

        System.assertEquals(true, rejected);
        Boolean foreignPropertyWasListed = false;
        for (Property__c visibleProperty : PropertyService.listProperties(null, null, null)) {
            if (visibleProperty.Id == otherProperty.Id) foreignPropertyWasListed = true;
        }
        System.assertEquals(false, foreignPropertyWasListed);
        CivicTaxSecurityService.clearRequestIdentity();
    }

    @IsTest
    static void invalidSignatureIsRejectedWithoutClaimingNonce() {
        createCitizen();
        configureKeys(ACTIVE_KEY_ID, ACTIVE_SECRET, null, null, null);
        RestRequest request = signedCurrentRequest('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB');
        request.headers.put(
            'X-CivicTax-Signature',
            '0000000000000000000000000000000000000000000000000000000000000000'
        );

        Boolean rejected = false;
        try {
            CivicTaxGatewayAuth.authenticate(request, 'properties', '');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            rejected = ex.getMessage().contains('signature is invalid');
        }

        System.assertEquals(true, rejected, 'Invalid signatures must be rejected.');
        System.assertEquals(0, [SELECT count() FROM CivicTax_Gateway_Nonce__c]);
    }

    @IsTest
    static void authenticationErrorResponseDoesNotExposeKeyOrSignature() {
        createCitizen();
        configureKeys(ACTIVE_KEY_ID, ACTIVE_SECRET, null, null, null);
        RestRequest request = signedCurrentRequest('HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH');
        String suppliedSignature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        request.headers.put('X-CivicTax-Signature', suppliedSignature);
        RestContext.request = request;
        RestContext.response = new RestResponse();

        CivicTaxRestResource.handleGet();

        String responseText = RestContext.response.responseBody.toString();
        System.assertEquals(401, RestContext.response.statusCode);
        System.assertEquals(false, responseText.contains(ACTIVE_SECRET));
        System.assertEquals(false, responseText.contains(suppliedSignature));
        System.assertEquals(false, responseText.contains('HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH'));
    }

    @IsTest
    static void expiredTimestampIsRejected() {
        createCitizen();
        configureKeys(ACTIVE_KEY_ID, ACTIVE_SECRET, null, null, null);
        String userId = 'gateway-test-citizen';
        String nonce = 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC';
        String timestamp = String.valueOf((DateTime.now().getTime() / 1000) - 301);
        RestRequest request = buildRequest(
            ACTIVE_KEY_ID,
            nonce,
            userId,
            timestamp,
            buildSignature(ACTIVE_SECRET, ACTIVE_KEY_ID, nonce, userId, timestamp, 'GET', 'properties', '')
        );

        Boolean rejected = false;
        try {
            CivicTaxGatewayAuth.authenticate(request, 'properties', '');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            rejected = ex.getMessage().contains('expired');
        }

        System.assertEquals(true, rejected, 'Expired timestamps must be rejected.');
        System.assertEquals(0, [SELECT count() FROM CivicTax_Gateway_Nonce__c]);
    }

    @IsTest
    static void replayedNonceIsRejected() {
        createCitizen();
        configureKeys(ACTIVE_KEY_ID, ACTIVE_SECRET, null, null, null);
        RestRequest request = signedCurrentRequest('DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD');
        CivicTaxGatewayAuth.authenticate(request, 'properties', '');

        Boolean rejected = false;
        try {
            CivicTaxGatewayAuth.authenticate(request, 'properties', '');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            rejected = ex.getMessage().contains('replay detected');
        }

        System.assertEquals(true, rejected, 'A replayed nonce must be rejected.');
        System.assertEquals(1, [SELECT count() FROM CivicTax_Gateway_Nonce__c]);
    }

    @IsTest
    static void missingConfigurationFailsClosed() {
        upsert new CivicTax_Gateway_Config__c(
            SetupOwnerId = UserInfo.getOrganizationId()
        );
        RestRequest request = signedCurrentRequest('EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE');

        Boolean rejected = false;
        try {
            CivicTaxGatewayAuth.authenticate(request, 'properties', '');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            rejected = ex.getMessage().contains('not configured');
        }

        System.assertEquals(true, rejected, 'Missing key configuration must fail closed.');
        System.assertEquals(0, [SELECT count() FROM CivicTax_Gateway_Nonce__c]);
    }

    @IsTest
    static void previousKeyWorksOnlyDuringRotationWindow() {
        createCitizen();
        configureKeys(
            ACTIVE_KEY_ID,
            ACTIVE_SECRET,
            PREVIOUS_KEY_ID,
            PREVIOUS_SECRET,
            DateTime.now().addMinutes(2)
        );
        String nonce = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
        String userId = 'gateway-test-citizen';
        String timestamp = String.valueOf(DateTime.now().getTime() / 1000);
        RestRequest request = buildRequest(
            PREVIOUS_KEY_ID,
            nonce,
            userId,
            timestamp,
            buildSignature(PREVIOUS_SECRET, PREVIOUS_KEY_ID, nonce, userId, timestamp, 'GET', 'properties', '')
        );

        CivicTaxGatewayAuth.authenticate(request, 'properties', '');
        System.assertEquals(1, [SELECT count() FROM CivicTax_Gateway_Nonce__c]);
    }

    @IsTest
    static void expiredPreviousKeyIsRejected() {
        createCitizen();
        configureKeys(
            ACTIVE_KEY_ID,
            ACTIVE_SECRET,
            PREVIOUS_KEY_ID,
            PREVIOUS_SECRET,
            DateTime.now().addSeconds(-1)
        );
        String nonce = 'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG';
        String userId = 'gateway-test-citizen';
        String timestamp = String.valueOf(DateTime.now().getTime() / 1000);
        RestRequest request = buildRequest(
            PREVIOUS_KEY_ID,
            nonce,
            userId,
            timestamp,
            buildSignature(PREVIOUS_SECRET, PREVIOUS_KEY_ID, nonce, userId, timestamp, 'GET', 'properties', '')
        );

        Boolean rejected = false;
        try {
            CivicTaxGatewayAuth.authenticate(request, 'properties', '');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            rejected = ex.getMessage().contains('unknown or expired');
        }

        System.assertEquals(true, rejected, 'Expired rotation keys must be rejected.');
        System.assertEquals(0, [SELECT count() FROM CivicTax_Gateway_Nonce__c]);
    }

    @IsTest
    static void cleanupBatchRemovesOnlyExpiredNonceRows() {
        String expiredKey = EncodingUtil.convertToHex(
            Crypto.generateDigest('SHA-256', Blob.valueOf('expired-nonce'))
        );
        String currentKey = EncodingUtil.convertToHex(
            Crypto.generateDigest('SHA-256', Blob.valueOf('current-nonce'))
        );
        insert new List<CivicTax_Gateway_Nonce__c>{
            new CivicTax_Gateway_Nonce__c(
                Request_Key__c = expiredKey,
                Expires_At__c = DateTime.now().addSeconds(-1)
            ),
            new CivicTax_Gateway_Nonce__c(
                Request_Key__c = currentKey,
                Expires_At__c = DateTime.now().addMinutes(5)
            )
        };

        Test.startTest();
        Database.executeBatch(new CivicTaxGatewayNonceCleanup(), 200);
        Test.stopTest();

        System.assertEquals(1, [SELECT count() FROM CivicTax_Gateway_Nonce__c]);
        System.assertEquals(
            1,
            [SELECT count() FROM CivicTax_Gateway_Nonce__c WHERE Request_Key__c = :currentKey]
        );
    }
}
