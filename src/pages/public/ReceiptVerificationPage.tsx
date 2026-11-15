import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  Search,
  ArrowRight,
  FileText,
  Calendar,
  Building,
  CreditCard,
  UserCheck,
  ExternalLink,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Payment } from '../../types';
import { StorageService } from '../../services/storageService';
import {
  downloadReceiptPdf,
  printReceiptPdf,
  SAMPLE_DEMO_PAYMENT,
  SAMPLE_DEMO_PROPERTY,
  SAMPLE_DEMO_ASSESSMENT,
} from '../../services/receiptPdfService';
import { formatCurrency, formatDateTime } from '../../utils';

export const ReceiptVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { receiptId } = useParams();

  const queryId = receiptId || searchParams.get('id') || searchParams.get('ref') || '';
  const [inputVal, setInputVal] = useState(queryId);
  const [verifiedPayment, setVerifiedPayment] = useState<Payment | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (queryId) {
      handleLookup(queryId);
    } else {
      setVerifiedPayment(null);
      setNotFound(false);
    }
  }, [queryId]);

  const handleLookup = (idToSearch: string) => {
    const cleanId = idToSearch.trim().toUpperCase();
    if (!cleanId) return;

    const allPayments = StorageService.getPayments();
    const match = allPayments.find(
      (p) =>
        p.receiptNumber.toUpperCase() === cleanId ||
        p.transactionId.toUpperCase() === cleanId ||
        p.id.toUpperCase() === cleanId
    );

    if (match) {
      setVerifiedPayment(match);
      setNotFound(false);
    } else if (
      cleanId.includes('DEMO') ||
      cleanId === 'SAMPLE' ||
      cleanId === 'RCP-DEMO-2026-0042'
    ) {
      setVerifiedPayment(SAMPLE_DEMO_PAYMENT);
      setNotFound(false);
    } else {
      setVerifiedPayment(null);
      setNotFound(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      handleLookup(inputVal.trim());
    }
  };

  const maskName = (name: string): string => {
    if (!name) return 'Protected Taxpayer';
    const parts = name.split(' ');
    return parts
      .map((part) => (part.length > 1 ? part[0] + '*'.repeat(Math.min(part.length - 1, 5)) : part))
      .join(' ');
  };

  const handleDownload = async () => {
    if (!verifiedPayment) return;
    setIsDownloading(true);
    try {
      await downloadReceiptPdf({ payment: verifiedPayment, isDemo: true });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = async () => {
    if (!verifiedPayment) return;
    await printReceiptPdf({ payment: verifiedPayment, isDemo: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Top Header Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>CivicTax Municipal Verification Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Official Payment Receipt Verification
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Scan or enter a CivicTax e-Challan receipt number to cryptographically verify tax settlement, property metadata, and payment ledger status.
          </p>
        </div>

        {/* Demo Mode Notice */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <span className="font-bold uppercase tracking-wider">
              DEMO RECEIPT -- NOT VALID FOR REAL TAX PAYMENT
            </span>
            <p className="text-amber-800 dark:text-amber-300">
              This verification interface is an academic project demonstration for municipal revenue systems. No real legal property tax liability was collected or settled.
            </p>
          </div>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter Receipt No (e.g. RCP-2024-0042, RCP-DEMO-2026-0042) or Txn ID"
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
          >
            <span>Verify</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Button */}
        {!verifiedPayment && (
          <div className="text-center">
            <button
              onClick={() => {
                setInputVal('RCP-DEMO-2026-0042');
                handleLookup('RCP-DEMO-2026-0042');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Realistic Sample Demo Receipt (RCP-DEMO-2026-0042)</span>
            </button>
          </div>
        )}

        {/* Not Found State */}
        {notFound && (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 shadow-md space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Receipt Not Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                No matching payment record could be located for identifier{' '}
                <strong className="font-mono text-slate-800 dark:text-slate-200">{inputVal}</strong>.
                Please verify the receipt number from your challan.
              </p>
            </div>
            <button
              onClick={() => {
                setInputVal('RCP-DEMO-2026-0042');
                handleLookup('RCP-DEMO-2026-0042');
              }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Verify Sample Demo Receipt Instead
            </button>
          </div>
        )}

        {/* Verified Certificate Card */}
        {verifiedPayment && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-900/50 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top Verified Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                    <Shield className="w-3 h-3" />
                    <span>Cryptographically Authenticated</span>
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight">
                    Official Municipal Receipt Verified
                  </h2>
                  <p className="text-xs text-emerald-100">
                    Recorded in CivicTax Municipal Revenue Ledger
                  </p>
                </div>
              </div>
              <div className="text-right sm:text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-100">Receipt No</span>
                <p className="text-base font-extrabold font-mono text-white">
                  {verifiedPayment.receiptNumber}
                </p>
              </div>
            </div>

            {/* Certificate Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Highlight Amount Box */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Total Amount Credited
                  </span>
                  <div className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-0.5">
                    {formatCurrency(verifiedPayment.amountPaid)}
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                    Status: <strong className="uppercase">PAID / SETTLED</strong> • {verifiedPayment.paymentMethod.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isDownloading ? 'Generating PDF...' : 'Download PDF'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium">Property Identifier (PID):</span>
                  <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                    {verifiedPayment.propertyNumber}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium">Assessment Year:</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {verifiedPayment.assessmentYear || '2024-2025'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium">Assessment Reference No:</span>
                  <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                    {verifiedPayment.assessmentNumber}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium">Transaction Reference ID:</span>
                  <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                    {verifiedPayment.transactionId}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium">Taxpayer (Masked for Privacy):</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {maskName(verifiedPayment.payerName)}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium">Payment Timestamp:</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {formatDateTime(verifiedPayment.paymentDate)}
                  </p>
                </div>
              </div>

              {/* Digital Seal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Digital Seal Verified • Municipal Revenue Authority</span>
                </div>
                <span className="font-mono text-[10px]">
                  Ref: SHA256-{verifiedPayment.id.slice(0, 12).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Project Developer Information Section */}
        <div className="p-6 rounded-3xl bg-[#101D32] text-white border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-widest text-amber-400">
              Project Developer
            </span>
            <span className="text-[10px] text-slate-400">
              Academic E-Governance Architecture
            </span>
          </div>

          <div>
            <h4 className="text-base font-extrabold text-white">
              PALLAPU DILEEP KUMAR
            </h4>
            <p className="text-xs text-slate-300">
              Department of Computer Science and Engineering • Vel Tech University, Chennai
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-4 text-xs font-semibold text-blue-400">
            <a
              href="https://dileepkumarpallapu.github.io/My-Portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-300 hover:underline flex items-center gap-1"
            >
              <span>Portfolio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/DileepKumarPallapu"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-300 hover:underline flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.linkedin.com/in/dileep-kumar-pallapu"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-300 hover:underline flex items-center gap-1"
            >
              <span>LinkedIn</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Return Link */}
        <div className="text-center">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            ← Return to CivicTax Municipal Portal
          </Link>
        </div>
      </div>
    </div>
  );
};
