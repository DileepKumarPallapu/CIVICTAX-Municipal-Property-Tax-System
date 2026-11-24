@IsTest
private class CivicTaxGatewayAuthTest {
    private static final String ACTIVE_KEY_ID = 'civictax-test-key-v2';
    private static final String ACTIVE_SECRET = 'test-only-active-key-0123456789abcdef';
    private static final String PREVIOUS_KEY_ID = 'civictax-test-key-v1';
    private static final String PREVIOUS_SECRET = 'test-only-previous-key-0123456789';

    private static void configureKeys(
        String activeKeyId,
        String activeSecret,
        String previousKeyId,
        String previousSecret,
        Datetime previousKeyExpiresAt
    ) {
        CivicTaxGatewayAuth.useTestSettings = true;
        CivicTaxGatewayAuth.testSettings = new CivicTax_Gateway_Config__c(
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
                timestamp, keyId, nonce, userId, method, endpoint, bodyText
            },
            '\n'
        );
        return EncodingUtil.convertToHex(
            Crypto.generateMac('hmacSHA256', Blob.valueOf(canonical), Blob.valueOf(secret))
        );
    }

    private static RestRequest requestFor(
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

    private static RestRequest signedRequest(String keyId, String secret, String nonce) {
        String userId = 'usr-test-citizen';
        String timestamp = String.valueOf(DateTime.now().getTime() / 1000);
        return requestFor(
            keyId,
            nonce,
            userId,
            timestamp,
            buildSignature(secret, keyId, nonce, userId, timestamp, 'GET', 'properties', '')
        );
    }

    @IsTest
    static void crossLanguageHmacVectorMatchesNode() {
        String secret = 'test-only-cross-language-hmac-key-2026';
        String canonical =
            '1730000000\ntest-key-v1\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n' +
            'test-user\nGET\nproperties\n';
        String signature = EncodingUtil.convertToHex(
            Crypto.generateMac('hmacSHA256', Blob.valueOf(canonical), Blob.valueOf(secret))
        );
        System.assertEquals(
            'dc86a1673d250e50d2d339bf7ee6b5537c5c5b4b494642d1d16bcb55491e0cdd',
            signature
        );
    }

    @IsTest
    static void validSignatureReturnsOnlyVerifiedIdentity() {
        configureKeys(ACTIVE_KEY_ID, ACTIVE_SECRET, null, null, null);
        RestRequest request = signedRequest(
            ACTIVE_KEY_ID,
            ACTIVE_SECRET,
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
        );
        System.assertEquals(
            'usr-test-citizen',
            CivicTaxGatewayAuth.authenticate(request, 'properties', '')
        );
        System.assertEquals(1, [SELECT count() FROM CivicTax_Gateway_Nonce__c]);
    }

    @IsTest
    static void invalidSignatureFailsClosed() {
        configureKeys(ACTIVE_KEY_ID, ACTIVE_SECRET, null, null, null);
        RestRequest request = signedRequest(
            ACTIVE_KEY_ID,
            ACTIVE_SECRET,
            'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
        );
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
        System.assertEquals(true, rejected);
        System.assertEquals(0, [SELECT count() FROM CivicTax_Gateway_Nonce__c]);
    }

    @IsTest
    static void expiredTimestampIsRejected() {
        configureKeys(ACTIVE_KEY_ID, ACTIVE_SECRET, null, null, null);
        String nonce = 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC';
        String timestamp = String.valueOf((DateTime.now().getTime() / 1000) - 301);
        String userId = 'usr-test-citizen';
        RestRequest request = requestFor(
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
        System.assertEquals(true, rejected);
        System.assertEquals(0, [SELECT count() FROM CivicTax_Gateway_Nonce__c]);
    }

    @IsTest
    static void duplicateNonceIsRejected() {
        configureKeys(ACTIVE_KEY_ID, ACTIVE_SECRET, null, null, null);
        RestRequest request = signedRequest(
            ACTIVE_KEY_ID,
            ACTIVE_SECRET,
            'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD'
        );
        CivicTaxGatewayAuth.authenticate(request, 'properties', '');
        Boolean rejected = false;
        try {
            CivicTaxGatewayAuth.authenticate(request, 'properties', '');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            rejected = ex.getMessage().contains('replay detected');
        }
        System.assertEquals(true, rejected);
        System.assertEquals(1, [SELECT count() FROM CivicTax_Gateway_Nonce__c]);
    }

    @IsTest
    static void missingConfigurationFailsClosed() {
        CivicTaxGatewayAuth.useTestSettings = true;
        CivicTaxGatewayAuth.testSettings = null;
        RestRequest request = signedRequest(
            ACTIVE_KEY_ID,
            ACTIVE_SECRET,
            'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE'
        );
        Boolean rejected = false;
        try {
            CivicTaxGatewayAuth.authenticate(request, 'properties', '');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            rejected = ex.getMessage().contains('unavailable');
        }
        System.assertEquals(true, rejected);
    }

    @IsTest
    static void previousKeyWorksWithinRotationWindowAndExpiresAfterward() {
        configureKeys(
            ACTIVE_KEY_ID,
            ACTIVE_SECRET,
            PREVIOUS_KEY_ID,
            PREVIOUS_SECRET,
            DateTime.now().addMinutes(2)
        );
        RestRequest validOldKeyRequest = signedRequest(
            PREVIOUS_KEY_ID,
            PREVIOUS_SECRET,
            'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
        );
        System.assertEquals(
            'usr-test-citizen',
            CivicTaxGatewayAuth.authenticate(validOldKeyRequest, 'properties', '')
        );

        configureKeys(
            ACTIVE_KEY_ID,
            ACTIVE_SECRET,
            PREVIOUS_KEY_ID,
            PREVIOUS_SECRET,
            DateTime.now().addSeconds(-1)
        );
        RestRequest expiredOldKeyRequest = signedRequest(
            PREVIOUS_KEY_ID,
            PREVIOUS_SECRET,
            'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG'
        );
        Boolean rejected = false;
        try {
            CivicTaxGatewayAuth.authenticate(expiredOldKeyRequest, 'properties', '');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            rejected = ex.getMessage().contains('unknown or expired');
        }
        System.assertEquals(true, rejected);
    }

    @IsTest
    static void cleanupBatchDeletesOnlyExpiredNonceHashes() {
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
