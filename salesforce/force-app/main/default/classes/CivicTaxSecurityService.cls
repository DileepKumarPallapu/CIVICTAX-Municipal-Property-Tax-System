
/**
 * CivicTax Security and Authorization Service
 *
 * Citizen identity is resolved through:
 * CivicTax_User__c.CivicTax_ID__c
 * CivicTax_User__c.Salesforce_Contact_ID__c
 *
 * IMPORTANT:
 * The backend must set the authenticated CivicTax ID for every
 * Apex REST transaction using setRequestIdentity().
 */
public with sharing class CivicTaxSecurityService {

    public class SecurityException extends Exception {}

    // Transaction-scoped identity supplied by the authenticated backend.
    private static String requestCivicTaxId;

    /**
     * Set the authenticated CivicTax ID.
     * Call this at the beginning of every Apex REST request.
     * Never take this value directly from an untrusted browser request.
     */
    public static void setRequestIdentity(String civicTaxId) {
        if (String.isBlank(civicTaxId)) {
            throw new SecurityException(
                'Authenticated CivicTax identity is required.'
            );
        }

        requestCivicTaxId = civicTaxId.trim();
    }

    public static String getRequestIdentity() {
        return requestCivicTaxId;
    }

    /**
     * Resolve the CivicTax user record.
     */
    public static CivicTax_User__c getCurrentCivicTaxUser() {

        if (String.isBlank(requestCivicTaxId)) {
            throw new SecurityException(
                'CivicTax identity has not been initialized.'
            );
        }

        List<CivicTax_User__c> users = [
            SELECT Id,
                   CivicTax_ID__c,
                   Salesforce_Contact_ID__c,
                   Full_Name__c,
                   Email__c,
                   Role__c,
                   Account_Status__c
            FROM CivicTax_User__c
            WHERE CivicTax_ID__c = :requestCivicTaxId
            LIMIT 2
        ];

        if (users.isEmpty()) {
            throw new SecurityException(
                'No CivicTax user mapping exists for this account.'
            );
        }

        if (users.size() > 1) {
            throw new SecurityException(
                'Duplicate CivicTax user mappings detected.'
            );
        }

        CivicTax_User__c currentUser = users[0];

        if (currentUser.Account_Status__c != 'ACTIVE') {
            throw new SecurityException(
                'Your CivicTax account is not active.'
            );
        }

        return currentUser;
    }

    /**
     * Resolve the Salesforce Contact belonging to the CivicTax user.
     */
    public static Id getCurrentCitizenContactId() {

        CivicTax_User__c currentUser = getCurrentCivicTaxUser();

        String contactIdText =
            currentUser.Salesforce_Contact_ID__c;

        if (String.isBlank(contactIdText)) {
            throw new SecurityException(
                'Your CivicTax account is not linked to a Salesforce Contact.'
            );
        }

        Id contactId;

        try {
            contactId = Id.valueOf(contactIdText.trim());
        } catch (Exception ex) {
            throw new SecurityException(
                'The Salesforce Contact mapping is invalid.'
            );
        }

        if (contactId.getSObjectType() != Contact.SObjectType) {
            throw new SecurityException(
                'The mapped record is not a Salesforce Contact.'
            );
        }

        List<Contact> contacts = [
            SELECT Id
            FROM Contact
            WHERE Id = :contactId
            LIMIT 1
        ];

        if (contacts.isEmpty()) {
            throw new SecurityException(
                'The mapped Salesforce Contact does not exist.'
            );
        }

        return contactId;
    }

    // ---------------------------------------------------------
    // APPLICATION ROLE AUTHORIZATION
    // ---------------------------------------------------------

    public static String getCurrentRole() {
        return getCurrentCivicTaxUser().Role__c;
    }

    public static Boolean isCitizen() {
        return getCurrentRole() == 'CITIZEN';
    }

    public static Boolean isAdmin() {
        return getCurrentRole() == 'ADMIN';
    }

    public static Boolean isOfficerOrAdmin() {
        String role = getCurrentRole();

        return role == 'OFFICER' || role == 'ADMIN';
    }

    public static Boolean isGeneralOfficerOrAdmin() {
        return isOfficerOrAdmin();
    }

    public static Boolean canVerifyProperty() {
        return isOfficerOrAdmin();
    }

    public static Boolean canResolveGrievance() {
        return isOfficerOrAdmin();
    }

    public static Boolean canApproveReassessment() {
        return isOfficerOrAdmin();
    }

    public static Boolean canManageAssessments() {
        return isOfficerOrAdmin();
    }

    public static Boolean canViewExecutiveDashboard() {
        return isOfficerOrAdmin();
    }

    public static void requireAdmin() {
        if (!isAdmin()) {
            throw new SecurityException(
                'Access denied. Administrator authorization required.'
            );
        }
    }

    public static void requireOfficerOrAdmin() {
        if (!isOfficerOrAdmin()) {
            throw new SecurityException(
                'Access denied. Officer or administrator authorization required.'
            );
        }
    }

    public static void requireCanVerifyProperty() {
        if (!canVerifyProperty()) {
            throw new SecurityException(
                'Property verification is restricted to officers and administrators.'
            );
        }
    }

    public static void requireCanResolveGrievance() {
        if (!canResolveGrievance()) {
            throw new SecurityException(
                'Grievance resolution is restricted to officers and administrators.'
            );
        }
    }

    public static void requireCanApproveReassessment() {
        if (!canApproveReassessment()) {
            throw new SecurityException(
                'Reassessment approval is restricted to officers and administrators.'
            );
        }
    }

    public static void requireCanManageAssessments() {
        if (!canManageAssessments()) {
            throw new SecurityException(
                'Assessment management is restricted to officers and administrators.'
            );
        }
    }

    public static void requireCanViewExecutiveDashboard() {
        if (!canViewExecutiveDashboard()) {
            throw new SecurityException(
                'Executive dashboard access is restricted to officers and administrators.'
            );
        }
    }

    // ---------------------------------------------------------
    // PROPERTY OWNERSHIP
    // ---------------------------------------------------------

    public static Boolean canAccessProperty(Id propertyId) {

        if (propertyId == null) {
            return false;
        }

        if (isOfficerOrAdmin()) {
            return true;
        }

        Id citizenContactId = getCurrentCitizenContactId();

        List<Property__c> properties = [
            SELECT Id, Owner__c, Property_Owner__c
            FROM Property__c
            WHERE Id = :propertyId
            LIMIT 1
        ];

        if (properties.isEmpty()) {
            return false;
        }

        Property__c propertyRecord = properties[0];

        return (
            propertyRecord.Property_Owner__c == citizenContactId ||
            propertyRecord.Owner__c == citizenContactId
        );
    }

    public static void requireCanAccessProperty(Id propertyId) {

        if (!canAccessProperty(propertyId)) {
            throw new SecurityException(
                'Access denied. This property does not belong to your CivicTax account.'
            );
        }
    }

    // ---------------------------------------------------------
    // ASSESSMENT OWNERSHIP
    // ---------------------------------------------------------

    public static Boolean canAccessAssessment(Id assessmentId) {

        if (assessmentId == null) {
            return false;
        }

        if (isOfficerOrAdmin()) {
            return true;
        }

        Id citizenContactId = getCurrentCitizenContactId();

        List<Tax_Assessment__c> assessments = [
            SELECT Id,
                   Property__c,
                   Property__r.Owner__c,
                   Property__r.Property_Owner__c
            FROM Tax_Assessment__c
            WHERE Id = :assessmentId
            LIMIT 1
        ];

        if (assessments.isEmpty()) {
            return false;
        }

        Tax_Assessment__c assessment = assessments[0];

        if (assessment.Property__c == null) {
            return false;
        }

        return (
            assessment.Property__r.Property_Owner__c == citizenContactId ||
            assessment.Property__r.Owner__c == citizenContactId
        );
    }

    public static void requireCanAccessAssessment(Id assessmentId) {

        if (!canAccessAssessment(assessmentId)) {
            throw new SecurityException(
                'Access denied. This assessment does not belong to your CivicTax account.'
            );
        }
    }

    // ---------------------------------------------------------
    // OBJECT PERMISSIONS AND FIELD SANITIZATION
    // ---------------------------------------------------------

    public static Boolean canReadObject(String sObjectName) {

        Schema.SObjectType targetType =
            Schema.getGlobalDescribe().get(sObjectName);

        return targetType != null &&
            targetType.getDescribe().isAccessible();
    }

    public static Boolean canCreateObject(String sObjectName) {

        Schema.SObjectType targetType =
            Schema.getGlobalDescribe().get(sObjectName);

        return targetType != null &&
            targetType.getDescribe().isCreateable();
    }

    public static Boolean canUpdateObject(String sObjectName) {

        Schema.SObjectType targetType =
            Schema.getGlobalDescribe().get(sObjectName);

        return targetType != null &&
            targetType.getDescribe().isUpdateable();
    }

    public static List<SObject> sanitizeRecords(
        AccessType accessMode,
        List<SObject> records
    ) {

        if (records == null || records.isEmpty()) {
            return records;
        }

        SObjectAccessDecision decision =
            Security.stripInaccessible(accessMode, records);

        return decision.getRecords();
    }
}
