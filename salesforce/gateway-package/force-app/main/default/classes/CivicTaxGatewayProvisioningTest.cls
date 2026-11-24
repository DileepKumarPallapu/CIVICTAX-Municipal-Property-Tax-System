@IsTest
private class CivicTaxGatewayProvisioningTest {
    private static Boolean isRejected(
        String activeKeyId,
        String activeSecret,
        String previousKeyId,
        String previousSecret,
        Datetime previousKeyExpiresAt
    ) {
        try {
            CivicTaxGatewayProvisioning.provisionKeys(
                activeKeyId,
                activeSecret,
                previousKeyId,
                previousSecret,
                previousKeyExpiresAt
            );
            return false;
        } catch (AuraHandledException ex) {
            return true;
        }
    }

    @IsTest
    static void provisioningRequiresExplicitPackagePermission() {
        CivicTaxGatewayProvisioning.testPermissionOverride = false;
        System.assertEquals(
            true,
            isRejected(
                'civictax-test-key',
                'test-only-key-material-0123456789abcdef',
                null,
                null,
                null
            )
        );
        System.assertEquals(0, [SELECT count() FROM CivicTax_Gateway_Config__c]);
    }

    @IsTest
    static void provisioningValidatesActiveAndRotationKeys() {
        CivicTaxGatewayProvisioning.testPermissionOverride = true;
        System.assertEquals(true, isRejected('invalid key', 'test-only-key-material-0123456789abcdef', null, null, null));
        System.assertEquals(true, isRejected('valid-key', 'too-short', null, null, null));
        System.assertEquals(true, isRejected('valid-key', 'test-only-key-material-0123456789abcdef', 'old-key', null, DateTime.now().addHours(1)));
        System.assertEquals(true, isRejected('valid-key', 'test-only-key-material-0123456789abcdef', 'valid-key', 'test-only-old-key-material-0123456789', DateTime.now().addHours(1)));
        System.assertEquals(true, isRejected('valid-key', 'test-only-key-material-0123456789abcdef', 'old-key', 'test-only-old-key-material-0123456789', DateTime.now().addHours(25)));
    }

    @IsTest
    static void provisioningStoresKeyRotationAndCanClearPreviousKey() {
        CivicTaxGatewayProvisioning.testPermissionOverride = true;
        DateTime previousExpiry = DateTime.now().addHours(1);
        System.assertEquals(
            'Gateway configuration saved.',
            CivicTaxGatewayProvisioning.provisionKeys(
                'active-key-v2',
                'test-only-active-key-material-0123456789',
                'active-key-v1',
                'test-only-previous-key-material-0123456789',
                previousExpiry
            )
        );

        CivicTax_Gateway_Config__c settings = CivicTax_Gateway_Config__c.getOrgDefaults();
        System.assertEquals('active-key-v2', settings.Key_Id__c);
        System.assertEquals('test-only-active-key-material-0123456789', settings.Shared_Secret__c);
        System.assertEquals('active-key-v1', settings.Previous_Key_Id__c);
        System.assertEquals('test-only-previous-key-material-0123456789', settings.Previous_Shared_Secret__c);
        System.assertEquals(previousExpiry, settings.Previous_Key_Expires_At__c);

        CivicTaxGatewayProvisioning.provisionKeys(
            'active-key-v3',
            'test-only-next-active-key-material-0123456789',
            null,
            null,
            null
        );
        settings = CivicTax_Gateway_Config__c.getOrgDefaults();
        System.assertEquals('active-key-v3', settings.Key_Id__c);
        System.assertEquals(null, settings.Previous_Key_Id__c);
        System.assertEquals(null, settings.Previous_Shared_Secret__c);
        System.assertEquals(null, settings.Previous_Key_Expires_At__c);
    }
}
