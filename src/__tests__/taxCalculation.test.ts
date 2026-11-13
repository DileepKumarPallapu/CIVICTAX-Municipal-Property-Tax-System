import { describe, it, expect } from 'vitest';
import { calculateTax, formatCurrency, formatDate } from '../utils';

describe('CivicTax Tax Calculation Engine', () => {
  it('calculates residential property base tax accurately', () => {
    // 1200 sq ft at 8.5/sq ft = 10,200
    const result = calculateTax({
      builtUpArea: 1200,
      ratePerSqFt: 8.5,
      penalty: 0,
      discount: 0,
      previousPayments: 0,
    });
    expect(result.baseTax).toBe(10200);
    expect(result.penalty).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.totalTax).toBe(10200);
    expect(result.outstandingBalance).toBe(10200);
  });

  it('calculates commercial property tax with penalty and discounts', () => {
    // 2500 sq ft at 18.5/sq ft = 46,250 Base Tax
    // Penalty: 1,500, Discount: 1,000 -> Total: 46,750
    // Previous payments: 20,000 -> Outstanding: 26,750
    const result = calculateTax({
      builtUpArea: 2500,
      ratePerSqFt: 18.5,
      penalty: 1500,
      discount: 1000,
      previousPayments: 20000,
    });
    expect(result.baseTax).toBe(46250);
    expect(result.penalty).toBe(1500);
    expect(result.discount).toBe(1000);
    expect(result.totalTax).toBe(46750);
    expect(result.outstandingBalance).toBe(26750);
  });

  it('handles zero or negative inputs cleanly without NaN errors', () => {
    const result = calculateTax({
      builtUpArea: 0,
      ratePerSqFt: 10,
      penalty: -50,
      discount: -20,
    });
    expect(result.baseTax).toBe(0);
    expect(result.penalty).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.outstandingBalance).toBe(0);
  });

  it('formats currency correctly in Indian Rupee format', () => {
    const formatted = formatCurrency(125000);
    expect(formatted).toContain('1,25,000');
  });

  it('formats date strings safely', () => {
    const formatted = formatDate('2024-04-01T10:00:00Z');
    expect(formatted).toBeTruthy();
    expect(formatted.length).toBeGreaterThan(4);
  });
});
