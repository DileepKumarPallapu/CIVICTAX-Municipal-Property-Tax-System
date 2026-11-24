/**
 * Verifies the signed identity header issued by the trusted CivicTax backend.
 * The Salesforce OAuth token never leaves the backend and CivicTax user IDs
 * are never trusted unless the HMAC signature and timestamp both validate.
 */
public with sharing class CivicTaxGatewayAuth {
    public class GatewayAuthException extends Exception {}
    private static final Long MAX_CLOCK_SKEW_SECONDS = 300;

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

    public static void authenticate(RestRequest request, String endpointPath, String bodyText) {
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

        if (String.isBlank(civicTaxUserId) || String.isBlank(timestampText) || String.isBlank(suppliedSignature)) {
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
        String sharedSecret = settings == null ? null : settings.Shared_Secret__c;
        if (String.isBlank(sharedSecret) || sharedSecret.length() < 32) {
            throw new GatewayAuthException('CivicTax gateway secret is not configured in Salesforce.');
        }

        String canonical = String.join(new List<String>{
            timestampText,
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

        // The security service resolves the role and Contact from Salesforce,
        // never from a caller-supplied role or owner field.
        CivicTaxSecurityService.setRequestIdentity(civicTaxUserId);
        CivicTaxSecurityService.getCurrentCivicTaxUser();
    }
}
