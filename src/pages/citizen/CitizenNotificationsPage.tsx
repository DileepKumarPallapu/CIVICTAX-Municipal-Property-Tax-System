import React from 'react';
import { CheckCheck, Trash2, Home, FileText, CreditCard, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useNotifications } from '../../context/NotificationContext';
import { formatDateTime } from '../../utils';
import { NotificationCategory } from '../../types';
import { useNavigate } from 'react-router-dom';

export const CitizenNotificationsPage: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotifications();
  const navigate = useNavigate();

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'PROPERTY':
        return <Home className="w-4 h-4 text-blue-500" />;
      case 'ASSESSMENT':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'GRIEVANCE':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'REASSESSMENT':
        return <RefreshCw className="w-4 h-4 text-teal-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Notifications & Activity Log"
        subtitle="Chronological feed of municipal property registrations, assessments, payment receipts, and grievance updates."
        breadcrumbs={[{ label: 'Dashboard', path: '/citizen/dashboard' }, { label: 'Notifications' }]}
        actions={
          unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5 transition border border-blue-200 dark:border-blue-900"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All as Read
            </button>
          )
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No notifications available in your account.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                markAsRead(n.id);
                if (n.linkUrl) navigate(n.linkUrl);
              }}
              className={`p-5 transition-colors flex items-start gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                n.isRead ? 'bg-transparent' : 'bg-blue-50/40 dark:bg-blue-950/20'
              }`}
            >
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 mt-0.5">
                {getCategoryIcon(n.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <h4
                    className={`text-sm font-bold ${
                      n.isRead ? 'text-slate-800 dark:text-slate-200' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {n.title}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {formatDateTime(n.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {n.message}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => deleteNotification(n.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
