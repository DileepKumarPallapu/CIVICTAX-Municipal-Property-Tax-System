public with sharing class CivicTaxGatewayProvisioning {
    private static final String KEY_ID_PATTERN = '^[A-Za-z0-9._-]{1,80}$';
    private static final Integer MAX_PREVIOUS_KEY_WINDOW_HOURS = 24;
    @TestVisible private static Boolean testPermissionOverride;

    private static Boolean hasConfigurationPermission() {
        if (Test.isRunningTest() && testPermissionOverride != null) {
            return testPermissionOverride;
        }
        return FeatureManagement.checkPermission('CivicTax_Gateway_Key_Admin');
    }

    @AuraEnabled
    public static String provisionKeys(
        String activeKeyId,
        String activeSecret,
        String previousKeyId,
        String previousSecret,
        Datetime previousKeyExpiresAt
    ) {
        if (!hasConfigurationPermission()) {
            throw new AuraHandledException('Not authorized to configure the gateway.');
        }

        Boolean hasActiveKey =
            !String.isBlank(activeKeyId) && !String.isBlank(activeSecret);
        Boolean hasPreviousKey =
            !String.isBlank(previousKeyId) && !String.isBlank(previousSecret) &&
            previousKeyExpiresAt != null;
        if (!hasActiveKey ||
            !Pattern.matches(KEY_ID_PATTERN, activeKeyId) ||
            activeSecret.length() < 32 || activeSecret.length() > 255) {
            throw new AuraHandledException('Gateway key configuration is invalid.');
        }
        if (hasPreviousKey &&
            (!Pattern.matches(KEY_ID_PATTERN, previousKeyId) ||
             previousSecret.length() < 32 || previousSecret.length() > 255 ||
             previousKeyId == activeKeyId ||
             previousKeyExpiresAt <= DateTime.now() ||
             previousKeyExpiresAt > DateTime.now().addHours(MAX_PREVIOUS_KEY_WINDOW_HOURS))) {
            throw new AuraHandledException('Previous gateway key configuration is invalid.');
        }
        if (!hasPreviousKey &&
            (!String.isBlank(previousKeyId) ||
             !String.isBlank(previousSecret) ||
             previousKeyExpiresAt != null)) {
            throw new AuraHandledException('Previous gateway key configuration is incomplete.');
        }

        CivicTax_Gateway_Config__c settings =
            CivicTax_Gateway_Config__c.getOrgDefaults();
        if (settings == null) {
            settings = new CivicTax_Gateway_Config__c(
                SetupOwnerId = UserInfo.getOrganizationId()
            );
        }
        settings.Key_Id__c = activeKeyId;
        settings.Shared_Secret__c = activeSecret;
        settings.Previous_Key_Id__c = hasPreviousKey ? previousKeyId : null;
        settings.Previous_Shared_Secret__c =
            hasPreviousKey ? previousSecret : null;
        settings.Previous_Key_Expires_At__c =
            hasPreviousKey ? previousKeyExpiresAt : null;

        try {
            upsert settings;
        } catch (DmlException ex) {
            throw new AuraHandledException('Gateway configuration could not be saved.');
        }
        return 'Gateway configuration saved.';
    }
}
