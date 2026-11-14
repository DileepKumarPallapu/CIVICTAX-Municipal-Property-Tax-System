import { describe, it, expect, beforeEach } from 'vitest';
import { LocalRepository } from '../repositories/LocalRepository.js';

describe('CivicTax Server Repository & Business Rules Test Suite', () => {
  let repo: LocalRepository;

  beforeEach(() => {
    repo = new LocalRepository();
  });

  it('lists seeded properties and filters by zone/category', async () => {
    const all = await repo.listProperties();
    expect(all.length).toBeGreaterThanOrEqual(2);

    const residential = await repo.listProperties({ category: 'RESIDENTIAL' });
    expect(residential.every((p) => p.category === 'RESIDENTIAL')).toBe(true);

    const central = await repo.listProperties({ zone: 'Z-CENTRAL' });
    expect(central.length).toBeGreaterThanOrEqual(2);
  });

  it('creates property and rejects duplicates', async () => {
    const newProp = await repo.createProperty({
      propertyNumber: 'TEST-PROP-999',
      ownerId: 'usr-1',
      ownerName: 'Test Owner',
      address: '77 Test Way',
      category: 'RESIDENTIAL',
      builtUpArea: 1000,
      zone: 'Z-CENTRAL',
      verificationStatus: 'PENDING',
      documentReference: 'DOC-999',
    });

    expect(newProp.id).toBeTruthy();
    expect(newProp.propertyNumber).toBe('TEST-PROP-999');

    // Duplicate rejection
    await expect(
      repo.createProperty({
        propertyNumber: 'TEST-PROP-999',
        ownerId: 'usr-2',
        ownerName: 'Another Owner',
        address: '78 Test Way',
        category: 'COMMERCIAL',
        builtUpArea: 500,
        zone: 'Z-CENTRAL',
        verificationStatus: 'PENDING',
        documentReference: 'DOC-1000',
      })
    ).rejects.toThrow('already exists');
  });

  it('enforces payment bounds and duplicate transaction prevention', async () => {
    // Payment exceeding balance (asm-001 has 6500 outstanding)
    await expect(
      repo.createPayment({
        assessmentId: 'asm-001',
        amountPaid: 10000,
        paymentMethod: 'UPI',
        transactionId: 'TXN-INVALID-OVERPAY',
        paymentDate: new Date().toISOString(),
        paymentStatus: 'SUCCESS',
      })
    ).rejects.toThrow('exceeds remaining balance');

    // Negative payment amount
    await expect(
      repo.createPayment({
        assessmentId: 'asm-001',
        amountPaid: -100,
        paymentMethod: 'UPI',
        transactionId: 'TXN-INVALID-NEG',
        paymentDate: new Date().toISOString(),
        paymentStatus: 'SUCCESS',
      })
    ).rejects.toThrow('greater than zero');

    // Valid payment
    const result = await repo.createPayment({
      assessmentId: 'asm-001',
      amountPaid: 2000,
      paymentMethod: 'UPI',
      transactionId: 'TXN-TEST-2000',
      paymentDate: new Date().toISOString(),
      paymentStatus: 'SUCCESS',
    });

    expect(result.payment.amountPaid).toBe(2000);
    expect(result.assessment.outstandingBalance).toBe(4500);
    expect(result.assessment.status).toBe('PARTIALLY_PAID');

    // Duplicate transaction ID rejection
    await expect(
      repo.createPayment({
        assessmentId: 'asm-001',
        amountPaid: 1000,
        paymentMethod: 'UPI',
        transactionId: 'TXN-TEST-2000',
        paymentDate: new Date().toISOString(),
        paymentStatus: 'SUCCESS',
      })
    ).rejects.toThrow('Duplicate transaction ID');
  });

  it('manages grievances and records resolution', async () => {
    const grv = await repo.createGrievance({
      propertyId: 'prop-001',
      citizenId: 'usr-citizen-01',
      subject: 'Calculation inquiry',
      description: 'Need breakdown of penalty and cess',
      priority: 'LOW',
      status: 'OPEN',
    });

    expect(grv.id).toBeTruthy();
    expect(grv.status).toBe('OPEN');

    const resolved = await repo.resolveGrievance(grv.id, 'Penalty waiver applied per section 14.');
    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolutionComments).toContain('Penalty waiver applied');
  });

  it('computes aggregated dashboard metrics correctly', async () => {
    const metrics = await repo.getDashboardMetrics();
    expect(metrics.totalProperties).toBeGreaterThanOrEqual(2);
    expect(metrics.totalTaxAssessed).toBeGreaterThan(0);
    expect(metrics.totalRevenueCollected).toBeGreaterThan(0);
    expect(metrics.collectionEfficiencyRate).toBeGreaterThan(0);
    expect(metrics.collectionEfficiencyRate).toBeLessThanOrEqual(100);
  });
});
