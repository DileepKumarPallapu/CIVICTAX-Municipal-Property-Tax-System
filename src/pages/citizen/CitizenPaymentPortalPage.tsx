import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  QrCode,
  Building,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Download,
  ArrowRight,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { services } from '../../services/serviceFactory';
import { TaxAssessment, Payment, PaymentMethod } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../../utils';
import { ReceiptViewer } from '../../components/common/ReceiptViewer';

export const CitizenPaymentPortalPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error, warning } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedAssessmentId = searchParams.get('assessmentId');

  const [assessments, setAssessments] = useState<TaxAssessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('UPI');

  // Simulation form inputs
  const [upiId, setUpiId] = useState('rajesh.sharma@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8492');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [selectedBank, setSelectedBank] = useState('State Bank of India');

  const [isProcessing, setIsProcessing] = useState(false);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [asms, pays] = await Promise.all([
        services.assessmentService.getAssessments({ ownerId: currentUser.id }),
        services.paymentService.getPayments({ payerId: currentUser.id }),
      ]);

      setAssessments(asms);
      setRecentPayments(pays);

      // Pre-select assessment with balance
      if (preselectedAssessmentId) {
        setSelectedAssessmentId(preselectedAssessmentId);
      } else {
        const pending = asms.find((a) => a.outstandingBalance > 0);
        if (pending) setSelectedAssessmentId(pending.id);
        else if (asms.length > 0) setSelectedAssessmentId(asms[0].id);
      }
    } catch (e) {
      console.error('Error loading payment portal:', e);
    }
  }, [currentUser, preselectedAssessmentId]);

  useEffect(() => {
    loadData();

    const handleStorageUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (
        ce.detail?.key === 'civictax_assessments' ||
        ce.detail?.key === 'civictax_payments' ||
        e.type === 'civictax_data_reset'
      ) {
        loadData();
      }
    };
    window.addEventListener('civictax_storage_update', handleStorageUpdate);
    window.addEventListener('civictax_data_reset', handleStorageUpdate);
    return () => {
      window.removeEventListener('civictax_storage_update', handleStorageUpdate);
      window.removeEventListener('civictax_data_reset', handleStorageUpdate);
    };
  }, [loadData]);

  const activeAssessment = useMemo(() => {
    return assessments.find((a) => a.id === selectedAssessmentId) || null;
  }, [assessments, selectedAssessmentId]);

  // Adjust amount when switching assessment or payment type
  useEffect(() => {
    if (activeAssessment) {
      if (paymentType === 'FULL') {
        setCustomAmount(activeAssessment.outstandingBalance);
      } else {
        // Default half of balance or 1000
        const half = Math.round(activeAssessment.outstandingBalance / 2);
        setCustomAmount(half > 0 ? half : activeAssessment.outstandingBalance);
      }
    }
  }, [activeAssessment, paymentType]);

  const handleProcessPayment = async () => {
    if (!currentUser || !activeAssessment) return;

    if (activeAssessment.outstandingBalance <= 0) {
      warning('Dues Already Cleared', 'This tax assessment has already been paid in full.');
      return;
    }

    const payAmount = paymentType === 'FULL' ? activeAssessment.outstandingBalance : customAmount;

    if (!payAmount || payAmount <= 0) {
      error('Invalid Amount', 'Please enter a payment amount greater than zero.');
      return;
    }

    if (payAmount > activeAssessment.outstandingBalance) {
      error(
        'Overpayment Prevented',
        `Amount cannot exceed current outstanding balance of ${formatCurrency(activeAssessment.outstandingBalance)}.`
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate gateway delay (500ms)
      await new Promise((resolve) => setTimeout(resolve, 600));

      const bankOrVpa =
        selectedMethod === 'UPI'
          ? `VPA: ${upiId}`
          : selectedMethod === 'NET_BANKING'
          ? `Net Banking: ${selectedBank}`
          : `${selectedMethod === 'CREDIT_CARD' ? 'Credit Card' : 'Debit Card'} ending 8492`;

      const payment = await services.paymentService.processSimulatedPayment({
        assessmentId: activeAssessment.id,
        payerId: currentUser.id,
        payerName: currentUser.name,
        payerEmail: currentUser.email,
        payerPhone: currentUser.phone,
        amountPaid: payAmount,
        paymentMethod: selectedMethod,
        bankOrVpaDetails: bankOrVpa,
      });

      // Fire celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      success(
        'Payment Successfully Credited!',
        `Recorded ${formatCurrency(payAmount)} against ${activeAssessment.propertyNumber}. Receipt: ${payment.receiptNumber}.`
      );

      // Open receipt modal
      setReceiptPayment(payment);
      loadData();
    } catch (err: any) {
      error('Transaction Failed', err.message || 'Payment simulation could not be processed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Simulated Property Tax Payment Portal"
        subtitle="Settle outstanding municipal tax assessments through instant, zero-surcharge simulated payment gateways."
        breadcrumbs={[{ label: 'Dashboard', path: '/citizen/dashboard' }, { label: 'Payment Portal' }]}
      />

      {/* Demo Warning Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Safe Academic Simulation:</strong> This portal simulates UPI, Net Banking, and Card payment transactions. <strong>No real money is charged</strong>, and no genuine card numbers, CVVs, or bank OTPs are collected.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Payment Formulation Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tax Settlement Desk
              </h3>
              <p className="text-xs text-slate-400">
                Choose assessment, specify installment amount, and select payment mode
              </p>
            </div>
          </div>

          {/* Assessment Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Property Tax Assessment *
            </label>
            <select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-semibold"
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assessmentNumber} ({a.propertyNumber} • FY {a.assessmentYear}) — Outstanding: {formatCurrency(a.outstandingBalance)}
                </option>
              ))}
            </select>
          </div>

          {activeAssessment && (
            <>
              {/* Assessment Summary Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-3 text-center text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Total Assessed</span>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5 text-sm">
                    {formatCurrency(activeAssessment.totalTax)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Already Paid</span>
                  <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 text-sm">
                    {formatCurrency(activeAssessment.amountPaid)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Current Outstanding</span>
                  <p className="font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 text-sm">
                    {formatCurrency(activeAssessment.outstandingBalance)}
                  </p>
                </div>
              </div>

              {activeAssessment.outstandingBalance <= 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-center text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                  ✓ This tax assessment has been fully paid. No balance remains outstanding.
                </div>
              ) : (
                <>
                  {/* Payment Type: Full vs Partial */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Payment Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentType('FULL')}
                        className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                          paymentType === 'FULL'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>Full Balance ({formatCurrency(activeAssessment.outstandingBalance)})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentType('PARTIAL')}
                        className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                          paymentType === 'PARTIAL'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>Partial Installment</span>
                      </button>
                    </div>

                    {paymentType === 'PARTIAL' && (
                      <div className="mt-3">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Enter Partial Payment Amount (₹) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={activeAssessment.outstandingBalance}
                          value={customAmount}
                          onChange={(e) => setCustomAmount(Number(e.target.value))}
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-mono font-bold"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Must be between ₹1 and {formatCurrency(activeAssessment.outstandingBalance)}.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Select Payment Method (Simulation)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('UPI')}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                          selectedMethod === 'UPI'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <QrCode className="w-5 h-5 text-blue-600" />
                        <span>UPI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMethod('NET_BANKING')}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                          selectedMethod === 'NET_BANKING'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Building className="w-5 h-5 text-indigo-600" />
                        <span>Net Banking</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMethod('CREDIT_CARD')}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                          selectedMethod === 'CREDIT_CARD'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                        <span>Credit Card</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMethod('DEBIT_CARD')}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                          selectedMethod === 'DEBIT_CARD'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Wallet className="w-5 h-5 text-purple-600" />
                        <span>Debit Card</span>
                      </button>
                    </div>
                  </div>

                  {/* Method Details (Simulation fields) */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-3">
                    {selectedMethod === 'UPI' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Simulated UPI ID (VPA)
                        </label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                    )}

                    {selectedMethod === 'NET_BANKING' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Select Banking Partner
                        </label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                        >
                          <option>State Bank of India</option>
                          <option>HDFC Bank</option>
                          <option>ICICI Bank</option>
                          <option>Axis Bank</option>
                          <option>Kotak Mahindra Bank</option>
                          <option>Punjab National Bank</option>
                        </select>
                      </div>
                    )}

                    {(selectedMethod === 'CREDIT_CARD' || selectedMethod === 'DEBIT_CARD') && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Mock Card Number
                          </label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleProcessPayment}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/25"
                  >
                    {isProcessing ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>
                          Confirm Simulated Payment of{' '}
                          {formatCurrency(paymentType === 'FULL' ? activeAssessment.outstandingBalance : customAmount)}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Right Column (5 cols): Payment History & Receipt Downloads */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Payment History & Receipts
              </h3>
              <p className="text-xs text-slate-400">
                Download verified digital e-challans
              </p>
            </div>
            <Receipt className="w-5 h-5 text-blue-600" />
          </div>

          {recentPayments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
              No previous payments found for this account.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {recentPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                      {pay.receiptNumber}
                    </span>
                    <StatusBadge status={pay.paymentStatus} size="sm" />
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                        {formatCurrency(pay.amountPaid)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {pay.propertyNumber} • {pay.paymentMethod}
                      </p>
                    </div>
                    <button
                      onClick={() => setReceiptPayment(pay)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Receipt
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800 font-mono">
                    Txn: {pay.transactionId} • {formatDateTime(pay.paymentDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Official Receipt Viewer Modal */}
      <ReceiptViewer
        payment={receiptPayment}
        isOpen={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
      />
    </div>
  );
};
