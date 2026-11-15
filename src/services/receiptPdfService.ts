import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Payment, Property, TaxAssessment } from '../types';
import { StorageService } from './storageService';

export interface ReceiptPdfOptions {
  payment: Payment;
  property?: Property | null;
  assessment?: TaxAssessment | null;
  isDemo?: boolean;
  verificationBaseUrl?: string;
}

// Realistic sample demo data for academic demonstration
export const SAMPLE_DEMO_PROPERTY: Property = {
  id: 'prop-demo-sample-01',
  propertyNumber: 'CT-PROP-2024-001',
  ownerId: 'usr-citizen-01',
  ownerName: 'Rajesh Kumar Sharma',
  ownerEmail: 'citizen@civictax.demo',
  ownerPhone: '+91 98765 43210',
  address: 'Flat 402, Shanti Heights, M.G. Road, Pune - 411001',
  category: 'RESIDENTIAL',
  zoneId: 'zone-1',
  zoneName: 'Central Administrative Zone',
  builtUpArea: 1200,
  constructionYear: 2018,
  documentReference: 'DOC-MH-PUN-2018-9841',
  contactDetails: '+91 98765 43210',
  description: 'Residential 2BHK Apartment (Demo Record)',
  verificationStatus: 'VERIFIED',
  registrationDate: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

export const SAMPLE_DEMO_ASSESSMENT: TaxAssessment = {
  id: 'asm-demo-sample-01',
  assessmentNumber: 'CT-ASM-2024-001',
  propertyId: 'prop-demo-sample-01',
  propertyNumber: 'CT-PROP-2024-001',
  ownerId: 'usr-citizen-01',
  ownerName: 'Rajesh Kumar Sharma',
  ownerEmail: 'citizen@civictax.demo',
  assessmentYear: '2024-2025',
  category: 'RESIDENTIAL',
  zoneId: 'zone-1',
  zoneName: 'Central Administrative Zone',
  builtUpArea: 1200,
  appliedRatePerSqFt: 10,
  baseTax: 12000,
  penalty: 0,
  discount: 500,
  totalTax: 11500,
  amountPaid: 11500,
  outstandingBalance: 0,
  status: 'PAID',
  dueDate: '2024-12-31',
  generatedDate: '2024-04-01T00:00:00Z',
};

export const SAMPLE_DEMO_PAYMENT: Payment = {
  id: 'pay-demo-sample-01',
  transactionId: 'TXN-DEMO-2026-98421',
  receiptNumber: 'RCP-DEMO-2026-0042',
  assessmentId: 'asm-demo-sample-01',
  assessmentNumber: 'CT-ASM-2024-001',
  propertyId: 'prop-demo-sample-01',
  propertyNumber: 'CT-PROP-2024-001',
  payerId: 'usr-citizen-01',
  payerName: 'Rajesh Kumar Sharma',
  payerEmail: 'citizen@civictax.demo',
  payerPhone: '+91 98765 43210',
  amountPaid: 11500,
  totalAssessment: 11500,
  remainingBalance: 0,
  paymentDate: new Date().toISOString(),
  paymentMethod: 'NET_BANKING',
  paymentStatus: 'SUCCESS',
  gatewayRef: 'HDFC-PG-8923419-DEMO',
  assessmentYear: '2024-2025',
  bankOrVpaDetails: 'HDFC Bank • NetBanking A/C **4821',
  remarks: 'Simulated Municipal Property Tax Annual Payment (Demo)',
};

/**
 * Generate a real, searchable, vector-based A4 PDF municipal payment receipt.
 */
export async function generateReceiptPdf(options: ReceiptPdfOptions): Promise<jsPDF> {
  const { payment, isDemo = true } = options;

  // Resolve linked property and assessment from local store if not supplied
  let property = options.property;
  let assessment = options.assessment;

  if (!property) {
    const allProps = StorageService.getProperties();
    property = allProps.find(
      (p) => p.id === payment.propertyId || p.propertyNumber === payment.propertyNumber
    ) || (payment.receiptNumber.includes('DEMO') ? SAMPLE_DEMO_PROPERTY : null);
  }

  if (!assessment) {
    const allAssessments = StorageService.getAssessments();
    assessment = allAssessments.find(
      (a) => a.id === payment.assessmentId || a.assessmentNumber === payment.assessmentNumber
    ) || (payment.receiptNumber.includes('DEMO') ? SAMPLE_DEMO_ASSESSMENT : null);
  }

  // Derive tax breakdown values accurately
  const baseTax = assessment?.baseTax ?? payment.totalAssessment;
  const penalty = assessment?.penalty ?? 0;
  const discount = assessment?.discount ?? 0;
  const totalDemand = assessment?.totalTax ?? payment.totalAssessment;
  const amountPaid = payment.amountPaid;
  const remainingBalance = payment.remainingBalance;

  // Formatted date string
  const paymentDateObj = new Date(payment.paymentDate);
  const formattedPaymentDate = isNaN(paymentDateObj.getTime())
    ? payment.paymentDate
    : paymentDateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ' ' +
      paymentDateObj.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

  const generatedDateStr = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Verification URL for QR code (points to verification page without exposing private taxpayer PII)
  const baseUrl = options.verificationBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://civictax.demo');
  const verificationUrl = `${baseUrl}/verify-receipt?id=${encodeURIComponent(payment.receiptNumber)}`;

  // Generate QR Code data URL
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 160,
      color: {
        dark: '#101D32',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code data URL:', err);
  }

  // Create A4 Portrait PDF (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: false,
  });

  // Colors
  const navyDark = [16, 29, 50];       // #101D32
  const navyHeader = [30, 58, 138];     // #1E3A8A
  const goldAccent = [217, 119, 6];     // #D97706
  const emeraldPaid = [5, 150, 105];    // #059669
  const textDark = [23, 32, 51];        // #172033
  const textMuted = [100, 116, 139];    // #64748B
  const borderLight = [226, 232, 240];  // #E2E8F0
  const bgCard = [248, 250, 252];       // #F8FAFC
  const bgCallout = [239, 246, 255];    // #EFF6FF

  const startX = 14;
  const contentWidth = 182; // 210 - 28
  let currentY = 12;

  // ==========================================
  // 1. TOP DEMO WATERMARK BANNER
  // ==========================================
  doc.setFillColor(254, 243, 199); // #FEF3C7 (amber-100)
  doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(startX, currentY, contentWidth, 8, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.text(
    'DEMO RECEIPT -- NOT VALID FOR REAL TAX PAYMENT (ACADEMIC DEMONSTRATION)',
    105,
    currentY + 5.2,
    { align: 'center' }
  );

  currentY += 12;

  // ==========================================
  // 2. HEADER: LOGO, MUNICIPAL SEAL & RECEIPT TITLE
  // ==========================================
  // Navy Header Banner Box
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.roundedRect(startX, currentY, contentWidth, 26, 2, 2, 'F');

  // CivicTax CT Logo Badge
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.roundedRect(startX + 4, currentY + 3.5, 18, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('CT', startX + 13, currentY + 15, { align: 'center' });

  // Organization Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('CIVICTAX MUNICIPAL CORPORATION', startX + 26, currentY + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(191, 219, 254); // Blue-200
  doc.text(
    'DIRECTORATE OF MUNICIPAL REVENUE & E-GOVERNANCE TAXATION GATEWAY',
    startX + 26,
    currentY + 14.5
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(253, 224, 71); // Yellow-300
  doc.text(
    'OFFICIAL E-CHALLAN & PROPERTY TAX PAYMENT RECEIPT',
    startX + 26,
    currentY + 19.5
  );

  // Status Badge on Right of Header
  doc.setFillColor(emeraldPaid[0], emeraldPaid[1], emeraldPaid[2]);
  doc.roundedRect(startX + contentWidth - 32, currentY + 4.5, 28, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('STATUS: PAID', startX + contentWidth - 18, currentY + 9.8, { align: 'center' });

  // Receipt Number on Top Right below badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(payment.receiptNumber, startX + contentWidth - 18, currentY + 18, { align: 'center' });

  currentY += 30;

  // ==========================================
  // 3. RECEIPT IDENTIFIERS & QR VERIFICATION CARD
  // ==========================================
  const cardHeight = 36;
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(startX, currentY, contentWidth, cardHeight, 2, 2, 'FD');

  // Left side: Receipt Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('RECEIPT NUMBER', startX + 6, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(navyHeader[0], navyHeader[1], navyHeader[2]);
  doc.text(payment.receiptNumber, startX + 6, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('TRANSACTION REFERENCE ID', startX + 6, currentY + 19);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(payment.transactionId, startX + 6, currentY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('PAYMENT DATE & TIME', startX + 6, currentY + 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(formattedPaymentDate, startX + 46, currentY + 30);

  // Center column: Assessment Year & Payment Method
  const colCenter = startX + 80;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('ASSESSMENT YEAR', colCenter, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(payment.assessmentYear || '2024-2025', colCenter, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('PAYMENT METHOD', colCenter, currentY + 19);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(payment.paymentMethod.replace(/_/g, ' '), colCenter, currentY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('GATEWAY REFERENCE', colCenter, currentY + 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(payment.gatewayRef || 'HDFC-PG-AUTO', colCenter + 36, currentY + 30);

  // Right side: QR Code Box
  if (qrDataUrl) {
    const qrSize = 26;
    const qrX = startX + contentWidth - qrSize - 6;
    const qrY = currentY + 3.5;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(navyHeader[0], navyHeader[1], navyHeader[2]);
    doc.text('SCAN TO VERIFY', qrX + qrSize / 2, qrY + qrSize + 3.2, { align: 'center' });
  }

  currentY += cardHeight + 6;

  // ==========================================
  // 4. SECTION A: TAXPAYER & PROPERTY INFORMATION
  // ==========================================
  doc.setFillColor(navyHeader[0], navyHeader[1], navyHeader[2]);
  doc.rect(startX, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SECTION A: TAXPAYER & PROPERTY PARTICULARS', startX + 4, currentY + 4.2);

  currentY += 6;

  const propBoxHeight = 38;
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.rect(startX, currentY, contentWidth, propBoxHeight, 'FD');

  const row1Y = currentY + 7;
  const row2Y = currentY + 16;
  const row3Y = currentY + 25;
  const row4Y = currentY + 33;

  // Row 1: Taxpayer Name & Property Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Taxpayer Full Name:', startX + 4, row1Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(payment.payerName, startX + 38, row1Y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Property Number (PID):', startX + 96, row1Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navyHeader[0], navyHeader[1], navyHeader[2]);
  doc.text(payment.propertyNumber, startX + 138, row1Y);

  // Row 2: Contact Details & Property Category
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Taxpayer Email / Phone:', startX + 4, row2Y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`${payment.payerEmail || 'citizen@civictax.demo'}  |  ${payment.payerPhone || '+91 98765 43210'}`, startX + 38, row2Y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Property Category:', startX + 96, row2Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(property?.category || 'RESIDENTIAL', startX + 138, row2Y);

  // Row 3: Assessment Number & Built-up Area
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Assessment Number:', startX + 4, row3Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(payment.assessmentNumber, startX + 38, row3Y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Built-up Area / Zone:', startX + 96, row3Y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const areaZoneText = `${property?.builtUpArea || assessment?.builtUpArea || 1200} sq ft  (${property?.zoneName || assessment?.zoneName || 'Central Zone'})`;
  doc.text(areaZoneText, startX + 138, row3Y);

  // Row 4: Property Address
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Property Address:', startX + 4, row4Y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const addressText = property?.address || 'Flat 402, Shanti Heights, M.G. Road, Pune - 411001';
  doc.text(addressText, startX + 38, row4Y);

  currentY += propBoxHeight + 6;

  // ==========================================
  // 5. SECTION B: TAX ASSESSMENT & PAYMENT BREAKDOWN
  // ==========================================
  doc.setFillColor(navyHeader[0], navyHeader[1], navyHeader[2]);
  doc.rect(startX, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SECTION B: FINANCIAL ASSESSMENT & PAYMENT LEDGER', startX + 4, currentY + 4.2);

  currentY += 6;

  // Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(startX, currentY, contentWidth, 6.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('PARTICULARS / TAX COMPONENT', startX + 4, currentY + 4.5);
  doc.text('RATE / APPLIED BASIS', startX + 90, currentY + 4.5);
  doc.text('AMOUNT (INR)', startX + contentWidth - 4, currentY + 4.5, { align: 'right' });

  currentY += 6.5;

  // Ledger Items
  const ledgerRows = [
    {
      label: 'Base Municipal Property Tax',
      basis: `${assessment?.appliedRatePerSqFt || 10} Rs/sqft x ${assessment?.builtUpArea || 1200} sqft`,
      amount: `Rs. ${baseTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isNegative: false,
    },
    {
      label: 'Late Payment Penalty / Surcharge',
      basis: penalty > 0 ? 'Statutory Penalty' : 'Zero Penalty (On-Time Payment)',
      amount: `Rs. ${penalty.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isNegative: false,
    },
    {
      label: 'Early Settlement Incentive / Rebate',
      basis: discount > 0 ? 'Municipal Early-Filing Concession' : 'None Applicable',
      amount: discount > 0
        ? `- Rs. ${discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `Rs. 0.00`,
      isNegative: discount > 0,
    },
    {
      label: 'Solid Waste Management & Sanitation Cess',
      basis: 'Municipal SWM Standard Schedule',
      amount: 'Rs. 0.00',
      isNegative: false,
    },
  ];

  for (let i = 0; i < ledgerRows.length; i++) {
    const row = ledgerRows[i];
    const isEven = i % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(startX, currentY, contentWidth, 6, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(row.label, startX + 4, currentY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(row.basis, startX + 90, currentY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(row.isNegative ? 5 : textDark[0], row.isNegative ? 150 : textDark[1], row.isNegative ? 105 : textDark[2]);
    doc.text(row.amount, startX + contentWidth - 4, currentY + 4.2, { align: 'right' });

    currentY += 6;
  }

  // Net Assessment Total Subtotal Row
  doc.setFillColor(241, 245, 249);
  doc.rect(startX, currentY, contentWidth, 6.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('NET ASSESSED TAX DEMAND', startX + 4, currentY + 4.5);
  doc.text(
    `Rs. ${totalDemand.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    startX + contentWidth - 4,
    currentY + 4.5,
    { align: 'right' }
  );

  currentY += 9;

  // ==========================================
  // 6. TOTAL AMOUNT PAID CALLOUT BOX
  // ==========================================
  const calloutHeight = 22;
  doc.setFillColor(bgCallout[0], bgCallout[1], bgCallout[2]);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.6);
  doc.roundedRect(startX, currentY, contentWidth, calloutHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175); // Blue-800
  doc.text('TOTAL AMOUNT RECEIVED & CREDITED TO MUNICIPAL TREASURY', startX + 6, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138); // Blue-900
  doc.text(
    `Rs. ${amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}  (INR)`,
    startX + 6,
    currentY + 14
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Remaining Balance:`, startX + contentWidth - 55, currentY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(remainingBalance > 0 ? 217 : 5, remainingBalance > 0 ? 119 : 150, remainingBalance > 0 ? 6 : 105);
  doc.text(
    `Rs. ${remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    startX + contentWidth - 6,
    currentY + 8,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(emeraldPaid[0], emeraldPaid[1], emeraldPaid[2]);
  doc.text('Payment Status: FULLY SETTLED / PAID', startX + contentWidth - 6, currentY + 16, { align: 'right' });

  currentY += calloutHeight + 6;

  // ==========================================
  // 7. SECURITY & DIGITAL SIGNATURE SEAL
  // ==========================================
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(startX, currentY, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(emeraldPaid[0], emeraldPaid[1], emeraldPaid[2]);
  doc.text('DIGITAL AUDIT TRAIL & VERIFICATION SEAL', startX + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `Digital Verification Reference: SHA256-${payment.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16).toUpperCase()}-${payment.transactionId}`,
    startX + 4,
    currentY + 10.5
  );

  doc.text(
    `Electronic Challan generated on ${generatedDateStr} via CivicTax Municipal E-Governance Architecture.`,
    startX + 4,
    currentY + 15
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(navyHeader[0], navyHeader[1], navyHeader[2]);
  doc.text('CivicTax Authority E-Sign', startX + contentWidth - 4, currentY + 10, { align: 'right' });
  doc.text('[Digitally Verified]', startX + contentWidth - 4, currentY + 14.5, { align: 'right' });

  currentY += 22;

  // ==========================================
  // 8. TASTEFUL DEVELOPER FOOTER SECTION
  // ==========================================
  // Distinctive developer footer section clearly labeled "Project Developer"
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.roundedRect(startX, currentY, contentWidth, 24, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(253, 224, 71); // Gold/Yellow label
  doc.text('PROJECT DEVELOPER (ACADEMIC ARCHITECT)', startX + 5, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('Developed By: PALLAPU DILEEP KUMAR', startX + 5, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text(
    'Department of Computer Science and Engineering  |  Vel Tech University, Chennai',
    startX + 5,
    currentY + 16
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(147, 197, 253); // Blue-300
  doc.text(
    'Portfolio: https://dileepkumarpallapu.github.io/My-Portfolio/   *   GitHub: DileepKumarPallapu   *   LinkedIn: dileep-kumar-pallapu',
    startX + 5,
    currentY + 20.5
  );

  return doc;
}

/**
 * Downloads the real PDF directly to the user's browser.
 */
export async function downloadReceiptPdf(options: ReceiptPdfOptions): Promise<void> {
  const doc = await generateReceiptPdf(options);
  const fileName = `CivicTax_Receipt_${options.payment.receiptNumber}.pdf`;
  doc.save(fileName);
}

/**
 * Opens print dialog directly using the vector PDF blob in an iframe.
 */
export async function printReceiptPdf(options: ReceiptPdfOptions): Promise<void> {
  const doc = await generateReceiptPdf(options);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  // If in browser, open printable iframe
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        iframe.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      }, 250);
    };
  }
}
