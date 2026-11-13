import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Eye, Check, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { services } from '../../services/serviceFactory';
import { ReassessmentRequest } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { formatDate } from '../../utils';

export const OfficerReassessmentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [requests, setRequests] = useState<ReassessmentRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ReassessmentRequest | null>(null);
  const [comments, setComments] = useState('Ground inspection verified structural alterations. Sanctioned revised measurements approved.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await services.reassessmentService.getReassessments();
      setRequests(list);
    } catch (e: any) {
      error('Failed to load reassessments', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadRequests();

    const handleStorageUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'civictax_reassessments' || e.type === 'civictax_data_reset') {
        loadRequests();
      }
    };
    window.addEventListener('civictax_storage_update', handleStorageUpdate);
    window.addEventListener('civictax_data_reset', handleStorageUpdate);
    return () => {
      window.removeEventListener('civictax_storage_update', handleStorageUpdate);
      window.removeEventListener('civictax_data_reset', handleStorageUpdate);
    };
  }, [loadRequests]);

  const handleDecision = async (status: 'APPROVED' | 'REJECTED') => {
    if (!currentUser || !selectedRequest) return;
    setIsProcessing(true);
    try {
      await services.reassessmentService.reviewReassessment(
        selectedRequest.id,
        status,
        currentUser.id,
        currentUser.name,
        comments,
        true
      );

      success(
        status === 'APPROVED' ? 'Reassessment Approved' : 'Reassessment Rejected',
        status === 'APPROVED'
          ? `Appeal ${selectedRequest.requestNumber} approved. Revised assessment issued.`
          : `Appeal ${selectedRequest.requestNumber} rejected with remark.`
      );
      setSelectedRequest(null);
      loadRequests();
    } catch (err: any) {
      error('Decision Failed', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const columns: Column<ReassessmentRequest>[] = [
    {
      key: 'requestNumber',
      header: 'Request No.',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
          {item.requestNumber}
        </span>
      ),
    },
    {
      key: 'citizenName',
      header: 'Taxpayer & Property',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-xs">{item.citizenName}</span>
          <div className="text-[11px] text-slate-400 font-mono">
            {item.propertyNumber} • Bill: {item.assessmentNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'currentBuiltUpArea',
      header: 'Area Adjustment',
      render: (item) => (
        <div className="text-xs">
          <span className="text-slate-400">{item.currentBuiltUpArea} sq.ft</span>
          <ArrowRight className="w-3 h-3 inline mx-1.5 text-blue-500" />
          <span className="font-bold text-slate-900 dark:text-white">
            {item.requestedBuiltUpArea} sq.ft
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'submissionDate',
      header: 'Date',
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
            setSelectedRequest(item);
          }}
          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 text-xs font-bold transition flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          Audit Appeal
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reassessment Appeal Management"
        subtitle="Review modification requests, audit demolition/alteration claims, and issue traceable revised assessments."
        breadcrumbs={[{ label: 'Officer Desk', path: '/officer/dashboard' }, { label: 'Reassessments' }]}
      />

      <DataTable
        columns={columns}
        data={requests}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        onRowClick={(item) => setSelectedRequest(item)}
      />

      {/* Audit Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                  {selectedRequest.requestNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Taxpayer: {selectedRequest.citizenName} • Property: {selectedRequest.propertyNumber}
                </p>
              </div>
              <StatusBadge status={selectedRequest.status} />
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400">Current Area:</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedRequest.currentBuiltUpArea} sq.ft</p>
                </div>
                <div>
                  <span className="text-slate-400">Requested Area:</span>
                  <p className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">{selectedRequest.requestedBuiltUpArea} sq.ft</p>
                </div>
              </div>
              <div>
                <span className="text-slate-400">Supporting Document Reference:</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{selectedRequest.documentReference}</p>
              </div>
              <div>
                <span className="text-slate-400">Citizen Grounds for Appeal:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">{selectedRequest.reason}</p>
              </div>
            </div>

            {selectedRequest.status === 'SUBMITTED' || selectedRequest.status === 'UNDER_REVIEW' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Officer Audit Comments & Resolution Reasoning *
                  </label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  ></textarea>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleDecision('REJECTED')}
                    disabled={isProcessing}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold"
                  >
                    Reject Appeal
                  </button>

                  <button
                    onClick={() => handleDecision('APPROVED')}
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    Approve & Issue Revised Bill
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
                <p className="font-bold">Appeal Concluded:</p>
                <p className="text-slate-600 dark:text-slate-300">{selectedRequest.officerComments}</p>
                {selectedRequest.reviewedByOfficerName && (
                  <p className="text-[10px] text-slate-400 pt-1">
                    Reviewed by {selectedRequest.reviewedByOfficerName} on {formatDate(selectedRequest.reviewDate)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
