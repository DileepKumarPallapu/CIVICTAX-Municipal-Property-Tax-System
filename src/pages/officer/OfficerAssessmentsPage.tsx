import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlusCircle, Receipt, Eye, CheckCircle2, Calculator, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { services } from '../../services/serviceFactory';
import { TaxAssessment, Property } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { formatCurrency, formatDate } from '../../utils';

export const OfficerAssessmentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [assessments, setAssessments] = useState<TaxAssessment[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<TaxAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate assessment form
  const [propertyId, setPropertyId] = useState('');
  const [assessmentYear, setAssessmentYear] = useState('2024-2025');
  const [penalty, setPenalty] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [asms, props] = await Promise.all([
        services.assessmentService.getAssessments(),
        services.propertyService.getProperties({ verificationStatus: 'VERIFIED' }),
      ]);
      setAssessments(asms);
      setProperties(props);
      if (props.length > 0) setPropertyId(props[0].id);
    } catch (e: any) {
      error('Failed to load assessments', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();

    const handleStorageUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'civictax_assessments' || e.type === 'civictax_data_reset') {
        loadData();
      }
    };
    window.addEventListener('civictax_storage_update', handleStorageUpdate);
    window.addEventListener('civictax_data_reset', handleStorageUpdate);
    return () => {
      window.removeEventListener('civictax_storage_update', handleStorageUpdate);
      window.removeEventListener('civictax_data_reset', handleStorageUpdate);
    };
  }, [loadData]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) {
      error('Property Required', 'Please select a verified property.');
      return;
    }

    setIsGenerating(true);
    try {
      const newAsm = await services.assessmentService.generateAssessment(
        propertyId,
        assessmentYear,
        penalty,
        discount,
        notes
      );
      success('Assessment Issued', `Bill ${newAsm.assessmentNumber} created for ${newAsm.propertyNumber}.`);
      setIsGenerateModalOpen(false);
      setNotes('');
      setPenalty(0);
      setDiscount(0);
      loadData();
    } catch (err: any) {
      error('Generation Failed', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const columns: Column<TaxAssessment>[] = [
    {
      key: 'assessmentNumber',
      header: 'Assessment No.',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
          {item.assessmentNumber}
        </span>
      ),
    },
    {
      key: 'propertyNumber',
      header: 'Property & Owner',
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-xs font-mono">
            {item.propertyNumber}
          </span>
          <div className="text-[11px] text-slate-400">
            {item.ownerName} • {item.category}
          </div>
        </div>
      ),
    },
    {
      key: 'assessmentYear',
      header: 'Year',
      sortable: true,
      render: (item) => <span className="text-xs font-semibold">FY {item.assessmentYear}</span>,
    },
    {
      key: 'totalTax',
      header: 'Total Tax',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-xs text-slate-900 dark:text-white">
          {formatCurrency(item.totalTax)}
        </span>
      ),
    },
    {
      key: 'amountPaid',
      header: 'Paid',
      sortable: true,
      render: (item) => (
        <span className="font-semibold text-emerald-600 text-xs">{formatCurrency(item.amountPaid)}</span>
      ),
    },
    {
      key: 'outstandingBalance',
      header: 'Balance',
      sortable: true,
      render: (item) => (
        <span
          className={`font-extrabold text-xs ${
            item.outstandingBalance > 0 ? 'text-amber-600' : 'text-slate-400'
          }`}
        >
          {formatCurrency(item.outstandingBalance)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedAssessment(item);
          }}
          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 text-xs font-bold transition flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          Math
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Tax Assessment Management"
        subtitle="Issue annual property tax assessments, review calculated tax sheets, and inspect ledger balances."
        breadcrumbs={[{ label: 'Officer Desk', path: '/officer/dashboard' }, { label: 'Assessments' }]}
        actions={
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Generate New Assessment
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={assessments}
        keyExtractor={(a) => a.id}
        isLoading={isLoading}
        onRowClick={(item) => setSelectedAssessment(item)}
      />

      {/* Generate Assessment Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Generate Annual Tax Assessment
                  </h3>
                  <p className="text-xs text-slate-400">Formula-Driven Tax Engine</p>
                </div>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Verified Property *
                </label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.propertyNumber} — {p.ownerName} ({p.category} • {p.builtUpArea} sq.ft)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Financial Year *
                  </label>
                  <select
                    value={assessmentYear}
                    onChange={(e) => setAssessmentYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                    <option value="2023-2024">2023-2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Penalty (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={penalty}
                    onChange={(e) => setPenalty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rebate / Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Calculation Remarks
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Standard rate applied per resolution no. 14."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                >
                  {isGenerating ? 'Generating...' : 'Calculate & Issue Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Math Details Modal */}
      {selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                  {selectedAssessment.assessmentNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Property: {selectedAssessment.propertyNumber} • FY {selectedAssessment.assessmentYear}
                </p>
              </div>
              <StatusBadge status={selectedAssessment.status} />
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-xs">
              <div className="flex justify-between">
                <span>Built-up Area:</span>
                <span className="font-bold font-mono">{selectedAssessment.builtUpArea} sq.ft</span>
              </div>
              <div className="flex justify-between">
                <span>Applied Tax Rate:</span>
                <span className="font-bold font-mono">₹{selectedAssessment.appliedRatePerSqFt}/sq.ft</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-slate-200">
                <span>Base Tax:</span>
                <span className="font-mono">{formatCurrency(selectedAssessment.baseTax)}</span>
              </div>
              {selectedAssessment.penalty > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Penalty:</span>
                  <span className="font-mono">+{formatCurrency(selectedAssessment.penalty)}</span>
                </div>
              )}
              {selectedAssessment.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Rebate:</span>
                  <span className="font-mono">-{formatCurrency(selectedAssessment.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-blue-900 dark:text-blue-300 pt-2 border-t border-slate-300">
                <span>Total Assessment:</span>
                <span className="font-mono">{formatCurrency(selectedAssessment.totalTax)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Total Paid:</span>
                <span className="font-mono">{formatCurrency(selectedAssessment.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-amber-600 font-black text-sm pt-2 border-t border-slate-200">
                <span>Outstanding Balance:</span>
                <span className="font-mono">{formatCurrency(selectedAssessment.outstandingBalance)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedAssessment(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
