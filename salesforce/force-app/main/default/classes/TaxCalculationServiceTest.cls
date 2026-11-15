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

    @isTest
    static void testComprehensiveTaxCalculation() {
        Test.startTest();
        // Standard Residential
        TaxCalculationService.TaxCalculationResult res1 = TaxCalculationService.calculateTax('RESIDENTIAL', 1000, false, false);
        System.assertEquals(10000.00, res1.baseTax, 'Base tax should be 10000');
        System.assertEquals(10000.00, res1.totalTax, 'Total tax should be 10000');

        // Commercial with Overdue Penalty (5%)
        TaxCalculationService.TaxCalculationResult res2 = TaxCalculationService.calculateTax('COMMERCIAL', 1000, true, false);
        System.assertEquals(18000.00, res2.baseTax, 'Commercial base tax @ 18/sq ft');
        System.assertEquals(900.00, res2.penalty, '5% overdue penalty on 18000');
        System.assertEquals(18900.00, res2.totalTax, 'Total tax with overdue penalty');

        // Industrial with Early Bird Discount (5%)
        TaxCalculationService.TaxCalculationResult res3 = TaxCalculationService.calculateTax('INDUSTRIAL', 1000, false, true);
        System.assertEquals(24000.00, res3.baseTax, 'Industrial base tax @ 24/sq ft');
        System.assertEquals(1200.00, res3.discount, '5% early bird discount');
        System.assertEquals(22800.00, res3.totalTax, 'Total tax with early bird discount');

        // Agricultural
        TaxCalculationService.TaxCalculationResult res4 = TaxCalculationService.calculateTax('AGRICULTURAL', 1000, false, false);
        System.assertEquals(5000.00, res4.baseTax, 'Agricultural base tax @ 5/sq ft');
        Test.stopTest();
    }

    @isTest
    static void testTaxCalculationExceptionOnInvalidArea() {
        Boolean caught = false;
        try {
            TaxCalculationService.calculateTax('RESIDENTIAL', 0, false, false);
        } catch (TaxCalculationService.TaxException ex) {
            caught = true;
        }
        System.assert(caught, 'Must throw exception for non-positive area');
    }
}
