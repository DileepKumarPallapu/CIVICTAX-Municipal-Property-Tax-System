import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Eye, CheckCircle2, UserCheck, X, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { services } from '../../services/serviceFactory';
import { Grievance, GrievanceStatus } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { ProgressTimeline } from '../../components/common/ProgressTimeline';
import { formatDate } from '../../utils';

export const OfficerGrievancesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [newStatus, setNewStatus] = useState<GrievanceStatus>('IN_PROGRESS');
  const [officerComment, setOfficerComment] = useState('Field measurement confirmed. Rectified in municipal ledger.');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadGrievances = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await services.grievanceService.getGrievances();
      setGrievances(list);
    } catch (e: any) {
      error('Failed to load grievances', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadGrievances();

    const handleStorageUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'civictax_grievances' || e.type === 'civictax_data_reset') {
        loadGrievances();
      }
    };
    window.addEventListener('civictax_storage_update', handleStorageUpdate);
    window.addEventListener('civictax_data_reset', handleStorageUpdate);
    return () => {
      window.removeEventListener('civictax_storage_update', handleStorageUpdate);
      window.removeEventListener('civictax_data_reset', handleStorageUpdate);
    };
  }, [loadGrievances]);

  const handleUpdateStatus = async () => {
    if (!currentUser || !selectedGrievance) return;
    setIsUpdating(true);
    try {
      const updated = await services.grievanceService.updateGrievanceStatus(
        selectedGrievance.id,
        newStatus,
        currentUser.name,
        officerComment,
        newStatus === 'RESOLVED' ? officerComment : undefined
      );

      success('Grievance Updated', `${updated.grievanceNumber} marked as ${newStatus}.`);
      setSelectedGrievance(updated);
      loadGrievances();
    } catch (err: any) {
      error('Status Update Failed', err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignToSelf = async (grv: Grievance) => {
    if (!currentUser) return;
    try {
      const updated = await services.grievanceService.assignOfficer(
        grv.id,
        currentUser.id,
        currentUser.name
      );
      success('Assigned to You', `${updated.grievanceNumber} is now assigned to your desk.`);
      if (selectedGrievance && selectedGrievance.id === grv.id) {
        setSelectedGrievance(updated);
      }
      loadGrievances();
    } catch (err: any) {
      error('Assignment Failed', err.message);
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
      header: 'Subject & Citizen',
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-xs line-clamp-1">{item.subject}</span>
          <div className="text-[11px] text-slate-400">
            {item.citizenName} • Property: {item.propertyNumber}
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
      header: 'Assignee',
      render: (item) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {item.assignedOfficerName || 'Unassigned'}
        </span>
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
            setNewStatus(item.status === 'SUBMITTED' ? 'IN_PROGRESS' : item.status);
          }}
          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          Investigate
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grievance Investigation & Redressal"
        subtitle="Manage public inquiries, assign field inspections, and resolve citizen billing disputes."
        breadcrumbs={[{ label: 'Officer Desk', path: '/officer/dashboard' }, { label: 'Grievance Management' }]}
      />

      <DataTable
        columns={columns}
        data={grievances}
        keyExtractor={(g) => g.id}
        isLoading={isLoading}
        onRowClick={(item) => {
          setSelectedGrievance(item);
          setNewStatus(item.status === 'SUBMITTED' ? 'IN_PROGRESS' : item.status);
        }}
      />

      {/* Investigation Modal */}
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
                  Citizen: {selectedGrievance.citizenName} ({selectedGrievance.citizenPhone})
                </p>
              </div>
              <button
                onClick={() => setSelectedGrievance(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl space-y-2">
                <p><strong>Property Parcel:</strong> {selectedGrievance.propertyNumber}</p>
                <p><strong>Subject:</strong> {selectedGrievance.subject}</p>
                <p><strong>Category:</strong> {selectedGrievance.category.replace(/_/g, ' ')}</p>
                <p><strong>Citizen Complaint:</strong> {selectedGrievance.description}</p>
              </div>

              {/* Assignment bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80">
                <span className="text-slate-700 dark:text-slate-300">
                  Assigned Officer:{' '}
                  <strong>{selectedGrievance.assignedOfficerName || 'Unassigned'}</strong>
                </span>
                {selectedGrievance.assignedOfficerId !== currentUser?.id && (
                  <button
                    onClick={() => handleAssignToSelf(selectedGrievance)}
                    className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs"
                  >
                    Assign to Me
                  </button>
                )}
              </div>

              {/* Status Update Form */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Update Grievance Milestone
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      New Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Action Timestamp
                    </label>
                    <input
                      type="text"
                      disabled
                      value={new Date().toLocaleDateString('en-IN')}
                      className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Official Milestone Remarks / Resolution Finding *
                  </label>
                  <textarea
                    rows={2}
                    value={officerComment}
                    onChange={(e) => setOfficerComment(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  ></textarea>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleUpdateStatus}
                    disabled={isUpdating}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    {isUpdating ? 'Saving...' : 'Apply Status Change'}
                  </button>
                </div>
              </div>

              {/* Progress Timeline */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                  Timeline History
                </h4>
                <ProgressTimeline events={selectedGrievance.timeline} />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedGrievance(null)}
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
