import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, AlertTriangle, Eye, Clock, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { services } from '../../services/serviceFactory';
import { Grievance, Property, GrievanceCategory, GrievancePriority } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { ProgressTimeline } from '../../components/common/ProgressTimeline';
import { formatDate } from '../../utils';

export const CitizenGrievancesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Grievance Form State
  const [propertyId, setPropertyId] = useState('');
  const [category, setCategory] = useState<GrievanceCategory>('INCORRECT_CALCULATION');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GrievancePriority>('MEDIUM');

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const [grvList, propList] = await Promise.all([
        services.grievanceService.getGrievances({ citizenId: currentUser.id }),
        services.propertyService.getProperties({ ownerId: currentUser.id }),
      ]);
      setGrievances(grvList);
      setProperties(propList);
      if (propList.length > 0) setPropertyId(propList[0].id);
    } catch (e) {
      console.error('Error loading grievances:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();

    const handleStorageUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'civictax_grievances' || e.type === 'civictax_data_reset') {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const prop = properties.find((p) => p.id === propertyId);
    if (!prop) {
      error('Property Required', 'Please select a valid property from your registered list.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await services.grievanceService.createGrievance({
        propertyId: prop.id,
        propertyNumber: prop.propertyNumber,
        citizenId: currentUser.id,
        citizenName: currentUser.name,
        citizenEmail: currentUser.email,
        citizenPhone: currentUser.phone,
        category,
        subject,
        description,
        priority,
      });

      success('Grievance Registered', `Grievance reference ${created.grievanceNumber} submitted.`);
      setIsModalOpen(false);
      setSubject('');
      setDescription('');
      loadData();
    } catch (err: any) {
      error('Submission Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Grievance>[] = [
    {
      key: 'grievanceNumber',
      header: 'Grievance No.',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
          {item.grievanceNumber}
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject & Property',
      render: (item) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white text-xs line-clamp-1">
            {item.subject}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {item.propertyNumber} • {item.category.replace(/_/g, ' ')}
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (item) => <StatusBadge status={item.priority} size="sm" />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'assignedOfficerName',
      header: 'Assigned Officer',
      render: (item) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {item.assignedOfficerName || 'Triage Queue'}
        </span>
      ),
    },
    {
      key: 'submissionDate',
      header: 'Submitted',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-slate-500">{formatDate(item.submissionDate)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedGrievance(item);
          }}
          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          Track
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Citizen Grievance Redressal"
        subtitle="Lodge disputes, check resolution milestones, and track revenue officer inspections."
        breadcrumbs={[{ label: 'Dashboard', path: '/citizen/dashboard' }, { label: 'Grievances' }]}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Raise New Grievance
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={grievances}
        keyExtractor={(g) => g.id}
        isLoading={isLoading}
        emptyTitle="No grievances lodged"
        emptyDescription="You have not filed any municipal property tax grievances."
        emptyAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            Lodge First Grievance
          </button>
        }
        onRowClick={(item) => setSelectedGrievance(item)}
      />

      {/* New Grievance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Raise Municipal Grievance
                  </h3>
                  <p className="text-xs text-slate-400">Formal Tax & Parcel Redressal</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Associated Property *
                </label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.propertyNumber} — {p.address}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Complaint Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="INCORRECT_CALCULATION">Incorrect Tax Calculation</option>
                    <option value="PROPERTY_INFO_ISSUE">Property Information Issue</option>
                    <option value="PAYMENT_ISSUE">Payment Reconciliation Issue</option>
                    <option value="OWNERSHIP_ISSUE">Ownership / Title Dispute</option>
                    <option value="ASSESSMENT_ISSUE">Assessment Dispute</option>
                    <option value="OTHER">Other Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Discrepancy in balcony built-up area rate..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide comprehensive details, floor area discrepancies, challan numbers..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Submit Grievance</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grievance Detail & Tracking Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {selectedGrievance.grievanceNumber}
                  </h3>
                  <StatusBadge status={selectedGrievance.status} size="sm" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Property: {selectedGrievance.propertyNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedGrievance(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold">Subject:</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedGrievance.subject}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 font-semibold">Grievance Description:</span>
                <p className="text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
                  {selectedGrievance.description}
                </p>
              </div>

              {selectedGrievance.resolutionComments && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60">
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                    Official Resolution Summary:
                  </span>
                  <p className="text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
                    {selectedGrievance.resolutionComments}
                  </p>
                  {selectedGrievance.resolvedDate && (
                    <p className="text-[10px] text-slate-400 mt-2">
                      Resolved on {formatDate(selectedGrievance.resolvedDate)}
                    </p>
                  )}
                </div>
              )}

              {/* Progress Timeline */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
                  Progress Milestone Timeline
                </h4>
                <ProgressTimeline events={selectedGrievance.timeline} />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedGrievance(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold"
              >
                Close Tracking View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
