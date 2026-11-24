@RestResource(urlMapping='/civictax/auth/v1/me')
global without sharing class CivicTaxIdentityRestResource {
    private static final Set<String> ALLOWED_ROLES =
        new Set<String>{ 'CITIZEN', 'OFFICER', 'ADMIN' };

    @TestVisible
    private static CivicTax_User__c resolveMappingForContact(Id contactId) {
        if (contactId == null || contactId.getSObjectType() != Contact.SObjectType) {
            return null;
        }

        String contactId18 = String.valueOf(contactId);
        Set<String> contactIdValues = new Set<String>{ contactId18 };
        if (contactId18.length() == 18) {
            contactIdValues.add(contactId18.substring(0, 15));
        }

        List<CivicTax_User__c> mappings = [
            SELECT CivicTax_ID__c, Full_Name__c, Email__c, Role__c,
                   Account_Status__c
            FROM CivicTax_User__c
            WHERE Salesforce_Contact_ID__c IN :contactIdValues
            LIMIT 2
        ];
        if (mappings.size() != 1) return null;

        CivicTax_User__c mapping = mappings[0];
        if (
            mapping.Account_Status__c != 'ACTIVE' ||
            String.isBlank(mapping.CivicTax_ID__c) ||
            !ALLOWED_ROLES.contains(mapping.Role__c)
        ) {
            return null;
        }
        return mapping;
    }

    @HttpGet
    global static void getCurrentIdentity() {
        RestResponse response = RestContext.response;
        response.addHeader('Content-Type', 'application/json');
        try {
            User salesforceUser = [
                SELECT ContactId, Name, Email
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];
            writeIdentityResponse(response, salesforceUser);
        } catch (Exception ex) {
            System.debug(
                LoggingLevel.ERROR,
                'CivicTax identity lookup failed (' + ex.getTypeName() + ').'
            );
            response.statusCode = 500;
            response.responseBody = Blob.valueOf(JSON.serialize(
                new Map<String, String>{
                    'error' => 'CIVICTAX_IDENTITY_LOOKUP_FAILED',
                    'message' => 'Salesforce could not resolve the CivicTax identity.'
                }
            ));
        }
    }

    @TestVisible
    private static void writeIdentityResponse(
        RestResponse response,
        User salesforceUser
    ) {
        if (salesforceUser.ContactId == null) {
            writeError(response);
            return;
        }

        // External-user sharing may hide mappings; this query is pinned to the
        // Contact from UserInfo and returns only that user's minimal identity.
        CivicTax_User__c mapping =
            resolveMappingForContact(salesforceUser.ContactId);
        if (mapping == null) {
            writeError(response);
            return;
        }

        response.statusCode = 200;
        response.responseBody = Blob.valueOf(JSON.serialize(
            new Map<String, String>{
                'id' => mapping.CivicTax_ID__c,
                'name' => String.isBlank(mapping.Full_Name__c)
                    ? salesforceUser.Name
                    : mapping.Full_Name__c,
                'email' => String.isBlank(mapping.Email__c)
                    ? salesforceUser.Email
                    : mapping.Email__c,
                'role' => mapping.Role__c
            }
        ));
    }

    private static void writeError(RestResponse response) {
        response.statusCode = 403;
        response.responseBody = Blob.valueOf(JSON.serialize(
            new Map<String, String>{
                'error' => 'CIVICTAX_ACCOUNT_NOT_AUTHORIZED',
                'message' => 'No active CivicTax identity mapping is available.'
            }
        ));
    }
}
