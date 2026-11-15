import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/common/AppSidebar';
import { AppHeader } from '../components/common/AppHeader';
import { AppFooter } from '../components/common/AppFooter';

export const DashboardLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#080D18] text-[#172033] dark:text-[#F8FAFC] flex font-sans transition-colors duration-200 overflow-x-hidden">
      {/* Sidebar - Fixed Left Position (no-print) */}
      <div className="no-print">
        <AppSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />
      </div>

      {/* Main Content Wrapper - Automatically reserves space for fixed sidebar */}
      <div
        className={`flex-1 flex flex-col min-h-screen w-full min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:ml-[76px]' : 'md:ml-[250px]'
        }`}
      >
        {/* Header (no-print) */}
        <div className="no-print sticky top-0 z-20">
          <AppHeader
            isCollapsed={isCollapsed}
            onOpenMobile={() => setIsMobileOpen(true)}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* Enterprise App Footer (no-print) */}
        <div className="no-print mt-auto">
          <AppFooter isDashboard />
        </div>
      </div>
    </div>
  );
};
