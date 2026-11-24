/**
 * @description Enterprise Security & Authorization Enforcer for CivicTax Custom Objects
 * @group CivicTax 6.0 & 10.0
 */
public with sharing class CivicTaxSecurityService {

    public class SecurityException extends Exception {}

    // Set only by CivicTaxGatewayAuth after validating the backend HMAC signature.
    private static String requestCivicTaxId;

    public static void setRequestIdentity(String civicTaxId) {
        if (String.isBlank(civicTaxId)) {
            throw new SecurityException('Authenticated CivicTax identity is required.');
        }
        requestCivicTaxId = civicTaxId.trim();
    }

    public static void clearRequestIdentity() {
        requestCivicTaxId = null;
    }

    public static String getRequestIdentity() {
        return requestCivicTaxId;
    }

    public static CivicTax_User__c getCurrentCivicTaxUser() {
        if (String.isBlank(requestCivicTaxId)) {
            throw new SecurityException('CivicTax identity has not been initialized.');
        }
        List<CivicTax_User__c> users = [
            SELECT Id, CivicTax_ID__c, Salesforce_Contact_ID__c, Full_Name__c,
                   Email__c, Role__c, Account_Status__c
            FROM CivicTax_User__c
            WHERE CivicTax_ID__c = :requestCivicTaxId
            LIMIT 2
        ];
        if (users.isEmpty()) throw new SecurityException('No CivicTax user mapping exists for this account.');
        if (users.size() > 1) throw new SecurityException('Duplicate CivicTax user mappings detected.');
        if (users[0].Account_Status__c != 'ACTIVE') {
            throw new SecurityException('Your CivicTax account is not active.');
        }
        return users[0];
    }

    public static Id getCurrentCitizenContactId() {
        CivicTax_User__c currentUser = getCurrentCivicTaxUser();
        if (String.isBlank(currentUser.Salesforce_Contact_ID__c)) {
            throw new SecurityException('Your CivicTax account is not linked to a Salesforce Contact.');
        }
        Id contactId;
        try {
            contactId = Id.valueOf(currentUser.Salesforce_Contact_ID__c.trim());
        } catch (Exception ex) {
            throw new SecurityException('The Salesforce Contact mapping is invalid.');
        }
        if (contactId.getSObjectType() != Contact.SObjectType ||
            [SELECT count() FROM Contact WHERE Id = :contactId] == 0) {
            throw new SecurityException('The mapped Salesforce Contact does not exist.');
        }
        return contactId;
    }

    private static Boolean hasExternalIdentity() {
        return !String.isBlank(requestCivicTaxId);
    }

    private static String externalRole() {
        return getCurrentCivicTaxUser().Role__c;
    }

    public static Boolean isSystemAdmin() {
        if (hasExternalIdentity()) return externalRole() == 'ADMIN';
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
        if (hasExternalIdentity()) return externalRole() == 'ADMIN';
        if (isSystemAdmin()) {
            return true;
        }
        return hasPermissionSet('CivicTax_Admin');
    }

    public static Boolean isCitizen() {
        if (hasExternalIdentity()) return externalRole() == 'CITIZEN';
        return hasPermissionSet('CivicTax_Citizen');
    }

    /**
     * @description Checks if running user has general Municipal Officer or Admin authorization
     */
    public static Boolean isGeneralOfficerOrAdmin() {
        if (hasExternalIdentity()) return new Set<String>{ 'OFFICER', 'ADMIN' }.contains(externalRole());
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
        if (hasExternalIdentity()) return isOfficerOrAdmin();
        if (isSystemAdmin()) return true;
        return hasAnyPermissionSet(new Set<String>{ 'CivicTax_Admin', 'CivicTax_Officer', 'CivicTax_Verification' });
    }

    /**
     * @description Operation-specific: Grievance resolution (Admin, Officer, or Grievance Specialist)
     */
    public static Boolean canResolveGrievance() {
        if (hasExternalIdentity()) return isOfficerOrAdmin();
        if (isSystemAdmin()) return true;
        return hasAnyPermissionSet(new Set<String>{ 'CivicTax_Admin', 'CivicTax_Officer', 'CivicTax_Grievance' });
    }

    /**
     * @description Operation-specific: Reassessment approval (Admin, Officer, or Reassessment Specialist)
     */
    public static Boolean canApproveReassessment() {
        if (hasExternalIdentity()) return isOfficerOrAdmin();
        if (isSystemAdmin()) return true;
        return hasAnyPermissionSet(new Set<String>{ 'CivicTax_Admin', 'CivicTax_Officer', 'CivicTax_Reassessment' });
    }

    /**
     * @description Operation-specific: Assessment management (Admin, Officer, or Assessment Specialist)
     */
    public static Boolean canManageAssessments() {
        if (hasExternalIdentity()) return isOfficerOrAdmin();
        if (isSystemAdmin()) return true;
        return hasAnyPermissionSet(new Set<String>{ 'CivicTax_Admin', 'CivicTax_Officer', 'CivicTax_Assessment' });
    }

    /**
     * @description Operation-specific: Executive dashboard analytics (Admin, Officer, Auditor, or Revenue Specialist)
     */
    public static Boolean canViewExecutiveDashboard() {
        if (hasExternalIdentity()) return isOfficerOrAdmin();
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
        if (isOfficerOrAdmin()) return true;

        Property__c property = CivicTaxPropertyAccessProbe.findById(propertyId);
        if (property == null) return false;

        if (hasExternalIdentity()) {
            Id contactId = getCurrentCitizenContactId();
            return property.Owner__c == contactId || property.Property_Owner__c == contactId;
        }

        Id currentUserId = UserInfo.getUserId();
        if (property.OwnerId == currentUserId) return true;
        List<User> runningUsers = [SELECT ContactId, Email FROM User WHERE Id = :currentUserId LIMIT 1];
        if (!runningUsers.isEmpty()) {
            User u = runningUsers[0];
            if (u.ContactId != null && property.Property_Owner__c != null && u.ContactId == property.Property_Owner__c) return true;
            if (property.Property_Owner__c != null && property.Property_Owner__r.Email != null &&
                u.Email != null && property.Property_Owner__r.Email.equalsIgnoreCase(u.Email)) return true;
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

        if (hasExternalIdentity()) {
            Id contactId = getCurrentCitizenContactId();
            List<Tax_Assessment__c> records = [
                SELECT Id, Property__c, Property__r.Owner__c, Property__r.Property_Owner__c
                FROM Tax_Assessment__c WHERE Id = :assessmentId LIMIT 1
            ];
            if (records.isEmpty() || records[0].Property__c == null) return false;
            return records[0].Property__r.Owner__c == contactId ||
                   records[0].Property__r.Property_Owner__c == contactId;
        }

        List<Tax_Assessment__c> assts = [
            SELECT Id, OwnerId, Property__c, Property__r.OwnerId,
                   Property__r.Property_Owner__c, Property__r.Property_Owner__r.Email
            FROM Tax_Assessment__c WHERE Id = :assessmentId LIMIT 1
        ];
        if (assts.isEmpty()) return false;
        Tax_Assessment__c a = assts[0];
        Id currentUserId = UserInfo.getUserId();
        if (a.OwnerId == currentUserId) return true;
        if (a.Property__c != null) {
            if (a.Property__r.OwnerId == currentUserId) return true;
            List<User> runningUsers = [SELECT ContactId, Email FROM User WHERE Id = :currentUserId LIMIT 1];
            if (!runningUsers.isEmpty()) {
                User u = runningUsers[0];
                if (u.ContactId != null && a.Property__r.Property_Owner__c != null && u.ContactId == a.Property__r.Property_Owner__c) return true;
                if (a.Property__r.Property_Owner__c != null && a.Property__r.Property_Owner__r.Email != null && u.Email != null && a.Property__r.Property_Owner__r.Email.equalsIgnoreCase(u.Email)) return true;
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