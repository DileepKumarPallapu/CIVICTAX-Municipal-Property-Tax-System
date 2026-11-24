@IsTest
private class CivicTaxIdentityRestResourceTest {
    private static Contact createContact() {
        Account account = new Account(Name = 'CivicTax Auth Test Account');
        insert account;
        Contact contact = new Contact(
            LastName = 'CivicTax Auth Test',
            AccountId = account.Id
        );
        insert contact;
        return contact;
    }

    private static CivicTax_User__c createMapping(
        Contact contact,
        String civicTaxId,
        String role,
        String status
    ) {
        CivicTax_User__c mapping = new CivicTax_User__c(
            CivicTax_ID__c = civicTaxId,
            Salesforce_Contact_ID__c = String.valueOf(contact.Id),
            Full_Name__c = 'Mapped CivicTax User',
            Email__c = 'mapped@example.invalid',
            Role__c = role,
            Account_Status__c = status
        );
        insert mapping;
        return mapping;
    }

    @IsTest
    static void resolvesOnlyOneActiveMappingForTheExactContact() {
        Contact contact = createContact();
        CivicTax_User__c mapping =
            createMapping(contact, 'auth-user-001', 'CITIZEN', 'ACTIVE');

        Test.startTest();
        CivicTax_User__c resolved =
            CivicTaxIdentityRestResource.resolveMappingForContact(contact.Id);
        CivicTax_User__c unrelated =
            CivicTaxIdentityRestResource.resolveMappingForContact(
                createContact().Id
            );
        Test.stopTest();

        System.assertEquals(mapping.CivicTax_ID__c, resolved.CivicTax_ID__c);
        System.assertEquals('CITIZEN', resolved.Role__c);
        System.assertEquals(null, unrelated);
    }

    @IsTest
    static void returnsOnlyTheAuthenticatedContactsActiveMapping() {
        Contact contact = createContact();
        createMapping(contact, 'mapped-user-001', 'OFFICER', 'ACTIVE');
        User salesforceUser = new User(
            ContactId = contact.Id,
            FirstName = 'Salesforce',
            LastName = 'Officer',
            Email = 'salesforce@example.invalid'
        );
        RestResponse response = new RestResponse();

        CivicTaxIdentityRestResource.writeIdentityResponse(
            response,
            salesforceUser
        );

        Map<String, Object> payload =
            (Map<String, Object>) JSON.deserializeUntyped(
                response.responseBody.toString()
            );
        System.assertEquals(200, response.statusCode);
        System.assertEquals(4, payload.size());
        System.assertEquals('mapped-user-001', payload.get('id'));
        System.assertEquals('OFFICER', payload.get('role'));
        System.assertEquals('Mapped CivicTax User', payload.get('name'));
        System.assertEquals('mapped@example.invalid', payload.get('email'));
    }

    @IsTest
    static void rejectsInactiveSuspendedPendingAndDuplicateMappings() {
        Contact inactiveContact = createContact();
        createMapping(inactiveContact, 'inactive-user', 'CITIZEN', 'INACTIVE');

        Contact suspendedContact = createContact();
        createMapping(suspendedContact, 'suspended-user', 'CITIZEN', 'SUSPENDED');

        Contact pendingContact = createContact();
        createMapping(pendingContact, 'pending-user', 'CITIZEN', 'PENDING');

        Contact duplicateContact = createContact();
        createMapping(duplicateContact, 'duplicate-one', 'CITIZEN', 'ACTIVE');
        createMapping(duplicateContact, 'duplicate-two', 'ADMIN', 'ACTIVE');

        Test.startTest();
        CivicTax_User__c inactive =
            CivicTaxIdentityRestResource.resolveMappingForContact(
                inactiveContact.Id
            );
        CivicTax_User__c suspended =
            CivicTaxIdentityRestResource.resolveMappingForContact(
                suspendedContact.Id
            );
        CivicTax_User__c pending =
            CivicTaxIdentityRestResource.resolveMappingForContact(
                pendingContact.Id
            );
        CivicTax_User__c duplicate =
            CivicTaxIdentityRestResource.resolveMappingForContact(
                duplicateContact.Id
            );
        CivicTax_User__c invalidContact =
            CivicTaxIdentityRestResource.resolveMappingForContact(
                UserInfo.getUserId()
            );
        Test.stopTest();

        System.assertEquals(null, inactive);
        System.assertEquals(null, suspended);
        System.assertEquals(null, pending);
        System.assertEquals(null, duplicate);
        System.assertEquals(null, invalidContact);
    }

    @IsTest
    static void restEndpointDoesNotAcceptCallerSuppliedIdentity() {
        RestContext.request = new RestRequest();
        RestContext.request.requestURI =
            '/services/apexrest/civictax/auth/v1/me';
        RestContext.request.httpMethod = 'GET';
        RestContext.response = new RestResponse();

        CivicTaxIdentityRestResource.getCurrentIdentity();

        System.assertEquals(403, RestContext.response.statusCode);
        System.assert(
            !RestContext.response.responseBody.toString().contains('ADMIN'),
            'An unmapped Salesforce user must not receive any caller-selected role.'
        );
    }
}
