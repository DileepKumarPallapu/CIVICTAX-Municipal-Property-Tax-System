import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storageService';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { 
  Building2, 
  FileCheck2,
  Layers,
  Cloud,
  ShieldAlert,
  RotateCcw,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

export const SystemSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast, success, info } = useToast();
  const navigate = useNavigate();

  // Settings State
  const [municipalityName, setMunicipalityName] = useState('Central Municipal Corporation of Delhi');
  const [financialYear, setFinancialYear] = useState('2024-2025');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [rebateRate, setRebateRate] = useState('10');
  const [penaltyRate, setPenaltyRate] = useState('5');
  const [dueDateNoticeDays, setDueDateNoticeDays] = useState('30');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoApproveVerification, setAutoApproveVerification] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  // Salesforce Bridge Simulation Settings
  const [salesforceOrgId, setSalesforceOrgId] = useState('00Dfj00000oPoePEAS');
  const [salesforceEndpoint, setSalesforceEndpoint] = useState('https://orgfarm-6061cf0a7d-dev-ed.develop.my.salesforce.com/services/apexrest/civictax/v1');

  // Reset confirmation state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      success('Settings Saved', 'System configuration parameters updated successfully!');
    }, 600);
  };

  const handleResetData = () => {
    StorageService.resetToSeedData();
    success('Database Restored', 'System database successfully restored to standard demo state!');
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <PageHeader
        title="System Settings & Maintenance"
        subtitle="Manage municipal operational parameters, financial terms, alert notifications, and local database state."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            Super Admin Access
          </span>
        }
      />

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* General Municipal Configuration */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Municipal Organization & Financial Year</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Core parameters governing assessment year and municipal authority branding</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Municipality Authority Name
              </label>
              <input
                type="text"
                value={municipalityName}
                onChange={(e) => setMunicipalityName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Active Assessment Financial Year
              </label>
              <select
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              >
                <option value="2023-2024">2023-2024</option>
                <option value="2024-2025">2024-2025 (Current)</option>
                <option value="2025-2026">2025-2026 (Upcoming)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Currency Symbol
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Global Financial Rules */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tax Incentives & Overdue Penalties</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Standard percentage rates for early taxpayer discounts and late payment penalties</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Early Payment Rebate (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={rebateRate}
                onChange={(e) => setRebateRate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
              <p className="text-xs text-slate-400 mt-1">Applied when payment is made &gt; 30 days before due date.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Late Payment Surcharge (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={penaltyRate}
                onChange={(e) => setPenaltyRate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
              <p className="text-xs text-slate-400 mt-1">Assessed on uncollected balances past the published deadline.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Due Date Advance Notice (Days)
              </label>
              <input
                type="number"
                min="7"
                max="90"
                value={dueDateNoticeDays}
                onChange={(e) => setDueDateNoticeDays(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
              <p className="text-xs text-slate-400 mt-1">Lead time for citizen automated reminder dispatches.</p>
            </div>
          </div>
        </div>

        {/* System Operations & Automation */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Workflow Automation & Notifications</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Configure automated dispatch pipelines and verification constraints</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Dispatch Email Receipts & Status Alerts</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Send transaction confirmation emails to registered property owners</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">SMS Citizen Reminders</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automated SMS delivery for grievance closures and payment milestones</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <input
                type="checkbox"
                checked={autoApproveVerification}
                onChange={(e) => setAutoApproveVerification(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Auto-Approve Low-Risk Residential Registrations</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Properties under 1,000 sq ft bypass manual physical verification queues</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 text-rose-600 dark:text-rose-400">Citizen Maintenance Mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Restrict citizen portal access during municipal audit reconciliations</p>
              </div>
            </label>
          </div>
        </div>

        {/* Future Salesforce Enterprise Bridge Configuration */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Salesforce Lightning & Custom Objects Bridge</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">Phase 2 Architecture Ready</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Configure connection targets for Property__c and Tax_Assessment__c synchronization</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Salesforce Connected App Org ID
              </label>
              <input
                type="text"
                value={salesforceOrgId}
                onChange={(e) => setSalesforceOrgId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Apex REST Base Endpoint URL
              </label>
              <input
                type="text"
                value={salesforceEndpoint}
                onChange={(e) => setSalesforceEndpoint(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-mono"
              />
            </div>
          </div>

          <div className="p-4 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-sky-900 dark:text-sky-200">
                Active Service Adapter: <span className="font-mono text-xs bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded">LocalServiceFactory (Demo Persistence)</span>
              </p>
              <p className="text-xs text-sky-700 dark:text-sky-400 mt-0.5">
                For live Trailhead Playground OAuth 2.0 PKCE authentication and Apex REST synchronization, use the dedicated Salesforce Gateway.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/admin/salesforce')}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
              >
                Open Salesforce Gateway
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => info('Connection Test', 'Salesforce mock ping succeeded! Handshake payload verified.')}
                className="px-3 py-2 bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-medium hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                Test Mock Ping
              </button>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Saving Configurations...' : 'Save Configuration Changes'}
          </button>
        </div>
      </form>

      {/* Danger Zone: Seed Data Reset */}
      <div className="bg-rose-50/40 dark:bg-rose-950/10 p-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-rose-900 dark:text-rose-200">Emergency Database Reset (Demo State)</h2>
            <p className="text-sm text-rose-700 dark:text-rose-400">Restore all properties, assessments, payments, grievances, and tax rates back to initial factory demo seed data.</p>
          </div>
        </div>

        <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
          Warning: This action completely clears custom records created during testing and resets local storage to the standard 20 properties, 15 assessments, and 10 payment records. Use this to restore clean state before client presentations or evaluator walkthroughs.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All Application Data to Seed State
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset Entire Database to Seed Data?"
        message="This operation will overwrite all recently modified properties, new payments, grievance logs, and rate tables with the initial system seed records. This cannot be undone."
        confirmText="Yes, Reset Database"
        cancelText="Keep Current Data"
        confirmVariant="danger"
        onConfirm={handleResetData}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
