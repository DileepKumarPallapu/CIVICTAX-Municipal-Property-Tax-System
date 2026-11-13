import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SupportedLanguage = 'en' | 'ta';

interface LocalizationContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

// Comprehensive English & Tamil Dictionary
export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.properties': 'My Properties',
    'nav.registerProperty': 'Register Property',
    'nav.assessments': 'Tax Assessments',
    'nav.payments': 'Payment Portal',
    'nav.grievances': 'Grievances',
    'nav.reassessments': 'Reassessments',
    'nav.notifications': 'Notifications',
    'nav.settings': 'Settings',
    'nav.gis': 'Municipal GIS Map',
    'nav.recovery': 'Revenue Recovery',
    'nav.compliance': 'Risk & Compliance',
    'nav.forecasting': 'Revenue Forecast Lab',
    'nav.operations': 'Operations & SLA',
    'nav.transparency': 'Public Transparency',
    'nav.commandCenter': 'Command Center',
    'nav.audit': 'Audit Ledger',
    'nav.reports': 'Audit Reports',

    // Common Buttons & Actions
    'btn.save': 'Save Changes',
    'btn.submit': 'Submit',
    'btn.cancel': 'Cancel',
    'btn.payNow': 'Pay Outstanding Tax',
    'btn.downloadReceipt': 'Download Receipt',
    'btn.verify': 'Approve & Verify',
    'btn.reject': 'Reject Submission',
    'btn.filter': 'Filter Records',
    'btn.export': 'Export CSV',
    'btn.search': 'Search...',

    // Headings & Labels
    'app.tagline': 'One Platform. Smarter Cities. Transparent Governance.',
    'kpi.totalAssessed': 'Gross Assessed Tax',
    'kpi.totalCollected': 'Revenue Collected',
    'kpi.outstanding': 'Outstanding Balance',
    'kpi.efficiency': 'Collection Efficiency',
    'status.verified': 'Verified',
    'status.pending': 'Pending Inspection',
    'status.paid': 'Fully Settled',
    'status.partiallyPaid': 'Partially Paid',
    'status.overdue': 'Overdue',
  },
  ta: {
    // Navigation
    'nav.dashboard': 'முகப்பு பலகை',
    'nav.properties': 'என் சொத்துக்கள்',
    'nav.registerProperty': 'சொத்து பதிவு',
    'nav.assessments': 'வரி மதிப்பீடுகள்',
    'nav.payments': 'வரி செலுத்தும் மையம்',
    'nav.grievances': 'குறைதீர்ப்பு மையம்',
    'nav.reassessments': 'மறுமதிப்பீடு கோரிக்கைகள்',
    'nav.notifications': 'அறிவிப்புகள்',
    'nav.settings': 'அமைப்புகள்',
    'nav.gis': 'நகராட்சி வரைபடம் (GIS)',
    'nav.recovery': 'வருவாய் மீட்பு மையம்',
    'nav.compliance': 'இடர் மற்றும் இணக்கம்',
    'nav.forecasting': 'வருவாய் முன்கணிப்பு மையம்',
    'nav.operations': 'நகராட்சி செயல்பாடுகள்',
    'nav.transparency': 'பொது வெளிப்படைத்தன்மை',
    'nav.commandCenter': 'தலைமை கட்டுப்பாட்டு மையம்',
    'nav.audit': 'தணிக்கை பதிவு',
    'nav.reports': 'அறிக்கைகள்',

    // Common Buttons & Actions
    'btn.save': 'மாற்றங்களை சேமிக்கவும்',
    'btn.submit': 'சமர்ப்பிக்கவும்',
    'btn.cancel': 'ரத்து செய்',
    'btn.payNow': 'வரி செலுத்தவும்',
    'btn.downloadReceipt': 'ரசீதை பதிவிறக்கவும்',
    'btn.verify': 'சரிபார்த்து அங்கீகரிக்கவும்',
    'btn.reject': 'நிராகரிக்கவும்',
    'btn.filter': 'வடிகட்டவும்',
    'btn.export': 'பதிவிறக்கம் (CSV)',
    'btn.search': 'தேடவும்...',

    // Headings & Labels
    'app.tagline': 'ஒருங்கிணைந்த தளம். சிறந்த நகரங்கள். வெளிப்படையான நிர்வாகம்.',
    'kpi.totalAssessed': 'மொத்த நிர்ணயிக்கப்பட்ட வரி',
    'kpi.totalCollected': 'வசூலிக்கப்பட்ட வருவாய்',
    'kpi.outstanding': 'நிலுவை தொகை',
    'kpi.efficiency': 'வசூல் திறன் சதவீதம்',
    'status.verified': 'சரிபார்க்கப்பட்டது',
    'status.pending': 'நிலுவையில் உள்ளது',
    'status.paid': 'முழுமையாக செலுத்தப்பட்டது',
    'status.partiallyPaid': 'பகுதி செலுத்தப்பட்டது',
    'status.overdue': 'காலக்கெடு முடிந்தது',
  },
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    const saved = localStorage.getItem('civictax_language') as SupportedLanguage;
    if (saved && (saved === 'en' || saved === 'ta')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('civictax_language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || fallback || key;
  };

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
