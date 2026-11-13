import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Building, Shield, Award, Users, BookOpen, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <PageHeader
        title="About CivicTax"
        subtitle="Transforming municipal governance through transparency, mathematical accuracy, and citizen accessibility."
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'About' }]}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mb-4">
            <Building className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Our Mission</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            To provide an open, transparent digital property tax management infrastructure that eliminates clerical delays and empowers both taxpayers and civic authorities.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center mb-4">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Statutory Compliance</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Engineered in strict accordance with standard municipal corporation property tax acts, unit area assessment models, and statutory grievance timelines.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center mb-4">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Academic Excellence</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Developed as a comprehensive full-stack software architecture showcase, demonstrating role-based access, financial accuracy, and future Salesforce integration readiness.
          </p>
        </div>
      </div>

      {/* Deep-dive content */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          The Municipal Problem Statement
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Municipal corporations govern sprawling urban zones spanning tens of thousands of properties across residential societies, commercial retail streets, and heavy manufacturing clusters. Under legacy paper-based workflows:
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <li className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
            <span>Manual calculations led to frequent clerical errors and loss of municipal tax revenue.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
            <span>Inconsistent property records and conflicting ownership deeds caused disputes and litigation.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
            <span>Delayed physical approvals left citizens waiting months for certified tax assessments.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
            <span>Lack of grievance tracking created citizen dissatisfaction and unaccountable service delivery.</span>
          </li>
        </ul>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Want to test the platform?</span>
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
          >
            Launch Interactive Demo
          </Link>
        </div>
      </div>
    </div>
  );
};
