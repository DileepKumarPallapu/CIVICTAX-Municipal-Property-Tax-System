import {
  User,
  MunicipalZone,
  Property,
  TaxRate,
  TaxAssessment,
  Payment,
  Grievance,
  ReassessmentRequest,
  Notification,
  AuditLogEntry,
} from '../types';
import {
  DEMO_USERS,
  DEMO_ZONES,
  DEMO_TAX_RATES,
  DEMO_PROPERTIES,
  DEMO_TAX_ASSESSMENTS,
  DEMO_PAYMENTS,
  DEMO_GRIEVANCES,
  DEMO_REASSESSMENTS,
  DEMO_NOTIFICATIONS,
} from '../data/seedData';

const STORAGE_KEYS = {
  USERS: 'civictax_users',
  ZONES: 'civictax_zones',
  TAX_RATES: 'civictax_tax_rates',
  PROPERTIES: 'civictax_properties',
  ASSESSMENTS: 'civictax_assessments',
  PAYMENTS: 'civictax_payments',
  GRIEVANCES: 'civictax_grievances',
  REASSESSMENTS: 'civictax_reassessments',
  NOTIFICATIONS: 'civictax_notifications',
  AUDIT_LOGS: 'civictax_audit_logs',
  CURRENT_USER: 'civictax_current_user',
  INITIALIZED: 'civictax_is_initialized_v4',
};

// Safe JSON Parse with fallback
function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
}

// Safe JSON Stringify
function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Dispatch reactive update event for cross-component sync
    window.dispatchEvent(
      new CustomEvent('civictax_storage_update', {
        detail: { key, timestamp: Date.now() },
      })
    );
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
}

export class StorageService {
  // Initialize default demo seed data if not yet present
  public static initialize(): void {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInit) {
      this.resetToSeedData();
    }
  }

  // Restore factory seed state
  public static resetToSeedData(): void {
    try {
      safeSet(STORAGE_KEYS.USERS, DEMO_USERS);
      safeSet(STORAGE_KEYS.ZONES, DEMO_ZONES);
      safeSet(STORAGE_KEYS.TAX_RATES, DEMO_TAX_RATES);
      safeSet(STORAGE_KEYS.PROPERTIES, DEMO_PROPERTIES);
      safeSet(STORAGE_KEYS.ASSESSMENTS, DEMO_TAX_ASSESSMENTS);
      safeSet(STORAGE_KEYS.PAYMENTS, DEMO_PAYMENTS);
      safeSet(STORAGE_KEYS.GRIEVANCES, DEMO_GRIEVANCES);
      safeSet(STORAGE_KEYS.REASSESSMENTS, DEMO_REASSESSMENTS);
      safeSet(STORAGE_KEYS.NOTIFICATIONS, DEMO_NOTIFICATIONS);

      // Seed initial immutable audit records
      const initialAuditLogs: AuditLogEntry[] = [
        {
          id: 'aud-001',
          actorId: 'usr-admin-01',
          actorName: 'Dr. Arvind S. Deshmukh',
          actorRole: 'ADMIN',
          action: 'SYSTEM_INITIALIZATION',
          recordType: 'SYSTEM',
          recordId: 'SYS-INIT',
          description: 'Municipal database schema initialized with FY 2024-25 rate gazette and ward boundaries.',
          timestamp: new Date().toISOString(),
        },
      ];
      safeSet(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);

      // Default logged in user (Citizen Rajesh Sharma)
      safeSet(STORAGE_KEYS.CURRENT_USER, DEMO_USERS[0]);

      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

      // Global notification event
      window.dispatchEvent(new CustomEvent('civictax_data_reset'));
    } catch (e) {
      console.error('Failed to reset CivicTax seed data:', e);
    }
  }

  // ==================== GETTERS ====================
  public static getUsers(): User[] {
    return safeGet<User[]>(STORAGE_KEYS.USERS, DEMO_USERS);
  }

  public static getZones(): MunicipalZone[] {
    return safeGet<MunicipalZone[]>(STORAGE_KEYS.ZONES, DEMO_ZONES);
  }

  public static getTaxRates(): TaxRate[] {
    return safeGet<TaxRate[]>(STORAGE_KEYS.TAX_RATES, DEMO_TAX_RATES);
  }

  public static getProperties(): Property[] {
    return safeGet<Property[]>(STORAGE_KEYS.PROPERTIES, DEMO_PROPERTIES);
  }

  public static getAssessments(): TaxAssessment[] {
    return safeGet<TaxAssessment[]>(STORAGE_KEYS.ASSESSMENTS, DEMO_TAX_ASSESSMENTS);
  }

  public static getPayments(): Payment[] {
    return safeGet<Payment[]>(STORAGE_KEYS.PAYMENTS, DEMO_PAYMENTS);
  }

  public static getGrievances(): Grievance[] {
    return safeGet<Grievance[]>(STORAGE_KEYS.GRIEVANCES, DEMO_GRIEVANCES);
  }

  public static getReassessments(): ReassessmentRequest[] {
    return safeGet<ReassessmentRequest[]>(STORAGE_KEYS.REASSESSMENTS, DEMO_REASSESSMENTS);
  }

  public static getNotifications(): Notification[] {
    return safeGet<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, DEMO_NOTIFICATIONS);
  }

  public static getAuditLogs(): AuditLogEntry[] {
    return safeGet<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  public static getCurrentUser(): User | null {
    return safeGet<User | null>(STORAGE_KEYS.CURRENT_USER, DEMO_USERS[0]);
  }

  // ==================== SETTERS ====================
  public static setUsers(users: User[]): void {
    safeSet(STORAGE_KEYS.USERS, users);
  }

  public static setZones(zones: MunicipalZone[]): void {
    safeSet(STORAGE_KEYS.ZONES, zones);
  }

  public static setTaxRates(taxRates: TaxRate[]): void {
    safeSet(STORAGE_KEYS.TAX_RATES, taxRates);
  }

  public static setProperties(properties: Property[]): void {
    safeSet(STORAGE_KEYS.PROPERTIES, properties);
  }

  public static setAssessments(assessments: TaxAssessment[]): void {
    safeSet(STORAGE_KEYS.ASSESSMENTS, assessments);
  }

  public static setPayments(payments: Payment[]): void {
    safeSet(STORAGE_KEYS.PAYMENTS, payments);
  }

  public static setGrievances(grievances: Grievance[]): void {
    safeSet(STORAGE_KEYS.GRIEVANCES, grievances);
  }

  public static setReassessments(reassessments: ReassessmentRequest[]): void {
    safeSet(STORAGE_KEYS.REASSESSMENTS, reassessments);
  }

  public static setNotifications(notifications: Notification[]): void {
    safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  public static recordAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    safeSet(STORAGE_KEYS.AUDIT_LOGS, [newEntry, ...logs]);
  }

  public static setCurrentUser(user: User | null): void {
    safeSet(STORAGE_KEYS.CURRENT_USER, user);
  }
}
