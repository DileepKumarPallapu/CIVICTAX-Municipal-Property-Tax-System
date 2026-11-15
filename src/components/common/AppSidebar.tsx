import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Receipt,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  Bell,
  User,
  Users,
  MapPin,
  Percent,
  BarChart3,
  FileSpreadsheet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { currentUser, role, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { info } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    info('Logged out', 'You have successfully signed out.');
    navigate('/', { replace: true });
  };

  interface NavItem {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    section?: string;
  }

  const citizenNav: NavItem[] = [
    { label: 'Citizen Dashboard', path: '/citizen', icon: LayoutDashboard, section: 'Core' },
    { label: 'My Properties', path: '/citizen/properties', icon: Building2, section: 'Properties' },
    { label: 'Register Property', path: '/citizen/register-property', icon: PlusCircle, section: 'Properties' },
    { label: 'Tax Assessments', path: '/citizen/assessments', icon: Receipt, section: 'Finance' },
    { label: 'Payment Portal', path: '/citizen/payments', icon: CreditCard, section: 'Finance' },
    { label: 'Grievance Redressal', path: '/citizen/grievances', icon: AlertTriangle, section: 'Services' },
    { label: 'Reassessment Requests', path: '/citizen/reassessments', icon: RefreshCw, section: 'Services' },
    { label: 'Faculty Demo Guide', path: '/citizen/demo-guide', icon: GraduationCap, section: 'Services' },
    { label: 'Notifications', path: '/citizen/notifications', icon: Bell, badge: unreadCount, section: 'Account' },
    { label: 'Profile Settings', path: '/citizen/profile', icon: User, section: 'Account' },
  ];

  const officerNav: NavItem[] = [
    { label: 'Officer Dashboard', path: '/officer', icon: LayoutDashboard, section: 'Overview' },
    { label: 'Assigned Properties', path: '/officer/assigned-properties', icon: Building2, section: 'Field Verification' },
    { label: 'Property Verification', path: '/officer/verification', icon: CheckSquare, section: 'Field Verification' },
    { label: 'Assessment Review', path: '/officer/assessments', icon: Receipt, section: 'Tax Operations' },
    { label: 'Reassessments', path: '/officer/reassessments', icon: RefreshCw, section: 'Tax Operations' },
    { label: 'Grievance Triage', path: '/officer/grievances', icon: AlertTriangle, section: 'Citizen Cases' },
    { label: 'Payment Monitoring', path: '/officer/payments', icon: CreditCard, section: 'Revenue' },
    { label: 'Municipal GIS Map', path: '/officer/gis', icon: MapPin, section: 'Spatial Intelligence' },
    { label: 'Revenue Recovery', path: '/officer/recovery', icon: AlertTriangle, section: 'Spatial Intelligence' },
    { label: 'Risk & Compliance', path: '/officer/compliance', icon: ShieldCheck, section: 'Spatial Intelligence' },
    { label: 'Zone Analytics', path: '/officer/zone-analytics', icon: BarChart3, section: 'Spatial Intelligence' },
    { label: 'Faculty Demo Guide', path: '/officer/demo-guide', icon: GraduationCap, section: 'Spatial Intelligence' },
    { label: 'Officer Profile', path: '/officer/profile', icon: User, section: 'Account' },
  ];

  const adminNav: NavItem[] = [
    { label: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard, section: 'Executive' },
    { label: 'Command Center', path: '/admin/command-center', icon: BarChart3, section: 'Executive' },
    { label: 'Municipal GIS Map', path: '/admin/gis', icon: MapPin, section: 'Spatial & Recovery' },
    { label: 'Revenue Recovery', path: '/admin/recovery', icon: AlertTriangle, section: 'Spatial & Recovery' },
    { label: 'Risk & Compliance', path: '/admin/compliance', icon: ShieldCheck, section: 'Spatial & Recovery' },
    { label: 'Revenue Forecast Lab', path: '/admin/forecasting', icon: BarChart3, section: 'Spatial & Recovery' },
    { label: 'User Directory', path: '/admin/users', icon: Users, section: 'Administration' },
    { label: 'All Properties', path: '/admin/properties', icon: Building2, section: 'Administration' },
    { label: 'Municipal Zones', path: '/admin/zones', icon: MapPin, section: 'Administration' },
    { label: 'Tax Rate Config', path: '/admin/tax-rates', icon: Percent, section: 'Administration' },
    { label: 'Tax Assessments', path: '/admin/assessments', icon: Receipt, section: 'Financial Operations' },
    { label: 'Treasury & Payments', path: '/admin/payments', icon: CreditCard, section: 'Financial Operations' },
    { label: 'Grievances Oversight', path: '/admin/grievances', icon: AlertTriangle, section: 'Financial Operations' },
    { label: 'Revenue Analytics', path: '/admin/analytics', icon: BarChart3, section: 'Reports & Logs' },
    { label: 'Audit Reports', path: '/admin/reports', icon: FileSpreadsheet, section: 'Reports & Logs' },
    { label: 'Salesforce Gateway', path: '/admin/salesforce', icon: ShieldCheck, section: 'Enterprise Connect' },
    { label: 'Academic Evidence', path: '/admin/evidence', icon: Sparkles, section: 'Enterprise Connect' },
    { label: 'Faculty Demo Guide', path: '/admin/demo-guide', icon: GraduationCap, section: 'Enterprise Connect' },
    { label: 'Audit Trail Ledger', path: '/admin/audit', icon: ShieldCheck, section: 'Enterprise Connect' },
    { label: 'System Settings', path: '/admin/settings', icon: Settings, section: 'System' },
  ];

  const navItems = role === 'ADMIN' ? adminNav : role === 'OFFICER' ? officerNav : citizenNav;

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-[#0C1424] text-slate-700 dark:text-slate-200 select-none border-r border-[#E2E8F0] dark:border-[#26354B] shadow-sm transition-colors duration-200">
      {/* Brand & Logo */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div
          className={`h-16 flex items-center border-b border-[#E2E8F0] dark:border-[#26354B] px-3.5 ${
            isCollapsed ? 'justify-between px-2.5' : 'justify-between'
          }`}
        >
          <NavLink
            to={role === 'ADMIN' ? '/admin' : role === 'OFFICER' ? '/officer' : '/citizen'}
            className="flex items-center gap-3 overflow-hidden cursor-pointer"
            title="CIVICTAX Smart Governance"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#14B8A6] text-white flex items-center justify-center font-extrabold text-sm shadow-md flex-shrink-0">
              CT
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-[#172033] dark:text-[#F8FAFC] text-base tracking-tight leading-none">
                  CIVICTAX
                </span>
                <span className="text-[10px] text-[#0D9488] dark:text-[#14B8A6] font-semibold tracking-wider uppercase mt-1">
                  Smart Governance
                </span>
              </div>
            )}
          </NavLink>
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#17243A] transition cursor-pointer"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Role Tag */}
        {!isCollapsed ? (
          <div className="px-4 py-3 bg-slate-50/80 dark:bg-[#111C2E] border-b border-[#E2E8F0] dark:border-[#26354B]">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <div className="text-xs truncate">
                <span className="font-bold text-[#172033] dark:text-white uppercase text-[10px] tracking-wider">
                  {role} PORTAL
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                  {currentUser?.name}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="py-2.5 flex justify-center border-b border-[#E2E8F0] dark:border-[#26354B]"
            title={`${role} Portal: ${currentUser?.name}`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-2 space-y-1 mt-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/citizen' || item.path === '/officer' || item.path === '/admin'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-[#17243A]'
                } ${isCollapsed ? 'justify-center px-0 w-11 h-10 mx-auto' : ''}`
              }
              title={item.label}
            >
              <item.icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {item.badge !== undefined && item.badge > 0 && !isCollapsed && (
                <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                  {item.badge}
                </span>
              )}
              {/* Tooltip on collapse */}
              {isCollapsed && (
                <div className="hidden md:group-hover:flex absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none items-center border border-slate-700 animate-in fade-in zoom-in-95 duration-100">
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-rose-500 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-[#E2E8F0] dark:border-[#26354B] flex-shrink-0">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer group relative ${
            isCollapsed ? 'justify-center px-0 w-11 h-10 mx-auto' : ''
          }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
          {isCollapsed && (
            <div className="hidden md:group-hover:flex absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none border border-slate-700">
              Sign Out
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Fixed Sidebar */}
      <aside
        className={`hidden md:block fixed top-0 left-0 h-screen z-30 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[76px]' : 'w-[250px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/60 z-40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Slide-in Navigation Drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-screen w-[260px] z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
