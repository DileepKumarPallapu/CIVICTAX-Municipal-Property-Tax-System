import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatDateTime } from '../../utils';
import { GrievanceTimelineEvent } from '../../types';

interface ProgressTimelineProps {
  events: GrievanceTimelineEvent[];
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return <p className="text-xs text-slate-400">No activity recorded yet.</p>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {events.map((evt, idx) => {
        const isLatest = idx === events.length - 1;
        const isResolved = evt.status === 'RESOLVED';
        const isRejected = evt.status === 'REJECTED';

        return (
          <div key={idx} className="relative flex items-start group">
            {/* Dot / Icon */}
            <div
              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 ${
                isResolved
                  ? 'bg-emerald-500 text-white'
                  : isRejected
                  ? 'bg-rose-500 text-white'
                  : isLatest
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {isResolved ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : isRejected ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
            </div>

            {/* Content card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 w-full transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {evt.status.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-slate-400">
                  {formatDateTime(evt.timestamp)}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {evt.comment}
              </p>
              <div className="mt-2 text-[10px] text-slate-400">
                Action by: <span className="font-semibold text-slate-600 dark:text-slate-300">{evt.updatedBy}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
