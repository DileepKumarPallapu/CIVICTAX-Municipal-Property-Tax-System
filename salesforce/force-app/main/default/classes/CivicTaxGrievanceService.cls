/**
 * @description Enterprise Service for Citizen Grievance Intake, Routing, and SLA Resolution
 * @group CivicTax 6.0
 */
public with sharing class CivicTaxGrievanceService {

    public class GrievanceException extends Exception {}

    /**
     * @description Creates a new grievance docket
     */
    public static Grievance__c submitGrievance(Id propertyId, String subject, String description, String priority) {
        if (String.isBlank(subject) || String.isBlank(description)) {
            throw new GrievanceException('Subject and description are mandatory for grievance filing.');
        }

        Grievance__c grv = new Grievance__c();
        grv.Property__c = propertyId;
        grv.Subject__c = subject;
        grv.Description__c = description;
        grv.Priority__c = String.isNotBlank(priority) ? priority : 'Medium';
        grv.Status__c = 'Open';

        SObjectAccessDecision decision = Security.stripInaccessible(AccessType.CREATABLE, new List<Grievance__c>{ grv });
        insert decision.getRecords();
        return (Grievance__c) decision.getRecords()[0];
    }

    /**
     * @description Resolves an open grievance with required officer resolution comments
     */
    public static Grievance__c resolveGrievance(Id grievanceId, String resolutionComments) {
        if (grievanceId == null) {
            throw new GrievanceException('Grievance ID cannot be null');
        }
        if (String.isBlank(resolutionComments)) {
            throw new GrievanceException('Mandatory resolution comments must be provided.');
        }

        List<Grievance__c> grievances = [
            SELECT Id, Status__c, Resolution_Comments__c 
            FROM Grievance__c 
            WHERE Id = :grievanceId 
            WITH SECURITY_ENFORCED 
            LIMIT 1
        ];

        if (grievances.isEmpty()) {
            throw new GrievanceException('Grievance not found');
        }

        Grievance__c grv = grievances[0];
        grv.Status__c = 'Resolved';
        grv.Resolution_Comments__c = resolutionComments;

        SObjectAccessDecision decision = Security.stripInaccessible(AccessType.UPDATABLE, new List<Grievance__c>{ grv });
        update decision.getRecords();
        return (Grievance__c) decision.getRecords()[0];
    }
}
