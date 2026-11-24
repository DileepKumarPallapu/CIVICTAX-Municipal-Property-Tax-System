/**
 * @description Enterprise Service for Property Valuation Reassessment, Multi-Step Approvals & Delta Recomputation
 * @group CivicTax 6.0 & 10.0
 */
public with sharing class CivicTaxReassessmentService {

    public class ReassessmentException extends Exception {}

    /**
     * @description Submits a reassessment request for an existing property with ownership and CRUD guards
     */
    public static Reassessment_Request__c submitRequest(Id propertyId, Id originalAssessmentId, String requestedChange, String reason) {
        if (!CivicTaxSecurityService.canCreateObject('Reassessment_Request__c')) {
            throw new CivicTaxSecurityService.SecurityException('Access Denied: Insufficient permissions to submit Reassessment requests.');
        }

        if (propertyId == null) {
            throw new ReassessmentException('Target Property ID is mandatory');
        }
        if (String.isBlank(requestedChange)) {
            throw new ReassessmentException('Requested dimensional or category changes must be stated');
        }

        // BOLA / IDOR Protection: Citizen can only file reassessment for properties they have access to
        CivicTaxSecurityService.requireCanAccessProperty(propertyId);

        Reassessment_Request__c req = new Reassessment_Request__c();
        req.Property__c = propertyId;
        if (String.isNotBlank(CivicTaxSecurityService.getRequestIdentity())) {
            CivicTax_User__c currentCitizen = CivicTaxSecurityService.getCurrentCivicTaxUser();
            req.Citizen__c = currentCitizen.Id;
            req.CivicTax_ID__c = currentCitizen.CivicTax_ID__c;
        }
        req.Original_Assessment__c = originalAssessmentId;
        req.Requested_Change__c = requestedChange;
        req.Supporting_Reason__c = reason;
        req.Approval_Status__c = 'Submitted';
        req.Request_Number__c = 'RR-' + String.valueOf(System.currentTimeMillis()).right(6);

        insert req;
        return req;
    }

    /**
     * @description Approves a reassessment request; assessment recalculation is a separate workflow and is not performed here.
     */
    public static Reassessment_Request__c approveReassessment(Id requestId, String comments) {
        if (requestId == null) {
            throw new ReassessmentException('Request ID cannot be null');
        }

        // Enforce Reassessment Officer or Administrator authorization
        CivicTaxSecurityService.requireCanApproveReassessment();

        if (!CivicTaxSecurityService.canUpdateObject('Reassessment_Request__c')) {
            throw new CivicTaxSecurityService.SecurityException('Access Denied: Insufficient permissions to approve Reassessment requests.');
        }

        return new SystemElevatedContext().executeApproveReassessment(requestId, comments);
    }

    public static Reassessment_Request__c rejectReassessment(Id requestId, String comments) {
        if (requestId == null) throw new ReassessmentException('Request ID cannot be null');
        CivicTaxSecurityService.requireCanApproveReassessment();
        if (!CivicTaxSecurityService.canUpdateObject('Reassessment_Request__c')) {
            throw new CivicTaxSecurityService.SecurityException('Access Denied: Insufficient permissions to reject Reassessment requests.');
        }
        return new SystemElevatedContext().executeDecision(requestId, comments, 'Rejected');
    }

    /**
     * @description Dedicated elevated execution context for authorized municipal officer approval
     */
    private without sharing class SystemElevatedContext {
        public Reassessment_Request__c executeApproveReassessment(Id requestId, String comments) {
            return executeDecision(requestId, comments, 'Approved');
        }

        public Reassessment_Request__c executeDecision(Id requestId, String comments, String decision) {
            List<Reassessment_Request__c> requests = [
                SELECT Id, Property__c, Original_Assessment__c, Approval_Status__c, Decision_Comments__c
                FROM Reassessment_Request__c WHERE Id = :requestId LIMIT 1
            ];
            if (requests.isEmpty()) throw new ReassessmentException('Reassessment Request not found');
            Reassessment_Request__c req = requests[0];
            req.Approval_Status__c = decision;
            req.Decision_Comments__c = comments;
            update req;
            return req;
        }
    }
}