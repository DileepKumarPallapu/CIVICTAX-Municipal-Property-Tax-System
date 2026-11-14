import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/common/AppSidebar';
import { AppHeader } from '../components/common/AppHeader';

export const DashboardLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#080D18] text-[#172033] dark:text-[#F8FAFC] flex flex-col font-sans transition-colors duration-200">
      {/* Sidebar (no-print) */}
      <div className="no-print">
        <AppSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />
      </div>

      {/* Header (no-print) */}
      <div className="no-print">
        <AppHeader
          isCollapsed={isCollapsed}
          onOpenMobile={() => setIsMobileOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-200 p-4 sm:p-6 lg:p-8 ${
          isCollapsed ? 'md:pl-24' : 'md:pl-72'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
