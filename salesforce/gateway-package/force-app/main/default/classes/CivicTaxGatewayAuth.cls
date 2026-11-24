/**
 * Verifies signed requests from the trusted CivicTax backend.
 * The protected key setting and this verifier must ship in the same managed namespace.
 */
global with sharing class CivicTaxGatewayAuth {
    global class GatewayAuthException extends Exception {}

    private static final Long MAX_CLOCK_SKEW_SECONDS = 300;
    private static final String KEY_ID_PATTERN = '^[A-Za-z0-9._-]{1,80}$';
    private static final String NONCE_PATTERN = '^[A-Za-z0-9_-]{43}$';
    private static final String SIGNATURE_PATTERN = '^[A-Fa-f0-9]{64}$';
    @TestVisible private static Boolean useTestSettings = false;
    @TestVisible private static CivicTax_Gateway_Config__c testSettings;

    private static CivicTax_Gateway_Config__c getGatewaySettings() {
        if (Test.isRunningTest() && useTestSettings) return testSettings;
        return CivicTax_Gateway_Config__c.getOrgDefaults();
    }

    private static String readHeader(RestRequest request, String requestedName) {
        if (request == null || request.headers == null) return null;
        for (String name : request.headers.keySet()) {
            if (name != null && name.equalsIgnoreCase(requestedName)) {
                return request.headers.get(name);
            }
        }
        return null;
    }

    private static Boolean constantTimeEquals(String expected, String actual) {
        if (String.isBlank(expected) || String.isBlank(actual) ||
            expected.length() != actual.length()) {
            return false;
        }
        Integer mismatch = 0;
        for (Integer i = 0; i < expected.length(); i++) {
            if (expected.substring(i, i + 1).toLowerCase() !=
                actual.substring(i, i + 1).toLowerCase()) {
                mismatch++;
            }
        }
        return mismatch == 0;
    }

    private static Boolean matchesPattern(String value, String regex) {
        return Pattern.compile(regex).matcher(value).matches();
    }

    /**
     * Validates a backend request, atomically claims its nonce, and returns only
     * the authenticated CivicTax identity. No business data or secret is returned.
     */
    global static String authenticate(
        RestRequest request,
        String endpointPath,
        String bodyText
    ) {
        String keyId = readHeader(request, 'X-CivicTax-Key-Id');
        String nonce = readHeader(request, 'X-CivicTax-Nonce');
        String civicTaxUserId = readHeader(request, 'X-CivicTax-User-Id');
        String timestampText = readHeader(request, 'X-CivicTax-Timestamp');
        String suppliedSignature = readHeader(request, 'X-CivicTax-Signature');

        if (String.isBlank(keyId) || !matchesPattern(keyId, KEY_ID_PATTERN) ||
            String.isBlank(nonce) || !matchesPattern(nonce, NONCE_PATTERN) ||
            String.isBlank(civicTaxUserId) || civicTaxUserId.contains('\n') ||
            String.isBlank(timestampText) ||
            !matchesPattern(timestampText, '^[0-9]{10}$') ||
            String.isBlank(suppliedSignature) ||
            !matchesPattern(suppliedSignature, SIGNATURE_PATTERN) ||
            String.isBlank(endpointPath) || endpointPath.contains('\n')) {
            throw new GatewayAuthException('Signed CivicTax request is invalid.');
        }

        Long requestSeconds;
        try {
            requestSeconds = Long.valueOf(timestampText);
        } catch (Exception ex) {
            throw new GatewayAuthException('Signed CivicTax request is invalid.');
        }

        Long nowSeconds = DateTime.now().getTime() / 1000;
        Long difference = nowSeconds - requestSeconds;
        if (difference < 0) difference = -difference;
        if (difference > MAX_CLOCK_SKEW_SECONDS) {
            throw new GatewayAuthException('CivicTax request has expired.');
        }

        CivicTax_Gateway_Config__c settings = getGatewaySettings();
        if (settings == null) {
            throw new GatewayAuthException('CivicTax gateway authentication is unavailable.');
        }

        Boolean hasActiveKey = !String.isBlank(settings.Key_Id__c) &&
            !String.isBlank(settings.Shared_Secret__c);
        Boolean hasPreviousKey = !String.isBlank(settings.Previous_Key_Id__c) &&
            !String.isBlank(settings.Previous_Shared_Secret__c) &&
            settings.Previous_Key_Expires_At__c != null &&
            DateTime.now() <= settings.Previous_Key_Expires_At__c;
        if (!hasActiveKey && !hasPreviousKey) {
            throw new GatewayAuthException('CivicTax gateway authentication is unavailable.');
        }

        String sharedSecret;
        if (keyId == settings.Key_Id__c) {
            sharedSecret = settings.Shared_Secret__c;
        } else if (keyId == settings.Previous_Key_Id__c && hasPreviousKey) {
            sharedSecret = settings.Previous_Shared_Secret__c;
        } else {
            throw new GatewayAuthException('CivicTax gateway key is unknown or expired.');
        }
        if (String.isBlank(sharedSecret) || sharedSecret.length() < 32) {
            throw new GatewayAuthException('CivicTax gateway authentication is unavailable.');
        }

        String canonical = String.join(new List<String>{
            timestampText,
            keyId,
            nonce,
            civicTaxUserId,
            request.httpMethod == null ? '' : request.httpMethod.toUpperCase(),
            endpointPath,
            bodyText == null ? '' : bodyText
        }, '\n');
        String expectedSignature = EncodingUtil.convertToHex(
            Crypto.generateMac(
                'hmacSHA256',
                Blob.valueOf(canonical),
                Blob.valueOf(sharedSecret)
            )
        );
        if (!constantTimeEquals(expectedSignature, suppliedSignature)) {
            throw new GatewayAuthException('CivicTax request signature is invalid.');
        }

        Datetime nonceExpiresAt =
            Datetime.newInstance((requestSeconds + MAX_CLOCK_SKEW_SECONDS) * 1000);
        try {
            CivicTaxGatewayReplayGuard.claim(
                keyId,
                civicTaxUserId,
                nonce,
                nonceExpiresAt
            );
        } catch (CivicTaxGatewayReplayGuard.ReplayException ex) {
            throw new GatewayAuthException(ex.getMessage());
        }
        return civicTaxUserId;
    }
}
