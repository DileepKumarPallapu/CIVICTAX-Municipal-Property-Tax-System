import React, { useState } from 'react';
import { Menu, ShieldAlert, Sparkles, Search } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NotificationDropdown } from './NotificationDropdown';
import { UserProfileMenu } from './UserProfileMenu';
import { GlobalSearchModal } from './GlobalSearchModal';

interface AppHeaderProps {
  onOpenMobile: () => void;
  isCollapsed: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenMobile, isCollapsed }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header
        className={`sticky top-0 z-20 h-16 bg-white/90 dark:bg-[#101D32]/90 backdrop-blur-md border-b border-[#E7EBF2] dark:border-[#19283D] transition-all duration-300 ${
          isCollapsed ? 'md:pl-16' : 'md:pl-64'
        }`}
      >
        <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left: Mobile trigger & Search trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobile}
              className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-[#19283D] cursor-pointer"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Quick Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#19283D] dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search records (Ctrl+K)...</span>
              <span className="sm:hidden">Search...</span>
            </button>
          </div>

          {/* Right: Actions, Notifications, Theme, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-[11px] font-semibold text-[#405CF5] dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CivicTax 7.0 Smart Governance</span>
            </div>

            <ThemeToggle />
            <NotificationDropdown />
            <div className="h-6 w-px bg-slate-200 dark:bg-[#19283D] mx-0.5" />
            <UserProfileMenu />
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
