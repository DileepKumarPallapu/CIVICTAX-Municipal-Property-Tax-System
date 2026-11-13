import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { LocalForecastingService } from './LocalForecastingService';
import { ForecastModelType, ForecastHorizon, RevenueForecastResult } from '../../types';
import { formatCurrency } from '../../utils';
import { TrendingUp, BarChart3, Sparkles, Filter, Info, ShieldAlert } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const RevenueForecastingPage: React.FC = () => {
  const [modelType, setModelType] = useState<ForecastModelType>('WEIGHTED_MOVING_AVERAGE');
  const [horizon, setHorizon] = useState<ForecastHorizon>('NEXT_QUARTER');
  const [forecastResult, setForecastResult] = useState<RevenueForecastResult | null>(null);

  useEffect(() => {
    const res = LocalForecastingService.generateRevenueForecast(modelType, horizon);
    setForecastResult(res);
  }, [modelType, horizon]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Revenue Forecasting & Yield Lab"
        subtitle="Transparent statistical projections of property tax collections based on historical payment velocity."
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#405CF5]/10 text-[#405CF5] border border-[#405CF5]/20 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Statistical Revenue Projection</span>
          </span>
        }
      />

      {/* Forecasting Control Toolbar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-[#405CF5]" />
          <span>Forecasting Parameters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value as ForecastModelType)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
          >
            <option value="WEIGHTED_MOVING_AVERAGE">Weighted Moving Average (50/30/20)</option>
            <option value="MOVING_AVERAGE">Simple Moving Average</option>
            <option value="LINEAR_TREND">Linear Trend Estimate</option>
          </select>

          <select
            value={horizon}
            onChange={(e) => setHorizon(e.target.value as ForecastHorizon)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
          >
            <option value="NEXT_MONTH">Next 1 Month</option>
            <option value="NEXT_QUARTER">Next 1 Quarter (3 Months)</option>
            <option value="NEXT_HALF_YEAR">Next Half Year (6 Months)</option>
            <option value="NEXT_FINANCIAL_YEAR">Full Next Financial Year</option>
          </select>
        </div>
      </div>

      {/* Projection Chart */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Revenue Forecast & Confidence Interval (₹)
            </h3>
            <p className="text-xs text-slate-400">
              Projections computed from {forecastResult?.historicalObservationsCount} historical monthly payment observations
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#405CF5]">
            Statistical Moving Projection
          </span>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastResult?.forecastPoints || []}>
              <defs>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#405CF5" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#405CF5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Projected Collection']}
                contentStyle={{
                  backgroundColor: '#101D32',
                  borderColor: '#19283D',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="forecastedRevenue"
                stroke="#405CF5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#forecastFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assumptions & Methodological Transparency Note */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
          <Info className="w-4 h-4 text-[#405CF5]" />
          <span>Forecasting Methodology & Transparency Assumptions</span>
        </div>

        <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
          {forecastResult?.assumptions.map((asm, idx) => (
            <li key={idx}>{asm}</li>
          ))}
        </ul>

        <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
          {forecastResult?.limitations}
        </p>
      </div>
    </div>
  );
};
