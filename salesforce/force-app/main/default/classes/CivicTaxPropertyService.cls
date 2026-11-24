
/**
 * CivicTax Property Registration, Verification and Query Service.
 *
 * All citizen ownership uses:
 * CivicTax_User__c -> Salesforce_Contact_ID__c -> Contact
 */
public with sharing class CivicTaxPropertyService {

    public class PropertyServiceException extends Exception {}

    // ---------------------------------------------------------
    // REGISTER PROPERTY
    // ---------------------------------------------------------

    public static Property__c registerProperty(Property__c prop) {

        if (prop == null) {
            throw new PropertyServiceException(
                'Property record cannot be null.'
            );
        }

        if (!CivicTaxSecurityService.canCreateObject('Property__c')) {
            throw new CivicTaxSecurityService.SecurityException(
                'Insufficient permission to register a property.'
            );
        }

        if (String.isBlank(prop.Property_Number__c)) {
            throw new PropertyServiceException(
                'Property Number is mandatory.'
            );
        }

        if (String.isBlank(prop.Property_Address__c)) {
            throw new PropertyServiceException(
                'Property address is mandatory.'
            );
        }

        if (prop.Built_Up_Area__c == null ||
            prop.Built_Up_Area__c <= 0) {

            throw new PropertyServiceException(
                'Built-Up Area must be greater than zero.'
            );
        }

        if (String.isBlank(prop.Property_Category__c)) {
            throw new PropertyServiceException(
                'Property category is mandatory.'
            );
        }

        // Citizens may only register properties for themselves.
        if (CivicTaxSecurityService.isCitizen()) {

            Id contactId =
                CivicTaxSecurityService.getCurrentCitizenContactId();

            // Ignore any owner ID supplied by the frontend.
            prop.Property_Owner__c = contactId;
            prop.Owner__c = contactId;

        } else {

            CivicTaxSecurityService.requireOfficerOrAdmin();

            // For staff-created records, ownership must be explicitly
            // assigned to a valid Contact.
            if (prop.Property_Owner__c == null &&
                prop.Owner__c != null) {

                prop.Property_Owner__c = prop.Owner__c;
            }

            if (prop.Owner__c == null &&
                prop.Property_Owner__c != null) {

                prop.Owner__c = prop.Property_Owner__c;
            }
        }

        // Staff may register an unassigned property. Citizen registration
        // always assigns an owner above, so only validate ownership supplied
        // for staff-created records.
        if (prop.Property_Owner__c != null || prop.Owner__c != null) {
            Id ownerContactId = prop.Property_Owner__c != null
                ? prop.Property_Owner__c
                : prop.Owner__c;

            if (ownerContactId.getSObjectType() != Contact.SObjectType) {
                throw new PropertyServiceException(
                    'Property owner must reference a Salesforce Contact.'
                );
            }

            List<Contact> contacts = [
                SELECT Id
                FROM Contact
                WHERE Id = :ownerContactId
                LIMIT 1
            ];

            if (contacts.isEmpty()) {
                throw new PropertyServiceException(
                    'The specified property owner Contact does not exist.'
                );
            }
        }

        // Duplicate property number validation.
        List<Property__c> existing = [
            SELECT Id
            FROM Property__c
            WHERE Property_Number__c = :prop.Property_Number__c
            LIMIT 1
        ];

        if (!existing.isEmpty()) {
            throw new PropertyServiceException(
                'Property Number ' +
                prop.Property_Number__c +
                ' is already registered.'
            );
        }

        // The Salesforce record owner remains the integration user.
        // Citizen ownership is stored in the Contact lookup fields.
        prop.Verification_Status__c = 'PENDING';
        prop.Registration_Status__c = 'Submitted';

        insert prop;

        return [
            SELECT Id,
                   Name,
                   Property_Number__c,
                   Property_Address__c,
                   Property_Category__c,
                   Built_Up_Area__c,
                   Zone__c,
                   Verification_Status__c,
                   Registration_Status__c,
                   Owner__c,
                   Property_Owner__c,
                   Registration_Date__c
            FROM Property__c
            WHERE Id = :prop.Id
            LIMIT 1
        ];
    }

    // ---------------------------------------------------------
    // GET PROPERTIES
    // ---------------------------------------------------------

    public static List<Property__c> getPropertiesByFilter(
        String zone,
        String category
    ) {

        String query =
            'SELECT Id, Name, Property_Number__c, ' +
            'Property_Address__c, Zone__c, ' +
            'Property_Category__c, Built_Up_Area__c, ' +
            'Verification_Status__c, Registration_Status__c, ' +
            'OwnerId, Owner__c, Property_Owner__c, ' +
            'Registration_Date__c ' +
            'FROM Property__c WHERE Id != null';

        // Citizen queries are isolated by their mapped Contact.
        if (!CivicTaxSecurityService.isOfficerOrAdmin()) {

            Id contactId =
                CivicTaxSecurityService.getCurrentCitizenContactId();

            query +=
                ' AND (Property_Owner__c = :contactId ' +
                'OR Owner__c = :contactId)';
        }

        if (String.isNotBlank(zone)) {
            query += ' AND Zone__c = :zone';
        }

        if (String.isNotBlank(category)) {
            query += ' AND Property_Category__c = :category';
        }

        query += ' ORDER BY CreatedDate DESC LIMIT 100';

        List<Property__c> properties = Database.query(query);

        return (List<Property__c>)
            CivicTaxSecurityService.sanitizeRecords(
                AccessType.READABLE,
                properties
            );
    }

    // ---------------------------------------------------------
    // GET PROPERTY BY ID
    // ---------------------------------------------------------

    public static Property__c getProperty(Id propertyId) {

        if (propertyId == null) {
            throw new PropertyServiceException(
                'Property ID is required.'
            );
        }

        if (!CivicTaxSecurityService.isOfficerOrAdmin()) {
            CivicTaxSecurityService.requireCanAccessProperty(propertyId);
        }

        List<Property__c> properties = [
            SELECT Id,
                   Name,
                   Property_Number__c,
                   Property_Address__c,
                   Property_Category__c,
                   Built_Up_Area__c,
                   Zone__c,
                   Latitude__c,
                   Longitude__c,
                   Verification_Status__c,
                   Registration_Status__c,
                   Ownership_Document__c,
                   Construction_Year__c,
                   Registration_Date__c,
                   Owner__c,
                   Property_Owner__c
            FROM Property__c
            WHERE Id = :propertyId
            LIMIT 1
        ];

        if (properties.isEmpty()) {
            throw new PropertyServiceException(
                'Property record not found.'
            );
        }

        return properties[0];
    }

    // ---------------------------------------------------------
    // UPDATE PROPERTY VERIFICATION
    // ---------------------------------------------------------

    public static List<Property__c> updateVerificationStatus(
        Map<Id, String> propertyStatusMap
    ) {

        if (propertyStatusMap == null ||
            propertyStatusMap.isEmpty()) {

            return new List<Property__c>();
        }

        CivicTaxSecurityService.requireCanVerifyProperty();

        if (!CivicTaxSecurityService.canUpdateObject('Property__c')) {
            throw new CivicTaxSecurityService.SecurityException(
                'Insufficient permission to update property verification.'
            );
        }

        Set<String> allowedStatuses = new Set<String>{
            'VERIFIED',
            'REJECTED',
            'RESUBMISSION_REQUIRED',
            'PENDING'
        };

        for (String status : propertyStatusMap.values()) {

            if (String.isBlank(status) ||
                !allowedStatuses.contains(status.toUpperCase())) {

                throw new PropertyServiceException(
                    'Invalid property verification status: ' + status
                );
            }
        }

        return new SystemElevatedContext()
            .executeUpdateVerification(propertyStatusMap);
    }

    // ---------------------------------------------------------
    // CONTROLLED OFFICER VERIFICATION CONTEXT
    // ---------------------------------------------------------

    private without sharing class SystemElevatedContext {

        public List<Property__c> executeUpdateVerification(
            Map<Id, String> propertyStatusMap
        ) {

            CivicTaxSecurityService.requireCanVerifyProperty();

            Set<Id> propertyIds = propertyStatusMap.keySet();

            List<Property__c> properties = [
                SELECT Id,
                       Verification_Status__c,
                       Registration_Status__c
                FROM Property__c
                WHERE Id IN :propertyIds
            ];

            if (properties.size() != propertyIds.size()) {
                throw new PropertyServiceException(
                    'One or more property records could not be found.'
                );
            }

            for (Property__c propertyRecord : properties) {

                String newStatus =
                    propertyStatusMap.get(propertyRecord.Id).toUpperCase();

                propertyRecord.Verification_Status__c = newStatus;

                if (newStatus == 'VERIFIED') {
                    propertyRecord.Registration_Status__c = 'Active';
                } else if (newStatus == 'REJECTED') {
                    propertyRecord.Registration_Status__c = 'Rejected';
                } else if (newStatus == 'PENDING' ||
                           newStatus == 'RESUBMISSION_REQUIRED') {
                    propertyRecord.Registration_Status__c = 'Submitted';
                }
            }

            update properties;

            return properties;
        }
    }
}
