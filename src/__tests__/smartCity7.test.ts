import { describe, it, expect, beforeEach } from 'vitest';
import { LocalRecoveryService } from '../features/recovery/LocalRecoveryService';
import { LocalComplianceService } from '../features/compliance/LocalComplianceService';
import { LocalForecastingService } from '../features/forecasting/LocalForecastingService';
import { LocalTransparencyService } from '../features/transparency/LocalTransparencyService';
import { StorageService } from '../services/storageService';

// In-memory mock localStorage for Node / test environment
const mockStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStore[key] || null,
  setItem: (key: string, value: string) => {
    mockStore[key] = value.toString();
  },
  removeItem: (key: string) => {
    delete mockStore[key];
  },
  clear: () => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

describe('CivicTax 7.0 Smart City Intelligence Tests', () => {
  beforeEach(() => {
    StorageService.initialize();
    StorageService.resetToSeedData();
  });

  it('calculates aging buckets and creates revenue recovery cases', () => {
    const cases = LocalRecoveryService.syncRecoveryCases();
    expect(cases.length).toBeGreaterThan(0);

    const firstCase = cases[0];
    expect(firstCase.caseNumber).toContain('REC-');
    expect(firstCase.outstandingAmount).toBeGreaterThan(0);
    expect(firstCase.agingBucket).toBeDefined();

    // Test bucket math
    const notDue = LocalRecoveryService.calculateAgingBucket(new Date(Date.now() + 864000000).toISOString());
    expect(notDue.bucket).toBe('NOT_DUE');

    const overdue35 = LocalRecoveryService.calculateAgingBucket(new Date(Date.now() - 35 * 86400000).toISOString());
    expect(overdue35.bucket).toBe('31_60_DAYS');
  });

  it('runs compliance scans and identifies explainable data integrity issues', () => {
    const alerts = LocalComplianceService.runComplianceScan();
    expect(alerts.length).toBeGreaterThan(0);

    const deedAlert = alerts.find((a) => a.category === 'PROPERTY_INTEGRITY');
    if (deedAlert) {
      expect(deedAlert.detectionRule).toBe('RULE_PROP_DEED_CHECK');
      expect(deedAlert.status).toBe('OPEN');
    }
  });

  it('generates statistical revenue forecasts using historical payments', () => {
    const forecast = LocalForecastingService.generateRevenueForecast('WEIGHTED_MOVING_AVERAGE', 'NEXT_QUARTER');
    expect(forecast.modelType).toBe('WEIGHTED_MOVING_AVERAGE');
    expect(forecast.forecastPoints.length).toBeGreaterThanOrEqual(3);
    expect(forecast.assumptions.length).toBeGreaterThan(0);

    const point = forecast.forecastPoints[forecast.forecastPoints.length - 1];
    expect(point.forecastedRevenue).toBeGreaterThan(0);
    expect(point.upperConfidenceBound).toBeGreaterThan(point.lowerConfidenceBound);
  });

  it('computes public transparency aggregations without leaking PII', () => {
    const metrics = LocalTransparencyService.getPublicMetrics();
    expect(metrics.totalRegisteredProperties).toBeGreaterThan(0);
    expect(metrics.aggregateAssessedTax).toBeGreaterThan(0);
    expect(metrics.aggregateCollections).toBeGreaterThan(0);
    expect(metrics.zonePerformance.length).toBe(4);

    // Verify privacy: no individual owner names or phone numbers are exposed in public metrics
    const serialized = JSON.stringify(metrics);
    expect(serialized).not.toContain('Rajesh Kumar Sharma');
    expect(serialized).not.toContain('9876543210');
  });
});
