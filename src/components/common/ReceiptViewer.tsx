import React, { useRef } from 'react';
import { Download, Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';
import { Payment } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils';
import { StatusBadge } from './StatusBadge';

interface ReceiptViewerProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptViewer: React.FC<ReceiptViewerProps> = ({ payment, isOpen, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate text/html blob for download
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CivicTax Receipt ${payment.receiptNumber}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #14243a; }
            .sub { font-size: 14px; color: #64748b; margin-top: 5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .val { font-size: 15px; font-weight: 600; margin-top: 4px; }
            .total-box { background: #eff6ff; border: 2px solid #3b82f6; padding: 20px; text-align: center; border-radius: 8px; margin-top: 20px; }
            .paid-amt { font-size: 28px; font-weight: bold; color: #1d4ed8; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">CIVICTAX — MUNICIPAL PROPERTY TAX MANAGEMENT SYSTEM</div>
            <div class="sub">Official e-Challan & Digital Payment Receipt (Simulated Demonstration)</div>
          </div>
          <div class="grid">
            <div class="box">
              <div class="label">Receipt Number</div>
              <div class="val">${payment.receiptNumber}</div>
            </div>
            <div class="box">
              <div class="label">Transaction Reference</div>
              <div class="val">${payment.transactionId}</div>
            </div>
            <div class="box">
              <div class="label">Property Number</div>
              <div class="val">${payment.propertyNumber}</div>
            </div>
            <div class="box">
              <div class="label">Payer / Owner</div>
              <div class="val">${payment.payerName}</div>
            </div>
            <div class="box">
              <div class="label">Assessment Year</div>
              <div class="val">${payment.assessmentYear}</div>
            </div>
            <div class="box">
              <div class="label">Payment Channel</div>
              <div class="val">${payment.paymentMethod} (${payment.gatewayRef})</div>
            </div>
          </div>
          <div class="total-box">
            <div class="label">Total Tax Assessed: ${formatCurrency(payment.totalAssessment)}</div>
            <div class="val paid-amt">Amount Paid: ${formatCurrency(payment.amountPaid)}</div>
            <div class="sub" style="margin-top: 8px; font-weight: 600;">Outstanding Balance: ${formatCurrency(payment.remainingBalance)}</div>
          </div>
          <div class="footer">
            <p>Generated on ${new Date(payment.paymentDate).toLocaleString('en-IN')}</p>
            <p>Verified Municipal Digital Seal • CivicTax Academic Demonstration Platform</p>
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CivicTax_Receipt_${payment.receiptNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Official Municipal Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Download HTML Receipt"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Container */}
        <div ref={receiptRef} className="pt-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="inline-flex items-center gap-2 text-blue-600 font-extrabold tracking-tight text-xl">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-black">CT</span>
              CIVICTAX
            </div>
            <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">
              Municipal Property Tax Administration System
            </p>
            <p className="text-[11px] text-slate-400">
              Taxation Authority & E-Governance Gateway
            </p>
          </div>

          {/* Receipt Status & Number */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Receipt No</span>
              <p className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                {payment.receiptNumber}
              </p>
            </div>
            <div className="text-right">
              <StatusBadge status={payment.paymentStatus} size="sm" />
              <p className="mt-1 text-[11px] text-slate-400 font-mono">
                {payment.transactionId}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Property Number:</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                {payment.propertyNumber}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Assessment Year:</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {payment.assessmentYear}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Taxpayer Name:</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {payment.payerName}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Payment Date:</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {formatDateTime(payment.paymentDate)}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Payment Method:</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {payment.paymentMethod.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Bank / Gateway Reference:</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate font-mono">
                {payment.gatewayRef}
              </p>
            </div>
          </div>

          {/* Amount Paid Callout */}
          <div className="bg-blue-50/70 dark:bg-blue-950/40 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/60 text-center space-y-1">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-700 dark:text-blue-300">
              Amount Successfully Credited
            </span>
            <div className="text-3xl font-extrabold text-blue-900 dark:text-blue-200">
              {formatCurrency(payment.amountPaid)}
            </div>
            <div className="pt-2 flex justify-center gap-6 text-xs text-slate-600 dark:text-slate-300 border-t border-blue-200/60 dark:border-blue-800/60 mt-2">
              <span>Total Assessed: <strong>{formatCurrency(payment.totalAssessment)}</strong></span>
              <span>Remaining Balance: <strong className={payment.remainingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{formatCurrency(payment.remainingBalance)}</strong></span>
            </div>
          </div>

          {/* Disclaimer & Seal */}
          <div className="text-[11px] text-slate-400 text-center space-y-1 pt-2">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              Digital Seal Verified • Municipal Revenue Gateway
            </div>
            <p>
              This is a computer-generated simulated receipt for academic demonstration. No real currency was collected.
            </p>
          </div>
        </div>

        {/* Buttons bottom */}
        <div className="mt-8 flex gap-3 no-print">
          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            Download Receipt
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
