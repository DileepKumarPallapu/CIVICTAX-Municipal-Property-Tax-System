import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { services } from '../../services/serviceFactory';
import {
  OfficerDashboardStats,
  Property,
  Grievance,
  ReassessmentRequest,
} from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../utils';

export const OfficerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState<OfficerDashboardStats>({
    totalAssignedProperties: 0,
    pendingVerification: 0,
    approvedProperties: 0,
    pendingAssessments: 0,
    pendingReassessments: 0,
    openGrievances: 0,
  });

  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [openGrievances, setOpenGrievances] = useState<Grievance[]>([]);
  const [pendingReassessments, setPendingReassessments] = useState<ReassessmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick verification modal
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [verificationComment, setVerificationComment] = useState('Ground survey and sanctioned layout plans verified on site.');
  const [isVerifying, setIsVerifying] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);

    try {
      const [statsData, propsData, grvData, reassessData] = await Promise.all([
        services.dashboardService.getOfficerStats(currentUser.id, currentUser.zoneId),
        services.propertyService.getProperties({ verificationStatus: 'PENDING' }),
        services.grievanceService.getGrievances(),
        services.reassessmentService.getReassessments(),
      ]);

      setStats(statsData);
      setPendingProperties(propsData.slice(0, 5));
      setOpenGrievances(grvData.filter((g) => g.status !== 'RESOLVED' && g.status !== 'REJECTED').slice(0, 4));
      setPendingReassessments(reassessData.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').slice(0, 3));
    } catch (e) {
      console.error('Error loading officer dashboard:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();

    const handleStorageUpdate = () => loadData();
    window.addEventListener('civictax_storage_update', handleStorageUpdate);
    window.addEventListener('civictax_data_reset', handleStorageUpdate);
    return () => {
      window.removeEventListener('civictax_storage_update', handleStorageUpdate);
      window.removeEventListener('civictax_data_reset', handleStorageUpdate);
    };
  }, [loadData]);

  const handleApproveProperty = async (prop: Property) => {
    if (!currentUser) return;
    setIsVerifying(true);
    try {
      await services.propertyService.verifyProperty(
        prop.id,
        'VERIFIED',
        currentUser.id,
        currentUser.name,
        verificationComment || 'Inspected and certified by revenue officer.'
      );
      success('Property Approved', `${prop.propertyNumber} verified and certified.`);
      setSelectedProperty(null);
      loadData();
    } catch (err: any) {
      error('Approval Failed', err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRejectProperty = async (prop: Property) => {
    if (!currentUser) return;
    setIsVerifying(true);
    try {
      await services.propertyService.verifyProperty(
        prop.id,
        'REJECTED',
        currentUser.id,
        currentUser.name,
        verificationComment || 'Deed plan mismatch or unauthorized construction.'
      );
      success('Property Rejected', `${prop.propertyNumber} marked as rejected.`);
      setSelectedProperty(null);
      loadData();
    } catch (err: any) {
      error('Rejection Failed', err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Officer Desk • ${currentUser?.name || 'Revenue Officer'}`}
        subtitle={`${currentUser?.designation || 'Revenue Inspector'} | ${currentUser?.zoneName || 'Municipal Corporation'}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/officer/property-verification"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <FileCheck className="w-4 h-4" />
              Verification Queue ({stats.pendingVerification})
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Assigned Parcels"
          value={stats.totalAssignedProperties}
          subtitle="Jurisdiction properties"
          icon={Building2}
          color="navy"
          isLoading={isLoading}
          onClick={() => navigate('/officer/assigned-properties')}
        />
        <StatCard
          title="Pending Verification"
          value={stats.pendingVerification}
          subtitle="Action required"
          icon={Clock}
          color="amber"
          isLoading={isLoading}
          onClick={() => navigate('/officer/property-verification')}
        />
        <StatCard
          title="Approved Properties"
          value={stats.approvedProperties}
          subtitle="Certified titles"
          icon={CheckCircle2}
          color="emerald"
          isLoading={isLoading}
          onClick={() => navigate('/officer/assigned-properties')}
        />
        <StatCard
          title="Open Grievances"
          value={stats.openGrievances}
          subtitle="Citizen complaints"
          icon={AlertTriangle}
          color="rose"
          isLoading={isLoading}
          onClick={() => navigate('/officer/grievances')}
        />
        <StatCard
          title="Pending Reassessments"
          value={stats.pendingReassessments}
          subtitle="Tax adjustment appeals"
          icon={RefreshCw}
          color="teal"
          isLoading={isLoading}
          onClick={() => navigate('/officer/reassessments')}
        />
        <StatCard
          title="Assessment Drafts"
          value={stats.pendingAssessments}
          subtitle="Ready for signoff"
          icon={Receipt}
          color="blue"
          isLoading={isLoading}
          onClick={() => navigate('/officer/assessments')}
        />
      </div>

      {/* Main Grid: Pending Approvals & Open Grievances */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left (7 cols): Properties Awaiting Verification */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pending Property Registrations
              </h3>
              <p className="text-xs text-slate-400">Applications awaiting site inspection and verification</p>
            </div>
            <Link
              to="/officer/property-verification"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All ({stats.pendingVerification})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingProperties.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
              ✓ All property registrations in your queue have been verified.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingProperties.map((prop) => (
                <div key={prop.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                        {prop.propertyNumber}
                      </span>
                      <StatusBadge status={prop.verificationStatus} size="sm" />
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold mt-1">
                      {prop.ownerName} • {prop.builtUpArea} sq.ft ({prop.category})
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {prop.address} • Deed: {prop.documentReference}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedProperty(prop);
                        setVerificationComment('Verified after site inspection and layout drawing authentication.');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Review & Decide
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right (5 cols): Active Grievances & Reassessments */}
        <div className="lg:col-span-5 space-y-6">
          {/* Grievance Triage Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Active Grievances
                </h3>
                <p className="text-xs text-slate-400">Citizen complaints needing response</p>
              </div>
              <Link to="/officer/grievances" className="text-xs font-bold text-blue-600">
                All
              </Link>
            </div>

            {openGrievances.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                No open citizen grievances.
              </div>
            ) : (
              <div className="space-y-3">
                {openGrievances.map((g) => (
                  <div
                    key={g.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                        {g.grievanceNumber}
                      </span>
                      <StatusBadge status={g.priority} size="sm" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {g.subject}
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                      <span>By {g.citizenName}</span>
                      <Link
                        to="/officer/grievances"
                        className="font-bold text-blue-600 hover:underline"
                      >
                        Investigate →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Reassessments Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reassessment Appeals
                </h3>
                <p className="text-xs text-slate-400">Structural modification claims</p>
              </div>
              <Link to="/officer/reassessments" className="text-xs font-bold text-blue-600">
                All
              </Link>
            </div>

            {pendingReassessments.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                No pending reassessment requests.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingReassessments.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                        {r.requestNumber}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {r.propertyNumber} • {r.currentBuiltUpArea} → {r.requestedBuiltUpArea} sq.ft
                      </p>
                    </div>
                    <Link
                      to="/officer/reassessments"
                      className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 text-xs font-bold"
                    >
                      Audit
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review & Verification Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                  {selectedProperty.propertyNumber}
                </h3>
                <p className="text-xs text-slate-400">Revenue Inspection Decision</p>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
              <p><strong>Owner:</strong> {selectedProperty.ownerName}</p>
              <p><strong>Address:</strong> {selectedProperty.address}</p>
              <p><strong>Category & Area:</strong> {selectedProperty.category} • {selectedProperty.builtUpArea} sq.ft</p>
              <p><strong>Deed Number:</strong> <span className="font-mono">{selectedProperty.documentReference}</span></p>
              <p><strong>Zone:</strong> {selectedProperty.zoneName}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Inspection Verification Remarks *
              </label>
              <textarea
                rows={3}
                value={verificationComment}
                onChange={(e) => setVerificationComment(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              ></textarea>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleRejectProperty(selectedProperty)}
                disabled={isVerifying}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <X className="w-4 h-4" />
                Reject Application
              </button>

              <button
                onClick={() => handleApproveProperty(selectedProperty)}
                disabled={isVerifying}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
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
