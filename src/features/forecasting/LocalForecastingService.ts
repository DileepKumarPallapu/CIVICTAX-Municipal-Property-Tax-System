import { ForecastModelType, ForecastHorizon, RevenueForecastResult, ForecastPoint, Payment } from '../../types';
import { StorageService } from '../../services/storageService';

export class LocalForecastingService {
  public static generateRevenueForecast(
    modelType: ForecastModelType = 'WEIGHTED_MOVING_AVERAGE',
    horizon: ForecastHorizon = 'NEXT_QUARTER'
  ): RevenueForecastResult {
    const payments = StorageService.getPayments().filter((p: Payment) => p.paymentStatus === 'SUCCESS');

    // Aggregate payments by month
    const monthlyMap: Record<string, number> = {};
    for (const p of payments) {
      const monthKey = p.paymentDate.slice(0, 7); // YYYY-MM
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + p.amountPaid;
    }

    const sortedMonths = Object.keys(monthlyMap).sort();
    const historicalSeries = sortedMonths.map((m) => ({
      period: m,
      amount: monthlyMap[m],
    }));

    // If historical data is minimal, populate standard baseline observations from seed history
    const baseAmounts = historicalSeries.length >= 3 ? historicalSeries.map((h) => h.amount) : [120000, 145000, 160000, 185000];

    const numPoints = horizon === 'NEXT_MONTH' ? 1 : horizon === 'NEXT_QUARTER' ? 3 : horizon === 'NEXT_HALF_YEAR' ? 6 : 12;

    const forecastPoints: ForecastPoint[] = [];

    // Historical Points
    sortedMonths.forEach((m) => {
      forecastPoints.push({
        period: m,
        historicalActual: monthlyMap[m],
        forecastedRevenue: monthlyMap[m],
        lowerConfidenceBound: monthlyMap[m] * 0.95,
        upperConfidenceBound: monthlyMap[m] * 1.05,
      });
    });

    // Statistical Engine
    const last3 = baseAmounts.slice(-3);
    let avg = 0;

    if (modelType === 'MOVING_AVERAGE') {
      avg = Math.round(last3.reduce((a, b) => a + b, 0) / last3.length);
    } else if (modelType === 'WEIGHTED_MOVING_AVERAGE') {
      // 50% recent, 30% middle, 20% oldest
      avg = Math.round(last3[2] * 0.5 + last3[1] * 0.3 + last3[0] * 0.2);
    } else {
      // Linear Trend
      const diff = (last3[2] - last3[0]) / 2;
      avg = Math.round(last3[2] + diff);
    }

    const now = new Date();
    for (let i = 1; i <= numPoints; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const periodLabel = futureDate.toISOString().slice(0, 7);

      // Slight seasonality adjustment (+2% growth factor)
      const projected = Math.round(avg * Math.pow(1.02, i));
      forecastPoints.push({
        period: periodLabel,
        forecastedRevenue: projected,
        lowerConfidenceBound: Math.round(projected * 0.9),
        upperConfidenceBound: Math.round(projected * 1.1),
      });
    }

    return {
      modelType,
      horizon,
      historicalObservationsCount: baseAmounts.length,
      forecastPoints,
      assumptions: [
        'Projection assumes consistent municipal rate schedule and uniform billing distribution.',
        'Assumes collection efficiency follows historical moving baseline without enforcement policy changes.',
        'Synthetic demonstration data: illustrative estimation model for academic presentation.',
      ],
      limitations: 'Calculations are statistical extrapolations based on historical payments. Real local local tax yield fluctuates with statutory reassessment cycles.',
      generatedDate: new Date().toISOString(),
    };
  }
}
