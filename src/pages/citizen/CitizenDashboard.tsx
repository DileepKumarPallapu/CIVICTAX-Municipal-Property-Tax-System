import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  CreditCard,
  PlusCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { services } from '../../services/serviceFactory';
import {
  CitizenDashboardStats,
  Property,
  TaxAssessment,
  Payment,
  Notification,
} from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils';
import { ReceiptViewer } from '../../components/common/ReceiptViewer';

export const CitizenDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<CitizenDashboardStats>({
    totalProperties: 0,
    verifiedProperties: 0,
    pendingVerification: 0,
    totalTaxDue: 0,
    totalTaxPaid: 0,
    upcomingDueCount: 0,
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [assessments, setAssessments] = useState<TaxAssessment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);

    try {
      const [statsData, propsData, asmsData, paysData, notifsData] = await Promise.all([
        services.dashboardService.getCitizenStats(currentUser.id),
        services.propertyService.getProperties({ ownerId: currentUser.id }),
        services.assessmentService.getAssessments({ ownerId: currentUser.id }),
        services.paymentService.getPayments({ payerId: currentUser.id }),
        services.notificationService.getNotifications(currentUser.id, 'CITIZEN'),
      ]);

      setStats(statsData);
      setProperties(propsData);
      setAssessments(asmsData);
      setPayments(paysData);
      setNotifications(notifsData.slice(0, 4));
    } catch (e) {
      console.error('Error loading citizen dashboard:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadDashboardData();

    const handleStorageUpdate = () => {
      loadDashboardData();
    };

    window.addEventListener('civictax_storage_update', handleStorageUpdate);
    window.addEventListener('civictax_data_reset', handleStorageUpdate);
    return () => {
      window.removeEventListener('civictax_storage_update', handleStorageUpdate);
      window.removeEventListener('civictax_data_reset', handleStorageUpdate);
    };
  }, [loadDashboardData]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title={`Welcome, ${currentUser?.name?.split(' ')[0] || 'Taxpayer'}`}
        subtitle="Manage your registered properties, track tax assessments, and settle municipal dues."
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/citizen/register-property"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Register Property
            </Link>
            <Link
              to="/citizen/payments"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <CreditCard className="w-4 h-4" />
              Pay Tax Now
            </Link>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Properties"
          value={stats.totalProperties}
          subtitle="Registered in your name"
          icon={Building2}
          color="navy"
          isLoading={isLoading}
          onClick={() => navigate('/citizen/my-properties')}
        />
        <StatCard
          title="Verified"
          value={stats.verifiedProperties}
          subtitle="Cleared by inspector"
          icon={CheckCircle2}
          color="emerald"
          isLoading={isLoading}
          onClick={() => navigate('/citizen/my-properties')}
        />
        <StatCard
          title="Pending Verification"
          value={stats.pendingVerification}
          subtitle="Awaiting site survey"
          icon={Clock}
          color="amber"
          isLoading={isLoading}
          onClick={() => navigate('/citizen/my-properties')}
        />
        <StatCard
          title="Total Tax Due"
          value={formatCurrency(stats.totalTaxDue)}
          subtitle="Current outstanding"
          icon={AlertCircle}
          color="rose"
          isLoading={isLoading}
          onClick={() => navigate('/citizen/assessments')}
        />
        <StatCard
          title="Total Tax Paid"
          value={formatCurrency(stats.totalTaxPaid)}
          subtitle="Settled in current ledger"
          icon={Receipt}
          color="teal"
          isLoading={isLoading}
          onClick={() => navigate('/citizen/payments')}
        />
        <StatCard
          title="Due Deadlines"
          value={stats.upcomingDueCount}
          subtitle="Assessments with balance"
          icon={TrendingUp}
          color="blue"
          isLoading={isLoading}
          onClick={() => navigate('/citizen/assessments')}
        />
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Quick Civic Operations
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Link
            to="/citizen/register-property"
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/60 dark:border-slate-800 text-xs font-bold flex flex-col items-center gap-2 text-center transition"
          >
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <span>Register Property</span>
          </Link>
          <Link
            to="/citizen/assessments"
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-800 text-xs font-bold flex flex-col items-center gap-2 text-center transition"
          >
            <Receipt className="w-5 h-5 text-indigo-600" />
            <span>View Assessments</span>
          </Link>
          <Link
            to="/citizen/payments"
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/60 dark:border-slate-800 text-xs font-bold flex flex-col items-center gap-2 text-center transition"
          >
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>Pay Property Tax</span>
          </Link>
          <Link
            to="/citizen/reassessments"
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200/60 dark:border-slate-800 text-xs font-bold flex flex-col items-center gap-2 text-center transition"
          >
            <RefreshCw className="w-5 h-5 text-teal-600" />
            <span>Request Reassessment</span>
          </Link>
          <Link
            to="/citizen/grievances"
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200/60 dark:border-slate-800 text-xs font-bold flex flex-col items-center gap-2 text-center transition"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Raise Grievance</span>
          </Link>
        </div>
      </div>

      {/* Main Content Grid: Assessments & Properties */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Recent Assessments & Properties */}
        <div className="lg:col-span-8 space-y-8">
          {/* Recent Assessments Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Current Tax Assessments
                </h3>
                <p className="text-xs text-slate-400">
                  Annual property tax liabilities calculated for your holdings
                </p>
              </div>
              <Link
                to="/citizen/assessments"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {assessments.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                No tax assessments issued yet. Register and verify your property to generate tax records.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {assessments.slice(0, 3).map((asm) => (
                  <div key={asm.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                          {asm.assessmentNumber}
                        </span>
                        <StatusBadge status={asm.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {asm.propertyNumber} • FY {asm.assessmentYear} • Due {formatDate(asm.dueDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Outstanding</div>
                        <div className={`text-sm font-extrabold ${asm.outstandingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {formatCurrency(asm.outstandingBalance)}
                        </div>
                      </div>

                      {asm.outstandingBalance > 0 ? (
                        <Link
                          to={`/citizen/payments?assessmentId=${asm.id}`}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                        >
                          Pay
                        </Link>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium">
                          Settled
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Properties Overview */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  My Registered Properties
                </h3>
                <p className="text-xs text-slate-400">
                  Residential, commercial, and industrial property titles
                </p>
              </div>
              <Link
                to="/citizen/my-properties"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                Manage
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {properties.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                No properties registered. Click &quot;Register Property&quot; to begin.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.slice(0, 4).map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                        {prop.propertyNumber}
                      </span>
                      <StatusBadge status={prop.verificationStatus} size="sm" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                      {prop.address}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200/50 dark:border-slate-800">
                      <span>{prop.category} • {prop.builtUpArea} sq.ft</span>
                      <span>Built {prop.constructionYear}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Payment History & Notifications */}
        <div className="lg:col-span-4 space-y-8">
          {/* Recent Payments Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Payment History
                </h3>
                <p className="text-xs text-slate-400">Recent tax transaction receipts</p>
              </div>
              <Link
                to="/citizen/payments"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                All
              </Link>
            </div>

            {payments.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.slice(0, 3).map((pay) => (
                  <div key={pay.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {formatCurrency(pay.amountPaid)}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {pay.receiptNumber} • {pay.paymentMethod}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedReceiptPayment(pay)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      title="View Receipt"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Receipt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Notifications */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Alerts
              </h3>
              <Link
                to="/citizen/notifications"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                View
              </Link>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                No recent alerts.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(notif.timestamp)}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official Receipt Viewer Modal */}
      <ReceiptViewer
        payment={selectedReceiptPayment}
        isOpen={!!selectedReceiptPayment}
        onClose={() => setSelectedReceiptPayment(null)}
      />
    </div>
  );
};
