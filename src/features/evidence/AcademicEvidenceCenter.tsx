import React, { useState } from 'react';
import { TRACEABILITY_MATRIX, TraceabilityItem } from './traceabilityData';
import { Award, BookOpen, CheckCircle, Code, Database, FileText, Layers, Shield, HelpCircle } from 'lucide-react';

export const AcademicEvidenceCenter: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeItem, setActiveItem] = useState<TraceabilityItem | null>(TRACEABILITY_MATRIX[0]);

  const filteredItems = TRACEABILITY_MATRIX.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title Banner */}
      <div className="bg-gradient-to-r from-[#101D32] to-[#1A2E4C] rounded-2xl p-6 text-white shadow-lg border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-8 h-8 text-amber-400" />
              <h1 className="text-2xl font-bold">CivicTax 9.0 — Salesforce Academic Evidence Center</h1>
            </div>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Official Requirement Traceability Matrix, Architecture Mapping, and Faculty Viva Defense Guide for Salesforce Milestone 1 & 2.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-400/30 rounded-lg text-xs font-semibold text-indigo-300">
              Academic Review Candidate
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            selectedCategory === 'ALL'
              ? 'bg-[#101D32] text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Requirements ({TRACEABILITY_MATRIX.length})
        </button>
        <button
          onClick={() => setSelectedCategory('MILESTONE_1_ADMIN')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            selectedCategory === 'MILESTONE_1_ADMIN'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Milestone 1: Admin & Config
        </button>
        <button
          onClick={() => setSelectedCategory('MILESTONE_2_DEV')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            selectedCategory === 'MILESTONE_2_DEV'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Milestone 2: Apex & Automation
        </button>
      </div>

      {/* Grid: Matrix List + Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Traceability List */}
        <div className="lg:col-span-1 space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveItem(item)}
              className={`p-4 rounded-xl border transition cursor-pointer ${
                activeItem?.id === item.id
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-500">{item.id}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {item.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{item.requirement}</h3>
              <p className="text-xs text-slate-500 mt-1">{item.concept}</p>
            </div>
          ))}
        </div>

        {/* Right Column: Detailed Evidence & Viva Card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          {activeItem && (
            <>
              <div className="border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  <Layers className="w-4 h-4" />
                  {activeItem.category}
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{activeItem.requirement}</h2>
                <p className="text-sm text-slate-600 mt-1">{activeItem.concept}</p>
              </div>

              {/* Implementation Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-600" />
                    Target Implementation
                  </span>
                  <p className="text-slate-600">{activeItem.implementation}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-indigo-600" />
                    Metadata / Source Path
                  </span>
                  <p className="font-mono text-indigo-700 break-all">{activeItem.metadataPath}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Test Verification Method
                  </span>
                  <p className="font-mono text-emerald-700">{activeItem.testMethod}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    Source Artifact File
                  </span>
                  <p className="font-mono text-amber-800 break-all">{activeItem.targetArtifact}</p>
                </div>
              </div>

              {/* Faculty Viva Defense Note */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  Faculty Viva Defense Insight
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">{activeItem.vivaNote}</p>
              </div>

              {/* Architecture Order of Execution Highlight */}
              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs space-y-2 font-mono">
                <div className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                  Execution Order Context:
                </div>
                <p className="text-slate-300">
                  UI Input $\rightarrow$ Server Validation $\rightarrow$ Apex REST $\rightarrow$ Before Triggers $\rightarrow$ Validation Rules $\rightarrow$ Save $\rightarrow$ After Triggers (Rollup/Balances) $\rightarrow$ Commit.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
