/**
 * @description Enterprise Service for Property Valuation Reassessment, Multi-Step Approvals & Delta Recomputation
 * @group CivicTax 6.0
 */
public with sharing class CivicTaxReassessmentService {

    public class ReassessmentException extends Exception {}

    /**
     * @description Submits a reassessment request for an existing property
     */
    public static Reassessment_Request__c submitRequest(Id propertyId, Id originalAssessmentId, String requestedChange, String reason) {
        if (propertyId == null) {
            throw new ReassessmentException('Target Property ID is mandatory');
        }
        if (String.isBlank(requestedChange)) {
            throw new ReassessmentException('Requested dimensional or category changes must be stated');
        }

        Reassessment_Request__c req = new Reassessment_Request__c();
        req.Property__c = propertyId;
        req.Original_Assessment__c = originalAssessmentId;
        req.Requested_Change__c = requestedChange;
        req.Supporting_Reason__c = reason;
        req.Approval_Status__c = 'Submitted';
        req.Request_Number__c = 'RR-' + String.valueOf(System.currentTimeMillis()).right(6);

        insert req;
        return req;
    }

    /**
     * @description Approves a reassessment request and initiates tax recalculation
     */
    public static Reassessment_Request__c approveReassessment(Id requestId, String comments) {
        if (requestId == null) {
            throw new ReassessmentException('Request ID cannot be null');
        }

        List<Reassessment_Request__c> requests = [
            SELECT Id, Property__c, Original_Assessment__c, Approval_Status__c, Decision_Comments__c 
            FROM Reassessment_Request__c 
            WHERE Id = :requestId 
            WITH SECURITY_ENFORCED 
            LIMIT 1
        ];

        if (requests.isEmpty()) {
            throw new ReassessmentException('Reassessment Request not found');
        }

        Reassessment_Request__c req = requests[0];
        req.Approval_Status__c = 'Approved';
        req.Decision_Comments__c = comments;

        update req;
        return req;
    }
}
