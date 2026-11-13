/**
 * @description Test Data Factory for CivicTax Apex Test Suites.
 * Generates bulkified records in an isolated memory context (SeeAllData=false).
 */
@isTest
public class CivicTaxTestDataFactory {

    public static Contact createCitizenContact(String firstName, String lastName, String email) {
        Contact citizen = new Contact(
            FirstName = firstName,
            LastName = lastName,
            Email = email
        );
        insert citizen;
        return citizen;
    }

    public static Property_Zone__c createZone(String zoneName, String zoneCode) {
        Property_Zone__c zone = new Property_Zone__c(
            Name = zoneName
        );
        insert zone;
        return zone;
    }

    public static Tax_Rate__c createTaxRate(String category, Decimal ratePerSqFt) {
        Tax_Rate__c rate = new Tax_Rate__c(
            Rate_Per_SqFt__c = ratePerSqFt,
            Effective_Start_Date__c = Date.today().addYears(-1),
            Effective_End_Date__c = Date.today().addYears(1)
        );
        insert rate;
        return rate;
    }

    public static Property__c createProperty(Id contactId, String propNum, String category, Decimal builtUpArea, Decimal plotArea) {
        Property__c prop = new Property__c(
            Property_Number__c = propNum,
            Property_Category__c = category,
            Built_Up_Area__c = builtUpArea,
            Property_Owner__c = contactId,
            Registration_Date__c = Date.today(),
            Verification_Status__c = 'PENDING'
        );
        insert prop;
        return prop;
    }

    public static Tax_Assessment__c createAssessment(Id propertyId, String fiscalYear, Decimal totalAmount) {
        Tax_Assessment__c asm = new Tax_Assessment__c(
            Property__c = propertyId,
            Assessment_Year__c = fiscalYear,
            Total_Amount__c = totalAmount,
            Amount_Paid__c = 0.00,
            Outstanding_Amount__c = totalAmount,
            Due_Date__c = Date.today().addDays(30),
            Assessment_Status__c = 'FINALIZED'
        );
        insert asm;
        return asm;
    }
}
