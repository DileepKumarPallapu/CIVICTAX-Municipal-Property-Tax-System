# 09 — CivicTax Financial Accuracy & Mathematical Integrity Report

## 1. Mathematical Standards

Municipal tax accounting requires exact financial calculation to prevent rounding discrepancies across assessment billing and payment reconciliation.

---

## 2. Calculation Formula & Edge Cases Tested

$$\text{Base Tax} = \text{Built-up Area} \times \text{Applied Zone Rate}$$

$$\text{Total Tax} = \text{Base Tax} + \text{Penalty} - \text{Discount}$$

$$\text{Outstanding Balance} = \text{Total Tax} - \sum \text{Verified Successful Payments}$$

### Financial Test Cases Executed:
1. **Standard Residential Property**: $1,200\text{ sq ft} \times ₹10.00/\text{sq ft} = ₹12,000.00$. Base tax verified.
2. **Commercial Property**: $2,500\text{ sq ft} \times ₹18.00/\text{sq ft} = ₹45,000.00$. Base tax verified.
3. **Early-Bird Rebate Incentive**: $5\%$ discount applied when paying $\ge 30$ days prior to due date ($₹12,000.00 - ₹600.00 = ₹11,400.00$).
4. **Delinquency Late Penalty**:
   - $1-30$ days overdue: $2\%$ late penalty ($₹12,000.00 + ₹240.00 = ₹12,240.00$).
   - $31-60$ days overdue: $5\%$ late penalty ($₹12,000.00 + ₹600.00 = ₹12,600.00$).
5. **Partial Payment Allocation**:
   - Assessment Total: $₹12,000.00$.
   - Partial Payment 1: $₹5,000.00 \implies \text{Outstanding} = ₹7,000.00$, Status = `PARTIALLY_PAID`.
   - Partial Payment 2: $₹7,000.00 \implies \text{Outstanding} = ₹0.00$, Status = `PAID`.
6. **Zero Floating-Point Artifacts**: Verified all amounts format with 2 decimal places (`Intl.NumberFormat('en-IN')`).
