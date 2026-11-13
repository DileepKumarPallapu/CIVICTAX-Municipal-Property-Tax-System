import { format, parseISO, isValid } from 'date-fns';
import { PropertyCategory, TaxRate } from '../types';

// Currency formatting (Indian Rupee format)
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Precise decimal currency string or number
export function formatCurrencyExact(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Date formatting
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(date)) return dateString;
    return format(date, 'dd MMM yyyy');
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(date)) return dateString;
    return format(date, 'dd MMM yyyy, hh:mm a');
  } catch {
    return dateString;
  }
}

// Tax Calculation Engine
export interface TaxCalculationParams {
  builtUpArea: number;
  ratePerSqFt: number;
  penalty?: number;
  discount?: number;
  previousPayments?: number;
}

export interface TaxCalculationResult {
  baseTax: number;
  penalty: number;
  discount: number;
  totalTax: number;
  outstandingBalance: number;
}

export function calculateTax(params: TaxCalculationParams): TaxCalculationResult {
  const {
    builtUpArea = 0,
    ratePerSqFt = 0,
    penalty = 0,
    discount = 0,
    previousPayments = 0,
  } = params;

  // Base Tax = Built-up Area × Tax Rate
  const baseTax = Math.round(Math.max(0, builtUpArea) * Math.max(0, ratePerSqFt));
  
  // Total Tax = Base Tax + Penalty - Discount
  const cleanPenalty = Math.max(0, penalty);
  const cleanDiscount = Math.max(0, discount);
  const totalTax = Math.max(0, baseTax + cleanPenalty - cleanDiscount);
  
  // Outstanding Amount = Total Tax - Successful Payments
  const cleanPayments = Math.max(0, previousPayments);
  const outstandingBalance = Math.max(0, totalTax - cleanPayments);

  return {
    baseTax,
    penalty: cleanPenalty,
    discount: cleanDiscount,
    totalTax,
    outstandingBalance,
  };
}

// Find effective rate for category and date
export function getEffectiveTaxRate(
  category: PropertyCategory,
  rates: TaxRate[],
  date: string = new Date().toISOString()
): number {
  const matchingRates = rates.filter(
    (r) => r.category === category && r.isActive
  );
  if (matchingRates.length === 0) {
    // Default fallback rates as specified
    if (category === 'RESIDENTIAL') return 10;
    if (category === 'COMMERCIAL') return 18;
    if (category === 'INDUSTRIAL') return 15;
    return 10;
  }
  return matchingRates[0].ratePerSqFt;
}

// Unique Reference Generators
export function generateId(prefix: string): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${randomNum}`;
}

export function generatePropertyNumber(index?: number): string {
  const year = new Date().getFullYear();
  const num = index ? String(index).padStart(4, '0') : Math.floor(1000 + Math.random() * 9000);
  return `CT-PROP-${year}-${num}`;
}

export function generateAssessmentNumber(index?: number): string {
  const year = new Date().getFullYear();
  const num = index ? String(index).padStart(4, '0') : Math.floor(1000 + Math.random() * 9000);
  return `CT-ASM-${year}-${num}`;
}

export function generateTransactionId(): string {
  const time = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TXN-${new Date().getFullYear()}-${time}-${random}`;
}

export function generateReceiptNumber(): string {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `RCP-${new Date().getFullYear()}-${rand}`;
}

export function generateGrievanceNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GRV-${new Date().getFullYear()}-${rand}`;
}

export function generateReassessmentNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RASM-${new Date().getFullYear()}-${rand}`;
}

// CSV Export Helper
export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map((h) => `"${h}"`).join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
