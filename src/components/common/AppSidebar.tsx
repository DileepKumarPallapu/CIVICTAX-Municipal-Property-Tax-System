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
    navigate('/login');
  };

  // Nav Item Definition
  interface NavItem {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const citizenNav: NavItem[] = [
    { label: 'Citizen Dashboard', path: '/citizen', icon: LayoutDashboard },
    { label: 'My Properties', path: '/citizen/properties', icon: Building2 },
    { label: 'Register Property', path: '/citizen/register-property', icon: PlusCircle },
    { label: 'Tax Assessments', path: '/citizen/assessments', icon: Receipt },
    { label: 'Payment Portal', path: '/citizen/payments', icon: CreditCard },
    { label: 'Grievances', path: '/citizen/grievances', icon: AlertTriangle },
    { label: 'Reassessments', path: '/citizen/reassessments', icon: RefreshCw },
    { label: 'Notifications', path: '/citizen/notifications', icon: Bell, badge: unreadCount },
    { label: 'Profile Settings', path: '/citizen/profile', icon: User },
  ];

  const officerNav: NavItem[] = [
    { label: 'Officer Dashboard', path: '/officer', icon: LayoutDashboard },
    { label: 'Assigned Properties', path: '/officer/assigned-properties', icon: Building2 },
    { label: 'Property Verification', path: '/officer/verification', icon: CheckSquare },
    { label: 'Assessment Review', path: '/officer/assessments', icon: Receipt },
    { label: 'Reassessments', path: '/officer/reassessments', icon: RefreshCw },
    { label: 'Grievance Triage', path: '/officer/grievances', icon: AlertTriangle },
    { label: 'Payment Monitoring', path: '/officer/payments', icon: CreditCard },
    { label: 'Municipal GIS Map', path: '/officer/gis', icon: MapPin },
    { label: 'Revenue Recovery', path: '/officer/recovery', icon: AlertTriangle },
    { label: 'Risk & Compliance', path: '/officer/compliance', icon: ShieldCheck },
    { label: 'Zone Analytics', path: '/officer/zone-analytics', icon: BarChart3 },
    { label: 'Officer Profile', path: '/officer/profile', icon: User },
  ];

  const adminNav: NavItem[] = [
    { label: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Command Center', path: '/admin/command-center', icon: BarChart3 },
    { label: 'Municipal GIS Map', path: '/admin/gis', icon: MapPin },
    { label: 'Revenue Recovery', path: '/admin/recovery', icon: AlertTriangle },
    { label: 'Risk & Compliance', path: '/admin/compliance', icon: ShieldCheck },
    { label: 'Revenue Forecast Lab', path: '/admin/forecasting', icon: BarChart3 },
    { label: 'User Directory', path: '/admin/users', icon: Users },
    { label: 'All Properties', path: '/admin/properties', icon: Building2 },
    { label: 'Municipal Zones', path: '/admin/zones', icon: MapPin },
    { label: 'Tax Rate Config', path: '/admin/tax-rates', icon: Percent },
    { label: 'Tax Assessments', path: '/admin/assessments', icon: Receipt },
    { label: 'Treasury & Payments', path: '/admin/payments', icon: CreditCard },
    { label: 'Grievances Oversight', path: '/admin/grievances', icon: AlertTriangle },
    { label: 'Revenue Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Audit Reports', path: '/admin/reports', icon: FileSpreadsheet },
    { label: 'Salesforce Gateway', path: '/admin/salesforce', icon: ShieldCheck },
    { label: 'Academic Evidence', path: '/admin/evidence', icon: ShieldCheck },
    { label: 'Audit Trail Ledger', path: '/admin/audit', icon: ShieldCheck },
    { label: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  const navItems = role === 'ADMIN' ? adminNav : role === 'OFFICER' ? officerNav : citizenNav;

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-[#101D32] text-slate-200 select-none border-r border-[#19283D] shadow-xl">
      {/* Brand & Logo */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#19283D]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-[#405CF5] text-white flex items-center justify-center font-extrabold text-base shadow-md flex-shrink-0">
              CT
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-white text-base tracking-tight leading-none">
                  CIVICTAX
                </span>
                <span className="text-[10px] text-[#13A58B] font-semibold tracking-wider uppercase mt-1">
                  Municipal Portal
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#19283D] transition cursor-pointer"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Role Tag */}
        {!isCollapsed && (
          <div className="px-4 py-3 bg-[#19283D]/60 border-b border-[#19283D]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#13A58B] flex-shrink-0" />
              <div className="text-xs truncate">
                <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                  {role} PORTAL
                </span>
                <p className="text-[10px] text-slate-400 truncate">
                  {currentUser?.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-2 space-y-1 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/citizen' || item.path === '/officer' || item.path === '/admin'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-[#405CF5] text-white shadow-md shadow-indigo-500/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#19283D]'
                }`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {item.badge !== undefined && item.badge > 0 && !isCollapsed && (
                <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-[#19283D]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs text-rose-400 hover:text-white hover:bg-rose-600/20 transition-colors cursor-pointer"
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block fixed top-0 left-0 h-screen z-40 transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/60 z-40 backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-screen w-64 z-50 transform transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
