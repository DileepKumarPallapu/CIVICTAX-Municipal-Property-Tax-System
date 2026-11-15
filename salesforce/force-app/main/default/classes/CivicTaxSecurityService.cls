/**
 * @description Enterprise Security & Authorization Enforcer for CivicTax Custom Objects
 * @group CivicTax 6.0 & 10.0
 */
public with sharing class CivicTaxSecurityService {

    public class SecurityException extends Exception {}

    public static Boolean isSystemAdmin() {
        List<Profile> profs = [SELECT Name FROM Profile WHERE Id = :UserInfo.getProfileId() LIMIT 1];
        return (!profs.isEmpty() && profs[0].Name == 'System Administrator');
    }

    /**
     * @description Checks if running user has a specific Permission Set assigned
     */
    public static Boolean hasPermissionSet(String permSetName) {
        List<PermissionSetAssignment> psa = [
            SELECT Id 
            FROM PermissionSetAssignment 
            WHERE AssigneeId = :UserInfo.getUserId() 
              AND PermissionSet.Name = :permSetName 
            LIMIT 1
        ];
        return !psa.isEmpty();
    }

    /**
     * @description Checks if running user has any of the specified Permission Sets assigned
     */
    public static Boolean hasAnyPermissionSet(Set<String> permSetNames) {
        List<PermissionSetAssignment> psa = [
            SELECT Id 
            FROM PermissionSetAssignment 
            WHERE AssigneeId = :UserInfo.getUserId() 
              AND PermissionSet.Name IN :permSetNames 
            LIMIT 1
        ];
        return !psa.isEmpty();
    }

    /**
     * @description Checks if running user is a Municipal Administrator
     */
    public static Boolean isAdmin() {
        if (isSystemAdmin()) {
            return true;
        }
        return hasPermissionSet('CivicTax_Admin');
    }

    /**
     * @description Checks if running user has general Municipal Officer or Admin authorization
     */
    public static Boolean isGeneralOfficerOrAdmin() {
        if (isSystemAdmin()) {
            return true;
        }
        return hasAnyPermissionSet(new Set<String>{ 'CivicTax_Officer', 'CivicTax_Admin' });
    }

    public static Boolean isOfficerOrAdmin() {
        return isGeneralOfficerOrAdmin();
    }

    /**
     * @description Operation-specific: Property verification (Admin, Officer, or Verification Specialist)
     */
    public static Boolean canVerifyProperty() {
        if (isSystemAdmin()) return true;
        return hasAnyPermissionSet(new Set<String>{ 'CivicTax_Admin', 'CivicTax_Officer', 'CivicTax_Verification' });
    }

    /**
     * @description Operation-specific: Grievance resolution (Admin, Officer, or Grievance Specialist)
     */
    public static Boolean canResolveGrievance() {
        if (isSystemAdmin()) return true;
        return hasAnyPermissionSet(new Set<String>{ 'CivicTax_Admin', 'CivicTax_Officer', 'CivicTax_Grievance' });
    }

    /**
     * @description Operation-specific: Reassessment approval (Admin, Officer, or Reassessment Specialist)
     */
    public static Boolean canApproveReassessment() {
        if (isSystemAdmin()) return true;
        return hasAnyPermissionSet(new Set<String>{ 'CivicTax_Admin', 'CivicTax_Officer', 'CivicTax_Reassessment' });
    }

    /**
     * @description Operation-specific: Assessment management (Admin, Officer, or Assessment Specialist)
     */
    public static Boolean canManageAssessments() {
        if (isSystemAdmin()) return true;
        return hasAnyPermissionSet(new Set<String>{ 'CivicTax_Admin', 'CivicTax_Officer', 'CivicTax_Assessment' });
    }

    /**
     * @description Operation-specific: Executive dashboard analytics (Admin, Officer, Auditor, or Revenue Specialist)
     */
    public static Boolean canViewExecutiveDashboard() {
        if (isSystemAdmin()) return true;
        return hasAnyPermissionSet(new Set<String>{ 'CivicTax_Admin', 'CivicTax_Officer', 'CivicTax_Auditor', 'CivicTax_Revenue' });
    }

    /**
     * @description Enforces general municipal officer or admin authorization
     */
    public static void requireOfficerOrAdmin() {
        if (!isGeneralOfficerOrAdmin()) {
            throw new SecurityException('Access Denied: Operation restricted to Municipal Officers and Administrators.');
        }
    }

    public static void requireAdmin() {
        if (!isAdmin()) {
            throw new SecurityException('Access Denied: Operation restricted to Municipal Administrators.');
        }
    }

    public static void requireCanVerifyProperty() {
        if (!canVerifyProperty()) {
            throw new SecurityException('Access Denied: Operation restricted to Property Verification Officers and Administrators.');
        }
    }

    public static void requireCanResolveGrievance() {
        if (!canResolveGrievance()) {
            throw new SecurityException('Access Denied: Operation restricted to Grievance Redressal Officers and Administrators.');
        }
    }

    public static void requireCanApproveReassessment() {
        if (!canApproveReassessment()) {
            throw new SecurityException('Access Denied: Operation restricted to Valuation Reassessment Officers and Administrators.');
        }
    }

    public static void requireCanManageAssessments() {
        if (!canManageAssessments()) {
            throw new SecurityException('Access Denied: Operation restricted to Municipal Assessment Officers and Administrators.');
        }
    }

    public static void requireCanViewExecutiveDashboard() {
        if (!canViewExecutiveDashboard()) {
            throw new SecurityException('Access Denied: Operation restricted to Municipal Executive, Revenue, and Audit Officers.');
        }
    }

    /**
     * @description Validates if running user is allowed to access specific Property
     * Prioritizes stable Salesforce relationships (OwnerId, ContactId) over email
     */
    public static Boolean canAccessProperty(Id propertyId) {
        if (propertyId == null) return false;
        if (canVerifyProperty()) return true;

        List<Property__c> props = [
            SELECT Id, OwnerId, Property_Owner__c, Property_Owner__r.Email 
            FROM Property__c 
            WHERE Id = :propertyId 
            LIMIT 1
        ];
        if (props.isEmpty()) return false;
        Property__c p = props[0];

        Id currentUserId = UserInfo.getUserId();
        // 1. Direct standard Salesforce record ownership
        if (p.OwnerId == currentUserId) {
            return true;
        }

        // 2. Direct Contact relationship: Check if running user's ContactId matches Property_Owner__c
        List<User> runningUsers = [SELECT ContactId, Email FROM User WHERE Id = :currentUserId LIMIT 1];
        if (!runningUsers.isEmpty()) {
            User u = runningUsers[0];
            if (u.ContactId != null && p.Property_Owner__c != null && u.ContactId == p.Property_Owner__c) {
                return true;
            }
            // 3. Secondary fallback only when Property_Owner__c lookup exists and contact email matches user email
            if (p.Property_Owner__c != null && p.Property_Owner__r.Email != null && u.Email != null && p.Property_Owner__r.Email.equalsIgnoreCase(u.Email)) {
                return true;
            }
        }
        return false;
    }

    public static void requireCanAccessProperty(Id propertyId) {
        if (!canAccessProperty(propertyId)) {
            throw new SecurityException('Access Denied: You do not have permission to access or modify this property.');
        }
    }

    /**
     * @description Validates if running user is allowed to access specific Tax Assessment
     */
    public static Boolean canAccessAssessment(Id assessmentId) {
        if (assessmentId == null) return false;
        if (canManageAssessments()) return true;

        List<Tax_Assessment__c> assts = [
            SELECT Id, OwnerId, Property__c, Property__r.OwnerId, Property__r.Property_Owner__c, Property__r.Property_Owner__r.Email 
            FROM Tax_Assessment__c 
            WHERE Id = :assessmentId 
            LIMIT 1
        ];
        if (assts.isEmpty()) return false;
        Tax_Assessment__c a = assts[0];

        Id currentUserId = UserInfo.getUserId();
        if (a.OwnerId == currentUserId) {
            return true;
        }
        if (a.Property__c != null) {
            if (a.Property__r.OwnerId == currentUserId) {
                return true;
            }
            List<User> runningUsers = [SELECT ContactId, Email FROM User WHERE Id = :currentUserId LIMIT 1];
            if (!runningUsers.isEmpty()) {
                User u = runningUsers[0];
                if (u.ContactId != null && a.Property__r.Property_Owner__c != null && u.ContactId == a.Property__r.Property_Owner__c) {
                    return true;
                }
                if (a.Property__r.Property_Owner__c != null && a.Property__r.Property_Owner__r.Email != null && u.Email != null && a.Property__r.Property_Owner__r.Email.equalsIgnoreCase(u.Email)) {
                    return true;
                }
            }
        }
        return false;
    }

    public static void requireCanAccessAssessment(Id assessmentId) {
        if (!canAccessAssessment(assessmentId)) {
            throw new SecurityException('Access Denied: You do not have permission to access or modify this tax assessment.');
        }
    }

    public static Boolean canReadObject(String sObjectName) {
        Schema.SObjectType targetType = Schema.getGlobalDescribe().get(sObjectName);
        if (targetType == null) return false;
        return targetType.getDescribe().isAccessible();
    }

    public static Boolean canCreateObject(String sObjectName) {
        Schema.SObjectType targetType = Schema.getGlobalDescribe().get(sObjectName);
        if (targetType == null) return false;
        return targetType.getDescribe().isCreateable();
    }

    public static Boolean canUpdateObject(String sObjectName) {
        Schema.SObjectType targetType = Schema.getGlobalDescribe().get(sObjectName);
        if (targetType == null) return false;
        return targetType.getDescribe().isUpdateable();
    }

    public static List<SObject> sanitizeRecords(AccessType accessMode, List<SObject> records) {
        if (records == null || records.isEmpty()) return records;
        SObjectAccessDecision decision = Security.stripInaccessible(accessMode, records);
        return decision.getRecords();
    }
}
