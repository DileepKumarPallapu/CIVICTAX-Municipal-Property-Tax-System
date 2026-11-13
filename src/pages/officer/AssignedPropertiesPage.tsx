import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Building2, Search, Filter, Eye, CheckCircle2, XCircle, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { services } from '../../services/serviceFactory';
import { Property, PropertyCategory, PropertyVerificationStatus } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { formatDate } from '../../utils';

export const AssignedPropertiesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PropertyCategory | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<PropertyVerificationStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Verification modal state
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const loadProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await services.propertyService.getProperties();
      setProperties(list);
    } catch (e: any) {
      error('Failed to load properties', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadProperties();

    const handleStorageUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'civictax_properties' || e.type === 'civictax_data_reset') {
        loadProperties();
      }
    };
    window.addEventListener('civictax_storage_update', handleStorageUpdate);
    window.addEventListener('civictax_data_reset', handleStorageUpdate);
    return () => {
      window.removeEventListener('civictax_storage_update', handleStorageUpdate);
      window.removeEventListener('civictax_data_reset', handleStorageUpdate);
    };
  }, [loadProperties]);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
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
  }, [properties, categoryFilter, statusFilter, search]);

  const handleVerify = async (status: PropertyVerificationStatus) => {
    if (!currentUser || !selectedProperty) return;
    setIsVerifying(true);
    try {
      const updated = await services.propertyService.verifyProperty(
        selectedProperty.id,
        status,
        currentUser.id,
        currentUser.name,
        remarks || (status === 'VERIFIED' ? 'Approved upon field inspection.' : 'Application rejected.')
      );

      success(
        status === 'VERIFIED' ? 'Property Certified' : 'Property Rejected',
        `${updated.propertyNumber} status marked as ${status}.`
      );
      setSelectedProperty(null);
      loadProperties();
    } catch (err: any) {
      error('Operation Failed', err.message);
    } finally {
      setIsVerifying(false);
    }
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
      header: 'Taxpayer Name',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-white text-xs">{item.ownerName}</span>
          <div className="text-[10px] text-slate-400 font-mono">{item.contactDetails}</div>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address & Zone',
      render: (item) => (
        <div>
          <span className="text-slate-800 dark:text-slate-200 text-xs line-clamp-1">{item.address}</span>
          <span className="text-[10px] text-slate-400">{item.zoneName}</span>
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
      key: 'verificationStatus',
      header: 'Status',
      sortable: true,
      render: (item) => <StatusBadge status={item.verificationStatus} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedProperty(item);
            setRemarks(item.verificationComments || 'Survey completed and matched with deed records.');
          }}
          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          Review
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Municipal Properties"
        subtitle="Master directory of properties within jurisdiction. Inspect legal titles, built-up areas, and verify parcel deeds."
        breadcrumbs={[{ label: 'Officer Desk', path: '/officer/dashboard' }, { label: 'Assigned Properties' }]}
      />

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by property number, owner, address, or deed..."
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="ALL">All Categories</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="INDUSTRIAL">Industrial</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="RESUBMISSION_REQUIRED">Resubmission Required</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        onRowClick={(p) => {
          setSelectedProperty(p);
          setRemarks(p.verificationComments || 'Survey completed and matched with deed records.');
        }}
      />

      {/* Review Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                  {selectedProperty.propertyNumber}
                </h3>
                <p className="text-xs text-slate-400">Jurisdictional Title Review</p>
              </div>
              <StatusBadge status={selectedProperty.verificationStatus} />
            </div>

            <div className="space-y-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl">
              <p><strong>Owner:</strong> {selectedProperty.ownerName} ({selectedProperty.ownerEmail})</p>
              <p><strong>Address:</strong> {selectedProperty.address}</p>
              <p><strong>Category:</strong> {selectedProperty.category}</p>
              <p><strong>Built-up Area:</strong> {selectedProperty.builtUpArea} sq.ft</p>
              <p><strong>Construction Year:</strong> {selectedProperty.constructionYear}</p>
              <p><strong>Document Deed Ref:</strong> <span className="font-mono">{selectedProperty.documentReference}</span></p>
              <p><strong>Zone:</strong> {selectedProperty.zoneName}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Inspector Verification Findings & Remarks *
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              ></textarea>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-2">
                <button
                  onClick={() => handleVerify('REJECTED')}
                  disabled={isVerifying}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold hover:bg-rose-100"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleVerify('RESUBMISSION_REQUIRED')}
                  disabled={isVerifying}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold hover:bg-amber-100"
                >
                  Request Resubmission
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVerify('VERIFIED')}
                  disabled={isVerifying}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  Approve Title
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
