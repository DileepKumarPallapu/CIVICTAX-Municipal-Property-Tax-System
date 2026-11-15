/**
 * @description Enterprise Service for Property Registration, Verification, and Zonal Inquiries
 * @group CivicTax 6.0 & 10.0
 */
public with sharing class CivicTaxPropertyService {
    
    public class PropertyServiceException extends Exception {}

    /**
     * @description Registers a new property with duplicate validation and CRUD guards
     */
    public static Property__c registerProperty(Property__c prop) {
        if (!CivicTaxSecurityService.canCreateObject('Property__c')) {
            throw new CivicTaxSecurityService.SecurityException('Access Denied: Insufficient permissions to register Property.');
        }

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
            LIMIT 1
        ];
        if (!existing.isEmpty()) {
            throw new PropertyServiceException('Property Number ' + prop.Property_Number__c + ' is already registered.');
        }

        prop.Verification_Status__c = 'PENDING';
        prop.Registration_Status__c = 'Submitted';
        
        insert prop;
        return prop;
    }

    /**
     * @description Bulk updates verification status with surveyor notes (Officer / Admin Only)
     */
    public static List<Property__c> updateVerificationStatus(Map<Id, String> propertyStatusMap) {
        if (propertyStatusMap == null || propertyStatusMap.isEmpty()) {
            return new List<Property__c>();
        }

        CivicTaxSecurityService.requireCanVerifyProperty();

        if (!CivicTaxSecurityService.canUpdateObject('Property__c')) {
            throw new CivicTaxSecurityService.SecurityException('Access Denied: Insufficient permissions to update Property verification.');
        }

        return new SystemElevatedContext().executeUpdateVerification(propertyStatusMap);
    }

    /**
     * @description Queries properties filtered by municipal zone and category with user isolation
     */
    public static List<Property__c> getPropertiesByFilter(String zone, String category) {
        String query = 'SELECT Id, Name, Property_Number__c, Property_Address__c, Zone__c, Property_Category__c, Built_Up_Area__c, Verification_Status__c, Registration_Status__c, OwnerId, Property_Owner__c FROM Property__c WHERE Id != null';
        
        // Non-officer/citizen accounts can only see their own properties
        if (!CivicTaxSecurityService.isOfficerOrAdmin()) {
            Id currentUserId = UserInfo.getUserId();
            String currentUserEmail = UserInfo.getUserEmail();
            query += ' AND (OwnerId = :currentUserId OR Property_Owner__r.Email = :currentUserEmail)';
        }

        if (String.isNotBlank(zone)) {
            query += ' AND Zone__c = :zone';
        }
        if (String.isNotBlank(category)) {
            query += ' AND Property_Category__c = :category';
        }
        query += ' ORDER BY CreatedDate DESC LIMIT 100';

        List<Property__c> props = Database.query(query);
        return (List<Property__c>) CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, props);
    }

    /**
     * @description Dedicated elevated execution context for authorized municipal officer property verification
     */
    private without sharing class SystemElevatedContext {
        public List<Property__c> executeUpdateVerification(Map<Id, String> propertyStatusMap) {
            Set<Id> propIds = propertyStatusMap.keySet();
            List<Property__c> properties = [
                SELECT Id, Verification_Status__c, Registration_Status__c 
                FROM Property__c 
                WHERE Id IN :propIds
            ];

            for (Property__c p : properties) {
                String newStatus = propertyStatusMap.get(p.Id);
                if (newStatus != null) {
                    if (newStatus.equalsIgnoreCase('Verified')) {
                        p.Verification_Status__c = 'VERIFIED';
                        p.Registration_Status__c = 'Active';
                    } else if (newStatus.equalsIgnoreCase('Rejected')) {
                        p.Verification_Status__c = 'REJECTED';
                        p.Registration_Status__c = 'Rejected';
                    } else {
                        p.Verification_Status__c = newStatus.toUpperCase();
                    }
                }
            }

            update properties;
            return properties;
        }
    }
}
