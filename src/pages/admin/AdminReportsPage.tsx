import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, Download, Printer, Filter, Search, FileText } from 'lucide-react';
import { services } from '../../services/serviceFactory';
import { Property, TaxAssessment, Payment, Grievance, ReassessmentRequest, MunicipalZone } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { formatCurrency, formatDate, exportToCSV } from '../../utils';
import { useToast } from '../../context/ToastContext';

type ReportType =
  | 'PROPERTY_REGISTRATION'
  | 'PROPERTY_VERIFICATION'
  | 'ANNUAL_ASSESSMENT'
  | 'PAYMENT_COLLECTION'
  | 'OUTSTANDING_TAX'
  | 'ZONE_REVENUE'
  | 'CATEGORY_SUMMARY'
  | 'GRIEVANCE_AUDIT'
  | 'REASSESSMENT_AUDIT';

export const AdminReportsPage: React.FC = () => {
  const { success } = useToast();
  const [reportType, setReportType] = useState<ReportType>('PAYMENT_COLLECTION');

  const [properties, setProperties] = useState<Property[]>([]);
  const [assessments, setAssessments] = useState<TaxAssessment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [reassessments, setReassessments] = useState<ReassessmentRequest[]>([]);
  const [zones, setZones] = useState<MunicipalZone[]>([]);

  // Filter state
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');

  useEffect(() => {
    Promise.all([
      services.propertyService.getProperties(),
      services.assessmentService.getAssessments(),
      services.paymentService.getPayments(),
      services.grievanceService.getGrievances(),
      services.reassessmentService.getReassessments(),
      services.zoneService.getZones(),
    ]).then(([pr, as, py, gr, re, zn]) => {
      setProperties(pr);
      setAssessments(as);
      setPayments(py);
      setGrievances(gr);
      setReassessments(re);
      setZones(zn);
    });
  }, []);

  // Safe CSV export with formula sanitization
  const handleExportCSV = (tableData: Record<string, any>[], filename: string) => {
    // Sanitize formula injection
    const sanitized = tableData.map((row) => {
      const cleanRow: Record<string, any> = {};
      for (const [k, v] of Object.entries(row)) {
        if (typeof v === 'string' && /^[=+\-@\t\r]/.test(v)) {
          cleanRow[k] = `'${v}`; // prepend apostrophe to neutralize formula
        } else {
          cleanRow[k] = v;
        }
      }
      return cleanRow;
    });

    exportToCSV(sanitized, filename);
    success('Export Completed', `Report downloaded successfully.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Statutory Reports & Data Audits"
        subtitle="Generate certified CSV data reports and printable audit sheets across all municipal operational areas."
        breadcrumbs={[{ label: 'Admin Console', path: '/admin/dashboard' }, { label: 'Reports' }]}
        actions={
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition no-print"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        }
      />

      {/* Report Selector Tabs */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap gap-2 no-print">
        <button
          onClick={() => setReportType('PAYMENT_COLLECTION')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            reportType === 'PAYMENT_COLLECTION'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Payment Collections
        </button>

        <button
          onClick={() => setReportType('ANNUAL_ASSESSMENT')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            reportType === 'ANNUAL_ASSESSMENT'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Annual Assessments
        </button>

        <button
          onClick={() => setReportType('OUTSTANDING_TAX')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            reportType === 'OUTSTANDING_TAX'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Outstanding Arrears
        </button>

        <button
          onClick={() => setReportType('PROPERTY_REGISTRATION')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            reportType === 'PROPERTY_REGISTRATION'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Property Master
        </button>

        <button
          onClick={() => setReportType('GRIEVANCE_AUDIT')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            reportType === 'GRIEVANCE_AUDIT'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Grievance Audit
        </button>

        <button
          onClick={() => setReportType('REASSESSMENT_AUDIT')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            reportType === 'REASSESSMENT_AUDIT'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Reassessments
        </button>
      </div>

      {/* Render Current Selected Report */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
        {reportType === 'PAYMENT_COLLECTION' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Payment Collection & Treasury Inflow Audit
                </h3>
                <p className="text-xs text-slate-400">Total verified transactions: {payments.length}</p>
              </div>
              <button
                onClick={() =>
                  handleExportCSV(
                    payments.map((p) => ({
                      'Receipt': p.receiptNumber,
                      'Txn ID': p.transactionId,
                      'Property': p.propertyNumber,
                      'Payer': p.payerName,
                      'Amount Paid': p.amountPaid,
                      'Method': p.paymentMethod,
                      'Date': p.paymentDate,
                    })),
                    'CivicTax_Payment_Collections'
                  )
                }
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition no-print shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Receipt No</th>
                    <th className="p-3">Txn Reference</th>
                    <th className="p-3">Property</th>
                    <th className="p-3">Taxpayer</th>
                    <th className="p-3">Channel</th>
                    <th className="p-3 text-right">Amount Credited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3 font-mono font-bold">{p.receiptNumber}</td>
                      <td className="p-3 font-mono text-slate-400">{p.transactionId}</td>
                      <td className="p-3 font-mono">{p.propertyNumber}</td>
                      <td className="p-3 font-medium">{p.payerName}</td>
                      <td className="p-3">{p.paymentMethod}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        {formatCurrency(p.amountPaid)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'ANNUAL_ASSESSMENT' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Annual Property Tax Assessment Roll
                </h3>
                <p className="text-xs text-slate-400">Total assessments issued: {assessments.length}</p>
              </div>
              <button
                onClick={() =>
                  handleExportCSV(
                    assessments.map((a) => ({
                      'Assessment No': a.assessmentNumber,
                      'Property No': a.propertyNumber,
                      'Owner': a.ownerName,
                      'Category': a.category,
                      'Area': a.builtUpArea,
                      'Rate': a.appliedRatePerSqFt,
                      'Total Tax': a.totalTax,
                      'Paid': a.amountPaid,
                      'Outstanding': a.outstandingBalance,
                      'Status': a.status,
                    })),
                    'CivicTax_Assessments_Roll'
                  )
                }
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition no-print shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Bill No</th>
                    <th className="p-3">Property</th>
                    <th className="p-3">Taxpayer</th>
                    <th className="p-3">Area</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3">Total Tax</th>
                    <th className="p-3">Paid</th>
                    <th className="p-3">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assessments.map((a) => (
                    <tr key={a.id}>
                      <td className="p-3 font-mono font-bold">{a.assessmentNumber}</td>
                      <td className="p-3 font-mono">{a.propertyNumber}</td>
                      <td className="p-3">{a.ownerName}</td>
                      <td className="p-3">{a.builtUpArea} sq.ft</td>
                      <td className="p-3">₹{a.appliedRatePerSqFt}</td>
                      <td className="p-3 font-bold">{formatCurrency(a.totalTax)}</td>
                      <td className="p-3 text-emerald-600 font-semibold">{formatCurrency(a.amountPaid)}</td>
                      <td className="p-3 font-bold text-amber-600">{formatCurrency(a.outstandingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'OUTSTANDING_TAX' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Outstanding Municipal Arrears Report
                </h3>
                <p className="text-xs text-slate-400">
                  Assessments with active non-zero balances
                </p>
              </div>
              <button
                onClick={() =>
                  handleExportCSV(
                    assessments
                      .filter((a) => a.outstandingBalance > 0)
                      .map((a) => ({
                        'Assessment': a.assessmentNumber,
                        'Property': a.propertyNumber,
                        'Taxpayer': a.ownerName,
                        'Due Date': a.dueDate,
                        'Outstanding Amount': a.outstandingBalance,
                        'Status': a.status,
                      })),
                    'CivicTax_Outstanding_Arrears'
                  )
                }
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition no-print shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Assessment</th>
                    <th className="p-3">Property</th>
                    <th className="p-3">Taxpayer</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Outstanding Dues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assessments
                    .filter((a) => a.outstandingBalance > 0)
                    .map((a) => (
                      <tr key={a.id}>
                        <td className="p-3 font-mono font-bold">{a.assessmentNumber}</td>
                        <td className="p-3 font-mono">{a.propertyNumber}</td>
                        <td className="p-3">{a.ownerName}</td>
                        <td className="p-3">{formatDate(a.dueDate)}</td>
                        <td className="p-3">{a.status}</td>
                        <td className="p-3 text-right font-extrabold text-amber-600">
                          {formatCurrency(a.outstandingBalance)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'PROPERTY_REGISTRATION' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Property Master Register
                </h3>
                <p className="text-xs text-slate-400">Total parcels registered: {properties.length}</p>
              </div>
              <button
                onClick={() =>
                  handleExportCSV(
                    properties.map((p) => ({
                      'Property No': p.propertyNumber,
                      'Owner': p.ownerName,
                      'Category': p.category,
                      'Area': p.builtUpArea,
                      'Zone': p.zoneName,
                      'Status': p.verificationStatus,
                    })),
                    'CivicTax_Property_Register'
                  )
                }
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition no-print shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Property No</th>
                    <th className="p-3">Taxpayer</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Area</th>
                    <th className="p-3">Zone</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {properties.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3 font-mono font-bold">{p.propertyNumber}</td>
                      <td className="p-3">{p.ownerName}</td>
                      <td className="p-3">{p.category}</td>
                      <td className="p-3">{p.builtUpArea} sq.ft</td>
                      <td className="p-3">{p.zoneName}</td>
                      <td className="p-3">{p.verificationStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'GRIEVANCE_AUDIT' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Grievance & Citizen Dispute Audit
                </h3>
                <p className="text-xs text-slate-400">Total complaints lodged: {grievances.length}</p>
              </div>
              <button
                onClick={() =>
                  handleExportCSV(
                    grievances.map((g) => ({
                      'Grievance No': g.grievanceNumber,
                      'Property': g.propertyNumber,
                      'Citizen': g.citizenName,
                      'Category': g.category,
                      'Priority': g.priority,
                      'Status': g.status,
                      'Assignee': g.assignedOfficerName,
                      'Date': g.submissionDate,
                    })),
                    'CivicTax_Grievance_Audit'
                  )
                }
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition no-print shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Grievance No</th>
                    <th className="p-3">Property</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Citizen</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {grievances.map((g) => (
                    <tr key={g.id}>
                      <td className="p-3 font-mono font-bold">{g.grievanceNumber}</td>
                      <td className="p-3 font-mono">{g.propertyNumber}</td>
                      <td className="p-3 line-clamp-1">{g.subject}</td>
                      <td className="p-3">{g.citizenName}</td>
                      <td className="p-3">{g.priority}</td>
                      <td className="p-3">{g.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'REASSESSMENT_AUDIT' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reassessment Modification Appeals
                </h3>
                <p className="text-xs text-slate-400">Total appeals: {reassessments.length}</p>
              </div>
              <button
                onClick={() =>
                  handleExportCSV(
                    reassessments.map((r) => ({
                      'Request No': r.requestNumber,
                      'Property': r.propertyNumber,
                      'Bill': r.assessmentNumber,
                      'Citizen': r.citizenName,
                      'Current Area': r.currentBuiltUpArea,
                      'Requested Area': r.requestedBuiltUpArea,
                      'Status': r.status,
                    })),
                    'CivicTax_Reassessment_Audit'
                  )
                }
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition no-print shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Appeal No</th>
                    <th className="p-3">Property</th>
                    <th className="p-3">Citizen</th>
                    <th className="p-3">Original Area</th>
                    <th className="p-3">Requested Area</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reassessments.map((r) => (
                    <tr key={r.id}>
                      <td className="p-3 font-mono font-bold">{r.requestNumber}</td>
                      <td className="p-3 font-mono">{r.propertyNumber}</td>
                      <td className="p-3">{r.citizenName}</td>
                      <td className="p-3">{r.currentBuiltUpArea} sq.ft</td>
                      <td className="p-3 font-bold text-blue-600">{r.requestedBuiltUpArea} sq.ft</td>
                      <td className="p-3">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
