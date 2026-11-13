import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { LocalRecoveryService } from './LocalRecoveryService';
import { RecoveryCase, AgingBucket } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { formatCurrency } from '../../utils';
import { Clock, ShieldAlert, PhoneCall, AlertTriangle, CheckCircle2, UserCheck, Filter, Download } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { exportToCSV } from '../../utils';

export const RevenueRecoveryPage: React.FC = () => {
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>('ALL');
  const [selectedCase, setSelectedCase] = useState<RecoveryCase | null>(null);
  const [officerNote, setOfficerNote] = useState('');
  const { success } = useToast();

  useEffect(() => {
    const synchronized = LocalRecoveryService.syncRecoveryCases();
    setCases(synchronized);
    if (synchronized.length > 0) setSelectedCase(synchronized[0]);
  }, []);

  const totalArrears = cases.reduce((acc, c) => acc + c.outstandingAmount, 0);
  const criticalCases = cases.filter((c) => c.priority === 'CRITICAL').length;
  const overdueOver60 = cases.filter((c) => c.agingBucket === '61_90_DAYS' || c.agingBucket === 'OVER_90_DAYS').length;

  const filteredCases = cases.filter((c) => {
    if (selectedBucket === 'ALL') return true;
    return c.agingBucket === selectedBucket;
  });

  const handleUpdateStatus = (newStatus: RecoveryCase['status']) => {
    if (!selectedCase) return;
    const updated = LocalRecoveryService.updateCase(selectedCase.id, {
      status: newStatus,
      officerNotes: officerNote || selectedCase.officerNotes,
    });
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCase(updated);
    setOfficerNote('');
    success('Case Updated', `Recovery case ${updated.caseNumber} moved to ${newStatus}.`);
  };

  const handleExportCSV = () => {
    exportToCSV(filteredCases, 'municipal_tax_arrears_recovery');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Revenue Recovery & Arrears Center"
        subtitle="Aging analysis, collection priority triage, simulated notices, and arrears recovery follow-up."
        actions={
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Recovery Register</span>
          </button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Outstanding Arrears"
          value={formatCurrency(totalArrears)}
          subtitle={`${cases.length} actionable recovery cases`}
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Critical Arrears Cases"
          value={criticalCases}
          subtitle="Balances > ₹50,000 or > 60 days overdue"
          icon={ShieldAlert}
          color="rose"
        />
        <StatCard
          title="Severe Delinquencies (> 60 Days)"
          value={overdueOver60}
          subtitle="Statutory demand notice required"
          icon={Clock}
          color="indigo"
        />
      </div>

      {/* Case Management Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cases Table */}
        <div className="lg:col-span-8 bg-white dark:bg-[#101D32] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Recovery Cases</h3>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBucket}
                onChange={(e) => setSelectedBucket(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
              >
                <option value="ALL">All Aging Buckets</option>
                <option value="1_30_DAYS">1-30 Days Overdue</option>
                <option value="31_60_DAYS">31-60 Days Overdue</option>
                <option value="61_90_DAYS">61-90 Days Overdue</option>
                <option value="OVER_90_DAYS">Over 90 Days</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                  <th className="py-2.5">Case #</th>
                  <th className="py-2.5">Parcel #</th>
                  <th className="py-2.5">Owner</th>
                  <th className="py-2.5">Arrears Due</th>
                  <th className="py-2.5">Overdue</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={`hover:bg-slate-50 dark:hover:bg-[#19283D] cursor-pointer transition ${
                      selectedCase?.id === c.id ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                    }`}
                  >
                    <td className="py-3 font-bold font-mono text-[#405CF5]">{c.caseNumber}</td>
                    <td className="py-3 font-mono">{c.propertyNumber}</td>
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{c.ownerName}</td>
                    <td className="py-3 font-extrabold text-rose-600 dark:text-rose-400">
                      {formatCurrency(c.outstandingAmount)}
                    </td>
                    <td className="py-3 font-medium text-slate-500">{c.overdueDays} days</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recovery Case Inspector & Action */}
        <div className="lg:col-span-4 bg-white dark:bg-[#101D32] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Case Details & Action
          </h3>

          {selectedCase ? (
            <div className="space-y-4 text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Case Reference</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedCase.caseNumber}</p>
                <p className="text-slate-500">Assessment: {selectedCase.assessmentNumber}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#19283D] border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Outstanding:</span>
                  <span className="font-extrabold text-rose-600">{formatCurrency(selectedCase.outstandingAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Officer:</span>
                  <span className="font-bold">{selectedCase.assignedOfficerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Aging:</span>
                  <span className="font-bold text-amber-500">{selectedCase.agingBucket.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Action Form */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Officer Action Notes:
                </label>
                <textarea
                  rows={2}
                  placeholder="Record call, contact attempt, or field follow-up..."
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs outline-none resize-none"
                />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleUpdateStatus('CONTACT_ATTEMPTED')}
                    className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] transition cursor-pointer"
                  >
                    Contact Attempted
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('FOLLOW_UP_REQUIRED')}
                    className="py-2 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition cursor-pointer"
                  >
                    Follow-Up Required
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 py-8 text-center text-xs">Select a case to inspect details.</p>
          )}
        </div>
      </div>
    </div>
  );
};
