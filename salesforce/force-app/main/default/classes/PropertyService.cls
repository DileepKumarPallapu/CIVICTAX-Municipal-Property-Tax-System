// PropertyService.cls
// CivicTax 8.0 & 10.0 Enterprise Apex Service for Property Management
public with sharing class PropertyService {
    public class PropertyException extends Exception {}

    // Register a new property with full validation and CRUD guards
    public static Property__c registerProperty(
        String propertyNumber,
        String address,
        String category,
        Decimal builtUpArea,
        String zone,
        Decimal latitude,
        Decimal longitude,
        String ownershipDoc,
        Integer constructionYear
    ) {
        if (!CivicTaxSecurityService.canCreateObject('Property__c')) {
            throw new CivicTaxSecurityService.SecurityException('Access Denied: Insufficient permissions to register Property.');
        }

        if (String.isBlank(propertyNumber)) {
            throw new PropertyException('Property Number is required.');
        }
        if (builtUpArea == null || builtUpArea <= 0) {
            throw new PropertyException('Built up area must be greater than zero.');
        }

        // Duplicate check
        List<Property__c> existing = [
            SELECT Id, Property_Number__c 
            FROM Property__c 
            WHERE Property_Number__c = :propertyNumber 
            LIMIT 1
        ];
        if (!existing.isEmpty()) {
            throw new PropertyException('Property with number ' + propertyNumber + ' already exists.');
        }

        Property__c prop = new Property__c(
            Name = propertyNumber,
            Property_Number__c = propertyNumber,
            Property_Address__c = address,
            Property_Category__c = category,
            Built_Up_Area__c = builtUpArea,
            Zone__c = zone,
            Latitude__c = latitude,
            Longitude__c = longitude,
            Ownership_Document__c = ownershipDoc,
            Construction_Year__c = constructionYear,
            Verification_Status__c = 'PENDING',
            Registration_Date__c = System.now()
        );

        insert prop;
        return prop;
    }

    // Retrieve single property by Property Number or Id with strict ownership validation
    public static Property__c getProperty(String identifier) {
        if (String.isBlank(identifier)) {
            throw new PropertyException('Property identifier cannot be blank.');
        }

        Boolean isSalesforceId = false;
        try {
            Id checkId = (Id) identifier;
            isSalesforceId = true;
        } catch (Exception ex) {
            isSalesforceId = false;
        }

        List<Property__c> props;
        if (isSalesforceId) {
            props = [
                SELECT Id, Name, Property_Number__c, Property_Address__c, Property_Category__c, 
                       Built_Up_Area__c, Zone__c, Verification_Status__c, Ownership_Document__c, 
                       Registration_Date__c, Latitude__c, Longitude__c, Construction_Year__c,
                       OwnerId, Property_Owner__c, Property_Owner__r.Email
                FROM Property__c 
                WHERE Id = :identifier OR Property_Number__c = :identifier 
                LIMIT 1
            ];
        } else {
            props = [
                SELECT Id, Name, Property_Number__c, Property_Address__c, Property_Category__c, 
                       Built_Up_Area__c, Zone__c, Verification_Status__c, Ownership_Document__c, 
                       Registration_Date__c, Latitude__c, Longitude__c, Construction_Year__c,
                       OwnerId, Property_Owner__c, Property_Owner__r.Email
                FROM Property__c 
                WHERE Property_Number__c = :identifier 
                LIMIT 1
            ];
        }

        if (props.isEmpty()) {
            throw new PropertyException('Property record not found for: ' + identifier);
        }

        // BOLA / IDOR Protection: Validate that running user can access this property
        CivicTaxSecurityService.requireCanAccessProperty(props[0].Id);

        List<Property__c> sanitized = (List<Property__c>) CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, props);
        return sanitized[0];
    }

    // List properties with optional filters and user isolation
    public static List<Property__c> listProperties(String category, String zone, String status) {
        String query = 'SELECT Id, Name, Property_Number__c, Property_Address__c, Property_Category__c, ' +
               'Built_Up_Area__c, Zone__c, Municipal_Zone__c, Verification_Status__c, ' +
               'Registration_Date__c, Latitude__c, Longitude__c, Property_Owner__c, ' +
               'Property_Owner__r.Name, Property_Owner__r.Email ' +
               'FROM Property__c ';
        List<String> conditions = new List<String>();

        // Enforce user isolation if not officer/admin
        if (!CivicTaxSecurityService.isOfficerOrAdmin()) {
            Id currentUserId = UserInfo.getUserId();
            String currentUserEmail = UserInfo.getUserEmail();
            conditions.add('(OwnerId = :currentUserId OR Property_Owner__r.Email = :currentUserEmail)');
        }

        if (String.isNotBlank(category)) {
            conditions.add('Property_Category__c = :category');
        }
        if (String.isNotBlank(zone)) {
            conditions.add('Zone__c = :zone');
        }
        if (String.isNotBlank(status)) {
            conditions.add('Verification_Status__c = :status');
        }

        if (!conditions.isEmpty()) {
            query += 'WHERE ' + String.join(conditions, ' AND ') + ' ';
        }

        query += 'ORDER BY CreatedDate DESC LIMIT 100';

        List<Property__c> props = Database.query(query);
        return (List<Property__c>) CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, props);
    }

    // Update Verification Status (Officer / Admin Only)
    public static Property__c updateVerificationStatus(String propertyId, String newStatus, String officerNotes) {
        CivicTaxSecurityService.requireCanVerifyProperty();

        if (!CivicTaxSecurityService.canUpdateObject('Property__c')) {
            throw new CivicTaxSecurityService.SecurityException('Access Denied: Insufficient permissions to update Property verification.');
        }

        return new SystemElevatedContext().executeUpdateVerification(propertyId, newStatus, officerNotes);
    }

    /**
     * @description Dedicated elevated execution context for authorized municipal officer property verification
     */
    private without sharing class SystemElevatedContext {
        public Property__c executeUpdateVerification(String propertyId, String newStatus, String officerNotes) {
            Property__c prop;
            Boolean isSalesforceId = false;
            try {
                Id checkId = (Id) propertyId;
                isSalesforceId = true;
            } catch (Exception ex) {
                isSalesforceId = false;
            }

            List<Property__c> props;
            if (isSalesforceId) {
                props = [
                    SELECT Id, Verification_Status__c 
                    FROM Property__c 
                    WHERE Id = :propertyId OR Property_Number__c = :propertyId 
                    LIMIT 1
                ];
            } else {
                props = [
                    SELECT Id, Verification_Status__c 
                    FROM Property__c 
                    WHERE Property_Number__c = :propertyId 
                    LIMIT 1
                ];
            }

            if (props.isEmpty()) {
                throw new PropertyException('Property record not found for: ' + propertyId);
            }

            prop = props[0];
            prop.Verification_Status__c = newStatus;
            update prop;
            return prop;
        }
    }
}
