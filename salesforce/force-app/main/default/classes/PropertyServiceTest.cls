// PropertyServiceTest.cls
// CivicTax 8.0 Unit Tests for Property Service
@isTest
private class PropertyServiceTest {
    @isTest
    static void testRegisterPropertySuccess() {
        Test.startTest();
        Property__c prop = PropertyService.registerProperty(
            'CT-TEST-001',
            '123 Civil Lines Road',
            'RESIDENTIAL',
            1200.0,
            'Z-CENTRAL',
            18.5204,
            73.8567,
            'DOC-2024-TEST-1',
            2020
        );
        Test.stopTest();

        System.assertNotEquals(null, prop.Id, 'Property ID should be generated');
        System.assertEquals('PENDING', prop.Verification_Status__c, 'Default status must be PENDING');
    }

    @isTest
    static void testTaxCalculationLogic() {
        TaxCalculationService.TaxCalculationResult res = TaxCalculationService.calculateTax('RESIDENTIAL', 1000, false, false);
        System.assertEquals(10000.0, res.baseTax, 'Base tax for 1000 sq ft @ 10 = 10000');
        System.assertEquals(10000.0, res.totalTax, 'Total tax with no penalty or discount');
    }
}
