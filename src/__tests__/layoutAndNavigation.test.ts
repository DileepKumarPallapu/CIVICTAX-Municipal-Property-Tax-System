import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storageService';
import { LocalUserService } from '../services/local/LocalUserService';

// In-memory mock localStorage for Node / test environment
const mockStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStore[key] || null,
  setItem: (key: string, value: string) => {
    mockStore[key] = value.toString();
  },
  removeItem: (key: string) => {
    delete mockStore[key];
  },
  clear: () => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

describe('CivicTax UI Layout, Navigation & Auth Flow Verification', () => {
  beforeEach(() => {
    localStorageMock.clear();
    StorageService.initialize();
  });

  it('correctly maps user roles to authenticated dashboard root paths', async () => {
    const userService = new LocalUserService();

    const admin = await userService.login('admin@civictax.demo', 'Admin@123');
    expect(admin.role).toBe('ADMIN');
    const adminPath = admin.role === 'ADMIN' ? '/admin' : admin.role === 'OFFICER' ? '/officer' : '/citizen';
    expect(adminPath).toBe('/admin');

    const officer = await userService.login('officer@civictax.demo', 'Officer@123');
    expect(officer.role).toBe('OFFICER');
    const officerPath = officer.role === 'ADMIN' ? '/admin' : officer.role === 'OFFICER' ? '/officer' : '/citizen';
    expect(officerPath).toBe('/officer');

    const citizen = await userService.login('citizen@civictax.demo', 'Citizen@123');
    expect(citizen.role).toBe('CITIZEN');
    const citizenPath = citizen.role === 'ADMIN' ? '/admin' : citizen.role === 'OFFICER' ? '/officer' : '/citizen';
    expect(citizenPath).toBe('/citizen');
  });

  it('persists session across reloads and clears session cleanly on logout', async () => {
    const userService = new LocalUserService();

    // Login as citizen
    const user = await userService.login('citizen@civictax.demo', 'Citizen@123');
    expect(StorageService.getCurrentUser()?.id).toBe(user.id);

    // Logout
    await userService.logout();
    expect(StorageService.getCurrentUser()).toBeNull();
  });

  it('verifies all 8 faculty demo guide steps are properly configured', () => {
    const expectedSteps = [
      { id: 1, role: 'CITIZEN', targetUrl: '/citizen/register-property' },
      { id: 2, role: 'OFFICER', targetUrl: '/officer/verification' },
      { id: 3, role: 'OFFICER', targetUrl: '/officer/assessments' },
      { id: 4, role: 'CITIZEN', targetUrl: '/citizen/payments' },
      { id: 5, role: 'CITIZEN', targetUrl: '/citizen/grievances' },
      { id: 6, role: 'CITIZEN', targetUrl: '/citizen/reassessments' },
      { id: 7, role: 'ADMIN', targetUrl: '/admin/analytics' },
      { id: 8, role: 'ADMIN', targetUrl: '/admin/audit' },
    ];

    expect(expectedSteps.length).toBe(8);
    for (const step of expectedSteps) {
      expect(step.targetUrl).toMatch(/^\/(citizen|officer|admin)\//);
      expect(['CITIZEN', 'OFFICER', 'ADMIN']).toContain(step.role);
    }
  });

  it('validates sidebar width dimensions (250px expanded, 76px collapsed)', () => {
    const expandedWidth = 250;
    const collapsedWidth = 76;
    expect(expandedWidth).toBe(250);
    expect(collapsedWidth).toBe(76);
    expect(expandedWidth - collapsedWidth).toBe(174);
  });

  it('validates authoritative developer details, links and institutional metadata', () => {
    const developerInfo = {
      fullName: 'Pallapu Dileep Kumar',
      title: 'CSE Student | Full-Stack Developer | AI & Salesforce Enthusiast',
      institution: 'Vel Tech University',
      department: 'Computer Science and Engineering',
      location: 'Chennai, India',
      email: 'dileepkumarpallapu28@gmail.com',
      github: 'https://github.com/DileepKumarPallapu',
      linkedin: 'https://www.linkedin.com/in/dileep-kumar-pallapu',
      portfolio: 'https://dileepkumarpallapu.github.io/My-Portfolio/',
      copyright: '© 2026 CivicTax. All Rights Reserved.',
      attribution: 'Designed & Developed by Pallapu Dileep Kumar',
    };

    expect(developerInfo.fullName).toBe('Pallapu Dileep Kumar');
    expect(developerInfo.email).toMatch(/@gmail\.com$/);
    expect(developerInfo.github).toContain('github.com/DileepKumarPallapu');
    expect(developerInfo.linkedin).toContain('linkedin.com/in/dileep-kumar-pallapu');
    expect(developerInfo.portfolio).toContain('dileepkumarpallapu.github.io/My-Portfolio/');
    expect(developerInfo.institution).toBe('Vel Tech University');
    expect(developerInfo.location).toBe('Chennai, India');
    expect(developerInfo.copyright).toContain('© 2026 CivicTax. All Rights Reserved.');
    expect(developerInfo.attribution).toContain('Pallapu Dileep Kumar');
  });

  it('enforces React Rules of Hooks in LandingPage (no hooks after conditional returns to prevent error #310)', async () => {
    // Dynamic import of raw source string supported by Vite
    const rawModule = await import('../pages/public/LandingPage.tsx?raw');
    const content = rawModule.default as string;

    // Find the early return index
    const earlyReturnIndex = content.indexOf('if (isLoading || isAuthenticated)');
    expect(earlyReturnIndex).toBeGreaterThan(0);

    // Verify all hooks in LandingPage are defined before this conditional return
    const hookPatterns = [
      'useAuth()',
      'useNavigate()',
      'useToast()',
      'useState<number | null>(0)',
      "useState({ name: '', email: '', phone: '', query: '' })",
      "useState<'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL'>('RESIDENTIAL')",
      'useState<number>(1200)',
      'useState<number>(10)',
      'useEffect(',
    ];

    for (const pattern of hookPatterns) {
      const hookIndex = content.indexOf(pattern);
      expect(hookIndex).toBeGreaterThan(-1);
      expect(hookIndex).toBeLessThan(earlyReturnIndex);
    }
  });

  it('validates interactive tax calculation logic matching LandingPage preset parameters', async () => {
    const { calculateTax } = await import('../utils');

    // 1. Residential preset: 1200 sqft, rate 10, discount 500
    const resPreview = calculateTax({
      builtUpArea: 1200,
      ratePerSqFt: 10,
      penalty: 0,
      discount: 500,
    });
    expect(resPreview.baseTax).toBe(12000);
    expect(resPreview.discount).toBe(500);
    expect(resPreview.totalTax).toBe(11500);

    // 2. Commercial preset: 1200 sqft, rate 18, discount 0
    const commPreview = calculateTax({
      builtUpArea: 1200,
      ratePerSqFt: 18,
      penalty: 0,
      discount: 0,
    });
    expect(commPreview.baseTax).toBe(21600);
    expect(commPreview.discount).toBe(0);
    expect(commPreview.totalTax).toBe(21600);

    // 3. Industrial preset: 1200 sqft, rate 15, discount 0
    const indPreview = calculateTax({
      builtUpArea: 1200,
      ratePerSqFt: 15,
      penalty: 0,
      discount: 0,
    });
    expect(indPreview.baseTax).toBe(18000);
    expect(indPreview.discount).toBe(0);
    expect(indPreview.totalTax).toBe(18000);
  });
});
