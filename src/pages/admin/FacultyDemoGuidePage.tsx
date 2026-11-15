import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { useToast } from '../../context/ToastContext';
import { StorageService } from '../../services/storageService';
import {
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Building2,
  FileCheck2,
  Receipt,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface DemoStep {
  id: number;
  title: string;
  role: 'CITIZEN' | 'OFFICER' | 'ADMIN';
  targetUrl: string;
  objective: string;
  instructions: string[];
  verificationCriteria: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const FacultyDemoGuidePage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('civictax_demo_completed_steps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const demoSteps: DemoStep[] = [
    {
      id: 1,
      title: 'Demo 1: Self-Service Property Registration',
      role: 'CITIZEN',
      targetUrl: '/citizen/register-property',
      icon: Building2,
      objective: 'Demonstrate citizen self-service parcel registration with deed validation and duplicate detection.',
      instructions: [
        'Open the citizen property registration form.',
        'Enter property category, built-up area (sq ft), and deed reference number.',
        'Submit the registration and verify automatic assignment of status PENDING.',
      ],
      verificationCriteria: 'Property appears in "My Properties" with status PENDING and an immutable audit log record is created.',
    },
    {
      id: 2,
      title: 'Demo 2: Field Verification & Deed Approval',
      role: 'OFFICER',
      targetUrl: '/officer/verification',
      icon: FileCheck2,
      objective: 'Demonstrate municipal officer field inspection queue, physical verification, and deed approval.',
      instructions: [
        'Switch to Municipal Officer portal (Assigned Properties / Verification).',
        'Review the submitted property deed and parcel dimensions.',
        'Click "Approve Registration" to certify the property.',
      ],
      verificationCriteria: 'Status updates to VERIFIED, unlocking annual tax assessment generation for the parcel.',
    },
    {
      id: 3,
      title: 'Demo 3: Formula-Driven Tax Assessment Generation',
      role: 'OFFICER',
      targetUrl: '/officer/assessments',
      icon: Receipt,
      objective: 'Demonstrate formula-driven municipal property tax computation using gazette rate tables.',
      instructions: [
        'In Officer Assessments, select the verified property.',
        'Generate an assessment for the current financial year.',
        'Verify formula: Base Tax = Built-up Area × Zonal Category Rate.',
      ],
      verificationCriteria: 'Official tax bill issued with status APPROVED, calculating total tax demand and due date notice.',
    },
    {
      id: 4,
      title: 'Demo 4: Multi-Channel Simulated Payment & E-Challan',
      role: 'CITIZEN',
      targetUrl: '/citizen/payments',
      icon: CreditCard,
      objective: 'Demonstrate digital treasury checkout simulation (UPI / Net Banking) and printable e-challan receipt.',
      instructions: [
        'Open Citizen Payment Portal.',
        'Select the assessment with outstanding demand.',
        'Complete simulated payment via UPI, Card, or Net Banking.',
      ],
      verificationCriteria: 'Outstanding balance reduces to zero, status transitions to PAID, and official printable receipt is generated.',
    },
    {
      id: 5,
      title: 'Demo 5: 5-Stage Citizen Grievance Redressal',
      role: 'CITIZEN',
      targetUrl: '/citizen/grievances',
      icon: AlertTriangle,
      objective: 'Demonstrate citizen grievance docket creation, SLA tracking, and officer resolution workflow.',
      instructions: [
        'Lodge a billing/measurement grievance from the citizen portal.',
        'Open Officer portal to review and triage the grievance.',
        'Submit official resolution notes and confirm citizen timeline updates.',
      ],
      verificationCriteria: 'Grievance progress timeline displays complete transition: SUBMITTED -> ASSIGNED -> RESOLVED with resolution timestamps.',
    },
    {
      id: 6,
      title: 'Demo 6: Reassessment Dispute & Delta Calculation',
      role: 'CITIZEN',
      targetUrl: '/citizen/reassessments',
      icon: RefreshCw,
      objective: 'Demonstrate non-destructive reassessment claims without overwriting historical financial ledgers.',
      instructions: [
        'Submit a reassessment dispute for revised built-up area.',
        'Officer audits the supporting documentation and approves dispute.',
        'Confirm a revised assessment bill is issued while preserving original historical record.',
      ],
      verificationCriteria: 'Original assessment is preserved in audit ledger; revised assessment (-R) is transparently generated.',
    },
    {
      id: 7,
      title: 'Demo 7: Municipal Revenue Analytics & GIS Intelligence',
      role: 'ADMIN',
      targetUrl: '/admin/analytics',
      icon: BarChart3,
      objective: 'Demonstrate municipal executive financial analytics, zone-by-zone collections, and GIS spatial intelligence.',
      instructions: [
        'Open Administrator Revenue Analytics and Municipal GIS Map.',
        'Inspect real-time collection efficiency, category yield, and overdue recovery queues.',
        'Filter by municipal zone (North, South, East, West).',
      ],
      verificationCriteria: 'Charts and spatial visualizations derive dynamically from actual stored database records.',
    },
    {
      id: 8,
      title: 'Demo 8: Statutory Audit Ledger & Sanitized CSV Export',
      role: 'ADMIN',
      targetUrl: '/admin/audit',
      icon: FileSpreadsheet,
      objective: 'Demonstrate immutable audit trail, CSV formula sanitization, and compliance certification.',
      instructions: [
        'Open Municipal Audit Ledger.',
        'Verify that all actions executed in Demos 1-7 are timestamped and logged.',
        'Export sanitized CSV report (prevention of formula injection attacks).',
      ],
      verificationCriteria: 'Audit entries match all executed actions with SHA-verified integrity and complete traceability.',
    },
  ];

  const handleToggleComplete = (id: number) => {
    let updated: number[];
    if (completedSteps.includes(id)) {
      updated = completedSteps.filter((s) => s !== id);
    } else {
      updated = [...completedSteps, id];
    }
    setCompletedSteps(updated);
    try {
      localStorage.setItem('civictax_demo_completed_steps', JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const handleLaunchStep = (step: DemoStep) => {
    if (!completedSteps.includes(step.id)) {
      handleToggleComplete(step.id);
    }
    success('Navigating to Workflow', `Opening ${step.title}. Follow the criteria below!`);
    navigate(step.targetUrl);
  };

  const handleResetData = () => {
    if (confirm('Restore application database to standard factory seed data?')) {
      StorageService.resetToSeedData();
      setCompletedSteps([]);
      try {
        localStorage.removeItem('civictax_demo_completed_steps');
      } catch {
        // Ignore
      }
      success('Database Restored', 'All demo properties, assessments, and payments reset to clean baseline.');
    }
  };

  const progressPercent = Math.round((completedSteps.length / demoSteps.length) * 100);

  const getRoleBadge = (role: 'CITIZEN' | 'OFFICER' | 'ADMIN') => {
    switch (role) {
      case 'CITIZEN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Citizen Portal
          </span>
        );
      case 'OFFICER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            Municipal Officer
          </span>
        );
      case 'ADMIN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            Administrator
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-6xl pb-12">
      <PageHeader
        title="Faculty Evaluation & Viva Defense Guide"
        subtitle="Standard 8-step live examination and presentation walkthrough of the CivicTax Property Tax Management System."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            Evaluation Mode
          </span>
        }
      />

      {/* Progress & Reset Control Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Workflow Verification Progress: {completedSteps.length} of {demoSteps.length} Steps Validated ({progressPercent}%)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Follow each guided step below to verify end-to-end municipal tax workflows during faculty viva assessment.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo Database
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 8 Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {demoSteps.map((step) => {
          const isDone = completedSteps.includes(step.id);
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className={`rounded-2xl border p-6 transition-all duration-200 flex flex-col justify-between ${
                isDone
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isDone
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {step.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        {getRoleBadge(step.role)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleComplete(step.id)}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isDone
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    title={isDone ? 'Mark as Pending' : 'Mark as Verified'}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${isDone ? 'fill-emerald-600 text-white dark:fill-emerald-500' : ''}`} />
                  </button>
                </div>

                {/* Objective */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {step.objective}
                </p>

                {/* Instructions */}
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Step Instructions
                  </span>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {step.instructions.map((inst, idx) => (
                      <li key={idx} className="leading-snug">
                        {inst}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Verification Criteria */}
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-700 dark:text-slate-300">Verification: </strong>
                    {step.verificationCriteria}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
                <span className="text-[11px] font-mono font-medium text-slate-400">
                  Target: {step.targetUrl}
                </span>
                <button
                  onClick={() => handleLaunchStep(step)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
                >
                  <span>Launch Workflow</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
