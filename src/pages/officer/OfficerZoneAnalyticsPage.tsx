import React, { useState, useEffect } from 'react';
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
import { BarChart3, TrendingUp, PieChart as PieIcon, Layers } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { services } from '../../services/serviceFactory';
import { formatCurrency } from '../../utils';

const COLORS = ['#2563EB', '#0F9D8A', '#F59E0B', '#8B5CF6'];

export const OfficerZoneAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<{
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

  useEffect(() => {
    services.dashboardService.getRevenueAnalytics().then((res) => {
      setData(res);
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Zone Revenue & Property Analytics"
        subtitle="Visual assessment and collection metrics derived directly from stored municipal payment records."
        breadcrumbs={[{ label: 'Officer Desk', path: '/officer/dashboard' }, { label: 'Zone Analytics' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Municipal Collections (₹)
              </h3>
              <p className="text-xs text-slate-400">Aggregated revenue from verified tax payments</p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Collection']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Pie Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Category Revenue
              </h3>
              <p className="text-xs text-slate-400">Share by property category</p>
            </div>
            <PieIcon className="w-5 h-5 text-teal-600" />
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryRevenue}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={4}
                >
                  {data.categoryRevenue.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
    </div>
  );
};
