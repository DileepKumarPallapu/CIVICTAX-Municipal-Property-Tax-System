import React, { useState, useEffect } from 'react';
import { LocalTransparencyService } from './LocalTransparencyService';
import { PublicTransparencyMetrics } from '../../types';
import { formatCurrency } from '../../utils';
import { ShieldCheck, TrendingUp, Users, CheckCircle2, Lock, Download, Sparkles, Building2 } from 'lucide-react';
import { exportToCSV } from '../../utils';

export const PublicTransparencyPage: React.FC = () => {
  const [metrics, setMetrics] = useState<PublicTransparencyMetrics | null>(null);

  useEffect(() => {
    setMetrics(LocalTransparencyService.getPublicMetrics());
  }, []);

  const handleExportPublicData = () => {
    if (!metrics) return;
    exportToCSV(metrics.zonePerformance, 'civictax_public_zone_transparency');
  };

  if (!metrics) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-900/60 text-[#13A58B] dark:text-teal-400 text-xs font-bold tracking-wide shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Open Municipal Transparency Portal</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101D32] dark:text-white tracking-tight">
          Transparent Municipal Finances & Service Metrics
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          CivicTax publishes verified, aggregate-level municipal property tax assessments, treasury collections, and citizen grievance resolution turnaround. Individual taxpayer privacy is strictly protected.
        </p>

        <div className="inline-flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Privacy Guaranteed: No PII, owner identities, or personal payment references are exposed.</span>
        </div>
      </div>

      {/* Aggregate Corporation KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Assessed Tax</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#101D32] dark:text-white mt-1">
            {formatCurrency(metrics.aggregateAssessedTax)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{metrics.reportingPeriod}</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Treasury Revenue Collected</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#13A58B] mt-1">
            {formatCurrency(metrics.aggregateCollections)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Efficiency: {metrics.overallCollectionEfficiency}%</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Properties</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#405CF5] mt-1">
            {metrics.totalRegisteredProperties} Parcels
          </p>
          <p className="text-xs text-slate-400 mt-1">City-Wide Tax Roll</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grievances Resolved</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
            {metrics.resolutionPercentage}%
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {metrics.totalGrievancesResolved} of {metrics.totalGrievancesLogged} Closed
          </p>
        </div>
      </div>

      {/* Ward / Zone Performance Table */}
      <div className="p-8 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Ward & Municipal Zone Collection Efficiency
            </h3>
            <p className="text-xs text-slate-400">Aggregate performance benchmarks across municipal revenue divisions</p>
          </div>

          <button
            onClick={handleExportPublicData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Open Data CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider pb-2">
                <th className="py-3">Zone / Ward Division</th>
                <th className="py-3">Registered Holdings</th>
                <th className="py-3">Total Tax Levied</th>
                <th className="py-3">Revenue Collected</th>
                <th className="py-3">Collection Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {metrics.zonePerformance.map((z, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#19283D]/40 transition">
                  <td className="py-3.5 font-bold text-slate-900 dark:text-white">{z.zoneName}</td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-300">{z.propertiesCount} Parcels</td>
                  <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(z.assessed)}
                  </td>
                  <td className="py-3.5 font-extrabold text-[#13A58B]">{formatCurrency(z.collected)}</td>
                  <td className="py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300">
                      {z.efficiency}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
