import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PlusCircle, RefreshCw, Eye, CheckCircle2, AlertCircle, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { services } from '../../services/serviceFactory';
import { ReassessmentRequest, TaxAssessment } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { formatCurrency, formatDate } from '../../utils';

export const CitizenReassessmentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedAssessmentId = searchParams.get('assessmentId');

  const [requests, setRequests] = useState<ReassessmentRequest[]>([]);
  const [assessments, setAssessments] = useState<TaxAssessment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ReassessmentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form inputs
  const [assessmentId, setAssessmentId] = useState('');
  const [requestedArea, setRequestedArea] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [docRef, setDocRef] = useState('');

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const [allReqs, asms] = await Promise.all([
        services.reassessmentService.getReassessments(),
        services.assessmentService.getAssessments({ ownerId: currentUser.id }),
      ]);
      const myReqs = allReqs.filter((r) => r.citizenId === currentUser.id);
      setRequests(myReqs);
      setAssessments(asms);

      if (preselectedAssessmentId) {
        setAssessmentId(preselectedAssessmentId);
        setIsModalOpen(true);
        const match = asms.find((a) => a.id === preselectedAssessmentId);
        if (match) setRequestedArea(match.builtUpArea);
      } else if (asms.length > 0) {
        setAssessmentId(asms[0].id);
        setRequestedArea(asms[0].builtUpArea);
      }
    } catch (e) {
      console.error('Error loading reassessments:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, preselectedAssessmentId]);

  useEffect(() => {
    loadData();

    const handleStorageUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'civictax_reassessments' || e.type === 'civictax_data_reset') {
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

  const handleAssessmentChange = (id: string) => {
    setAssessmentId(id);
    const match = assessments.find((a) => a.id === id);
    if (match) setRequestedArea(match.builtUpArea);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const asm = assessments.find((a) => a.id === assessmentId);
    if (!asm) {
      error('Assessment Required', 'Please select a valid assessment bill to request reassessment.');
      return;
    }

    if (requestedArea <= 0) {
      error('Invalid Area', 'Requested built-up area must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await services.reassessmentService.createReassessment({
        assessmentId: asm.id,
        assessmentNumber: asm.assessmentNumber,
        propertyId: asm.propertyId,
        propertyNumber: asm.propertyNumber,
        citizenId: currentUser.id,
        citizenName: currentUser.name,
        currentBuiltUpArea: asm.builtUpArea,
        requestedBuiltUpArea: requestedArea,
        currentCategory: asm.category,
        requestedCategory: asm.category,
        currentTotalTax: asm.totalTax,
        reason,
        documentReference: docRef,
      });

      success('Reassessment Appeal Registered', `Request ${created.requestNumber} logged for review.`);
      setIsModalOpen(false);
      setReason('');
      setDocRef('');
      loadData();
    } catch (err: any) {
      error('Request Failed', err.message);
    } finally {
      setIsSubmitting(false);
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
      key: 'propertyNumber',
      header: 'Property & Assessment',
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-xs font-mono">
            {item.propertyNumber}
          </span>
          <div className="text-[11px] text-slate-400 font-mono">
            Bill: {item.assessmentNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'currentBuiltUpArea',
      header: 'Current vs Requested Area',
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
            setSelectedRequest(item);
          }}
          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property Tax Reassessment Requests"
        subtitle="Submit rectification appeals for area alterations, demolitions, or category changes."
        breadcrumbs={[{ label: 'Dashboard', path: '/citizen/dashboard' }, { label: 'Reassessments' }]}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            File Reassessment Appeal
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={requests}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        emptyTitle="No reassessment requests"
        emptyDescription="You have not submitted any property tax reassessment appeals."
        emptyAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            File First Reassessment
          </button>
        }
        onRowClick={(item) => setSelectedRequest(item)}
      />

      {/* New Reassessment Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400 flex items-center justify-center font-bold">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    File Reassessment Request
                  </h3>
                  <p className="text-xs text-slate-400">Statutory Tax Modification Appeal</p>
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
                  Select Assessment Bill *
                </label>
                <select
                  value={assessmentId}
                  onChange={(e) => handleAssessmentChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.assessmentNumber} ({a.propertyNumber} • FY {a.assessmentYear}) — Current: {a.builtUpArea} sq.ft
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Requested Built-up Area (Sq.Ft) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={requestedArea}
                  onChange={(e) => setRequestedArea(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supporting Document Reference (Sanctioned Plan / Demolition NOC) *
                </label>
                <input
                  type="text"
                  required
                  value={docRef}
                  onChange={(e) => setDocRef(e.target.value)}
                  placeholder="e.g. DOC-DEMOLITION-NOC-2024-819"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Reassessment Appeal *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe the structural reduction, vacancy, or measurement dispute in detail..."
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {selectedRequest.requestNumber}
                  </h3>
                  <StatusBadge status={selectedRequest.status} size="sm" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Property: {selectedRequest.propertyNumber} • Assessment: {selectedRequest.assessmentNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl">
                <div>
                  <span className="text-slate-400">Current Area:</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedRequest.currentBuiltUpArea} sq.ft
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Requested Area:</span>
                  <p className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {selectedRequest.requestedBuiltUpArea} sq.ft
                  </p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold">Supporting Document:</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedRequest.documentReference}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 font-semibold">Applicant Statement:</span>
                <p className="text-slate-700 dark:text-slate-200 mt-1">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.officerComments && (
                <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60">
                  <span className="text-blue-700 dark:text-blue-300 font-bold">Officer Review Remark:</span>
                  <p className="text-slate-700 dark:text-slate-200 mt-1">{selectedRequest.officerComments}</p>
                  {selectedRequest.reviewedByOfficerName && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Reviewed by {selectedRequest.reviewedByOfficerName} on {formatDate(selectedRequest.reviewDate)}
                    </p>
                  )}
                </div>
              )}

              {selectedRequest.revisedAssessmentId && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 flex items-center justify-between">
                  <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
                    ✓ Revised Assessment Created
                  </span>
                  <Link
                    to="/citizen/assessments"
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-300 underline"
                  >
                    View Bill →
                  </Link>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedRequest(null)}
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
