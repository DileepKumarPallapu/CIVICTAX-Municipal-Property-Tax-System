import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, ArrowRight, UserCheck, Shield, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, role, isLoading } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  // If already authenticated, redirect to the user's role-based dashboard
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      if (role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (role === 'OFFICER') {
        navigate('/officer', { replace: true });
      } else {
        navigate('/citizen', { replace: true });
      }
    }
  }, [isAuthenticated, role, isLoading, navigate]);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    try {
      const user = await login(loginEmail, loginPassword);
      success('Authentication Successful', `Welcome back, ${user.name}!`);

      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'OFFICER') {
        navigate('/officer', { replace: true });
      } else {
        navigate('/citizen', { replace: true });
      }
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please verify credentials.';
      setErrorMessage(msg);
      toastError('Login Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = (role: 'CITIZEN' | 'OFFICER' | 'ADMIN') => {
    if (role === 'ADMIN') {
      setEmail('admin@civictax.demo');
      setPassword('Admin@123');
      handleLogin(undefined, 'admin@civictax.demo', 'Admin@123');
    } else if (role === 'OFFICER') {
      setEmail('officer@civictax.demo');
      setPassword('Officer@123');
      handleLogin(undefined, 'officer@civictax.demo', 'Officer@123');
    } else {
      setEmail('citizen@civictax.demo');
      setPassword('Citizen@123');
      handleLogin(undefined, 'citizen@civictax.demo', 'Citizen@123');
    }
  };

  return (
    <div className="min-h-[calc(100vh-220px)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
            CT
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sign In to CivicTax
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access your property dashboard, assessments, or administrative desk.
          </p>
        </div>

        {/* 1-Click Demo Account Quick Select */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Instant Demo Logins</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold lowercase text-[10px]">1-click access</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('CITIZEN')}
              className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex flex-col items-center gap-1 transition"
            >
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('OFFICER')}
              className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-bold flex flex-col items-center gap-1 transition"
            >
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Officer</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('ADMIN')}
              className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/70 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs font-bold flex flex-col items-center gap-1 transition"
            >
              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@civictax.demo"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <span className="text-[10px] text-slate-400">
                  Citizen@123 / Officer@123 / Admin@123
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-blue-500/20"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Need to register a fresh demo citizen?{' '}
            <Link to="/register-demo" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Create Demo Account
            </Link>
          </div>
        </div>

        {/* Demo Disclaimer */}
        <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p className="leading-relaxed">
            <strong>Demonstration Notice:</strong> Authentication is handled via local browser session persistence for academic review. In Phase 2, this will be wired to Salesforce Connected App OAuth 2.0 & Lightning Identity.
          </p>
        </div>
      </div>
    </div>
  );
};
