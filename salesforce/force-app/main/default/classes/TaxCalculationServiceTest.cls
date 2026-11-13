/**
 * @description Unit tests for CivicTax TaxCalculationService.
 */
@isTest
private class TaxCalculationServiceTest {

    @isTest
    static void testBaseTaxCalculation() {
        Test.startTest();
        Decimal tax = TaxCalculationService.calculateTax(1200, 10);
        Test.stopTest();

        System.assertEquals(12000.00, tax, 'Base tax for 1200 sq ft at 10/sq ft must be 12000.00');
    }

    @isTest
    static void testCommercialTaxCalculation() {
        Test.startTest();
        Decimal tax = TaxCalculationService.calculateTax(2500, 18);
        Test.stopTest();

        System.assertEquals(45000.00, tax, 'Base tax for 2500 sq ft at 18/sq ft must be 45000.00');
    }

    @isTest
    static void testInvalidInputsReturnZero() {
        Test.startTest();
        Decimal taxNegativeArea = TaxCalculationService.calculateTax(-100, 10);
        Decimal taxNegativeRate = TaxCalculationService.calculateTax(1000, -5);
        Test.stopTest();

        System.assert(taxNegativeArea <= 0, 'Negative area must yield 0 or non-positive');
        System.assert(taxNegativeRate <= 0, 'Negative rate must yield 0 or non-positive');
    }
}
