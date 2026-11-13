import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StorageService } from '../../services/storageService';
import { AuditLogEntry } from '../../types';
import { ShieldCheck, History, Search, Download, Filter, UserCheck, Calendar } from 'lucide-react';
import { exportToCSV } from '../../utils';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedRecordType, setSelectedRecordType] = useState<string>('ALL');

  useEffect(() => {
    setLogs(StorageService.getAuditLogs());

    const handleUpdate = () => {
      setLogs(StorageService.getAuditLogs());
    };
    window.addEventListener('civictax_storage_update', handleUpdate);
    window.addEventListener('civictax_data_reset', handleUpdate);
    return () => {
      window.removeEventListener('civictax_storage_update', handleUpdate);
      window.removeEventListener('civictax_data_reset', handleUpdate);
    };
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recordId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRole === 'ALL' || log.actorRole === selectedRole;
    const matchesType = selectedRecordType === 'ALL' || log.recordType === selectedRecordType;

    return matchesSearch && matchesRole && matchesType;
  });

  const handleExport = () => {
    exportToCSV(filteredLogs, 'civictax_audit_trail');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Audit Trail & Security Ledger"
        subtitle="Immutable-style historical ledger tracking administrative approvals, tax rate modifications, citizen filings, and treasury settlements."
        actions={
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit Ledger CSV</span>
          </button>
        }
      />

      {/* Filter Toolbar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-80">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search action, actor, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-[#405CF5]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Administrators</option>
            <option value="OFFICER">Municipal Officers</option>
            <option value="CITIZEN">Citizens</option>
          </select>

          <select
            value={selectedRecordType}
            onChange={(e) => setSelectedRecordType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
          >
            <option value="ALL">All Record Types</option>
            <option value="PROPERTY">Properties</option>
            <option value="ASSESSMENT">Assessments</option>
            <option value="PAYMENT">Payments</option>
            <option value="GRIEVANCE">Grievances</option>
            <option value="REASSESSMENT">Reassessments</option>
            <option value="TAX_RATE">Tax Rates</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-[#101D32] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#19283D]/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Role</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target Record</th>
                <th className="p-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No matching audit log records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-[#19283D]/40 transition">
                    <td className="p-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                      {log.actorName}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.actorRole === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            : log.actorRole === 'OFFICER'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap font-mono font-semibold text-[#405CF5]">
                      {log.action}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {log.recordType}: {log.recordId}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 max-w-md">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
