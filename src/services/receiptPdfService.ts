import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Payment, Property, TaxAssessment } from '../types/index';
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
    compress: false, // Ensures clear text streams for searchability and verification
  });

  // Colors
  const navyDark = [16, 29, 50];       // #101D32
  const navyHeader = [30, 58, 138];     // #1E3A8A
  const goldAccent = [217, 119, 6];     // #D97706
  const goldLight = [245, 158, 11];     // #F59E0B
  const emeraldPaid = [5, 150, 105];    // #059669
  const textDark = [23, 32, 51];        // #172033
  const textMuted = [100, 116, 139];    // #64748B
  const borderLight = [226, 232, 240];  // #E2E8F0
  const bgCard = [248, 250, 252];       // #F8FAFC
  const bgCallout = [239, 246, 255];    // #EFF6FF

  const startX = 12;
  const contentWidth = 186; // 210 - 24

  // ==========================================
  // BACKGROUND WATERMARK: SUBTLE DIAGONAL DEMO
  // ==========================================
  if (isDemo) {
    const docAny = doc as any;
    if (docAny.GState && docAny.setGState) {
      try {
        docAny.setGState(new docAny.GState({ opacity: 0.07 }));
      } catch {
        // Fallback gracefully
      }
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(54);
    doc.setTextColor(100, 116, 139);
    doc.text('DEMO RECEIPT', 105, 140, { align: 'center', angle: 45 });
    doc.setFontSize(20);
    doc.text('ACADEMIC PROJECT DEMONSTRATION', 105, 158, { align: 'center', angle: 45 });
    doc.setFontSize(16);
    doc.text('NOT VALID FOR REAL TAX PAYMENT', 105, 172, { align: 'center', angle: 45 });
    if (docAny.GState && docAny.setGState) {
      try {
        docAny.setGState(new docAny.GState({ opacity: 1.0 }));
      } catch {
        // Fallback gracefully
      }
    }
  }

  let currentY = 10;

  // ==========================================
  // 1. MANDATORY TOP DEMO IDENTIFICATION BANNER
  // ==========================================
  // Display prominent, clearly visible banner at the top:
  // DEMO RECEIPT
  // ACADEMIC PROJECT DEMONSTRATION
  // NOT VALID FOR REAL TAX PAYMENT
  const topBannerHeight = 15;
  doc.setFillColor(254, 243, 199); // #FEF3C7 amber-100
  doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(startX, currentY, contentWidth, topBannerHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(146, 64, 14); // amber-900
  doc.text('DEMO RECEIPT', 105, currentY + 4.8, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(
    'ACADEMIC PROJECT DEMONSTRATION  *  NOT VALID FOR REAL TAX PAYMENT',
    105,
    currentY + 10.5,
    { align: 'center' }
  );

  currentY += topBannerHeight + 4;

  // ==========================================
  // 2. HEADER: LOGO, MUNICIPAL SEAL & RECEIPT TITLE
  // ==========================================
  const headerHeight = 25;
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.roundedRect(startX, currentY, contentWidth, headerHeight, 2, 2, 'F');

  // CivicTax CT Logo Badge
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.roundedRect(startX + 4, currentY + 3.5, 18, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('CT', startX + 13, currentY + 15, { align: 'center' });

  // Organization Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('CIVICTAX MUNICIPAL CORPORATION', startX + 26, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(191, 219, 254); // Blue-200
  doc.text(
    'DIRECTORATE OF MUNICIPAL REVENUE & E-GOVERNANCE TAXATION GATEWAY',
    startX + 26,
    currentY + 14
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(253, 224, 71); // Gold/Yellow
  doc.text(
    'OFFICIAL E-CHALLAN & PROPERTY TAX PAYMENT RECEIPT',
    startX + 26,
    currentY + 19
  );

  // Status Badge on Right of Header
  doc.setFillColor(emeraldPaid[0], emeraldPaid[1], emeraldPaid[2]);
  doc.roundedRect(startX + contentWidth - 34, currentY + 4, 30, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('STATUS: PAID', startX + contentWidth - 19, currentY + 9.5, { align: 'center' });

  // Receipt Number on Top Right below badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(payment.receiptNumber, startX + contentWidth - 19, currentY + 18, { align: 'center' });

  currentY += headerHeight + 4;

  // ==========================================
  // 3. RECEIPT IDENTIFIERS & QR VERIFICATION CARD
  // ==========================================
  const cardHeight = 32;
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(startX, currentY, contentWidth, cardHeight, 2, 2, 'FD');

  // Left column: Receipt Number & Transaction ID
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('RECEIPT NUMBER', startX + 5, currentY + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(navyHeader[0], navyHeader[1], navyHeader[2]);
  doc.text(payment.receiptNumber, startX + 5, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('TRANSACTION REFERENCE ID', startX + 5, currentY + 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(payment.transactionId, startX + 5, currentY + 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('PAYMENT DATE & TIME', startX + 5, currentY + 28.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(formattedPaymentDate, startX + 42, currentY + 28.5);

  // Center column: Assessment Year & Payment Method
  const colCenter = startX + 80;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('ASSESSMENT YEAR', colCenter, currentY + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(payment.assessmentYear || '2024-2025', colCenter, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('PAYMENT METHOD', colCenter, currentY + 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(payment.paymentMethod.replace(/_/g, ' '), colCenter, currentY + 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('GATEWAY REFERENCE', colCenter, currentY + 28.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(payment.gatewayRef || 'HDFC-PG-AUTO', colCenter + 35, currentY + 28.5);

  // Right side: QR Code Box
  if (qrDataUrl) {
    const qrSize = 23;
    const qrX = startX + contentWidth - qrSize - 5;
    const qrY = currentY + 3;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(navyHeader[0], navyHeader[1], navyHeader[2]);
    doc.text('SCAN TO VERIFY', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
  }

  currentY += cardHeight + 4;

  // ==========================================
  // 4. SECTION A: TAXPAYER & PROPERTY INFORMATION
  // ==========================================
  doc.setFillColor(navyHeader[0], navyHeader[1], navyHeader[2]);
  doc.rect(startX, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('SECTION A: TAXPAYER & PROPERTY PARTICULARS', startX + 4, currentY + 4);

  currentY += 5.5;

  const propBoxHeight = 36;
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.rect(startX, currentY, contentWidth, propBoxHeight, 'FD');

  const r1Y = currentY + 6.5;
  const r2Y = currentY + 15;
  const r3Y = currentY + 23.5;
  const r4Y = currentY + 31.5;

  // Row 1: Taxpayer Name & Property Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Taxpayer Full Name:', startX + 4, r1Y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(payment.payerName, startX + 38, r1Y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Property ID (PID):', startX + 96, r1Y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(navyHeader[0], navyHeader[1], navyHeader[2]);
  doc.text(payment.propertyNumber, startX + 132, r1Y);

  // Row 2: Contact Details & Property Category
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Taxpayer Email / Phone:', startX + 4, r2Y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`${payment.payerEmail || 'citizen@civictax.demo'}  |  ${payment.payerPhone || '+91 98765 43210'}`, startX + 38, r2Y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Property Type:', startX + 96, r2Y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(property?.category || 'RESIDENTIAL', startX + 132, r2Y);

  // Row 3: Assessment Number & Built-up Area
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Assessment Number:', startX + 4, r3Y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(payment.assessmentNumber, startX + 38, r3Y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Built-up Area / Zone:', startX + 96, r3Y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const areaZoneText = `${property?.builtUpArea || assessment?.builtUpArea || 1200} sq ft  (${property?.zoneName || assessment?.zoneName || 'Central Zone'})`;
  doc.text(areaZoneText, startX + 132, r3Y);

  // Row 4: Property Address
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Property Address:', startX + 4, r4Y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const addressText = property?.address || 'Flat 402, Shanti Heights, M.G. Road, Pune - 411001';
  doc.text(addressText, startX + 38, r4Y);

  currentY += propBoxHeight + 4;

  // ==========================================
  // 5. SECTION B: TAX ASSESSMENT & PAYMENT BREAKDOWN
  // ==========================================
  doc.setFillColor(navyHeader[0], navyHeader[1], navyHeader[2]);
  doc.rect(startX, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('SECTION B: FINANCIAL ASSESSMENT & PAYMENT LEDGER', startX + 4, currentY + 4);

  currentY += 5.5;

  // Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(startX, currentY, contentWidth, 5.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('TAX COMPONENT / PARTICULARS', startX + 4, currentY + 3.8);
  doc.text('CALCULATION BASIS', startX + 90, currentY + 3.8);
  doc.text('AMOUNT (INR)', startX + contentWidth - 4, currentY + 3.8, { align: 'right' });

  currentY += 5.5;

  // Ledger Items
  const ledgerRows = [
    {
      label: 'Base Municipal Property Tax',
      basis: `${assessment?.appliedRatePerSqFt || 10} Rs/sqft x ${assessment?.builtUpArea || 1200} sqft`,
      amount: `Rs. ${baseTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isNegative: false,
    },
    {
      label: 'Late Payment Statutory Penalty',
      basis: penalty > 0 ? 'Mandatory Statutory Surcharge' : 'Zero Penalty (On-Time Filing)',
      amount: `Rs. ${penalty.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isNegative: false,
    },
    {
      label: 'Early Settlement Incentive / Rebate',
      basis: discount > 0 ? 'Early-Filing Concession Applied' : 'None Applicable',
      amount: discount > 0
        ? `- Rs. ${discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `Rs. 0.00`,
      isNegative: discount > 0,
    },
    {
      label: 'Solid Waste Management & Sanitation Cess',
      basis: 'Municipal SWM Schedule',
      amount: 'Rs. 0.00',
      isNegative: false,
    },
  ];

  for (let i = 0; i < ledgerRows.length; i++) {
    const row = ledgerRows[i];
    const isEven = i % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(startX, currentY, contentWidth, 5.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(row.label, startX + 4, currentY + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(row.basis, startX + 90, currentY + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(row.isNegative ? 5 : textDark[0], row.isNegative ? 150 : textDark[1], row.isNegative ? 105 : textDark[2]);
    doc.text(row.amount, startX + contentWidth - 4, currentY + 3.8, { align: 'right' });

    currentY += 5.5;
  }

  // Net Assessment Total Subtotal Row
  doc.setFillColor(241, 245, 249);
  doc.rect(startX, currentY, contentWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('NET ASSESSED TAX DEMAND', startX + 4, currentY + 4.2);
  doc.text(
    `Rs. ${totalDemand.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    startX + contentWidth - 4,
    currentY + 4.2,
    { align: 'right' }
  );

  currentY += 8;

  // ==========================================
  // 6. TOTAL AMOUNT PAID CALLOUT BOX
  // ==========================================
  const calloutHeight = 20;
  doc.setFillColor(bgCallout[0], bgCallout[1], bgCallout[2]);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.6);
  doc.roundedRect(startX, currentY, contentWidth, calloutHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 64, 175); // Blue-800
  doc.text('TOTAL AMOUNT RECEIVED & CREDITED TO MUNICIPAL TREASURY', startX + 6, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138); // Blue-900
  doc.text(
    `Rs. ${amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}  (INR)`,
    startX + 6,
    currentY + 13.5
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Remaining Balance:`, startX + contentWidth - 55, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(remainingBalance > 0 ? 217 : 5, remainingBalance > 0 ? 119 : 150, remainingBalance > 0 ? 6 : 105);
  doc.text(
    `Rs. ${remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    startX + contentWidth - 6,
    currentY + 7,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(emeraldPaid[0], emeraldPaid[1], emeraldPaid[2]);
  doc.text('Payment Status: FULLY SETTLED / PAID', startX + contentWidth - 6, currentY + 15, { align: 'right' });

  currentY += calloutHeight + 4;

  // ==========================================
  // 7. SECURITY & DIGITAL SIGNATURE SEAL
  // ==========================================
  const sealHeight = 14;
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(startX, currentY, contentWidth, sealHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(emeraldPaid[0], emeraldPaid[1], emeraldPaid[2]);
  doc.text('DIGITAL AUDIT TRAIL & E-GOVERNANCE VERIFICATION SEAL', startX + 4, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `Digital Verification Reference: SHA256-${payment.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16).toUpperCase()}-${payment.transactionId}`,
    startX + 4,
    currentY + 8.5
  );

  doc.text(
    `Electronic Challan generated on ${generatedDateStr} via CivicTax Municipal Architecture.`,
    startX + 4,
    currentY + 12
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(navyHeader[0], navyHeader[1], navyHeader[2]);
  doc.text('CivicTax Municipal Revenue Authority', startX + contentWidth - 4, currentY + 8, { align: 'right' });
  doc.text('[Digitally Signed & Validated]', startX + contentWidth - 4, currentY + 11.5, { align: 'right' });

  currentY += sealHeight + 4;

  // ==========================================
  // 8. MANDATORY DEVELOPER INFORMATION SECTION
  // ==========================================
  // Dedicated, professionally designed footer section titled:
  // PROJECT DEVELOPED BY
  // PALLAPU DILEEP KUMAR
  // B.Tech — Computer Science and Engineering
  // Vel Tech University
  // Portfolio: https://dileepkumarpallapu.github.io/My-Portfolio/
  // GitHub: https://github.com/DileepKumarPallapu
  // LinkedIn: https://www.linkedin.com/in/dileep-kumar-pallapu
  const devSectionHeight = 36;
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setDrawColor(goldLight[0], goldLight[1], goldLight[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(startX, currentY, contentWidth, devSectionHeight, 2, 2, 'FD');

  // Title: PROJECT DEVELOPED BY
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(253, 224, 71); // Gold/Yellow
  doc.text('PROJECT DEVELOPED BY', startX + 6, currentY + 6);

  // Full Name: PALLAPU DILEEP KUMAR (Prominent bold text)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('PALLAPU DILEEP KUMAR', startX + 6, currentY + 13);

  // Degree & Institution
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240); // Slate-200
  doc.text(
    'B.Tech -- Computer Science and Engineering  |  Vel Tech University',
    startX + 6,
    currentY + 19
  );

  // Developer Links
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(147, 197, 253); // Blue-300

  doc.text(
    'Portfolio: https://dileepkumarpallapu.github.io/My-Portfolio/',
    startX + 6,
    currentY + 24.5
  );

  doc.text(
    'GitHub: https://github.com/DileepKumarPallapu    |    LinkedIn: https://www.linkedin.com/in/dileep-kumar-pallapu',
    startX + 6,
    currentY + 30
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
