// TaxCalculationService.cls
// CivicTax 8.0 Authoritative Apex Tax Calculation Service
public with sharing class TaxCalculationService {
    public class TaxException extends Exception {}

    public class TaxCalculationResult {
        public Decimal baseTax;
        public Decimal appliedRate;
        public Decimal penalty;
        public Decimal discount;
        public Decimal totalTax;
    }

    // Overloaded calculation: calculates tax directly given built-up area and custom rate
    public static Decimal calculateTax(Decimal builtUpArea, Decimal ratePerSqFt) {
        if (builtUpArea == null || builtUpArea <= 0 || ratePerSqFt == null || ratePerSqFt <= 0) {
            return 0.00;
        }
        return (builtUpArea * ratePerSqFt).setScale(2, System.RoundingMode.HALF_UP);
    }

    // Authoritative calculation of property tax based on category and area
    public static TaxCalculationResult calculateTax(String category, Decimal builtUpArea, Boolean isOverdue, Boolean isEarlyBird) {
        if (builtUpArea == null || builtUpArea <= 0) {
            throw new TaxException('Invalid built-up area for tax calculation.');
        }

        // Standard municipal gazette rate per square foot
        Decimal ratePerSqFt = 10.0;
        if (category == 'COMMERCIAL') {
            ratePerSqFt = 18.0;
        } else if (category == 'INDUSTRIAL') {
            ratePerSqFt = 24.0;
        } else if (category == 'AGRICULTURAL') {
            ratePerSqFt = 5.0;
        }

        Decimal base = (builtUpArea * ratePerSqFt).setScale(2, System.RoundingMode.HALF_UP);
        Decimal penalty = 0.0;
        Decimal discount = 0.0;

        if (isOverdue) {
            // Statutory 5% overdue municipal penalty
            penalty = (base * 0.05).setScale(2, System.RoundingMode.HALF_UP);
        }

        if (isEarlyBird && !isOverdue) {
            // Early payment incentive rebate (5%)
            discount = (base * 0.05).setScale(2, System.RoundingMode.HALF_UP);
        }

        Decimal total = (base + penalty - discount).setScale(2, System.RoundingMode.HALF_UP);

        TaxCalculationResult res = new TaxCalculationResult();
        res.baseTax = base;
        res.appliedRate = ratePerSqFt;
        res.penalty = penalty;
        res.discount = discount;
        res.totalTax = total;
        return res;
    }
}
