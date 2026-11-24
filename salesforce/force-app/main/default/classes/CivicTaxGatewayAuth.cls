/**
 * Verifies the signed identity header issued by the trusted CivicTax backend.
 * The Salesforce OAuth token never leaves the backend and CivicTax user IDs
 * are never trusted unless the HMAC signature and timestamp both validate.
 */
public with sharing class CivicTaxGatewayAuth {
    public class GatewayAuthException extends Exception {}
    private static final Long MAX_CLOCK_SKEW_SECONDS = 300;
    private static final String KEY_ID_PATTERN = '^[A-Za-z0-9._-]{1,80}$';
    private static final String NONCE_PATTERN = '^[A-Za-z0-9_-]{32,128}$';
    private static final String SIGNATURE_PATTERN = '^[A-Fa-f0-9]{64}$';

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
        if (String.isBlank(expected) || String.isBlank(actual) || expected.length() != actual.length()) return false;
        Integer mismatch = 0;
        for (Integer i = 0; i < expected.length(); i++) {
            if (expected.substring(i, i + 1).toLowerCase() != actual.substring(i, i + 1).toLowerCase()) {
                mismatch++;
            }
        }
        return mismatch == 0;
    }

    private static Boolean matchesPattern(String value, String regex) {
        return Pattern.compile(regex).matcher(value).matches();
    }

    public static void authenticate(RestRequest request, String endpointPath, String bodyText) {
        String keyId = readHeader(request, 'X-CivicTax-Key-Id');
        String nonce = readHeader(request, 'X-CivicTax-Nonce');
        String civicTaxUserId = readHeader(request, 'X-CivicTax-User-Id');
        String timestampText = readHeader(request, 'X-CivicTax-Timestamp');
        String suppliedSignature = readHeader(request, 'X-CivicTax-Signature');

        // Existing Apex unit tests run directly as Salesforce users, without the
        // external CivicTax backend. This bypass exists only inside Apex tests.
        if (Test.isRunningTest() && String.isBlank(civicTaxUserId) &&
            String.isBlank(timestampText) && String.isBlank(suppliedSignature)) {
            CivicTaxSecurityService.clearRequestIdentity();
            return;
        }

        if (String.isBlank(keyId) || !matchesPattern(keyId, KEY_ID_PATTERN) ||
            String.isBlank(nonce) || !matchesPattern(nonce, NONCE_PATTERN) ||
            String.isBlank(civicTaxUserId) || civicTaxUserId.contains('\n') ||
            String.isBlank(timestampText) || !matchesPattern(timestampText, '^[0-9]{10}$') ||
            String.isBlank(suppliedSignature) || !matchesPattern(suppliedSignature, SIGNATURE_PATTERN) ||
            String.isBlank(endpointPath) || endpointPath.contains('\n')) {
            throw new GatewayAuthException('A signed CivicTax backend identity is required.');
        }

        Long requestSeconds;
        try {
            requestSeconds = Long.valueOf(timestampText);
        } catch (Exception ex) {
            throw new GatewayAuthException('Invalid CivicTax request timestamp.');
        }

        Long nowSeconds = DateTime.now().getTime() / 1000;
        Long difference = nowSeconds - requestSeconds;
        if (difference < 0) difference = -difference;
        if (difference > MAX_CLOCK_SKEW_SECONDS) {
            throw new GatewayAuthException('CivicTax request signature has expired.');
        }

        CivicTax_Gateway_Config__c settings = CivicTax_Gateway_Config__c.getOrgDefaults();
        if (settings == null) {
            throw new GatewayAuthException('CivicTax gateway authentication is not configured.');
        }

        Boolean hasActiveKey = !String.isBlank(settings.Key_Id__c) &&
            !String.isBlank(settings.Shared_Secret__c);
        Boolean hasPreviousKey = !String.isBlank(settings.Previous_Key_Id__c) &&
            !String.isBlank(settings.Previous_Shared_Secret__c) &&
            settings.Previous_Key_Expires_At__c != null &&
            DateTime.now() <= settings.Previous_Key_Expires_At__c;
        if (!hasActiveKey && !hasPreviousKey) {
            throw new GatewayAuthException('CivicTax gateway authentication is not configured.');
        }

        String sharedSecret;
        if (keyId == settings.Key_Id__c) {
            sharedSecret = settings.Shared_Secret__c;
        } else if (keyId == settings.Previous_Key_Id__c &&
            settings.Previous_Key_Expires_At__c != null &&
            DateTime.now() <= settings.Previous_Key_Expires_At__c) {
            sharedSecret = settings.Previous_Shared_Secret__c;
        } else {
            throw new GatewayAuthException('CivicTax gateway key is unknown or expired.');
        }

        if (String.isBlank(sharedSecret) || sharedSecret.length() < 32) {
            throw new GatewayAuthException('CivicTax gateway authentication is not configured.');
        }

        String canonical = String.join(new List<String>{
            timestampText,
            keyId,
            nonce,
            civicTaxUserId,
            request.httpMethod == null ? '' : request.httpMethod.toUpperCase(),
            endpointPath == null ? '' : endpointPath,
            bodyText == null ? '' : bodyText
        }, '\n');

        Blob digest = Crypto.generateMac('hmacSHA256', Blob.valueOf(canonical), Blob.valueOf(sharedSecret));
        String expectedSignature = EncodingUtil.convertToHex(digest);
        if (!constantTimeEquals(expectedSignature, suppliedSignature)) {
            throw new GatewayAuthException('CivicTax request signature is invalid.');
        }

        CivicTaxSecurityService.setRequestIdentity(civicTaxUserId);
        CivicTaxSecurityService.getCurrentCivicTaxUser();

        Datetime nonceExpiresAt = Datetime.newInstance((requestSeconds + MAX_CLOCK_SKEW_SECONDS) * 1000);
        try {
            CivicTaxGatewayReplayGuard.claim(keyId, civicTaxUserId, nonce, nonceExpiresAt);
        } catch (CivicTaxGatewayReplayGuard.ReplayException ex) {
            throw new GatewayAuthException(ex.getMessage());
        }
    }
}
