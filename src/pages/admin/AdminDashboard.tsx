import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Percent,
  MapPin,
  Users,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { services } from '../../services/serviceFactory';
import { AdminDashboardStats } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { PageHeader } from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils';

const PIE_COLORS = ['#405CF5', '#13A58B', '#F59E0B', '#8B5CF6'];

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminDashboardStats>({
    totalRegisteredProperties: 0,
    verifiedProperties: 0,
    pendingVerification: 0,
    totalTaxAssessed: 0,
    totalRevenueCollected: 0,
    outstandingTax: 0,
    totalGrievances: 0,
    pendingReassessments: 0,
  });

  const [analytics, setAnalytics] = useState<{
    monthlyRevenue: Array<{ month: string; amount: number; transactions: number }>;
    zoneRevenue: Array<{ zone: string; amount: number; percentage: number }>;
    categoryRevenue: Array<{ category: string; amount: number }>;
    paymentMethodDistribution: Array<{ method: string; count: number; amount: number }>;
  }>({
    monthlyRevenue: [],
    zoneRevenue: [],
    categoryRevenue: [],
    paymentMethodDistribution: [],
  });

  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsData, analyticsData] = await Promise.all([
        services.dashboardService.getAdminStats(),
        services.dashboardService.getRevenueAnalytics(),
      ]);

      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (e) {
      console.error('Error loading admin dashboard:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Municipal Administration & Revenue Console"
        subtitle="Corporation-wide property tax assessment oversight, treasury monitoring, and zone analytics."
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/admin/tax-rates"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Percent className="w-4 h-4" />
              Configure Tax Rates
            </Link>
            <Link
              to="/admin/reports"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Audit Reports
            </Link>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Properties"
          value={stats.totalRegisteredProperties}
          subtitle={`${stats.verifiedProperties} verified • ${stats.pendingVerification} pending`}
          icon={Building2}
          color="navy"
          isLoading={isLoading}
          onClick={() => navigate('/admin/properties')}
        />
        <StatCard
          title="Total Tax Assessed"
          value={formatCurrency(stats.totalTaxAssessed)}
          subtitle="Cumulative annual assessments"
          icon={Receipt}
          color="blue"
          isLoading={isLoading}
          onClick={() => navigate('/admin/assessments')}
        />
        <StatCard
          title="Revenue Collected"
          value={formatCurrency(stats.totalRevenueCollected)}
          subtitle="Cleared into municipal treasury"
          icon={TrendingUp}
          color="emerald"
          isLoading={isLoading}
          onClick={() => navigate('/admin/payments')}
        />
        <StatCard
          title="Outstanding Tax"
          value={formatCurrency(stats.outstandingTax)}
          subtitle="Active municipal receivables"
          icon={AlertCircle}
          color="rose"
          isLoading={isLoading}
          onClick={() => navigate('/admin/assessments')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Verified Titles"
          value={stats.verifiedProperties}
          subtitle="Inspected by field officers"
          icon={CheckCircle2}
          color="teal"
          isLoading={isLoading}
          onClick={() => navigate('/admin/properties')}
        />
        <StatCard
          title="Pending Inspections"
          value={stats.pendingVerification}
          subtitle="Parcels in verification triage"
          icon={Clock}
          color="amber"
          isLoading={isLoading}
          onClick={() => navigate('/admin/properties')}
        />
        <StatCard
          title="Public Grievances"
          value={stats.totalGrievances}
          subtitle="Citizen billing inquiries"
          icon={AlertTriangle}
          color="rose"
          isLoading={isLoading}
          onClick={() => navigate('/admin/grievances')}
        />
        <StatCard
          title="Reassessments"
          value={stats.pendingReassessments}
          subtitle="Appeals awaiting resolution"
          icon={RefreshCw}
          color="blue"
          isLoading={isLoading}
          onClick={() => navigate('/admin/reports')}
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Municipal Revenue Collection (₹)
              </h3>
              <p className="text-xs text-slate-400">Total tax received per month across all wards</p>
            </div>
            <Link to="/admin/analytics" className="text-xs font-bold text-blue-600">
              Detailed Analytics →
            </Link>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Collection']}
                  contentStyle={{ backgroundColor: '#101D32', borderColor: '#19283D', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#405CF5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone Distribution Pie Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Revenue by Zone
              </h3>
              <p className="text-xs text-slate-400">Zonal treasury contribution</p>
            </div>
            <MapPin className="w-5 h-5 text-teal-600" />
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.zoneRevenue}
                  dataKey="amount"
                  nameKey="zone"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {analytics.zoneRevenue.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value) || 0)}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Access Action Deck */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          to="/admin/users"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600">User Management</h4>
          <p className="text-xs text-slate-400">Manage taxpayers and verification officers</p>
        </Link>

        <Link
          to="/admin/zones"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600">Municipal Zones</h4>
          <p className="text-xs text-slate-400">Configure wards, revenue targets, and assignees</p>
        </Link>

        <Link
          to="/admin/tax-rates"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600">Tax Rate Schedules</h4>
          <p className="text-xs text-slate-400">Configure base unit area tariffs per sq.ft</p>
        </Link>

        <Link
          to="/admin/reports"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600">Export & Reports</h4>
          <p className="text-xs text-slate-400">Download CSV audit logs and statutory filings</p>
        </Link>
      </div>
    </div>
  );
};
