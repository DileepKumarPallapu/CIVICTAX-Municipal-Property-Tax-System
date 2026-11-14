/**
 * @description Enterprise Service for Municipal Tax Assessment Calculations & Lifecycle Management
 * @group CivicTax 6.0
 */
public with sharing class CivicTaxAssessmentService {

    public class AssessmentException extends Exception {}

    private static final Map<String, Decimal> BASE_RATES = new Map<String, Decimal>{
        'Residential' => 10.0,
        'Commercial' => 18.0,
        'Industrial' => 25.0,
        'Agricultural' => 5.0
    };

    /**
     * @description Calculates and creates a statutory tax assessment for a verified property
     */
    public static Tax_Assessment__c calculateAndCreateAssessment(Id propertyId, String assessmentYear) {
        if (propertyId == null) {
            throw new AssessmentException('Property ID is mandatory for assessment');
        }

        List<Property__c> properties = [
            SELECT Id, Property_Number__c, Property_Category__c, Built_Up_Area__c, Verification_Status__c 
            FROM Property__c 
            WHERE Id = :propertyId 
            WITH SECURITY_ENFORCED 
            LIMIT 1
        ];

        if (properties.isEmpty()) {
            throw new AssessmentException('Property not found');
        }

        Property__c prop = properties[0];
        if (prop.Verification_Status__c != 'Verified') {
            throw new AssessmentException('Tax assessment requires property to be strictly Verified.');
        }

        Decimal rate = BASE_RATES.containsKey(prop.Property_Category__c) 
            ? BASE_RATES.get(prop.Property_Category__c) 
            : 10.0;
        
        Decimal builtArea = prop.Built_Up_Area__c != null ? prop.Built_Up_Area__c : 0.0;
        Decimal baseTax = builtArea * rate;
        Decimal discount = baseTax * 0.05; // 5% prompt payment discount
        Decimal penalty = 0.0;
        Decimal totalTax = baseTax - discount;

        Tax_Assessment__c asm = new Tax_Assessment__c();
        asm.Property__c = prop.Id;
        asm.Assessment_Number__c = 'ASM-' + prop.Property_Number__c + '-' + assessmentYear.replace('-', '');
        asm.Assessment_Year__c = assessmentYear;
        asm.Base_Tax__c = baseTax;
        asm.Discount__c = discount;
        asm.Penalty__c = penalty;
        asm.Total_Tax__c = totalTax;
        asm.Total_Amount__c = totalTax;
        asm.Due_Date__c = Date.today().addDays(60);
        asm.Assessment_Status__c = 'Approved';

        SObjectAccessDecision decision = Security.stripInaccessible(AccessType.CREATABLE, new List<Tax_Assessment__c>{ asm });
        insert decision.getRecords();
        return (Tax_Assessment__c) decision.getRecords()[0];
    }

    /**
     * @description Fetches all assessments for a property
     */
    public static List<Tax_Assessment__c> getAssessmentsForProperty(Id propertyId) {
        return [
            SELECT Id, Name, Assessment_Number__c, Property__c, Assessment_Year__c, 
                   Base_Tax__c, Penalty__c, Discount__c, Total_Tax__c, Total_Amount__c, 
                   Amount_Paid__c, Outstanding_Amount__c, Due_Date__c, Assessment_Status__c 
            FROM Tax_Assessment__c 
            WHERE Property__c = :propertyId 
            WITH SECURITY_ENFORCED 
            ORDER BY CreatedDate DESC
        ];
    }
}
