import React, { useState } from 'react';
import { supabase, isSupabaseConfigured, getSupabaseConfig, saveSupabaseCredentials } from '../lib/supabase';
import { useAuth, verifyPassword } from '../lib/auth';
import { useRouter } from '../lib/router';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Sparkles,
  Database,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Settings,
} from 'lucide-react';

interface AdminAuthProps {
  initialIsSignUp?: boolean;
  onSuccess?: () => void;
}

export const AdminAuth: React.FC<AdminAuthProps> = ({ initialIsSignUp = false, onSuccess }) => {
  const router = useRouter();
  const { login } = useAuth();

  // 1. State & View Toggle: boolean isSignUp to toggle between Sign In and Sign Up views
  const [isSignUp, setIsSignUp] = useState<boolean>(initialIsSignUp);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form input fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // UI state feedback
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Supabase connection configuration state & modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [customSupabaseUrl, setCustomSupabaseUrl] = useState<string>(() => getSupabaseConfig().url);
  const [customSupabaseAnonKey, setCustomSupabaseAnonKey] = useState<string>(() => getSupabaseConfig().anonKey);
  const [configSaveStatus, setConfigSaveStatus] = useState<string>('');

  // Check if Supabase is connected
  const configured = isSupabaseConfigured();

  // Toggle between Sign In & Sign Up views
  const handleToggleView = (signUpMode: boolean) => {
    setIsSignUp(signUpMode);
    setErrorMessage('');
    setPassword('');
  };

  // Save Supabase credentials directly from UI
  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    const success = saveSupabaseCredentials(customSupabaseUrl, customSupabaseAnonKey);
    if (success) {
      setConfigSaveStatus('Supabase credentials saved successfully!');
      setTimeout(() => {
        setIsConfigModalOpen(false);
        setConfigSaveStatus('');
      }, 1200);
    } else {
      setConfigSaveStatus('Failed to save credentials. Please verify your inputs.');
    }
  };

  // 2. Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const inputPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !inputPassword) {
      alert('Please fill in all fields (Name, Email, Password).');
      return;
    }

    if (!isSupabaseConfigured()) {
      setIsConfigModalOpen(true);
      alert('Supabase is not configured with your Project URL & Anon Key yet. Please provide your credentials in the setup window.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Derive username before inserting
      const generatedUsername = trimmedEmail.split('@')[0];

      // Call Supabase insert directly (database trigger automatically hashes password_hash)
      const { data, error } = await supabase
        .from('admin')
        .insert([
          {
            name: trimmedName,
            email: trimmedEmail,
            password_hash: inputPassword,
            username: generatedUsername,
          },
        ]);

      if (error) {
        console.error('Supabase Insert Error:', error);
        alert('Failed to register: ' + error.message);
        setErrorMessage(error.message);
        return; // STOP execution here - DO NOT redirect/navigate
      }

      console.log('Supabase Insert Success:', data);
      alert('Registration successful! Please sign in.');

      // Clear form state
      setName('');
      setEmail('');
      setPassword('');

      // Switch to Sign In view
      setIsSignUp(false);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('Registration Exception:', err);
      alert('Failed to register: ' + errMsg);
      setErrorMessage(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim();
    const inputPassword = password.trim();

    if (!trimmedEmail || !inputPassword) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (!isSupabaseConfigured()) {
      setIsConfigModalOpen(true);
      alert('Supabase is not configured yet. Please provide your Project URL & Anon Key.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Query admin table by email
      const { data: userRow, error } = await supabase
        .from('admin')
        .select('*')
        .ilike('email', trimmedEmail)
        .maybeSingle();

      if (error || !userRow) {
        if (error) console.error('Supabase Query Error:', error);
        setErrorMessage('Invalid credentials');
        return; // STOP execution
      }

      // Password Check against stored hash (handles pgcrypto/bcrypt hash or fallback)
      const storedHash = (userRow.password_hash ?? userRow.password ?? '') as string;
      if (!storedHash) {
        setErrorMessage('Invalid credentials');
        return;
      }

      let isMatch = false;
      const isBcryptFormat = /^\$2[abyx]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(storedHash) || storedHash.startsWith('$2');

      if (isBcryptFormat) {
        isMatch = await verifyPassword(inputPassword, storedHash);
      } else {
        isMatch = (inputPassword === storedHash);
      }

      if (!isMatch) {
        setErrorMessage('Invalid credentials');
        return;
      }

      // Sync authentication session with App context
      await login(trimmedEmail, inputPassword);

      if (onSuccess) {
        onSuccess();
      }

      // Success Action: Only call router.push('/admin/dashboard') inside the Sign In handler AFTER verification succeeds
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Invalid credentials';
      console.error('Sign In Error:', err);
      setErrorMessage('Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sqlSetupScript = `-- Run this in your Supabase SQL Editor to set up the 'admin' table & RLS policies
CREATE TABLE IF NOT EXISTS public.admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

-- Allow anonymous registration and select for login verification
DROP POLICY IF EXISTS "Allow anon admin insert" ON public.admin;
CREATE POLICY "Allow anon admin insert" ON public.admin FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon admin select" ON public.admin;
CREATE POLICY "Allow anon admin select" ON public.admin FOR SELECT TO anon, authenticated USING (true);`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-rose-100 selection:text-rose-900 font-sans antialiased">
      {/* Centered Auth Card Component */}
      <div className="relative w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 overflow-hidden">
        {/* Brand accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-rose-500 to-blue-600" />

        {/* Top Connection Status Badge & Settings trigger */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
              configured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title="Click to view or edit Supabase connection credentials"
          >
            <Database className="w-3 h-3" />
            <span>{configured ? 'Supabase Connected' : 'Supabase Config Required'}</span>
            <Settings className="w-3 h-3 ml-0.5 opacity-70" />
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <button
            type="button"
            onClick={() => router.push('/')}
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
            {isSignUp ? 'Create Administrator Account' : 'Welcome Back, Administrator'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isSignUp
              ? 'Register an authorized administrator profile to manage the AFINBO platform.'
              : 'Sign in to access catalog management, RFQ procurement quotes, and logs.'}
          </p>
        </div>

        {/* 1. View Toggle inside one card */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200/80">
          <button
            type="button"
            onClick={() => handleToggleView(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isSignUp
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleToggleView(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isSignUp
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert Display */}
        {errorMessage && (
          <div className="mb-4 text-xs text-rose-800 font-semibold bg-rose-50 p-3.5 rounded-xl border border-rose-200 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-medium text-rose-700">{errorMessage}</p>
              {errorMessage.toLowerCase().includes('row-level security') && (
                <p className="text-[11px] text-rose-600 mt-1">
                  💡 Hint: Enable an anonymous INSERT policy on your Supabase <code>admin</code> table. Click "Supabase Config" above to view the SQL script.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Auth Form */}
        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
          {/* Sign Up Fields: Full Name */}
          {isSignUp && (
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
                    setErrorMessage('');
                  }}
                  placeholder="e.g. Engr. Babatunde Lawal"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {isSignUp ? 'Work Email' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="admin@afinbo.com"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition shadow-2xs"
              />
            </div>
          </div>

          {/* Password Field */}
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
                  setErrorMessage('');
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
            {isSignUp && (
              <p className="text-[11px] text-slate-400 mt-1">
                Must be at least 6 characters. Passwords are automatically encrypted by Supabase.
              </p>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-70 text-white font-bold text-sm rounded-xl shadow-md shadow-rose-600/20 transition duration-150 flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isSignUp ? 'Creating Account...' : 'Authenticating...'}</span>
              </>
            ) : (
              <>
                {isSignUp ? <Sparkles className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                <span>{isSignUp ? 'Create Admin Account' : 'Sign In to Admin Portal'}</span>
              </>
            )}
          </button>
        </form>

        {/* Bottom Toggle Link */}
        <div className="pt-5 text-center border-t border-slate-100 mt-6">
          {!isSignUp ? (
            <p className="text-xs text-slate-600">
              Don't have an admin account?{' '}
              <button
                type="button"
                onClick={() => handleToggleView(true)}
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
                onClick={() => handleToggleView(false)}
                className="text-rose-600 font-bold hover:text-rose-700 hover:underline cursor-pointer transition ml-1"
              >
                Sign In
              </button>
            </p>
          )}

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="hover:text-slate-700 transition font-medium cursor-pointer inline-flex items-center gap-1"
            >
              <span>&larr; Return to Public Website</span>
            </button>
          </div>
        </div>
      </div>

      {/* Supabase Connection Setup Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Supabase Connection Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Enter your live Supabase Project URL and Public Anon Key. These credentials will be stored securely in your browser's local store so signup and login save directly to your Supabase PostgreSQL database.
            </p>

            <form onSubmit={handleSaveConnection} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://xyzproject.supabase.co"
                  value={customSupabaseUrl}
                  onChange={(e) => setCustomSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supabase Anon Key
                </label>
                <input
                  type="text"
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={customSupabaseAnonKey}
                  onChange={(e) => setCustomSupabaseAnonKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 font-mono"
                />
              </div>

              {configSaveStatus && (
                <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{configSaveStatus}</span>
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Save & Connect
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </form>

            {/* SQL Helper Script to Copy */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  PostgreSQL Table & RLS Setup
                </span>
                <button
                  type="button"
                  onClick={copySqlToClipboard}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre className="text-[10px] bg-slate-900 text-slate-200 p-2.5 rounded-lg overflow-x-auto max-h-28 font-mono">
                {sqlSetupScript}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Security badge at bottom */}
      <div className="mt-6 text-center text-slate-400 text-[11px] flex items-center justify-center gap-2">
        <span>AFINBO Nigeria Telecoms</span>
        <span>•</span>
        <span>Supabase PostgreSQL Integration</span>
      </div>
    </div>
  );
};
