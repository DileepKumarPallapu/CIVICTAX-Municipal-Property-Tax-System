import React from 'react';
import {
  PropertyVerificationStatus,
  AssessmentStatus,
  PaymentStatus,
  GrievanceStatus,
  GrievancePriority,
  ReassessmentStatus,
} from '../../types';

interface StatusBadgeProps {
  status:
    | PropertyVerificationStatus
    | AssessmentStatus
    | PaymentStatus
    | GrievanceStatus
    | GrievancePriority
    | ReassessmentStatus
    | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = (val: string) => {
    switch (val) {
      // Verified / Paid / Approved / Success / Resolved
      case 'VERIFIED':
      case 'PAID':
      case 'APPROVED':
      case 'SUCCESS':
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';

      // Pending / Under Review / Submitted / Partially Paid
      case 'PENDING':
      case 'UNDER_REVIEW':
      case 'SUBMITTED':
      case 'PARTIALLY_PAID':
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';

      // Warning / Overdue / Resubmission / Medium
      case 'RESUBMISSION_REQUIRED':
      case 'OVERDUE':
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';

      // Rejected / Failed / Critical / High
      case 'REJECTED':
      case 'FAILED':
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';

      // Low / Draft
      case 'LOW':
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const formatText = (val: string) => {
    return val.replace(/_/g, ' ');
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-medium rounded-full border transition-colors ${
        sizeClasses[size]
      } ${getBadgeStyle(status)}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {formatText(status)}
    </span>
  );
};
