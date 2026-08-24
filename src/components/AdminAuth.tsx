import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';

export type AdminAuthMode = 'signin' | 'signup';

interface AdminAuthProps {
  initialMode?: AdminAuthMode;
  onSuccess?: () => void;
}

export const AdminAuth: React.FC<AdminAuthProps> = ({ initialMode = 'signin', onSuccess }) => {
  const { login, signup } = useAuth();
  const { navigate } = useRouter();

  const [mode, setMode] = useState<AdminAuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Status feedback states
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inactivity timeout message from previous session if any
  const [inactivityNotice, setInactivityNotice] = useState<string | null>(() => {
    try {
      const reason = sessionStorage.getItem('afinbo_admin_logout_reason');
      return reason === 'inactivity'
        ? 'Your administrator session expired after 30 minutes of inactivity. Please sign in again.'
        : null;
    } catch {
      return null;
    }
  });

  // Listen to session expiry events
  useEffect(() => {
    const handleSessionExpired = () => {
      setInactivityNotice('Your administrator session expired after 30 minutes of inactivity. Please sign in again.');
      setMode('signin');
    };
    window.addEventListener('afinbo_session_expired', handleSessionExpired);
    return () => window.removeEventListener('afinbo_session_expired', handleSessionExpired);
  }, []);

  const clearFeedback = () => {
    setErrorMessage('');
    if (inactivityNotice) setInactivityNotice(null);
  };

  const handleToggleMode = (newMode: AdminAuthMode) => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
    if (inactivityNotice) setInactivityNotice(null);
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        // Sign Up Action - strictly register to Supabase and switch to Sign In mode
        const result = await signup(name, email, password);

        if (!result.success) {
          setErrorMessage(result.error || 'Failed to register.');
          return; // STOP execution here
        }

        // Successfully created account: Clear fields and switch to signin mode
        setName('');
        setEmail('');
        setPassword('');
        setMode('signin');
        setSuccessMessage('Account created successfully. Please sign in.');
      } else {
        // Sign In Action
        const result = await login(email, password);

        if (!result.success) {
          setErrorMessage(result.error || 'Invalid email or password');
        } else {
          if (onSuccess) {
            onSuccess();
          } else {
            navigate('/admin');
          }
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-rose-100 selection:text-rose-900 font-sans antialiased">
      <div className="relative w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 overflow-hidden">
        {/* Top brand accent gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-rose-500 to-blue-600" />

        {/* AFINBO Brand Header */}
        <div className="text-center mb-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2.5 group cursor-pointer transition hover:opacity-90"
            title="Return to AFINBO Home Page"
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-rose-600/20 group-hover:scale-105 transition">
              A
            </div>
            <span className="text-3xl font-black tracking-tight text-slate-900 group-hover:text-rose-600 transition">
              AFINBO
            </span>
          </button>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
            <span>Restricted Administrator Portal</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-4 tracking-tight">
            {mode === 'signin' ? 'Welcome Back, Administrator' : 'Create Administrator Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'signin'
              ? 'Sign in to access catalog management, RFQ procurement quotes, and logs.'
              : 'Register an authorized administrator profile to manage the AFINBO platform.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200/80">
          <button
            type="button"
            onClick={() => handleToggleMode('signin')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleToggleMode('signup')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Inactivity Alert */}
        {inactivityNotice && mode === 'signin' && (
          <div className="mb-4 text-xs text-amber-800 font-semibold bg-amber-50 p-3.5 rounded-xl border border-amber-200 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-amber-900">Session Expired</p>
              <p className="text-[11px] text-amber-700 mt-0.5">{inactivityNotice}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 text-xs text-emerald-800 font-semibold bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-emerald-900">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 text-xs text-rose-800 font-semibold bg-rose-50 p-3.5 rounded-xl border border-rose-200 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-rose-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFeedback();
                  }}
                  placeholder="e.g. Engr. Babatunde Lawal"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition shadow-2xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {mode === 'signup' ? 'Work Email' : 'Email or Username'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={mode === 'signup' ? 'email' : 'text'}
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFeedback();
                }}
                placeholder={mode === 'signup' ? 'admin@afinbo.com' : 'admin@afinbo.com or admin'}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFeedback();
                }}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-[11px] text-slate-400 mt-1">
                Must be at least 6 characters. Passwords are securely hashed with bcrypt.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-70 text-white font-bold text-sm rounded-xl shadow-md shadow-rose-600/20 transition duration-150 flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === 'signup' ? 'Creating Account...' : 'Authenticating...'}</span>
              </>
            ) : (
              <>
                {mode === 'signup' ? <Sparkles className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                <span>{mode === 'signup' ? 'Create Admin Account' : 'Sign In to Admin Portal'}</span>
              </>
            )}
          </button>
        </form>

        {/* Bottom Toggle Link */}
        <div className="pt-5 text-center border-t border-slate-100 mt-6">
          {mode === 'signin' ? (
            <p className="text-xs text-slate-600">
              Don't have an admin account?{' '}
              <button
                type="button"
                onClick={() => handleToggleMode('signup')}
                className="text-rose-600 font-bold hover:text-rose-700 hover:underline cursor-pointer transition ml-1"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-600">
              Already have an admin account?{' '}
              <button
                type="button"
                onClick={() => handleToggleMode('signin')}
                className="text-rose-600 font-bold hover:text-rose-700 hover:underline cursor-pointer transition ml-1"
              >
                Sign In
              </button>
            </p>
          )}

          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs text-slate-400 hover:text-slate-700 transition font-medium cursor-pointer inline-flex items-center gap-1"
            >
              <span>&larr; Return to Public Website</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security badge at bottom */}
      <div className="mt-6 text-center text-slate-400 text-[11px] flex items-center justify-center gap-2">
        <span>AFINBO Nigeria Telecoms</span>
        <span>•</span>
        <span>256-Bit Bcrypt Encrypted</span>
      </div>
    </div>
  );
};
