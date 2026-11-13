import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Building2,
  Receipt,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

interface DemoStep {
  id: number;
  title: string;
  role: string;
  targetUrl: string;
  objective: string;
  instructions: string[];
  verificationCriteria: string;
}

export const FacultyDemoMode: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const navigate = useNavigate();
  const { success } = useToast();

  const demoSteps: DemoStep[] = [
    {
      id: 1,
      title: 'Demo 1: Property Registration',
      role: 'CITIZEN',
      targetUrl: '/citizen/register-property',
      objective: 'Demonstrate self-service parcel registration with deed validation and duplicate detection.',
      instructions: [
        'Navigate to citizen property registration.',
        'Fill built-up area and document deed reference.',
        'Submit to verify automatic status PENDING assignment.',
      ],
      verificationCriteria: 'Property appears in My Properties with status PENDING and audit log recorded.',
    },
    {
      id: 2,
      title: 'Demo 2: Property Verification',
      role: 'OFFICER',
      targetUrl: '/officer/verification',
      objective: 'Demonstrate municipal officer field inspection triage and deed approval.',
      instructions: [
        'Switch to Officer account (Zone 1).',
        'Open Assigned Properties / Verification queue.',
        'Inspect deed reference and click "Approve Registration".',
      ],
      verificationCriteria: 'Status updates to VERIFIED and unlocks annual tax assessment generation.',
    },
    {
      id: 3,
      title: 'Demo 3: Tax Assessment Generation',
      role: 'OFFICER',
      targetUrl: '/officer/assessments',
      objective: 'Demonstrate formula-driven assessment generation using active gazette rates.',
      instructions: [
        'In Officer Assessments, select the verified property.',
        'Generate assessment for FY 2024-25.',
        'Verify formula: Base Tax = Built-up Area × Rate per Sq Ft.',
      ],
      verificationCriteria: 'New assessment bill issued with status APPROVED and outstanding balance.',
    },
    {
      id: 4,
      title: 'Demo 4: Simulated Payment & Receipt',
      role: 'CITIZEN',
      targetUrl: '/citizen/payments',
      objective: 'Demonstrate multi-channel online tax settlement and printable e-challan generation.',
      instructions: [
        'Open Citizen Payment Portal.',
        'Select assessment with outstanding balance.',
        'Complete simulated payment via UPI / Net Banking.',
      ],
      verificationCriteria: 'Balance reduced, status set to PAID/PARTIALLY_PAID, official receipt generated.',
    },
    {
      id: 5,
      title: 'Demo 5: Citizen Grievance Redressal',
      role: 'CITIZEN',
      targetUrl: '/citizen/grievances',
      objective: 'Demonstrate 5-stage grievance logging and resolution workflow.',
      instructions: [
        'Lodge a billing grievance as citizen.',
        'Switch to Officer portal to assign and resolve grievance.',
        'Confirm citizen sees official resolution timestamp.',
      ],
      verificationCriteria: 'Grievance timeline displays transition: SUBMITTED -> ASSIGNED -> RESOLVED.',
    },
    {
      id: 6,
      title: 'Demo 6: Reassessment Dispute',
      role: 'CITIZEN',
      targetUrl: '/citizen/reassessments',
      objective: 'Demonstrate traceable reassessment dispute without overwriting historical records.',
      instructions: [
        'Submit reassessment claim for revised area.',
        'Officer reviews and approves dispute.',
        'Confirm revised assessment (-R) is generated.',
      ],
      verificationCriteria: 'Original assessment preserved; revised bill issued transparently.',
    },
    {
      id: 7,
      title: 'Demo 7: Administrator Revenue Analytics',
      role: 'ADMIN',
      targetUrl: '/admin/analytics',
      objective: 'Demonstrate corporation-wide financial intelligence and zone comparisons.',
      instructions: [
        'Open Administrator Analytics.',
        'Inspect real-time collection efficiency and category yield.',
        'Filter by municipal zone.',
      ],
      verificationCriteria: 'Visualizations derive from actual stored payment and property records.',
    },
    {
      id: 8,
      title: 'Demo 8: Municipal Report & Audit Ledger',
      role: 'ADMIN',
      targetUrl: '/admin/audit',
      objective: 'Demonstrate immutable audit trail and sanitized CSV export.',
      instructions: [
        'Open Municipal Audit Ledger.',
        'Verify every previous action was recorded with timestamp.',
        'Export sanitized CSV report.',
      ],
      verificationCriteria: 'Audit entries match all executed demo operations with CSV formula protection.',
    },
  ];

  const handleExecuteStep = (step: DemoStep) => {
    navigate(step.targetUrl);
    if (!completedSteps.includes(step.id)) {
      setCompletedSteps([...completedSteps, step.id]);
    }
    success(`Demo Mode Activated`, `Navigated to ${step.title}. Follow the guided checklist!`);
  };

  const handleResetDemoState = () => {
    StorageService.resetToSeedData();
    setCompletedSteps([]);
    setActiveStep(1);
    success('Demo Reset', 'Application database restored to factory seed state.');
  };

  return (
    <>
      {/* Floating Demo Mode Pill */}
      <div className="fixed top-20 right-6 z-40 hidden md:block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <GraduationCap className="w-4 h-4" />
          <span>Faculty Demo Guide ({completedSteps.length}/8)</span>
        </button>
      </div>

      {/* Guided Walkthrough Drawer / Modal */}
      {isOpen && (
        <div className="fixed top-28 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] max-h-[80vh] bg-white dark:bg-[#101D32] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          {/* Header */}
          <div className="p-4 bg-amber-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              <div>
                <h3 className="text-xs font-bold leading-tight">Faculty Evaluation Demo Guide</h3>
                <p className="text-[10px] text-amber-100">8 Guided Steps for Live Presentation</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-amber-100 hover:text-white transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Steps List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {demoSteps.map((s) => {
              const isCompleted = completedSteps.includes(s.id);
              const isCurrent = activeStep === s.id;

              return (
                <div
                  key={s.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-[#405CF5] bg-indigo-50/40 dark:bg-indigo-950/20'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#19283D]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{s.title}</span>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {s.role}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {s.objective}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setActiveStep(s.id);
                        handleExecuteStep(s);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#405CF5] hover:bg-[#324BD9] text-white font-bold text-[11px] transition cursor-pointer shadow-xs"
                    >
                      <span>Launch Step {s.id}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <span className="text-[10px] text-slate-400 font-medium">
                      {isCompleted ? 'Verified ✓' : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Reset */}
          <div className="p-3 bg-slate-50 dark:bg-[#19283D] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">CivicTax 5.0 Faculty Demo Engine</span>
            <button
              onClick={handleResetDemoState}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[10px] font-bold transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
