import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StorageService } from '../../services/storageService';
import { StatCard } from '../../components/common/StatCard';
import { formatCurrency } from '../../utils';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  CreditCard,
  RefreshCw,
  TrendingUp,
  MapPin,
  Filter,
  Layers,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const MunicipalCommandCenter: React.FC = () => {
  const [properties, setProperties] = useState(StorageService.getProperties());
  const [assessments, setAssessments] = useState(StorageService.getAssessments());
  const [payments, setPayments] = useState(StorageService.getPayments());
  const [grievances, setGrievances] = useState(StorageService.getGrievances());
  const [zones, setZones] = useState(StorageService.getZones());

  // Interactive Filter States
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('2024-2025');

  useEffect(() => {
    const handleUpdate = () => {
      setProperties(StorageService.getProperties());
      setAssessments(StorageService.getAssessments());
      setPayments(StorageService.getPayments());
      setGrievances(StorageService.getGrievances());
      setZones(StorageService.getZones());
    };

    window.addEventListener('civictax_storage_update', handleUpdate);
    window.addEventListener('civictax_data_reset', handleUpdate);
    return () => {
      window.removeEventListener('civictax_storage_update', handleUpdate);
      window.removeEventListener('civictax_data_reset', handleUpdate);
    };
  }, []);

  // Filtered dataset calculations
  const filteredProperties = properties.filter((p) => {
    const matchZone = selectedZone === 'ALL' || p.zoneId === selectedZone;
    const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchZone && matchCategory;
  });

  const filteredAssessments = assessments.filter((a) => {
    const matchZone = selectedZone === 'ALL' || a.zoneId === selectedZone;
    const matchCategory = selectedCategory === 'ALL' || a.category === selectedCategory;
    const matchYear = selectedYear === 'ALL' || a.assessmentYear === selectedYear;
    return matchZone && matchCategory && matchYear;
  });

  // Financial Metrics
  const totalAssessed = filteredAssessments.reduce((sum, a) => sum + a.totalTax, 0);
  const totalCollected = filteredAssessments.reduce((sum, a) => sum + a.amountPaid, 0);
  const totalOutstanding = Math.max(0, totalAssessed - totalCollected);
  const collectionEfficiency = totalAssessed > 0 ? Math.round((totalCollected / totalAssessed) * 100) : 0;

  // Operational Counts
  const verifiedCount = filteredProperties.filter((p) => p.verificationStatus === 'VERIFIED').length;
  const pendingCount = filteredProperties.filter((p) => p.verificationStatus === 'PENDING').length;
  const openGrievances = grievances.filter((g) => g.status !== 'RESOLVED').length;
  const overdueCount = filteredAssessments.filter((a) => a.status === 'OVERDUE').length;

  // Category Yield Data for Chart
  const categoryYield = [
    {
      name: 'Residential',
      revenue: filteredAssessments
        .filter((a) => a.category === 'RESIDENTIAL')
        .reduce((sum, a) => sum + a.amountPaid, 0),
    },
    {
      name: 'Commercial',
      revenue: filteredAssessments
        .filter((a) => a.category === 'COMMERCIAL')
        .reduce((sum, a) => sum + a.amountPaid, 0),
    },
    {
      name: 'Industrial',
      revenue: filteredAssessments
        .filter((a) => a.category === 'INDUSTRIAL')
        .reduce((sum, a) => sum + a.amountPaid, 0),
    },
  ];

  const PIE_COLORS = ['#405CF5', '#13A58B', '#F59E0B'];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Municipal Operations Command Center"
        subtitle="Real-time corporation oversight, fiscal collection intelligence, zone workload velocity, and assessment distribution."
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#405CF5]/10 text-[#405CF5] border border-[#405CF5]/20 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CivicTax 5.0 Executive Command</span>
          </span>
        }
      />

      {/* Multi-Filter Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-[#405CF5]" />
          <span>Command Center Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
          >
            <option value="2024-2025">FY 2024-2025 (Active)</option>
            <option value="2023-2024">FY 2023-2024</option>
            <option value="ALL">All Financial Years</option>
          </select>

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
          >
            <option value="ALL">All Municipal Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
          >
            <option value="ALL">All Property Categories</option>
            <option value="RESIDENTIAL">Residential Only</option>
            <option value="COMMERCIAL">Commercial Only</option>
            <option value="INDUSTRIAL">Industrial Only</option>
          </select>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Gross Assessed"
          value={formatCurrency(totalAssessed)}
          subtitle="Annual tax levied on active parcels"
          icon={Receipt}
          color="indigo"
        />
        <StatCard
          title="Revenue Collected"
          value={formatCurrency(totalCollected)}
          subtitle={`Collection Efficiency: ${collectionEfficiency}%`}
          icon={CreditCard}
          color="emerald"
          trend={{ value: `${collectionEfficiency}%`, isPositive: collectionEfficiency >= 75 }}
        />
        <StatCard
          title="Outstanding Dues"
          value={formatCurrency(totalOutstanding)}
          subtitle={`${overdueCount} assessments past deadline`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Registered Parcels"
          value={filteredProperties.length}
          subtitle={`${verifiedCount} verified, ${pendingCount} in audit`}
          icon={Building2}
          color="blue"
        />
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Revenue Performance by Category */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Revenue Collection by Property Classification (₹)
              </h3>
              <p className="text-xs text-slate-400">Total simulated collections realized in selected period</p>
            </div>
            <BarChart3 className="w-5 h-5 text-[#405CF5]" />
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryYield}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Collection']}
                  contentStyle={{
                    backgroundColor: '#101D32',
                    borderColor: '#19283D',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" fill="#405CF5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone Operations & Grievance Workload */}
        <div className="lg:col-span-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Zone Operational Workload
          </h3>

          <div className="space-y-4">
            {zones.map((z) => {
              const zoneProps = properties.filter((p) => p.zoneId === z.id);
              const zoneAssessments = assessments.filter((a) => a.zoneId === z.id);
              const zoneCollected = zoneAssessments.reduce((sum, a) => sum + a.amountPaid, 0);

              return (
                <div key={z.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#19283D] border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900 dark:text-white truncate">{z.name}</span>
                    <span className="font-mono font-bold text-[#13A58B]">{formatCurrency(zoneCollected)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Officer: {z.officerInChargeName.split(' ')[0]}</span>
                    <span>{zoneProps.length} Registered Properties</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
