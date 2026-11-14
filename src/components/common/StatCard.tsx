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
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-[#2563EB] dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/40',
      hoverGlow: 'hover:border-[#2563EB]/40',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/50',
      hoverGlow: 'hover:border-blue-400/40',
    },
    teal: {
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      text: 'text-[#0D9488] dark:text-[#14B8A6]',
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
      bg: 'bg-slate-100 dark:bg-[#17243A]',
      text: 'text-slate-800 dark:text-slate-200',
      border: 'border-slate-200 dark:border-[#26354B]',
      hoverGlow: 'hover:border-slate-400/40',
    },
  };

  const selectedColor = colorMap[color] || colorMap.indigo;

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      onClick={onClick}
      className={`relative p-5 rounded-2xl bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#26354B] shadow-sm hover:shadow-card transition-all ${
        selectedColor.hoverGlow
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate tracking-wide">
            {title}
          </p>
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-200 dark:bg-[#17243A] animate-pulse rounded-lg" />
          ) : (
            <h3 className="text-2xl font-extrabold text-[#172033] dark:text-[#F8FAFC] tracking-tight truncate">
              {value}
            </h3>
          )}
          {subtitle && (
            <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate font-medium">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${selectedColor.bg} ${selectedColor.text} border ${selectedColor.border}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#26354B]/80 flex items-center gap-1.5 text-xs font-semibold">
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
