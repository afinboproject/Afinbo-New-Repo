import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
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
} from 'lucide-react';

interface AdminAuthProps {
  initialIsSignUp?: boolean;
  onSuccess?: () => void;
}

export const AdminAuth: React.FC<AdminAuthProps> = ({ initialIsSignUp = false, onSuccess }) => {
  const router = useRouter();
  const { login } = useAuth();

  // State & View Toggle: boolean isSignUp to toggle between Sign In and Sign Up views
  const [isSignUp, setIsSignUp] = useState<boolean>(initialIsSignUp);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form input fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // UI state feedback
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Toggle between Sign In & Sign Up views
  const handleToggleView = (signUpMode: boolean) => {
    setIsSignUp(signUpMode);
    setErrorMessage('');
    setPassword('');
  };

  // Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const inputPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !inputPassword) {
      setErrorMessage('Please fill in all fields (Name, Email, Password).');
      return;
    }

    setIsSubmitting(true);

    try {
      // Derive username before inserting
      const generatedUsername = trimmedEmail.split('@')[0];

      // Call Supabase insert directly
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
        setErrorMessage(error.message || 'Failed to register administrator.');
        return;
      }

      console.log('Supabase Insert Success:', data);
      alert('Registration successful! Please sign in with your credentials.');

      // Clear form state
      setName('');
      setEmail('');
      setPassword('');

      // Switch to Sign In view
      setIsSignUp(false);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred during registration.';
      console.error('Registration Exception:', err);
      setErrorMessage(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim();
    const inputPassword = password.trim();

    if (!trimmedEmail || !inputPassword) {
      setErrorMessage('Please enter both email and password.');
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
        setErrorMessage('Invalid email or password.');
        return;
      }

      // Password Check against stored hash (handles bcrypt or plain fallback)
      const storedHash = (userRow.password_hash ?? userRow.password ?? '') as string;
      if (!storedHash) {
        setErrorMessage('Invalid email or password.');
        return;
      }

      let isMatch = false;
      const isBcryptFormat = /^\$2[abyx]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(storedHash) || storedHash.startsWith('$2');

      if (isBcryptFormat) {
        isMatch = await verifyPassword(inputPassword, storedHash);
      } else {
        isMatch = inputPassword === storedHash;
      }

      if (!isMatch) {
        setErrorMessage('Invalid email or password.');
        return;
      }

      // Sync authentication session with App context
      await login(trimmedEmail, inputPassword);

      if (onSuccess) {
        onSuccess();
      }

      router.push('/admin/dashboard');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Invalid credentials';
      console.error('Sign In Error:', err);
      setErrorMessage(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-rose-100 selection:text-rose-900 font-sans antialiased">
      {/* Centered Auth Card Component */}
      <div className="relative w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 overflow-hidden">
        {/* Brand accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-rose-500 to-blue-600" />

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

        {/* View Toggle inside one card */}
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

      {/* Footer notes */}
      <div className="mt-6 text-center text-slate-400 text-[11px] flex items-center justify-center gap-2">
        <span>AFINBO Nigeria Telecoms</span>
        <span>•</span>
        <span>Secured Administrator Portal</span>
      </div>
    </div>
  );
};
