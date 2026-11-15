import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Sparkles, Search, GraduationCap } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NotificationDropdown } from './NotificationDropdown';
import { UserProfileMenu } from './UserProfileMenu';
import { GlobalSearchModal } from './GlobalSearchModal';
import { useAuth } from '../../context/AuthContext';

interface AppHeaderProps {
  onOpenMobile: () => void;
  isCollapsed: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenMobile }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { role } = useAuth();

  const demoGuidePath =
    role === 'ADMIN'
      ? '/admin/demo-guide'
      : role === 'OFFICER'
      ? '/officer/demo-guide'
      : '/citizen/demo-guide';

  return (
    <>
      <header className="h-16 bg-white/90 dark:bg-[#080D18]/90 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#26354B] transition-colors duration-200">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left: Mobile trigger & Search trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobile}
              className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-[#17243A] cursor-pointer"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Quick Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-100/70 hover:bg-slate-100 dark:bg-[#111C2E] dark:hover:bg-[#17243A] border border-[#E2E8F0] dark:border-[#26354B] text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="hidden sm:inline font-medium">Search records, parcels, or receipts (Ctrl+K)...</span>
              <span className="sm:hidden font-medium">Search...</span>
            </button>
          </div>

          {/* Right: Actions, Notifications, Theme, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to={demoGuidePath}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition shadow-2xs"
              title="Open Faculty Evaluation & Viva Defense Guide"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
              <span>Faculty Demo Guide</span>
            </Link>

            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 text-[11px] font-semibold text-[#2563EB] dark:text-blue-400">
              <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>CivicTax 2.0</span>
            </div>

            <ThemeToggle />
            <NotificationDropdown />
            <div className="h-6 w-px bg-slate-200 dark:bg-[#26354B] mx-0.5" />
            <UserProfileMenu />
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
