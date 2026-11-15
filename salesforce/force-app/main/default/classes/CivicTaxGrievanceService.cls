/**
 * @description Enterprise Service for Citizen Grievance Intake, Routing, and SLA Resolution
 * @group CivicTax 6.0 & 10.0
 */
public with sharing class CivicTaxGrievanceService {

    public class GrievanceException extends Exception {}

    /**
     * @description Creates a new grievance docket with ownership validation and CRUD enforcement
     */
    public static Grievance__c submitGrievance(Id propertyId, String subject, String description, String priority) {
        if (!CivicTaxSecurityService.canCreateObject('Grievance__c')) {
            throw new CivicTaxSecurityService.SecurityException('Access Denied: Insufficient permissions to create Grievance records.');
        }

        if (String.isBlank(subject) || String.isBlank(description)) {
            throw new GrievanceException('Subject and description are mandatory for grievance filing.');
        }

        // BOLA / IDOR Protection: Citizens can only file grievances against properties they own or have access to
        if (propertyId != null) {
            CivicTaxSecurityService.requireCanAccessProperty(propertyId);
        }

        Grievance__c grv = new Grievance__c();
        grv.Property__c = propertyId;
        grv.Subject__c = subject;
        grv.Description__c = description;
        grv.Priority__c = String.isNotBlank(priority) ? priority.toUpperCase() : 'MEDIUM';
        grv.Status__c = 'OPEN';

        insert grv;
        return grv;
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

        // Enforce Grievance Officer or Administrator authorization
        CivicTaxSecurityService.requireCanResolveGrievance();

        if (!CivicTaxSecurityService.canUpdateObject('Grievance__c')) {
            throw new CivicTaxSecurityService.SecurityException('Access Denied: Insufficient permissions to update Grievance records.');
        }

        return new SystemElevatedContext().executeResolveGrievance(grievanceId, resolutionComments);
    }

    /**
     * @description Dedicated elevated execution context for authorized municipal officer resolution
     */
    private without sharing class SystemElevatedContext {
        public Grievance__c executeResolveGrievance(Id grievanceId, String resolutionComments) {
            List<Grievance__c> grievances = [
                SELECT Id, Status__c, Resolution_Comments__c 
                FROM Grievance__c 
                WHERE Id = :grievanceId 
                LIMIT 1
            ];

            if (grievances.isEmpty()) {
                throw new GrievanceException('Grievance not found');
            }

            Grievance__c grv = grievances[0];
            grv.Status__c = 'RESOLVED';
            grv.Resolution_Comments__c = resolutionComments;

            update grv;
            return grv;
        }
    }
}
