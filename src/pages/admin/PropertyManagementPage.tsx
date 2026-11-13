import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Building2, Search, Filter, Trash2, Eye, Download, ShieldCheck } from 'lucide-react';
import { services } from '../../services/serviceFactory';
import { Property, PropertyCategory, PropertyVerificationStatus, MunicipalZone } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { formatDate, exportToCSV } from '../../utils';

export const PropertyManagementPage: React.FC = () => {
  const { success, error } = useToast();

  const [properties, setProperties] = useState<Property[]>([]);
  const [zones, setZones] = useState<MunicipalZone[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Delete Confirm Dialog State
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [props, zoneList] = await Promise.all([
        services.propertyService.getProperties(),
        services.zoneService.getZones(),
      ]);
      setProperties(props);
      setZones(zoneList);
    } catch (e: any) {
      error('Failed to load properties', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();

    const handleStorageUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'civictax_properties' || e.type === 'civictax_data_reset') {
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
    return properties.filter((p) => {
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
      if (zoneFilter !== 'ALL' && p.zoneId !== zoneFilter) return false;
      if (statusFilter !== 'ALL' && p.verificationStatus !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.propertyNumber.toLowerCase().includes(q) ||
          p.ownerName.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.documentReference.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [properties, categoryFilter, zoneFilter, statusFilter, search]);

  const handleDelete = async () => {
    if (!propertyToDelete) return;
    setIsDeleting(true);
    try {
      await services.propertyService.deleteProperty(propertyToDelete.id);
      success('Property Removed', `Parcel ${propertyToDelete.propertyNumber} deleted from municipal records.`);
      setPropertyToDelete(null);
      loadData();
    } catch (err: any) {
      error('Deletion Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    const exportData = filtered.map((p) => ({
      'Property Number': p.propertyNumber,
      'Owner Name': p.ownerName,
      'Category': p.category,
      'Built-up Area (Sq.Ft)': p.builtUpArea,
      'Zone': p.zoneName,
      'Verification Status': p.verificationStatus,
      'Deed Reference': p.documentReference,
      'Address': p.address,
      'Registration Date': p.registrationDate,
    }));
    exportToCSV(exportData, `CivicTax_Properties_${new Date().toISOString().split('T')[0]}`);
    success('Export Initiated', 'CSV file generated and downloaded.');
  };

  const columns: Column<Property>[] = [
    {
      key: 'propertyNumber',
      header: 'Property No.',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
          {item.propertyNumber}
        </span>
      ),
    },
    {
      key: 'ownerName',
      header: 'Taxpayer',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-xs">{item.ownerName}</span>
          <div className="text-[10px] text-slate-400">{item.ownerEmail}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category & Area',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {item.category} • {item.builtUpArea} sq.ft
        </span>
      ),
    },
    {
      key: 'zoneName',
      header: 'Municipal Zone',
      sortable: true,
      render: (item) => <span className="text-xs text-slate-600 dark:text-slate-400">{item.zoneName}</span>,
    },
    {
      key: 'verificationStatus',
      header: 'Status',
      sortable: true,
      render: (item) => <StatusBadge status={item.verificationStatus} size="sm" />,
    },
    {
      key: 'registrationDate',
      header: 'Registered',
      sortable: true,
      render: (item) => <span className="text-xs text-slate-500">{formatDate(item.registrationDate)}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPropertyToDelete(item);
          }}
          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
          title="Delete Property"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporation Property Master Ledger"
        subtitle="Complete catalog of all residential, commercial, and industrial holdings across all wards."
        breadcrumbs={[{ label: 'Admin Console', path: '/admin/dashboard' }, { label: 'Property Ledger' }]}
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
          placeholder="Search by property no, taxpayer, address, deed ref..."
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="ALL">All Categories</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="INDUSTRIAL">Industrial</option>
          </select>

          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="ALL">All Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.code}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="RESUBMISSION_REQUIRED">Resubmission</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
      />

      <ConfirmDialog
        isOpen={!!propertyToDelete}
        title="Remove Property Record"
        message={`Are you sure you want to delete property parcel ${propertyToDelete?.propertyNumber}? This action will permanently remove it from municipal active ledgers.`}
        confirmText="Delete Record"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPropertyToDelete(null)}
      />
    </div>
  );
};
