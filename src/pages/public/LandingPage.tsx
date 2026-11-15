import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Receipt,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  ChevronDown,
  Send,
  Sparkles,
  Search,
  Scale,
  Users2,
  Globe2,
  Lock,
  ArrowUpRight,
  BadgeCheck,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { CountUp } from '../../components/common/CountUp';
import { calculateTax, formatCurrency } from '../../utils';
import { 
  cardVariants, 
  staggerContainer, 
  fadeIn, 
  floatingBadge 
} from '../../utils/animations';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', query: '' });

  // Interactive Tax Calculator Preview State
  const [calcCategory, setCalcCategory] = useState<'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL'>('RESIDENTIAL');
  const [calcArea, setCalcArea] = useState<number>(1200);
  const [calcRate, setCalcRate] = useState<number>(10);

  // Prevent landing page flash and redirect authenticated users directly to their dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      if (role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (role === 'OFFICER') {
        navigate('/officer', { replace: true });
      } else {
        navigate('/citizen', { replace: true });
      }
    }
  }, [isAuthenticated, role, isLoading, navigate]);

  const calculatedPreview = calculateTax({
    builtUpArea: calcArea,
    ratePerSqFt: calcRate,
    penalty: 0,
    discount: calcCategory === 'RESIDENTIAL' ? 500 : 0,
  });

  const handleCategoryChange = (cat: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL') => {
    setCalcCategory(cat);
    if (cat === 'RESIDENTIAL') setCalcRate(10);
    else if (cat === 'COMMERCIAL') setCalcRate(18);
    else setCalcRate(15);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.query) return;
    success('Message Dispatched!', 'Thank you for reaching out. A municipal citizen liaison officer will respond within 24 hours.');
    setContactForm({ name: '', email: '', phone: '', query: '' });
  };

  const services = [
    {
      title: 'Property Registration',
      desc: 'Seamlessly submit residential, commercial, and industrial property titles with digital document uploads and automated parcel tracking.',
      icon: Building2,
      link: '/citizen/register-property',
      color: 'bg-blue-50 text-[#405CF5] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      title: 'Tax Assessment Engine',
      desc: 'Accurate, formula-driven municipal property tax computation based on verified built-up area and active municipal category rate schedules.',
      icon: Receipt,
      link: '/citizen/assessments',
      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      title: 'Simulated Payments',
      desc: 'Multi-channel digital checkout simulation via UPI, Net Banking, and Cards with instant official e-receipt generation and ledger clearance.',
      icon: CreditCard,
      link: '/citizen/payments',
      color: 'bg-teal-50 text-[#13A58B] dark:bg-teal-950/40 dark:text-teal-400',
    },
    {
      title: 'Grievance Redressal',
      desc: 'Citizen grievance tracking with transparent 5-stage progress monitoring, automated inspector assignment, and official resolution timestamps.',
      icon: AlertTriangle,
      link: '/citizen/grievances',
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      title: 'Assessment Revaluation',
      desc: 'Transparent dispute and reassessment submission pipeline with side-by-side area audit, officer feedback, and traceable audit trails.',
      icon: RefreshCw,
      link: '/citizen/reassessments',
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
    },
    {
      title: 'Municipal Transparency',
      desc: 'Real-time city analytics, ward-level revenue collection efficiency, property classification stats, and fiscal transparency reports.',
      icon: TrendingUp,
      link: '/services',
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
  ];

  const faqs = [
    {
      q: 'How is my municipal property tax calculated in CivicTax?',
      a: 'CivicTax uses the standard Municipal Unit Area Value formula: Base Tax = Built-up Area (in sq ft) × Gazette Rate per Sq Ft for your property category (Residential: ₹10/sq ft, Commercial: ₹18/sq ft, Industrial: ₹15/sq ft). Any early payment discount is subtracted, and overdue penalties are added to arrive at the Total Assessment.',
    },
    {
      q: 'Is real money deducted during the online payment simulation?',
      a: 'No. This application is an enterprise municipal demonstration and academic system. All payment gateways (UPI, Cards, Net Banking) are fully functional state simulations that issue real verifiable receipt documents and update the database ledger without debiting actual bank accounts.',
    },
    {
      q: 'How long does physical verification of a newly registered property take?',
      a: 'Once submitted by a citizen, the property appears immediately in the Assigned Properties queue of the designated zone revenue inspector. Municipal guidelines mandate field or deed verification within 3 to 5 business days, triggering automated citizen notifications.',
    },
    {
      q: 'Can I dispute an assessment if my measured square footage differs?',
      a: 'Yes. Citizens can navigate to Reassessment Requests, select the disputed assessment, input their actual measured area, provide justification, and submit. An officer will review the claim and issue an approved revision or explain the variance.',
    },
    {
      q: 'Is CivicTax ready for municipal Salesforce integration?',
      a: 'Yes. CivicTax is architected with a decoupled Service Factory pattern. The current LocalStorage demo adapter can be switched directly to the included SalesforceServiceAdapter to synchronize records with Salesforce Custom Objects (Property__c, Tax_Assessment__c) via Apex REST APIs.',
    },
  ];

  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 lg:pt-20">
        {/* Ambient background lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-[#405CF5]/10 via-[#13A58B]/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-[#405CF5] dark:text-indigo-400 text-xs font-bold tracking-wide shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Municipal Governance Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#101D32] dark:text-white tracking-tight leading-[1.12]">
                Your Property. <br className="hidden sm:inline" />
                Your Taxes. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#405CF5] via-blue-600 to-[#13A58B]">
                  Simplified.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Experience smarter property tax management with transparent assessments, seamless simulated payments, and efficient municipal services — all in one centralized digital platform.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#405CF5] hover:bg-[#324BD9] text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 cursor-pointer"
                >
                  <span>Get Started Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/services"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white dark:bg-[#19283D] hover:bg-slate-50 dark:hover:bg-[#233754] text-[#19283D] dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-700 transition-all shadow-xs cursor-pointer"
                >
                  Explore Services
                </Link>
              </div>

              {/* Verified Trust Badges */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-[#13A58B]" />
                  <span>100% Transparent Formula</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#405CF5]" />
                  <span>Digital Official Receipts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>Salesforce DI-Ready</span>
                </div>
              </div>
            </motion.div>

            {/* Right Hero Dashboard Preview Graphic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Floating Stat Card 1 */}
                <motion.div
                  variants={floatingBadge}
                  animate="animate"
                  className="absolute -top-6 -left-6 z-20 hidden sm:flex items-center gap-3 p-3.5 bg-white/95 dark:bg-[#19283D]/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#16A34A] flex items-center justify-center font-bold">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400">Total Tax Settled</p>
                    <p className="text-sm font-extrabold text-[#101D32] dark:text-white">₹1,84,25,000</p>
                  </div>
                </motion.div>

                {/* Floating Stat Card 2 */}
                <div className="absolute -bottom-6 -right-6 z-20 hidden sm:flex items-center gap-3 p-3.5 bg-white/95 dark:bg-[#19283D]/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#405CF5] flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400">Verified Holdings</p>
                    <p className="text-sm font-extrabold text-[#101D32] dark:text-white">99.4% Clearance</p>
                  </div>
                </div>

                {/* Main Hero Card Container */}
                <div className="bg-white dark:bg-[#101D32] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/90 dark:border-slate-800 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#405CF5] text-white flex items-center justify-center font-bold text-xs">
                        CT
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#101D32] dark:text-white">Quick Tax Estimator</h4>
                        <p className="text-[10px] text-slate-400">Interactive Gazette Rate Preview</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/50 text-[#13A58B]">
                      FY 2024-25
                    </span>
                  </div>

                  {/* Calculator Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Property Category
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleCategoryChange(cat)}
                            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              calcCategory === cat
                                ? 'bg-[#405CF5] text-white shadow-sm'
                                : 'bg-slate-50 dark:bg-[#19283D] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {cat.charAt(0) + cat.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        <span>Built-up Area (Sq Ft)</span>
                        <span className="font-bold text-[#405CF5]">{calcArea} sq ft</span>
                      </div>
                      <input
                        type="range"
                        min="200"
                        max="10000"
                        step="50"
                        value={calcArea}
                        onChange={(e) => setCalcArea(Number(e.target.value))}
                        className="w-full accent-[#405CF5] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Calculated Breakdown Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#19283D]/70 border border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Rate per Sq Ft:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">₹{calcRate}.00</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Base Assessment:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{formatCurrency(calculatedPreview.baseTax)}</span>
                    </div>
                    {calcCategory === 'RESIDENTIAL' && (
                      <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                        <span>Early Citizen Rebate:</span>
                        <span className="font-medium">-₹500</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <span className="text-xs font-bold text-[#101D32] dark:text-white">Estimated Annual Tax:</span>
                      <span className="text-lg font-extrabold text-[#405CF5]">
                        {formatCurrency(calculatedPreview.totalTax)}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#101D32] hover:bg-slate-800 text-white font-medium text-xs transition cursor-pointer"
                  >
                    <span>Sign In to Pay or File Returns</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. LIVE MUNICIPAL STATISTICS COUNTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="p-4 text-center lg:text-left border-r border-slate-100 dark:border-slate-800/80 last:border-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Properties Managed</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#101D32] dark:text-white mt-1">
              <CountUp end={20} suffix="+" />
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Across 4 Municipal Zones</p>
          </div>

          <div className="p-4 text-center lg:text-left border-r border-slate-100 dark:border-slate-800/80 last:border-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tax Revenue Collected</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#405CF5] mt-1">
              <CountUp end={458000} prefix="₹" />
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Simulated Treasury Ledger</p>
          </div>

          <div className="p-4 text-center lg:text-left border-r border-slate-100 dark:border-slate-800/80 last:border-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Grievance Resolution</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#13A58B] mt-1">
              <CountUp end={92} suffix="%" />
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Turnaround &lt; 48 Hours</p>
          </div>

          <div className="p-4 text-center lg:text-left">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Digital Transparency</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-1">
              <CountUp end={100} suffix="%" />
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Zero Assessment Leaks</p>
          </div>
        </div>
      </section>

      {/* 3. CORE SERVICES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#405CF5] uppercase tracking-wider">Comprehensive Municipal Suite</span>
          <h2 className="text-3xl font-extrabold text-[#101D32] dark:text-white tracking-tight">
            Designed for Citizens, Officers, and Cities
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            CivicTax connects property owners with municipal revenue departments through transparent, verified digital channels.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((item, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover="hover"
              className="p-7 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-card transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#101D32] dark:text-white group-hover:text-[#405CF5] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/80">
                <Link
                  to={item.link}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#405CF5] hover:gap-2.5 transition-all"
                >
                  <span>Explore Module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 4. HOW IT WORKS (STEP BY STEP) */}
      <section className="bg-white dark:bg-[#101D32] py-20 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#13A58B] uppercase tracking-wider">Streamlined Journey</span>
            <h2 className="text-3xl font-extrabold text-[#101D32] dark:text-white">How CivicTax Works</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Four structured phases from initial title submission to instant receipt issuance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Register Property',
                desc: 'Citizen submits property specifications, built-up area, and title deed registration references.',
              },
              {
                step: '02',
                title: 'Officer Verification',
                desc: 'Assigned zone revenue inspector audits title deeds and verifies physical parameters.',
              },
              {
                step: '03',
                title: 'Assessment Issued',
                desc: 'System applies gazette square footage rates, computes tax dues, and dispatches notification.',
              },
              {
                step: '04',
                title: 'Digital Payment',
                desc: 'Citizen pays via simulated UPI/Cards and instantly downloads an authorized municipal e-challan.',
              },
            ].map((st, i) => (
              <div key={i} className="space-y-3 relative">
                <div className="text-4xl font-extrabold text-slate-200 dark:text-slate-800 select-none">
                  {st.step}
                </div>
                <h4 className="text-base font-bold text-[#101D32] dark:text-white">{st.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[#405CF5] uppercase tracking-wider">Citizen Advisory</span>
          <h2 className="text-3xl font-extrabold text-[#101D32] dark:text-white">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Clear guidance regarding municipal property tax policies, calculations, and dispute options.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white dark:bg-[#101D32] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-[#101D32] dark:text-white cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-[#405CF5]' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. CONTACT & CITIZEN SUPPORT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 p-8 sm:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <span className="text-xs font-bold text-[#13A58B] uppercase tracking-wider">Municipal Helpdesk</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#101D32] dark:text-white">
              Connect with Your Ward Revenue Liaison
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Have questions regarding property verification, valuation criteria, or tax concessions? Send an inquiry directly to the Directorate of Municipal Administration.
            </p>

            <div className="space-y-3 pt-4 text-xs text-slate-600 dark:text-slate-300">
              <p>🏛️ <strong>Central HQ:</strong> Civic Tax Bhavan, Municipal Corporation Complex, Pune - 411001</p>
              <p>📞 <strong>Toll-Free Helpline:</strong> 1800-233-CIVIC (1800 233 24842)</p>
              <p>✉️ <strong>Public Grievance Email:</strong> helpdesk@civictax.gov.in</p>
            </div>
          </div>

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#405CF5] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="rajesh@example.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#405CF5] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Property Number / Zone (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. CT-PROP-2024-001 or Zone 1"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#405CF5] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Query / Grievance Description *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe your inquiry or request..."
                value={contactForm.query}
                onChange={(e) => setContactForm({ ...contactForm, query: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#405CF5] outline-none resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#405CF5] hover:bg-[#324BD9] text-white font-semibold text-xs transition cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Municipal Inquiry</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
