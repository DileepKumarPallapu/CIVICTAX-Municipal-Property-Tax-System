/**
 * Performs a narrowly scoped ownership lookup.
 * Returns only the property identifier and ownership metadata.
 * Does not return property business data.
 */
public without sharing class CivicTaxPropertyAccessProbe {

    public static Property__c findById(Id propertyId) {
        if (propertyId == null) {
            return null;
        }

        List<Property__c> records = [
            SELECT Id, OwnerId, Owner__c, Property_Owner__c,
                   Property_Owner__r.Email
            FROM Property__c
            WHERE Id = :propertyId
            LIMIT 1
        ];
        return records.isEmpty() ? null : records[0];
    }

    public static Property__c findByIdentifier(String identifier) {
        if (String.isBlank(identifier)) {
            return null;
        }

        try {
            Id propertyId = Id.valueOf(identifier);
            return findById(propertyId);
        } catch (Exception ex) {
            List<Property__c> records = [
                SELECT Id, OwnerId, Owner__c, Property_Owner__c,
                       Property_Owner__r.Email
                FROM Property__c
                WHERE Property_Number__c = :identifier
                LIMIT 1
            ];
            return records.isEmpty() ? null : records[0];
        }
    }
}