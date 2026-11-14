/**
 * @description Enterprise Service for Property Registration, Verification, and Zonal Inquiries
 * @group CivicTax 6.0
 */
public with sharing class CivicTaxPropertyService {
    
    public class PropertyServiceException extends Exception {}

    /**
     * @description Registers a new property with duplicate validation and plot boundary guards
     */
    public static Property__c registerProperty(Property__c prop) {
        if (prop == null) {
            throw new PropertyServiceException('Property record cannot be null');
        }
        if (String.isBlank(prop.Property_Number__c)) {
            throw new PropertyServiceException('Property Number is mandatory');
        }
        if (prop.Built_Up_Area__c == null || prop.Built_Up_Area__c <= 0) {
            throw new PropertyServiceException('Built-Up Area must be strictly greater than zero');
        }

        // Duplicate Guard
        List<Property__c> existing = [
            SELECT Id, Property_Number__c 
            FROM Property__c 
            WHERE Property_Number__c = :prop.Property_Number__c 
            WITH SECURITY_ENFORCED 
            LIMIT 1
        ];
        if (!existing.isEmpty()) {
            throw new PropertyServiceException('Property Number ' + prop.Property_Number__c + ' is already registered.');
        }

        prop.Verification_Status__c = 'Pending';
        prop.Registration_Status__c = 'Submitted';
        
        SObjectAccessDecision decision = Security.stripInaccessible(AccessType.CREATABLE, new List<Property__c>{ prop });
        insert decision.getRecords();
        return (Property__c) decision.getRecords()[0];
    }

    /**
     * @description Bulk updates verification status with surveyor notes
     */
    public static List<Property__c> updateVerificationStatus(Map<Id, String> propertyStatusMap) {
        if (propertyStatusMap == null || propertyStatusMap.isEmpty()) {
            return new List<Property__c>();
        }

        Set<Id> propIds = propertyStatusMap.keySet();
        List<Property__c> properties = [
            SELECT Id, Verification_Status__c, Registration_Status__c 
            FROM Property__c 
            WHERE Id IN :propIds 
            WITH SECURITY_ENFORCED
        ];

        for (Property__c p : properties) {
            String newStatus = propertyStatusMap.get(p.Id);
            p.Verification_Status__c = newStatus;
            if (newStatus == 'Verified') {
                p.Registration_Status__c = 'Active';
            } else if (newStatus == 'Rejected') {
                p.Registration_Status__c = 'Rejected';
            }
        }

        SObjectAccessDecision decision = Security.stripInaccessible(AccessType.UPDATABLE, properties);
        update decision.getRecords();
        return (List<Property__c>) decision.getRecords();
    }

    /**
     * @description Queries properties filtered by municipal zone and category
     */
    public static List<Property__c> getPropertiesByFilter(String zone, String category) {
        String query = 'SELECT Id, Name, Property_Number__c, Property_Address__c, Zone__c, Property_Category__c, Built_Up_Area__c, Verification_Status__c, Registration_Status__c FROM Property__c WHERE Id != null';
        
        if (String.isNotBlank(zone)) {
            query += ' AND Zone__c = :zone';
        }
        if (String.isNotBlank(category)) {
            query += ' AND Property_Category__c = :category';
        }
        query += ' WITH SECURITY_ENFORCED ORDER BY CreatedDate DESC LIMIT 100';

        return Database.query(query);
    }
}
