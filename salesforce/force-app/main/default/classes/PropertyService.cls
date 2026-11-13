// PropertyService.cls
// CivicTax 8.0 Enterprise Apex Service for Property Management
public with sharing class PropertyService {
    public class PropertyException extends Exception {}

    // Register a new property with full validation and duplicate checks
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
            WITH USER_MODE 
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

        insert as user prop;
        return prop;
    }

    // Retrieve single property by Property Number or Id
    public static Property__c getProperty(String identifier) {
        List<Property__c> props = [
            SELECT Id, Name, Property_Number__c, Property_Address__c, Property_Category__c, 
                   Built_Up_Area__c, Zone__c, Verification_Status__c, Ownership_Document__c, 
                   Registration_Date__c, Latitude__c, Longitude__c, Construction_Year__c
            FROM Property__c 
            WHERE Id = :identifier OR Property_Number__c = :identifier 
            WITH USER_MODE 
            LIMIT 1
        ];
        if (props.isEmpty()) {
            throw new PropertyException('Property record not found for: ' + identifier);
        }
        return props[0];
    }

    // List properties with optional filters
    public static List<Property__c> listProperties(String category, String zone, String status) {
        String query = 'SELECT Id, Name, Property_Number__c, Property_Address__c, Property_Category__c, ' +
                       'Built_Up_Area__c, Zone__c, Verification_Status__c, Registration_Date__c, Latitude__c, Longitude__c ' +
                       'FROM Property__c ';
        List<String> conditions = new List<String>();

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

        return Database.query(query, AccessLevel.USER_MODE);
    }

    // Update Verification Status
    public static Property__c updateVerificationStatus(String propertyId, String newStatus, String officerNotes) {
        Property__c prop = getProperty(propertyId);
        prop.Verification_Status__c = newStatus;
        update as user prop;
        return prop;
    }
}
