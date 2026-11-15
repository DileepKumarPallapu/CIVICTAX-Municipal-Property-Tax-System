import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Mail,
  MapPin,
  GraduationCap,
  ExternalLink,
  Shield,
  FileText,
  Code2,
  Cpu,
  Layers,
  Sparkles,
  ArrowUpRight,
  X,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AppFooterProps {
  isDashboard?: boolean;
}

export const AppFooter: React.FC<AppFooterProps> = ({ isDashboard = false }) => {
  const { currentUser, role, isAuthenticated } = useAuth();
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);

  // Dynamic route resolution for platform features based on authentication & role
  const getPlatformRoute = (feature: 'properties' | 'assessments' | 'payments' | 'grievances' | 'reports') => {
    if (!isAuthenticated || !currentUser) {
      switch (feature) {
        case 'properties':
          return '/citizen/register-property';
        case 'assessments':
          return '/services';
        case 'payments':
          return '/citizen/payments';
        case 'grievances':
          return '/citizen/grievances';
        case 'reports':
          return '/transparency';
      }
    }

    if (role === 'OFFICER') {
      switch (feature) {
        case 'properties':
          return '/officer/assigned-properties';
        case 'assessments':
          return '/officer/assessments';
        case 'payments':
          return '/officer/payments';
        case 'grievances':
          return '/officer/grievances';
        case 'reports':
          return '/officer/zone-analytics';
      }
    }

    if (role === 'ADMIN') {
      switch (feature) {
        case 'properties':
          return '/admin/properties';
        case 'assessments':
          return '/admin/assessments';
        case 'payments':
          return '/admin/payments';
        case 'grievances':
          return '/admin/grievances';
        case 'reports':
          return '/admin/reports';
      }
    }

    // Default Citizen Role
    switch (feature) {
      case 'properties':
        return '/citizen/properties';
      case 'assessments':
        return '/citizen/assessments';
      case 'payments':
        return '/citizen/payments';
      case 'grievances':
        return '/citizen/grievances';
      case 'reports':
        return '/transparency';
    }
  };

  return (
    <footer
      className={`bg-[#0B132B] text-slate-300 border-t border-slate-800/90 font-sans ${
        isDashboard ? 'pt-12 pb-10 mt-12' : 'pt-16 pb-12'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* SECTION A — CIVICTAX */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-sky-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 border border-blue-400/30">
                CT
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                  CIVICTAX
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </span>
                <p className="text-[10px] uppercase font-bold tracking-widest text-sky-400">
                  Municipal E-Governance
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300/90 leading-relaxed font-medium">
              Property Tax Assessment and Payment Management System.
            </p>

            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise smart-city revenue administration platform providing automated property valuations, digital payment reconciliation, and statutory citizen grievance redressal.
            </p>

            <div className="pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick Navigation
              </p>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link
                    to="/"
                    className="text-slate-400 hover:text-sky-400 transition-colors duration-150 inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-sky-400 transition-colors"></span>
                    Home Portal
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="text-slate-400 hover:text-sky-400 transition-colors duration-150 inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-sky-400 transition-colors"></span>
                    About Corporation
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="text-slate-400 hover:text-sky-400 transition-colors duration-150 inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-sky-400 transition-colors"></span>
                    Citizen Services
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-slate-400 hover:text-sky-400 transition-colors duration-150 inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-sky-400 transition-colors"></span>
                    Helpdesk & Support
                  </Link>
                </li>
                <li>
                  <Link
                    to="/transparency"
                    className="text-slate-400 hover:text-teal-400 transition-colors duration-150 inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-teal-400 transition-colors"></span>
                    Public Transparency Portal
                  </Link>
                </li>
                <li>
                  <Link
                    to="/verify-receipt"
                    className="text-slate-400 hover:text-emerald-400 transition-colors duration-150 inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-emerald-400 transition-colors"></span>
                    Verify Payment Receipt
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* SECTION B — PLATFORM */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Platform Features
              </h4>
              <div className="h-0.5 w-10 bg-blue-500 rounded-full mt-2"></div>
            </div>

            <p className="text-xs text-slate-400">
              Direct access to authoritative municipal tax administration modules:
            </p>

            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  to={getPlatformRoute('properties')}
                  className="group flex items-start gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 mt-0.5 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <div>
                    <span className="font-semibold block text-slate-200 group-hover:text-blue-300 transition-colors">
                      Property Management
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Registration, survey boundaries & GIS verification
                    </span>
                  </div>
                </Link>
              </li>

              <li>
                <Link
                  to={getPlatformRoute('assessments')}
                  className="group flex items-start gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 mt-0.5 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <div>
                    <span className="font-semibold block text-slate-200 group-hover:text-blue-300 transition-colors">
                      Tax Assessment
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Statutory unit area formula & automated demands
                    </span>
                  </div>
                </Link>
              </li>

              <li>
                <Link
                  to={getPlatformRoute('payments')}
                  className="group flex items-start gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 mt-0.5 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <div>
                    <span className="font-semibold block text-slate-200 group-hover:text-blue-300 transition-colors">
                      Tax Payments
                    </span>
                    <span className="text-[11px] text-slate-400">
                      UPI, Card & NetBanking with instant receipts
                    </span>
                  </div>
                </Link>
              </li>

              <li>
                <Link
                  to={getPlatformRoute('grievances')}
                  className="group flex items-start gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 mt-0.5 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <div>
                    <span className="font-semibold block text-slate-200 group-hover:text-blue-300 transition-colors">
                      Grievance Management
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Dispute intake, SLA tracking & ward resolution
                    </span>
                  </div>
                </Link>
              </li>

              <li>
                <Link
                  to={getPlatformRoute('reports')}
                  className="group flex items-start gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 mt-0.5 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <div>
                    <span className="font-semibold block text-slate-200 group-hover:text-blue-300 transition-colors">
                      Reports and Analytics
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Revenue collection metrics & ward performance
                    </span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          {/* SECTION C — DEVELOPED BY */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Developed By
              </h4>
              <div className="h-0.5 w-10 bg-amber-500 rounded-full mt-2"></div>
            </div>

            {/* Developer Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/60 border border-slate-700/80 shadow-inner space-y-3">
              <div>
                <a
                  href="https://dileepkumarpallapu.github.io/My-Portfolio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-sm font-bold text-white hover:text-amber-300 transition-colors"
                >
                  <span>Pallapu Dileep Kumar</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </a>
                <p className="text-[11px] text-amber-400 font-semibold mt-0.5">
                  CSE Student | Full-Stack Developer
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  AI &amp; Salesforce Enthusiast
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-700/60 pt-2.5">
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <GraduationCap className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Vel Tech University</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Computer Science &amp; Engineering</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Chennai, India</span>
                </div>
              </div>

              {/* Direct Email Link */}
              <div className="pt-1">
                <a
                  href="mailto:dileepkumarpallapu28@gmail.com"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition-all duration-150 w-full justify-center group"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="truncate">dileepkumarpallapu28@gmail.com</span>
                </a>
              </div>

              {/* Social and Portfolio Icon Links */}
              <div className="flex items-center justify-center gap-2.5 pt-1">
                {/* GitHub */}
                <a
                  href="https://github.com/DileepKumarPallapu"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub Profile - Pallapu Dileep Kumar"
                  title="GitHub: https://github.com/DileepKumarPallapu"
                  className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/40"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/in/dileep-kumar-pallapu"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn Profile - Pallapu Dileep Kumar"
                  title="LinkedIn: https://www.linkedin.com/in/dileep-kumar-pallapu"
                  className="p-2 rounded-xl bg-slate-800/90 hover:bg-[#0077b5]/30 text-slate-300 hover:text-[#0077b5] border border-slate-700/80 hover:border-[#0077b5]/50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#0077b5]/20"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                </a>

                {/* Portfolio */}
                <a
                  href="https://dileepkumarpallapu.github.io/My-Portfolio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Personal Portfolio - Pallapu Dileep Kumar"
                  title="Portfolio: https://dileepkumarpallapu.github.io/My-Portfolio/"
                  className="p-2 rounded-xl bg-slate-800/90 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700/80 hover:border-emerald-500/50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-500/20"
                >
                  <Globe className="w-4 h-4" />
                </a>

                {/* Email Direct Button */}
                <a
                  href="mailto:dileepkumarpallapu28@gmail.com"
                  aria-label="Send Email to Pallapu Dileep Kumar"
                  title="Email: dileepkumarpallapu28@gmail.com"
                  className="p-2 rounded-xl bg-slate-800/90 hover:bg-sky-500/20 text-slate-300 hover:text-sky-400 border border-slate-700/80 hover:border-sky-500/50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-sky-500/20"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* SECTION D — PROJECT INFORMATION */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                Project Information
              </h4>
              <div className="h-0.5 w-10 bg-emerald-500 rounded-full mt-2"></div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              CivicTax is an enterprise municipal tax and revenue management system demonstrating secure e-governance workflows.
            </p>

            {/* Actual Tech Stack Implementation */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Technology Architecture
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-blue-950/80 border border-blue-800/60 text-blue-300 text-[10px] font-medium font-mono">
                  React 19 &amp; Vite
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-[10px] font-medium font-mono">
                  TypeScript
                </span>
                <span className="px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-800/60 text-sky-300 text-[10px] font-medium font-mono">
                  Tailwind CSS
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-[10px] font-medium font-mono">
                  Node.js &amp; Express
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-800/60 text-amber-300 text-[10px] font-medium font-mono">
                  Salesforce Apex REST
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800/60 text-purple-300 text-[10px] font-medium font-mono">
                  OAuth 2.0 PKCE
                </span>
              </div>
            </div>

            {/* Policies and Governance Links */}
            <div className="pt-2 border-t border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Statutory &amp; Policies
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setActiveModal('privacy')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('terms')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
                <Link to="/transparency" className="hover:text-white transition-colors">
                  Citizen Charter
                </Link>
                <Link to="/transparency" className="hover:text-white transition-colors">
                  RTI Governance
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Divider */}
        <div className="border-t border-slate-800/90 my-10"></div>

        {/* Copyright Area */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="font-medium text-slate-300">
              &copy; 2026 CivicTax. All Rights Reserved.
            </p>
            <p className="text-[11px] text-slate-500">
              Academic Demonstration Project &bull; Department of Computer Science &amp; Engineering &bull; Vel Tech University
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Designed &amp; Developed by</span>
            <a
              href="https://dileepkumarpallapu.github.io/My-Portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 group"
            >
              <span>Pallapu Dileep Kumar</span>
              <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      {/* Lightweight Privacy Policy Modal */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-300 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 text-white">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold">CivicTax Privacy Policy</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              CivicTax respects citizen data confidentiality under statutory municipal guidelines. Taxpayer details, property ownership documents, and payment records are encrypted and isolated using enterprise role-based access control (RBAC).
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero unauthorized exposure: Citizen records are private to property owners and designated municipal ward officers.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Payment ledger security: Transactions utilize cryptographic tokens and immutable transaction references.</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightweight Terms of Service Modal */}
      {activeModal === 'terms' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-300 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 text-white">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold">CivicTax Terms of Service</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              By accessing the CivicTax portal, citizens and municipal employees agree to abide by municipal property assessment statutes and honest revenue disclosure standards.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Statutory calculations: Property taxes are calculated in accordance with published municipal gazette unit rates.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Formal dispute timeline: Reassessment and grievance dockets are subject to municipal SLA timelines.</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Accept &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
