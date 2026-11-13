import React, { useState, useEffect, useCallback } from 'react';
import { Percent, PlusCircle, CheckCircle2, XCircle, AlertCircle, Edit2, ShieldAlert, X } from 'lucide-react';
import { services } from '../../services/serviceFactory';
import { TaxRate, PropertyCategory } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils';

export const TaxRateConfigPage: React.FC = () => {
  const { success, error, warning } = useToast();
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [category, setCategory] = useState<PropertyCategory>('RESIDENTIAL');
  const [ratePerSqFt, setRatePerSqFt] = useState<number>(10);
  const [effectiveStartDate, setEffectiveStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await services.taxRateService.getTaxRates();
      setRates(list);
    } catch (e: any) {
      error('Failed to load tax rates', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadRates();

    const handleStorageUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'civictax_tax_rates' || e.type === 'civictax_data_reset') {
        loadRates();
      }
    };
    window.addEventListener('civictax_storage_update', handleStorageUpdate);
    window.addEventListener('civictax_data_reset', handleStorageUpdate);
    return () => {
      window.removeEventListener('civictax_storage_update', handleStorageUpdate);
      window.removeEventListener('civictax_data_reset', handleStorageUpdate);
    };
  }, [loadRates]);

  const handleOpenAdd = () => {
    setEditingRate(null);
    setCategory('RESIDENTIAL');
    setRatePerSqFt(12);
    setEffectiveStartDate(new Date().toISOString().split('T')[0]);
    setIsActive(true);
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rate: TaxRate) => {
    setEditingRate(rate);
    setCategory(rate.category);
    setRatePerSqFt(rate.ratePerSqFt);
    setEffectiveStartDate(rate.effectiveStartDate);
    setIsActive(rate.isActive);
    setDescription(rate.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ratePerSqFt <= 0) {
      error('Invalid Rate', 'Rate per square foot must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRate) {
        await services.taxRateService.updateTaxRate(editingRate.id, {
          category,
          ratePerSqFt,
          effectiveStartDate,
          isActive,
          description,
        });
        success('Tax Rate Updated', `Tariff for ${category} updated to ₹${ratePerSqFt}/sq.ft.`);
      } else {
        await services.taxRateService.createTaxRate({
          category,
          ratePerSqFt,
          effectiveStartDate,
          effectiveEndDate: null,
          isActive,
          description,
          zoneId: null,
          zoneName: null,
        });
        success('Tax Rate Registered', `New active tariff for ${category} registered at ₹${ratePerSqFt}/sq.ft.`);
      }

      setIsModalOpen(false);
      loadRates();
    } catch (err: any) {
      error('Rate Configuration Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (rate: TaxRate) => {
    try {
      await services.taxRateService.deactivateTaxRate(rate.id);
      warning('Tariff Deactivated', `Rate for ${rate.category} (₹${rate.ratePerSqFt}) is now marked inactive.`);
      loadRates();
    } catch (err: any) {
      error('Deactivation Failed', err.message);
    }
  };

  const columns: Column<TaxRate>[] = [
    {
      key: 'category',
      header: 'Property Category',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-slate-900 dark:text-white text-xs">
          {item.category}
        </span>
      ),
    },
    {
      key: 'ratePerSqFt',
      header: 'Rate per Sq.Ft',
      sortable: true,
      render: (item) => (
        <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm font-mono">
          ₹{item.ratePerSqFt}
        </span>
      ),
    },
    {
      key: 'effectiveStartDate',
      header: 'Effective Period',
      render: (item) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          From {formatDate(item.effectiveStartDate)} {item.effectiveEndDate ? `to ${formatDate(item.effectiveEndDate)}` : '(Current)'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Tariff Status',
      sortable: true,
      render: (item) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            item.isActive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {item.isActive ? 'Active Schedule' : 'Historical Archive'}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Tariff Policy Note',
      render: (item) => <span className="text-xs text-slate-400 line-clamp-1">{item.description || '—'}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Edit Rate"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {item.isActive && (
            <button
              onClick={() => handleDeactivate(item)}
              className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition"
              title="Deactivate rate"
            >
              Retire
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Tax Rate Schedule Configuration"
        subtitle="Manage base unit-area tax tariffs per square foot. Conflicting active rates for identical categories are strictly audited."
        breadcrumbs={[{ label: 'Admin Console', path: '/admin/dashboard' }, { label: 'Tax Rates' }]}
        actions={
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add Tax Rate Tariff
          </button>
        }
      />

      {/* Historical Audit Preservation Banner */}
      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Historical Assessment Integrity:</strong> When a tax rate is updated or retired, all past annual tax assessments retain their original applied rate (<code className="font-mono font-bold">appliedRatePerSqFt</code>) to ensure audit stability. Only new assessments issued henceforth apply the revised schedule.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={rates}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        onRowClick={(item) => handleOpenEdit(item)}
      />

      {/* Create / Edit Tax Rate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingRate ? 'Modify Tax Rate Tariff' : 'Register New Tax Rate'}
                  </h3>
                  <p className="text-xs text-slate-400">Unit-Area Assessment Tariff Schedule</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Property Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="INDUSTRIAL">Industrial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rate per Sq.Ft (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.5"
                    value={ratePerSqFt}
                    onChange={(e) => setRatePerSqFt(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Effective Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={effectiveStartDate}
                    onChange={(e) => setEffectiveStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="activeCheck"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="activeCheck" className="text-xs font-semibold cursor-pointer">
                      Mark as Current Active Tariff
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Municipal Resolution / Policy Reference
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Standard rate revised pursuant to General Body Resolution 42..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                >
                  {isSubmitting ? 'Saving...' : editingRate ? 'Update Tariff' : 'Register Tariff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
