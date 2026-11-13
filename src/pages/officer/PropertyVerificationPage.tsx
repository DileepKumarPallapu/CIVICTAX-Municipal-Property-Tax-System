import React, { useState, useEffect, useCallback } from 'react';
import { FileCheck, CheckCircle2, XCircle, AlertCircle, Eye, Check, X, Building2, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { services } from '../../services/serviceFactory';
import { Property, PropertyVerificationStatus } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { formatDate } from '../../utils';

export const PropertyVerificationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [remarks, setRemarks] = useState('Ground inspection completed. Sanctioned layout and index-II deed validated.');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verification Checklist State
  const [checkDeed, setCheckDeed] = useState(true);
  const [checkArea, setCheckArea] = useState(true);
  const [checkZone, setCheckZone] = useState(true);
  const [checkNoc, setCheckNoc] = useState(true);

  const loadPending = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await services.propertyService.getProperties();
      const pendingList = all.filter(
        (p) => p.verificationStatus === 'PENDING' || p.verificationStatus === 'RESUBMISSION_REQUIRED'
      );
      setProperties(pendingList);
    } catch (e: any) {
      error('Error loading pending queue', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadPending();

    const handleStorageUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'civictax_properties' || e.type === 'civictax_data_reset') {
        loadPending();
      }
    };
    window.addEventListener('civictax_storage_update', handleStorageUpdate);
    window.addEventListener('civictax_data_reset', handleStorageUpdate);
    return () => {
      window.removeEventListener('civictax_storage_update', handleStorageUpdate);
      window.removeEventListener('civictax_data_reset', handleStorageUpdate);
    };
  }, [loadPending]);

  const handleDecision = async (status: PropertyVerificationStatus) => {
    if (!currentUser || !selectedProperty) return;
    setIsVerifying(true);
    try {
      await services.propertyService.verifyProperty(
        selectedProperty.id,
        status,
        currentUser.id,
        currentUser.name,
        remarks
      );
      success('Verification Status Recorded', `${selectedProperty.propertyNumber} marked as ${status}.`);
      setSelectedProperty(null);
      loadPending();
    } catch (err: any) {
      error('Failed to submit verification', err.message);
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
          <span className="font-bold text-slate-900 dark:text-white text-xs">{item.ownerName}</span>
          <div className="text-[10px] text-slate-400 font-mono">{item.contactDetails}</div>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Location & Zone',
      render: (item) => (
        <div>
          <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-1">{item.address}</p>
          <p className="text-[10px] text-slate-400">{item.zoneName}</p>
        </div>
      ),
    },
    {
      key: 'builtUpArea',
      header: 'Dimensions',
      render: (item) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {item.builtUpArea} sq.ft • {item.category}
        </span>
      ),
    },
    {
      key: 'verificationStatus',
      header: 'Queue Status',
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
          }}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
        >
          <FileCheck className="w-3.5 h-3.5" />
          Verify Parcel
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property Verification Queue"
        subtitle="Perform physical survey audits, validate deed credentials, and certify newly registered properties."
        breadcrumbs={[{ label: 'Officer Desk', path: '/officer/dashboard' }, { label: 'Property Verification' }]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {properties.length} Awaiting Verification
          </span>
        }
      />

      <DataTable
        columns={columns}
        data={properties}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        emptyTitle="Queue is Empty"
        emptyDescription="All submitted properties in your jurisdiction have been audited."
        onRowClick={(p) => setSelectedProperty(p)}
      />

      {/* Verification Modal with Inspection Checklist */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {selectedProperty.propertyNumber}
                  </h3>
                  <p className="text-xs text-slate-400">Formal Verification Checklist</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Property Summary */}
            <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl">
              <p><strong>Owner:</strong> {selectedProperty.ownerName}</p>
              <p><strong>Address:</strong> {selectedProperty.address}</p>
              <p><strong>Category & Area:</strong> {selectedProperty.category} • {selectedProperty.builtUpArea} sq.ft</p>
              <p><strong>Deed Number:</strong> <span className="font-mono">{selectedProperty.documentReference}</span></p>
            </div>

            {/* Interactive Inspection Checklist */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Statutory Inspection Checklist
              </h4>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkDeed}
                    onChange={(e) => setCheckDeed(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Ownership deed matches state registry records</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkArea}
                    onChange={(e) => setCheckArea(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Physical carpet & built-up area conforms to blueprint</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkZone}
                    onChange={(e) => setCheckZone(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Zonal classification & category verified ({selectedProperty.category})</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkNoc}
                    onChange={(e) => setCheckNoc(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>No encumbrance or stay order recorded in municipal ledger</span>
                </label>
              </div>
            </div>

            {/* Officer Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Verification Findings *
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              ></textarea>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleDecision('REJECTED')}
                disabled={isVerifying}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold"
              >
                Reject Title
              </button>

              <button
                onClick={() => handleDecision('VERIFIED')}
                disabled={isVerifying || !(checkDeed && checkArea)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                Certify & Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
