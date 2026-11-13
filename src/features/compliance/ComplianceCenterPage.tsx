import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { LocalComplianceService } from './LocalComplianceService';
import { ComplianceAlert, ComplianceSeverity } from '../../types';
import { ShieldAlert, CheckCircle2, AlertTriangle, Eye, ShieldCheck, Filter } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ComplianceCenterPage: React.FC = () => {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<ComplianceAlert | null>(null);
  const [investigationNotes, setInvestigationNotes] = useState('');
  const { success } = useToast();

  useEffect(() => {
    const scanned = LocalComplianceService.runComplianceScan();
    setAlerts(scanned);
    if (scanned.length > 0) setSelectedAlert(scanned[0]);
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    if (selectedSeverity === 'ALL') return true;
    return a.severity === selectedSeverity;
  });

  const handleUpdateAlert = (status: ComplianceAlert['status']) => {
    if (!selectedAlert) return;
    const updated = LocalComplianceService.updateAlertStatus(selectedAlert.alertId, status, investigationNotes);
    setAlerts((prev) => prev.map((a) => (a.alertId === updated.alertId ? updated : a)));
    setSelectedAlert(updated);
    setInvestigationNotes('');
    success('Compliance Alert Updated', `Alert ${updated.alertId} transitioned to ${status}.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Risk & Compliance Audit Center"
        subtitle="Rule-based integrity verification, base tax calculation audits, and overpayment anomaly detection."
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Integrity Rule Monitor</span>
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alerts List */}
        <div className="lg:col-span-8 bg-white dark:bg-[#101D32] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Compliance Audit Findings</h3>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="HIGH">High Severity</option>
                <option value="MEDIUM">Medium Severity</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredAlerts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No active integrity discrepancies identified. All records comply with active business rules.
              </div>
            ) : (
              filteredAlerts.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setSelectedAlert(a)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedAlert?.id === a.id
                      ? 'border-[#405CF5] bg-indigo-50/40 dark:bg-indigo-950/20'
                      : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-[#19283D] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#405CF5]">{a.alertId}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {a.recordReference}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : a.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {a.severity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{a.explanation}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Alert Action Panel */}
        <div className="lg:col-span-4 bg-white dark:bg-[#101D32] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Investigation & Resolution
          </h3>

          {selectedAlert ? (
            <div className="space-y-4 text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Detection Rule</p>
                <p className="font-mono font-bold text-[#405CF5]">{selectedAlert.detectionRule}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Recommended Municipal Action</p>
                <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedAlert.recommendedAction}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#19283D] border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400">Current Status:</span>
                <p className="font-extrabold text-slate-900 dark:text-white uppercase">{selectedAlert.status}</p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Auditor Resolution Notes:
                </label>
                <textarea
                  rows={3}
                  placeholder="Record verification, deed validation, or dismissal reason..."
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs outline-none resize-none"
                />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleUpdateAlert('ACKNOWLEDGED')}
                    className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition cursor-pointer"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleUpdateAlert('RESOLVED')}
                    className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 py-8 text-center text-xs">Select an alert to investigate.</p>
          )}
        </div>
      </div>
    </div>
  );
};
