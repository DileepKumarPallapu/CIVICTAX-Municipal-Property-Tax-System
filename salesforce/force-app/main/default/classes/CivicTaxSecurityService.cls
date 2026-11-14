/**
 * @description Enterprise Security & Authorization Enforcer for CivicTax Custom Objects
 * @group CivicTax 6.0
 */
public with sharing class CivicTaxSecurityService {

    /**
     * @description Checks if running user has read access on target sObject
     */
    public static Boolean canReadObject(String sObjectName) {
        Schema.SObjectType targetType = Schema.getGlobalDescribe().get(sObjectName);
        if (targetType == null) return false;
        return targetType.getDescribe().isAccessible();
    }

    /**
     * @description Checks if running user has create access on target sObject
     */
    public static Boolean canCreateObject(String sObjectName) {
        Schema.SObjectType targetType = Schema.getGlobalDescribe().get(sObjectName);
        if (targetType == null) return false;
        return targetType.getDescribe().isCreateable();
    }

    /**
     * @description Checks if running user has edit access on target sObject
     */
    public static Boolean canUpdateObject(String sObjectName) {
        Schema.SObjectType targetType = Schema.getGlobalDescribe().get(sObjectName);
        if (targetType == null) return false;
        return targetType.getDescribe().isUpdateable();
    }

    /**
     * @description Strips inaccessible fields from a record list according to current user's profile/permsets
     */
    public static List<SObject> sanitizeRecords(AccessType accessMode, List<SObject> records) {
        if (records == null || records.isEmpty()) return records;
        SObjectAccessDecision decision = Security.stripInaccessible(accessMode, records);
        return decision.getRecords();
    }
}
