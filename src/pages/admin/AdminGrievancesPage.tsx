import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, Eye, Users, CheckCircle2, Clock, X } from 'lucide-react';
import { services } from '../../services/serviceFactory';
import { Grievance, User } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { ProgressTimeline } from '../../components/common/ProgressTimeline';
import { formatDate } from '../../utils';
import { useToast } from '../../context/ToastContext';

export const AdminGrievancesPage: React.FC = () => {
  const { success, error } = useToast();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [assignOfficerId, setAssignOfficerId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [grvs, users] = await Promise.all([
        services.grievanceService.getGrievances(),
        services.userService.getUsers(),
      ]);
      setGrievances(grvs);
      const offList = users.filter((u) => u.role === 'OFFICER');
      setOfficers(offList);
      if (offList.length > 0) setAssignOfficerId(offList[0].id);
    } catch (e: any) {
      error('Failed to load grievances', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

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

  const filtered = useMemo(() => {
    return grievances.filter((g) => {
      if (statusFilter !== 'ALL' && g.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          g.grievanceNumber.toLowerCase().includes(q) ||
          g.subject.toLowerCase().includes(q) ||
          g.propertyNumber.toLowerCase().includes(q) ||
          g.citizenName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [grievances, statusFilter, search]);

  const handleAssignOfficer = async () => {
    if (!selectedGrievance || !assignOfficerId) return;
    const officer = officers.find((o) => o.id === assignOfficerId);
    if (!officer) return;

    try {
      const updated = await services.grievanceService.assignOfficer(
        selectedGrievance.id,
        officer.id,
        officer.name
      );
      success('Officer Assigned', `${selectedGrievance.grievanceNumber} allocated to ${officer.name}.`);
      setSelectedGrievance(updated);
      loadData();
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
      header: 'Subject & Property',
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-xs line-clamp-1">{item.subject}</span>
          <div className="text-[11px] text-slate-400">
            {item.citizenName} • Parcel: {item.propertyNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {item.category.replace(/_/g, ' ')}
        </span>
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
          {item.assignedOfficerName || 'Triage Pool'}
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
        title="Public Grievance Redressal Oversight"
        subtitle="Corporation-wide monitoring of citizen disputes, officer triage performance, and SLA compliance."
        breadcrumbs={[{ label: 'Admin Console', path: '/admin/dashboard' }, { label: 'Grievance Oversight' }]}
      />

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by grievance no, taxpayer, subject, property..."
        />

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(g) => g.id}
        isLoading={isLoading}
        onRowClick={(item) => setSelectedGrievance(item)}
      />

      {/* Review & Assign Modal */}
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
                  Taxpayer: {selectedGrievance.citizenName} • Parcel: {selectedGrievance.propertyNumber}
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
                <p><strong>Subject:</strong> {selectedGrievance.subject}</p>
                <p><strong>Category:</strong> {selectedGrievance.category.replace(/_/g, ' ')}</p>
                <p><strong>Description:</strong> {selectedGrievance.description}</p>
              </div>

              {/* Officer Allocation Bar */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Supervisory Officer Allocation
                </h4>
                <div className="flex gap-2">
                  <select
                    value={assignOfficerId}
                    onChange={(e) => setAssignOfficerId(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {officers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.designation || 'Revenue Inspector'})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignOfficer}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    Assign Officer
                  </button>
                </div>
              </div>

              {/* Progress Timeline */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                  Audit Milestone Timeline
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
