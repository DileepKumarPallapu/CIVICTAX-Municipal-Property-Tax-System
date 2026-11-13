import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'teal' | 'emerald' | 'amber' | 'rose' | 'navy' | 'indigo';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
  onClick,
  isLoading = false,
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-[#405CF5] dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-900/40',
      hoverGlow: 'hover:border-[#405CF5]/40',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/50',
      hoverGlow: 'hover:border-blue-400/40',
    },
    teal: {
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      text: 'text-[#13A58B] dark:text-teal-400',
      border: 'border-teal-100 dark:border-teal-900/50',
      hoverGlow: 'hover:border-teal-400/40',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/50',
      hoverGlow: 'hover:border-emerald-400/40',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/50',
      hoverGlow: 'hover:border-amber-400/40',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-100 dark:border-rose-900/50',
      hoverGlow: 'hover:border-rose-400/40',
    },
    navy: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-800 dark:text-slate-200',
      border: 'border-slate-200 dark:border-slate-700',
      hoverGlow: 'hover:border-slate-400/40',
    },
  };

  const selectedColor = colorMap[color] || colorMap.indigo;

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`relative p-5 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-card transition-all ${
        selectedColor.hoverGlow
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate tracking-wide">
            {title}
          </p>
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
          ) : (
            <h3 className="text-2xl font-extrabold text-[#101D32] dark:text-white tracking-tight truncate">
              {value}
            </h3>
          )}
          {subtitle && (
            <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 ${selectedColor.bg} ${selectedColor.text} border ${selectedColor.border}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-semibold">
          <span
            className={
              trend.isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }
          >
            {trend.value}
          </span>
          <span className="text-[11px] text-slate-400 font-normal">vs previous period</span>
        </div>
      )}
    </motion.div>
  );
};
