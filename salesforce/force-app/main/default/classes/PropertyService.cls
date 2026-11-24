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

        // For CivicTax citizen sessions, bind the record to the mapped Contact.
        // OwnerId is the Salesforce record owner and is not a citizen identity.
        if (String.isNotBlank(CivicTaxSecurityService.getRequestIdentity()) &&
            !CivicTaxSecurityService.isOfficerOrAdmin()) {
            Id citizenContactId = CivicTaxSecurityService.getCurrentCitizenContactId();
            prop.Owner__c = citizenContactId;
            prop.Property_Owner__c = citizenContactId;
        }

        insert prop;
        return prop;
    }

    // Retrieve single property by Property Number or Id with strict ownership validation
    public static Property__c getProperty(String identifier) {
        if (String.isBlank(identifier)) {
            throw new PropertyException('Property identifier cannot be blank.');
        }

        // Identify the record and enforce ownership before attempting a sharing-scoped
        // business-data query. The probe exposes only ownership metadata.
        Property__c ownership = CivicTaxPropertyAccessProbe.findByIdentifier(identifier);
        if (ownership == null) {
            throw new PropertyException('Property record not found for: ' + identifier);
        }
        CivicTaxSecurityService.requireCanAccessProperty(ownership.Id);

        List<Property__c> props;
        props = [
            SELECT Id, Name, Property_Number__c, Property_Address__c, Property_Category__c,
                   Built_Up_Area__c, Zone__c, Verification_Status__c, Ownership_Document__c,
                   Registration_Date__c, Latitude__c, Longitude__c, Construction_Year__c,
                   OwnerId, Owner__c, Owner__r.Name, Property_Owner__c,
                   Property_Owner__r.Name, Property_Owner__r.Email
            FROM Property__c
            WHERE Id = :ownership.Id
            LIMIT 1
        ];

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
               'Registration_Date__c, Latitude__c, Longitude__c, Owner__c, Owner__r.Name, ' +
               'Property_Owner__c, Property_Owner__r.Name, Property_Owner__r.Email ' +
               'FROM Property__c ';
        List<String> conditions = new List<String>();

        // Enforce user isolation if not officer/admin
        if (!CivicTaxSecurityService.isOfficerOrAdmin()) {
            if (String.isNotBlank(CivicTaxSecurityService.getRequestIdentity())) {
                Id citizenContactId = CivicTaxSecurityService.getCurrentCitizenContactId();
                conditions.add('(Owner__c = :citizenContactId OR Property_Owner__c = :citizenContactId)');
            } else {
                Id currentUserId = UserInfo.getUserId();
                String currentUserEmail = UserInfo.getUserEmail();
                conditions.add('(OwnerId = :currentUserId OR Property_Owner__r.Email = :currentUserEmail)');
            }
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

    // Update editable property details while preserving ownership and verification controls.
    public static Property__c updatePropertyDetails(
        Id propertyId,
        String address,
        String category,
        Decimal builtUpArea,
        String zone,
        String ownershipDoc,
        Integer constructionYear,
        Decimal latitude,
        Decimal longitude
    ) {
        if (propertyId == null) throw new PropertyException('Property ID is required.');
        CivicTaxSecurityService.requireCanAccessProperty(propertyId);
        if (!CivicTaxSecurityService.canUpdateObject('Property__c')) {
            throw new CivicTaxSecurityService.SecurityException('Access Denied: Insufficient permissions to update Property.');
        }
        if (builtUpArea != null && builtUpArea <= 0) {
            throw new PropertyException('Built-up area must be greater than zero.');
        }

        List<Property__c> records = [
            SELECT Id, Verification_Status__c
            FROM Property__c WHERE Id = :propertyId LIMIT 1
        ];
        if (records.isEmpty()) throw new PropertyException('Property record not found.');
        Property__c prop = records[0];
        if (prop.Verification_Status__c == 'VERIFIED') {
            throw new PropertyException('Verified properties cannot be edited directly. Submit a reassessment request.');
        }

        if (address != null) prop.Property_Address__c = address.trim();
        if (category != null) prop.Property_Category__c = category;
        if (builtUpArea != null) prop.Built_Up_Area__c = builtUpArea;
        if (zone != null) prop.Zone__c = zone;
        if (ownershipDoc != null) prop.Ownership_Document__c = ownershipDoc;
        if (constructionYear != null) prop.Construction_Year__c = constructionYear;
        if (latitude != null) prop.Latitude__c = latitude;
        if (longitude != null) prop.Longitude__c = longitude;

        SObjectAccessDecision decision = Security.stripInaccessible(AccessType.UPDATABLE, new List<SObject>{ prop });
        update decision.getRecords()[0];
        return [
            SELECT Id, Name, Property_Number__c, Property_Address__c, Property_Category__c,
                   Built_Up_Area__c, Zone__c, Verification_Status__c, Ownership_Document__c,
                   Registration_Date__c, Latitude__c, Longitude__c, Construction_Year__c,
                   Owner__c, Owner__r.Name, Property_Owner__c, Property_Owner__r.Name
            FROM Property__c WHERE Id = :propertyId LIMIT 1
        ];
    }

    // Update Verification Status (Officer / Admin Only)
    public static Property__c updateVerificationStatus(String propertyId, String newStatus, String officerNotes) {
        CivicTaxSecurityService.requireCanVerifyProperty();

        if (!CivicTaxSecurityService.canUpdateObject('Property__c')) {
            throw new CivicTaxSecurityService.SecurityException('Access Denied: Insufficient permissions to update Property verification.');
        }
        Set<String> allowedStatuses = new Set<String>{ 'PENDING', 'VERIFIED', 'RESUBMISSION_REQUIRED', 'REJECTED' };
        if (!allowedStatuses.contains(newStatus)) {
            throw new PropertyException('Invalid property verification status.');
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