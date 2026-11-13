import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Building2, Receipt, CreditCard, AlertTriangle, RefreshCw, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ServicesPage: React.FC = () => {
  const servicesList = [
    {
      title: 'Digital Property Registration',
      description: 'Comprehensive workflow for entering property coordinates, ward information, built-up dimensions, and deed records for verification.',
      icon: Building2,
      path: '/citizen/register-property',
      highlights: ['Automated Parcel CT-PROP ID Generation', 'Deed Reference Uniqueness Check', 'Site Inspection Status Tracking'],
    },
    {
      title: 'Automated Tax Assessment',
      description: 'Transparent calculations linking active municipal tariffs to verified property built-up area, with early rebate & penalty support.',
      icon: Receipt,
      path: '/citizen/assessments',
      highlights: ['Configurable Rate Schedules', 'Precision Arithmetic', 'Annual Challan Generation'],
    },
    {
      title: 'Simulated Payment Portal',
      description: 'Interactive simulated gateway supporting UPI, Net Banking, and Cards with instant ledger credit and downloadable e-receipts.',
      icon: CreditCard,
      path: '/citizen/payments',
      highlights: ['Full & Partial Installment Support', 'Official Watermarked Receipts', 'Outstanding Balance Tracking'],
    },
    {
      title: 'Public Grievance Redressal',
      description: 'Lodge formal complaints regarding incorrect billing, name corrections, or payment reconciliation with SLA tracking.',
      icon: AlertTriangle,
      path: '/citizen/grievances',
      highlights: ['Officer Assignment', 'Step-by-Step Progress Timeline', 'Resolution Auditing'],
    },
    {
      title: 'Statutory Reassessment Requests',
      description: 'File modification appeals for partial demolition, vacancy remissions, or commercial-to-residential reclassification.',
      icon: RefreshCw,
      path: '/citizen/reassessments',
      highlights: ['Traceable Revised Assessment Creation', 'Historical Rate Preservation', 'Inspection Remark Log'],
    },
    {
      title: 'Citizen Notification Center',
      description: 'Real-time alerts for verified registrations, new assessments, payment acknowledgments, and approaching due dates.',
      icon: FileText,
      path: '/citizen/notifications',
      highlights: ['Instant Event Triggers', 'Unread Tracking', 'One-Click Action Links'],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <PageHeader
        title="Civic Services Directory"
        subtitle="Explore all digital citizen and municipal officer capabilities available on the CivicTax platform."
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Services' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {servicesList.map((srv, idx) => {
          const Icon = srv.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mb-5 border border-blue-100 dark:border-blue-900/40">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {srv.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  {srv.description}
                </p>

                <div className="space-y-2 mb-6">
                  {srv.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to={srv.path}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 text-xs font-bold transition-all text-slate-700 dark:text-slate-200 w-fit"
              >
                Access Service Portal
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
