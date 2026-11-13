import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, PlusCircle, Users, TrendingUp, Building, X } from 'lucide-react';
import { services } from '../../services/serviceFactory';
import { MunicipalZone, User } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils';

export const ZoneManagementPage: React.FC = () => {
  const { success, error } = useToast();
  const [zones, setZones] = useState<MunicipalZone[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [wardCoverage, setWardCoverage] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [revenueTarget, setRevenueTarget] = useState<number>(100000000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [zoneList, userList] = await Promise.all([
        services.zoneService.getZones(),
        services.userService.getUsers(),
      ]);
      setZones(zoneList);
      const offList = userList.filter((u) => u.role === 'OFFICER');
      setOfficers(offList);
      if (offList.length > 0) setOfficerId(offList[0].id);
    } catch (e: any) {
      error('Failed to load zones', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();

    const handleStorageUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'civictax_zones' || e.type === 'civictax_data_reset') {
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

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const selectedOfficer = officers.find((o) => o.id === officerId);
      const created = await services.zoneService.createZone({
        code: code.toUpperCase(),
        name,
        description,
        wardCoverage,
        officerInChargeId: officerId,
        officerInChargeName: selectedOfficer?.name || 'Officer',
        activePropertiesCount: 0,
        totalRevenueTarget: revenueTarget,
      });

      success('Zone Created', `Municipal zone ${created.name} (${created.code}) registered.`);
      setIsModalOpen(false);
      setName('');
      setCode('');
      setDescription('');
      setWardCoverage('');
      loadData();
    } catch (err: any) {
      error('Failed to create zone', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<MunicipalZone>[] = [
    {
      key: 'code',
      header: 'Zone Code',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
          {item.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Zone Name & Description',
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-xs">{item.name}</span>
          <p className="text-[11px] text-slate-400 line-clamp-1">{item.description}</p>
        </div>
      ),
    },
    {
      key: 'wardCoverage',
      header: 'Wards Covered',
      render: (item) => <span className="text-xs text-slate-600 dark:text-slate-300">{item.wardCoverage}</span>,
    },
    {
      key: 'officerInChargeName',
      header: 'Officer in Charge',
      render: (item) => (
        <span className="text-xs font-semibold text-slate-900 dark:text-white">
          {item.officerInChargeName}
        </span>
      ),
    },
    {
      key: 'totalRevenueTarget',
      header: 'Revenue Target',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
          {formatCurrency(item.totalRevenueTarget)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Zone Administration"
        subtitle="Configure geographic municipal tax boundaries, ward allocations, revenue targets, and supervising officers."
        breadcrumbs={[{ label: 'Admin Console', path: '/admin/dashboard' }, { label: 'Zones' }]}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add Municipal Zone
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={zones}
        keyExtractor={(z) => z.id}
        isLoading={isLoading}
      />

      {/* Add Zone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Add Municipal Zone
                  </h3>
                  <p className="text-xs text-slate-400">Jurisdictional Boundary Configuration</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateZone} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Zone Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Zone 5 - Eastern Corridor"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Zone Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. Z-EAST"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ward Coverage *
                </label>
                <input
                  type="text"
                  required
                  value={wardCoverage}
                  onChange={(e) => setWardCoverage(e.target.value)}
                  placeholder="e.g. Wards 97 to 120 (Hadapsar, Kharadi)"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Officer in Charge *
                  </label>
                  <select
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {officers.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Annual Revenue Target (₹)
                  </label>
                  <input
                    type="number"
                    value={revenueTarget}
                    onChange={(e) => setRevenueTarget(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  {isSubmitting ? 'Registering...' : 'Register Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
