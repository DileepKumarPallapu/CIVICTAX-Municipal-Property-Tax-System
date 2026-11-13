import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CreditCard, Download, Search, Filter, Receipt } from 'lucide-react';
import { services } from '../../services/serviceFactory';
import { Payment } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { ReceiptViewer } from '../../components/common/ReceiptViewer';
import { formatCurrency, formatDateTime, exportToCSV } from '../../utils';
import { useToast } from '../../context/ToastContext';

export const AdminPaymentsPage: React.FC = () => {
  const { success } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await services.paymentService.getPayments();
      setPayments(list);
    } catch (e) {
      console.error('Error fetching admin payments:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleStorageUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'civictax_payments' || e.type === 'civictax_data_reset') {
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
    return payments.filter((p) => {
      if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.transactionId.toLowerCase().includes(q) ||
          p.receiptNumber.toLowerCase().includes(q) ||
          p.propertyNumber.toLowerCase().includes(q) ||
          p.payerName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, methodFilter, search]);

  const totalCollected = useMemo(() => {
    return filtered
      .filter((p) => p.paymentStatus === 'SUCCESS')
      .reduce((sum, p) => sum + p.amountPaid, 0);
  }, [filtered]);

  const handleExport = () => {
    const data = filtered.map((p) => ({
      'Receipt Number': p.receiptNumber,
      'Transaction ID': p.transactionId,
      'Property Number': p.propertyNumber,
      'Assessment Number': p.assessmentNumber,
      'Payer Name': p.payerName,
      'Amount Paid (₹)': p.amountPaid,
      'Total Assessment (₹)': p.totalAssessment,
      'Remaining Balance (₹)': p.remainingBalance,
      'Payment Method': p.paymentMethod,
      'Status': p.paymentStatus,
      'Gateway Reference': p.gatewayRef,
      'Date': p.paymentDate,
    }));
    exportToCSV(data, `CivicTax_Treasury_Collections_${new Date().toISOString().split('T')[0]}`);
    success('Export Initiated', 'Payment treasury report downloaded as CSV.');
  };

  const columns: Column<Payment>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt No.',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
          {item.receiptNumber}
        </span>
      ),
    },
    {
      key: 'propertyNumber',
      header: 'Property & Taxpayer',
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-xs font-mono">{item.propertyNumber}</span>
          <div className="text-[11px] text-slate-400">{item.payerName}</div>
        </div>
      ),
    },
    {
      key: 'amountPaid',
      header: 'Amount Paid',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
          {formatCurrency(item.amountPaid)}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Channel',
      sortable: true,
      render: (item) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {item.paymentMethod.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      sortable: true,
      render: (item) => <StatusBadge status={item.paymentStatus} size="sm" />,
    },
    {
      key: 'paymentDate',
      header: 'Date & Time',
      sortable: true,
      render: (item) => <span className="text-xs text-slate-500">{formatDateTime(item.paymentDate)}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedReceiptPayment(item);
          }}
          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          Receipt
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporation Treasury & Payment Records"
        subtitle="Complete ledger of property tax receipts, simulated gateway transactions, and bank reconciliations."
        breadcrumbs={[{ label: 'Admin Console', path: '/admin/dashboard' }, { label: 'Payments' }]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Filtered Collections: {formatCurrency(totalCollected)}
          </span>
        }
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

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by receipt, transaction ID, property, or taxpayer..."
        />

        <div className="flex items-center gap-2">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="UPI">UPI</option>
            <option value="NET_BANKING">Net Banking</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="DEBIT_CARD">Debit Card</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        onRowClick={(p) => setSelectedReceiptPayment(p)}
      />

      <ReceiptViewer
        payment={selectedReceiptPayment}
        isOpen={!!selectedReceiptPayment}
        onClose={() => setSelectedReceiptPayment(null)}
      />
    </div>
  );
};
