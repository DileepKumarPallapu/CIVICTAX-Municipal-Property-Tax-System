import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CreditCard, Download, Search, Filter, Receipt } from 'lucide-react';
import { services } from '../../services/serviceFactory';
import { Payment } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { ReceiptViewer } from '../../components/common/ReceiptViewer';
import { formatCurrency, formatDateTime } from '../../utils';

export const OfficerPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await services.paymentService.getPayments();
      setPayments(list);
    } catch (e) {
      console.error('Error fetching payments:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();

    const handleStorageUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'civictax_payments' || e.type === 'civictax_data_reset') {
        loadPayments();
      }
    };
    window.addEventListener('civictax_storage_update', handleStorageUpdate);
    window.addEventListener('civictax_data_reset', handleStorageUpdate);
    return () => {
      window.removeEventListener('civictax_storage_update', handleStorageUpdate);
      window.removeEventListener('civictax_data_reset', handleStorageUpdate);
    };
  }, [loadPayments]);

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
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
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
      header: 'Timestamp',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-slate-500">{formatDateTime(item.paymentDate)}</span>
      ),
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
        title="Municipal Payment & Treasury Monitoring"
        subtitle="Live feed of online tax collections, transaction references, and issued e-challans."
        breadcrumbs={[{ label: 'Officer Desk', path: '/officer/dashboard' }, { label: 'Payments' }]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Total Filtered Collections: {formatCurrency(totalCollected)}
          </span>
        }
      />

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by receipt no, txn ID, property, or taxpayer..."
        />

        <div className="flex items-center gap-2">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="ALL">All Payment Channels</option>
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
