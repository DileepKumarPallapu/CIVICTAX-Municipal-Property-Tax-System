public without sharing class CivicTaxGatewayReplayGuard {
    public class ReplayException extends Exception {}

    public static void claim(
        String keyId,
        String civicTaxUserId,
        String nonce,
        Datetime expiresAt
    ) {
        String replayMaterial = String.join(
            new List<String>{ keyId, civicTaxUserId, nonce },
            '\n'
        );
        String requestKey = EncodingUtil.convertToHex(
            Crypto.generateDigest('SHA-256', Blob.valueOf(replayMaterial))
        );

        Database.SaveResult result = Database.insert(
            new CivicTax_Gateway_Nonce__c(
                Request_Key__c = requestKey,
                Expires_At__c = expiresAt
            ),
            false
        );
        if (result.isSuccess()) return;

        for (Database.Error error : result.getErrors()) {
            if (error.getStatusCode() == StatusCode.DUPLICATE_VALUE) {
                throw new ReplayException('CivicTax request replay detected.');
            }
        }
        throw new ReplayException('CivicTax replay protection is unavailable.');
    }
}
