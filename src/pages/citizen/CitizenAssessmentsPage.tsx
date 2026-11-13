import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Receipt, CreditCard, RefreshCw, Eye, AlertCircle, Info, Calculator } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { services } from '../../services/serviceFactory';
import { TaxAssessment, AssessmentStatus } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { formatCurrency, formatDate } from '../../utils';

export const CitizenAssessmentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const propFilterParam = searchParams.get('propertyNumber');

  const [assessments, setAssessments] = useState<TaxAssessment[]>([]);
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | 'ALL'>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [selectedAssessment, setSelectedAssessment] = useState<TaxAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAssessments = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const list = await services.assessmentService.getAssessments({ ownerId: currentUser.id });
      setAssessments(list);
    } catch (e) {
      console.error('Error fetching assessments:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadAssessments();

    const handleStorageUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'civictax_assessments' || e.type === 'civictax_data_reset') {
        loadAssessments();
      }
    };
    window.addEventListener('civictax_storage_update', handleStorageUpdate);
    window.addEventListener('civictax_data_reset', handleStorageUpdate);
    return () => {
      window.removeEventListener('civictax_storage_update', handleStorageUpdate);
      window.removeEventListener('civictax_data_reset', handleStorageUpdate);
    };
  }, [loadAssessments]);

  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      if (propFilterParam && a.propertyNumber !== propFilterParam) return false;
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (yearFilter !== 'ALL' && a.assessmentYear !== yearFilter) return false;
      return true;
    });
  }, [assessments, propFilterParam, statusFilter, yearFilter]);

  const years = useMemo(() => {
    const set = new Set(assessments.map((a) => a.assessmentYear));
    return Array.from(set);
  }, [assessments]);

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
      header: 'Property & Year',
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-white text-xs font-mono">
            {item.propertyNumber}
          </span>
          <div className="text-[11px] text-slate-400">
            FY {item.assessmentYear} • {item.category}
          </div>
        </div>
      ),
    },
    {
      key: 'totalTax',
      header: 'Total Assessed',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-slate-900 dark:text-white text-xs">
          {formatCurrency(item.totalTax)}
        </span>
      ),
    },
    {
      key: 'amountPaid',
      header: 'Paid',
      sortable: true,
      render: (item) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
          {formatCurrency(item.amountPaid)}
        </span>
      ),
    },
    {
      key: 'outstandingBalance',
      header: 'Outstanding',
      sortable: true,
      render: (item) => (
        <span
          className={`font-extrabold text-xs ${
            item.outstandingBalance > 0
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-400 dark:text-slate-500'
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
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-slate-500">{formatDate(item.dueDate)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedAssessment(item)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="View Calculation Math"
          >
            <Eye className="w-4 h-4" />
          </button>
          {item.outstandingBalance > 0 ? (
            <Link
              to={`/citizen/payments?assessmentId=${item.id}`}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Pay
            </Link>
          ) : (
            <span className="text-[11px] text-emerald-600 font-semibold px-2">
              Cleared
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Annual Property Tax Assessments"
        subtitle="Certified municipal tax calculation bills issued for your properties."
        breadcrumbs={[{ label: 'Dashboard', path: '/citizen/dashboard' }, { label: 'Tax Assessments' }]}
        actions={
          <Link
            to="/citizen/payments"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
            Make Tax Payment
          </Link>
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="APPROVED">Approved / Unpaid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid in Full</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Financial Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                FY {y}
              </option>
            ))}
          </select>

          {(statusFilter !== 'ALL' || yearFilter !== 'ALL' || propFilterParam) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setYearFilter('ALL');
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
            >
              Reset Filters
            </button>
          )}
        </div>

        {propFilterParam && (
          <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-3 py-1.5 rounded-xl border border-blue-200 font-medium">
            Filtered for property: <strong>{propFilterParam}</strong>
          </span>
        )}
      </div>

      {/* Assessment Table */}
      <DataTable
        columns={columns}
        data={filteredAssessments}
        keyExtractor={(a) => a.id}
        isLoading={isLoading}
        emptyTitle="No assessments found"
        emptyDescription="No tax assessments matched the selected filter."
        onRowClick={(item) => setSelectedAssessment(item)}
      />

      {/* Assessment Calculation Breakdown Modal */}
      {selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {selectedAssessment.assessmentNumber}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Formula-Driven Municipal Calculation
                  </p>
                </div>
              </div>
              <StatusBadge status={selectedAssessment.status} />
            </div>

            {/* Math Formula Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>Built-up Area:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedAssessment.builtUpArea} sq.ft
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Applied Category Rate:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  ₹{selectedAssessment.appliedRatePerSqFt} / sq.ft ({selectedAssessment.category})
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-bold text-slate-900 dark:text-white">
                <span>Base Tax (Area × Rate):</span>
                <span className="font-mono">{formatCurrency(selectedAssessment.baseTax)}</span>
              </div>

              {selectedAssessment.penalty > 0 && (
                <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                  <span>Delayed Payment Penalty:</span>
                  <span className="font-mono font-bold">+{formatCurrency(selectedAssessment.penalty)}</span>
                </div>
              )}

              {selectedAssessment.discount > 0 && (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                  <span>Early Payment Rebate:</span>
                  <span className="font-mono font-bold">-{formatCurrency(selectedAssessment.discount)}</span>
                </div>
              )}

              <div className="pt-2 border-t-2 border-slate-300 dark:border-slate-600 flex justify-between items-center text-sm font-extrabold text-blue-900 dark:text-blue-300">
                <span>Total Tax Payable:</span>
                <span className="font-mono">{formatCurrency(selectedAssessment.totalTax)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-500 pt-1">
                <span>Total Payments Credited:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedAssessment.amountPaid)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-black text-sm">
                <span>Remaining Balance Due:</span>
                <span
                  className={`font-mono ${
                    selectedAssessment.outstandingBalance > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {formatCurrency(selectedAssessment.outstandingBalance)}
                </span>
              </div>
            </div>

            {selectedAssessment.notes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Note: {selectedAssessment.notes}
              </p>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                to={`/citizen/reassessments?assessmentId=${selectedAssessment.id}`}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Dispute or Request Reassessment
              </Link>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedAssessment(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold"
                >
                  Close
                </button>
                {selectedAssessment.outstandingBalance > 0 && (
                  <Link
                    to={`/citizen/payments?assessmentId=${selectedAssessment.id}`}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Pay Balance
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
