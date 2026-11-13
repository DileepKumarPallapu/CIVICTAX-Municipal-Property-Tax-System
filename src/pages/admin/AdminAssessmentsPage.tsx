import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Receipt, Search, Filter, Eye, Download, Calculator, X } from 'lucide-react';
import { services } from '../../services/serviceFactory';
import { TaxAssessment } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { formatCurrency, formatDate, exportToCSV } from '../../utils';
import { useToast } from '../../context/ToastContext';

export const AdminAssessmentsPage: React.FC = () => {
  const { success } = useToast();
  const [assessments, setAssessments] = useState<TaxAssessment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [selectedAssessment, setSelectedAssessment] = useState<TaxAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await services.assessmentService.getAssessments();
      setAssessments(list);
    } catch (e) {
      console.error('Error fetching admin assessments:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const filtered = useMemo(() => {
    return assessments.filter((a) => {
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (yearFilter !== 'ALL' && a.assessmentYear !== yearFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.assessmentNumber.toLowerCase().includes(q) ||
          a.propertyNumber.toLowerCase().includes(q) ||
          a.ownerName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assessments, statusFilter, yearFilter, search]);

  const years = useMemo(() => {
    return Array.from(new Set(assessments.map((a) => a.assessmentYear)));
  }, [assessments]);

  const handleExport = () => {
    const data = filtered.map((a) => ({
      'Assessment Number': a.assessmentNumber,
      'Property Number': a.propertyNumber,
      'Taxpayer Name': a.ownerName,
      'Category': a.category,
      'Zone': a.zoneName,
      'Built-up Area (Sq.Ft)': a.builtUpArea,
      'Applied Rate (₹/sq.ft)': a.appliedRatePerSqFt,
      'Base Tax (₹)': a.baseTax,
      'Total Tax (₹)': a.totalTax,
      'Amount Paid (₹)': a.amountPaid,
      'Outstanding Balance (₹)': a.outstandingBalance,
      'Status': a.status,
      'Due Date': a.dueDate,
    }));
    exportToCSV(data, `CivicTax_Assessments_Audit_${new Date().toISOString().split('T')[0]}`);
    success('Export Initiated', 'Assessment register downloaded as CSV.');
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
      header: 'Property & Taxpayer',
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-xs font-mono">{item.propertyNumber}</span>
          <div className="text-[11px] text-slate-400">{item.ownerName} • {item.zoneName}</div>
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
        <span className="font-bold text-xs text-slate-900 dark:text-white">{formatCurrency(item.totalTax)}</span>
      ),
    },
    {
      key: 'amountPaid',
      header: 'Amount Paid',
      sortable: true,
      render: (item) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">{formatCurrency(item.amountPaid)}</span>
      ),
    },
    {
      key: 'outstandingBalance',
      header: 'Outstanding',
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
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
          title="Inspect Math"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Tax Assessment Register"
        subtitle="Corporation-wide register of issued annual tax bills, collections, and outstanding receivables."
        breadcrumbs={[{ label: 'Admin Console', path: '/admin/dashboard' }, { label: 'Assessments' }]}
        actions={
          <button
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV ({filtered.length})
          </button>
        }
      />

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by assessment no, property, taxpayer..."
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved / Unpaid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid in Full</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="ALL">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>FY {y}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(a) => a.id}
        isLoading={isLoading}
        onRowClick={(item) => setSelectedAssessment(item)}
      />

      {/* Math Modal */}
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
                <span className="font-bold font-mono">₹{selectedAssessment.appliedRatePerSqFt} / sq.ft ({selectedAssessment.category})</span>
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
                  <span>Rebate / Early Discount:</span>
                  <span className="font-mono">-{formatCurrency(selectedAssessment.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-blue-900 dark:text-blue-300 pt-2 border-t border-slate-300">
                <span>Total Assessment:</span>
                <span className="font-mono">{formatCurrency(selectedAssessment.totalTax)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Amount Paid:</span>
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
