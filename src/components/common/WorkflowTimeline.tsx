import React from 'react';
import { CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';

export interface WorkflowStep {
  label: string;
  subLabel?: string;
  status: 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'REJECTED';
  timestamp?: string;
  actor?: string;
}

interface WorkflowTimelineProps {
  title?: string;
  steps: WorkflowStep[];
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ title, steps }) => {
  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
      {title && (
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          {title}
        </h4>
      )}

      <div className="relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
          {steps.map((st, idx) => {
            const isLast = idx === steps.length - 1;

            return (
              <div key={idx} className="flex-1 flex sm:flex-col items-center gap-3 w-full sm:w-auto relative group">
                {/* Connecting Line (Desktop) */}
                {!isLast && (
                  <div
                    className={`hidden sm:block absolute top-4 left-1/2 w-full h-0.5 -z-0 transition-colors ${
                      st.status === 'COMPLETED'
                        ? 'bg-emerald-500'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}

                {/* Node Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-transform group-hover:scale-105 shadow-xs ${
                    st.status === 'COMPLETED'
                      ? 'bg-emerald-500 text-white'
                      : st.status === 'CURRENT'
                      ? 'bg-[#405CF5] text-white ring-4 ring-indigo-100 dark:ring-indigo-950/60'
                      : st.status === 'REJECTED'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {st.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : st.status === 'CURRENT' ? (
                    <Clock className="w-4 h-4 animate-spin-slow" />
                  ) : st.status === 'REJECTED' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>

                {/* Details */}
                <div className="sm:text-center">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{st.label}</p>
                  {st.subLabel && (
                    <p className="text-[10px] text-slate-400 max-w-[130px] sm:mx-auto truncate">
                      {st.subLabel}
                    </p>
                  )}
                  {st.timestamp && (
                    <p className="text-[9px] font-mono text-slate-400 mt-0.5">{st.timestamp}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
