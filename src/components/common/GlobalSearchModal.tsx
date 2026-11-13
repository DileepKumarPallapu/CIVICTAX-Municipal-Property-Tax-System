import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Building2, Receipt, CreditCard, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlobalSearchService } from '../../services/globalSearchService';
import { GlobalSearchResultItem } from '../../types';

export const GlobalSearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        const matches = GlobalSearchService.search(query, currentUser);
        setResults(matches);
      } else {
        setResults([]);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, currentUser]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PROPERTY':
        return <Building2 className="w-4 h-4 text-blue-500" />;
      case 'ASSESSMENT':
        return <Receipt className="w-4 h-4 text-indigo-500" />;
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-teal-500" />;
      case 'GRIEVANCE':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#101D32] rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by property #, owner, assessment, receipt, or grievance..."
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results / Empty states */}
        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
          {query.trim().length < 2 && (
            <div className="py-8 text-center text-xs text-slate-400">
              Type at least 2 characters to search municipal records across all portals.
            </div>
          )}

          {query.trim().length >= 2 && results.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching records found for "{query}".
            </div>
          )}

          {results.map((res) => (
            <div
              key={`${res.category}-${res.id}`}
              onClick={() => handleSelect(res.linkUrl)}
              className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#19283D] border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  {getCategoryIcon(res.category)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {res.title}
                    </p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {res.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{res.subtitle}</p>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#405CF5] group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Global Search (Role: {currentUser?.role})</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            Esc to close
          </button>
        </div>
      </div>
    </div>
  );
};
