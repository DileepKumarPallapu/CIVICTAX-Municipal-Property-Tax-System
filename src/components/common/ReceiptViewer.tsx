import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Printer,
  X,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  FileCheck,
  ExternalLink,
  Lock,
  Sparkles,
  Shield,
  Building,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Payment, Property, TaxAssessment } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils';
import { StatusBadge } from './StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storageService';
import {
  downloadReceiptPdf,
  printReceiptPdf,
  SAMPLE_DEMO_PAYMENT,
  SAMPLE_DEMO_PROPERTY,
  SAMPLE_DEMO_ASSESSMENT,
} from '../../services/receiptPdfService';

interface ReceiptViewerProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  isDemo?: boolean;
}

export const ReceiptViewer: React.FC<ReceiptViewerProps> = ({
  payment: originalPayment,
  isOpen,
  onClose,
  isDemo = true,
}) => {
  const { currentUser } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showSampleDemo, setShowSampleDemo] = useState(false);

  // Active payment: either the sample demo payment or original payment
  const activePayment = showSampleDemo ? SAMPLE_DEMO_PAYMENT : originalPayment;

  // Authorization check: Citizens may only view their own receipts or demo receipts
  const isAuthorized = (() => {
    if (!currentUser || !activePayment) return true;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'OFFICER') return true;
    if (activePayment.receiptNumber.includes('DEMO') || showSampleDemo) return true;
    return (
      activePayment.payerId === currentUser.id ||
      activePayment.payerEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
  })();

  // Resolve property & assessment metadata
  const property: Property | null = (() => {
    if (!activePayment) return null;
    if (showSampleDemo) return SAMPLE_DEMO_PROPERTY;
    const allProps = StorageService.getProperties();
    return (
      allProps.find(
        (p) =>
          p.id === activePayment.propertyId ||
          p.propertyNumber === activePayment.propertyNumber
      ) || null
    );
  })();

  const assessment: TaxAssessment | null = (() => {
    if (!activePayment) return null;
    if (showSampleDemo) return SAMPLE_DEMO_ASSESSMENT;
    const allAssessments = StorageService.getAssessments();
    return (
      allAssessments.find(
        (a) =>
          a.id === activePayment.assessmentId ||
          a.assessmentNumber === activePayment.assessmentNumber
      ) || null
    );
  })();

  // Financial breakdown amounts
  const baseTax = assessment?.baseTax ?? activePayment?.totalAssessment ?? 0;
  const penalty = assessment?.penalty ?? 0;
  const discount = assessment?.discount ?? 0;
  const totalDemand = assessment?.totalTax ?? activePayment?.totalAssessment ?? 0;
  const amountPaid = activePayment?.amountPaid ?? 0;
  const remainingBalance = activePayment?.remainingBalance ?? 0;

  // Generate QR Code data URL dynamically
  useEffect(() => {
    if (activePayment && isOpen) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://civictax.demo';
      const verificationUrl = `${baseUrl}/verify-receipt?id=${encodeURIComponent(
        activePayment.receiptNumber
      )}`;

      QRCode.toDataURL(verificationUrl, {
        margin: 1,
        width: 140,
        color: {
          dark: '#101D32',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate receipt QR:', err));
    }
  }, [activePayment, isOpen]);

  // Handle Download Real PDF
  const handleDownloadPdf = async () => {
    if (!activePayment) return;
    setIsGeneratingPdf(true);
    try {
      await downloadReceiptPdf({
        payment: activePayment,
        property,
        assessment,
        isDemo,
      });
    } catch (err) {
      console.error('Error downloading receipt PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle Print Receipt
  const handlePrint = async () => {
    if (!activePayment) return;
    setIsPrinting(true);
    try {
      await printReceiptPdf({
        payment: activePayment,
        property,
        assessment,
        isDemo,
      });
    } catch (err) {
      console.error('Error printing receipt PDF:', err);
      // Fallback to window.print if iframe print is blocked
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  // Safe early exit AFTER all hooks have executed unconditionally
  if (!isOpen || !activePayment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto font-sans receipt-modal-backdrop">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 animate-in fade-in zoom-in-95 duration-150 receipt-modal-card">
        {/* Modal Top Bar Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Official Municipal Tax Receipt
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSampleDemo(!showSampleDemo)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
                showSampleDemo
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Toggle Sample Demonstration Data"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{showSampleDemo ? 'Showing Sample' : 'Sample Demo'}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isPrinting || !isAuthorized}
              className="p-2 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || !isAuthorized}
              className="p-2 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40"
              title="Download Searchable A4 PDF Receipt"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setShowSampleDemo(false);
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Authorization Restriction Notice */}
        {!isAuthorized ? (
          <div className="py-12 px-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Access Restricted: Confidential Taxpayer Record
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                This municipal property tax receipt belongs to another taxpayer account. In compliance with municipal privacy regulations, receipts are restricted to the paying property owner and authorized tax officers.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setShowSampleDemo(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                View Sample Demo Receipt Instead
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Printable & On-Screen Receipt Container */
          <div ref={receiptRef} className="pt-5 space-y-5 relative overflow-hidden">
            {/* Subtle Diagonal DEMO Watermark */}
            {isDemo && (
              <div
                aria-hidden="true"
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0 opacity-[0.04] dark:opacity-[0.07]"
              >
                <div className="transform -rotate-30 text-center font-black tracking-widest text-slate-900 dark:text-white space-y-3">
                  <span className="text-5xl sm:text-6xl block">DEMO RECEIPT</span>
                  <span className="text-lg sm:text-2xl block">ACADEMIC PROJECT DEMONSTRATION</span>
                  <span className="text-base sm:text-xl block">NOT VALID FOR REAL TAX PAYMENT</span>
                </div>
              </div>
            )}

            {/* 1. Mandatory Academic Demo Identification Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 text-center space-y-1 relative z-10">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-200 block">
                DEMO RECEIPT
              </span>
              <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                ACADEMIC PROJECT DEMONSTRATION  •  NOT VALID FOR REAL TAX PAYMENT
              </p>
            </div>

            {/* 2. Header Box */}
            <div className="bg-[#101D32] text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-md shrink-0">
                  CT
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">
                    CIVICTAX MUNICIPAL CORPORATION
                  </h3>
                  <p className="text-[10px] text-blue-200 uppercase tracking-widest font-semibold">
                    DIRECTORATE OF MUNICIPAL REVENUE & TAXATION
                  </p>
                  <p className="text-[10px] text-amber-300 font-bold tracking-wide mt-0.5">
                    OFFICIAL E-CHALLAN & PROPERTY TAX PAYMENT RECEIPT
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right shrink-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold tracking-wide uppercase shadow-xs">
                  STATUS: PAID
                </span>
                <p className="mt-1 text-xs font-mono font-bold text-slate-200">
                  {activePayment.receiptNumber}
                </p>
              </div>
            </div>

            {/* 3. Receipt Metadata & QR Verification Row */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs flex-1">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Receipt No:</span>
                  <p className="font-extrabold font-mono text-blue-600 dark:text-blue-400">
                    {activePayment.receiptNumber}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Transaction ID:</span>
                  <p className="font-bold font-mono text-slate-800 dark:text-slate-200">
                    {activePayment.transactionId}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Assessment Year:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {activePayment.assessmentYear || '2024-2025'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Channel:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {activePayment.paymentMethod.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Timestamp:</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {formatDateTime(activePayment.paymentDate)}
                  </p>
                </div>
              </div>

              {/* Dynamic QR Code */}
              {qrDataUrl && (
                <div className="flex flex-col items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
                  <img
                    src={qrDataUrl}
                    alt="Receipt Verification QR Code"
                    className="w-20 h-20 rounded-md"
                  />
                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight mt-1">
                    Scan to Verify
                  </span>
                </div>
              )}
            </div>

            {/* 4. Section A: Taxpayer & Property Particulars */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
              <div className="bg-[#1E3A8A] text-white px-3.5 py-1.5 font-bold text-[11px] uppercase tracking-wider">
                Section A: Taxpayer & Property Particulars
              </div>
              <div className="p-3.5 bg-white dark:bg-slate-900/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-medium">Taxpayer Full Name:</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {activePayment.payerName}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Property Identification (PID):</span>
                  <p className="font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                    {activePayment.propertyNumber}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Taxpayer Email / Phone:</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                    {activePayment.payerEmail || 'citizen@civictax.demo'} • {activePayment.payerPhone || '+91 98765 43210'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Property Category & Area:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {property?.category || 'RESIDENTIAL'} • {property?.builtUpArea || assessment?.builtUpArea || 1200} sq ft
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-medium">Property Address:</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                    {property?.address || 'Flat 402, Shanti Heights, M.G. Road, Pune - 411001'}
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Section B: Financial Breakdown Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
              <div className="bg-[#1E3A8A] text-white px-3.5 py-1.5 font-bold text-[11px] uppercase tracking-wider">
                Section B: Financial Assessment & Payment Ledger
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2 px-3.5">Tax Component</th>
                    <th className="py-2 px-3.5">Calculation Basis</th>
                    <th className="py-2 px-3.5 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  <tr>
                    <td className="py-2 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                      Base Property Tax
                    </td>
                    <td className="py-2 px-3.5 text-slate-500">
                      {assessment?.appliedRatePerSqFt || 10} ₹/sqft × {assessment?.builtUpArea || 1200} sqft
                    </td>
                    <td className="py-2 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(baseTax)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                      Late Payment Penalty
                    </td>
                    <td className="py-2 px-3.5 text-slate-500">
                      {penalty > 0 ? 'Statutory Penalty' : 'Zero Penalty (On-Time)'}
                    </td>
                    <td className="py-2 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(penalty)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                      Early Bird Rebate / Concession
                    </td>
                    <td className="py-2 px-3.5 text-slate-500">
                      {discount > 0 ? 'Early-Settlement Incentive' : 'None Applicable'}
                    </td>
                    <td className="py-2 px-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {discount > 0 ? `- ${formatCurrency(discount)}` : '₹0.00'}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/40 font-bold">
                    <td colSpan={2} className="py-2 px-3.5 text-slate-800 dark:text-slate-200 uppercase text-[10px]">
                      Net Assessed Tax Demand
                    </td>
                    <td className="py-2 px-3.5 text-right text-slate-900 dark:text-white">
                      {formatCurrency(totalDemand)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 6. Total Amount Paid Callout */}
            <div className="bg-blue-50/80 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 dark:text-blue-300">
                  Total Amount Credited to Treasury
                </span>
                <div className="text-2xl font-extrabold text-blue-900 dark:text-blue-100">
                  {formatCurrency(amountPaid)}
                </div>
              </div>
              <div className="text-center sm:text-right text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Remaining Balance:</span>
                <p className={`font-bold text-sm ${remainingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {formatCurrency(remainingBalance)}
                </p>
              </div>
            </div>

            {/* 7. Mandatory Dedicated Project Developer Information Section */}
            <div className="p-5 rounded-2xl bg-[#101D32] text-white border-2 border-amber-500/80 shadow-lg space-y-3 relative z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                  PROJECT DEVELOPED BY
                </span>
                <span className="text-[9px] text-slate-400">
                  Academic E-Governance Architecture
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-white text-base sm:text-lg tracking-wide">
                    PALLAPU DILEEP KUMAR
                  </h4>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">
                    B.Tech — Computer Science and Engineering
                  </p>
                  <p className="text-xs text-slate-300">
                    Vel Tech University
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-1.5 text-xs text-blue-300">
                  <a
                    href="https://dileepkumarpallapu.github.io/My-Portfolio/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-white flex items-center gap-1 font-medium"
                  >
                    <span>Portfolio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://github.com/DileepKumarPallapu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-white flex items-center gap-1 font-medium"
                  >
                    <span>GitHub: DileepKumarPallapu</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/dileep-kumar-pallapu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-white flex items-center gap-1 font-medium"
                  >
                    <span>LinkedIn: dileep-kumar-pallapu</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Modal Actions */}
        {isAuthorized && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 no-print">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Compiling PDF...' : 'Download PDF Receipt'}</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Opening Print Layout...' : 'Print Receipt'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
