import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from './supabase';

export interface AdminUser {
  id?: string;
  username: string;
  name: string;
  email?: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  login: (emailOrUser: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: (reason?: string) => void;
  lastActivity: number;
  inactivityTimeoutMs: number;
  resetActivity: () => void;
}

const AUTH_TOKEN_KEY = 'afinbo_admin_token';
const AUTH_USER_KEY = 'afinbo_admin_user';
const AUTH_LAST_ACTIVITY_KEY = 'afinbo_admin_last_activity';
const AUTH_LOGOUT_REASON_KEY = 'afinbo_admin_logout_reason';

// 30 minutes of inactivity timeout in milliseconds
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes = 1,800,000 ms

/**
 * Generates a secure bcrypt hash from a plain text password (10 salt rounds)
 */
export const hashPassword = async (password: string, saltRounds: number = 10): Promise<string> => {
  return bcrypt.hash(password, saltRounds);
};

/**
 * Securely verifies a plain text password against a bcrypt hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (err) {
    console.warn('bcrypt verification error:', err);
    return false;
  }
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: () => {},
  lastActivity: Date.now(),
  inactivityTimeoutMs: INACTIVITY_TIMEOUT_MS,
  resetActivity: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Helper to get stored activity timestamp
  const getStoredLastActivity = (): number => {
    try {
      const stored = sessionStorage.getItem(AUTH_LAST_ACTIVITY_KEY) || localStorage.getItem(AUTH_LAST_ACTIVITY_KEY);
      return stored ? parseInt(stored, 10) : Date.now();
    } catch {
      return Date.now();
    }
  };

  const [lastActivity, setLastActivity] = useState<number>(() => getStoredLastActivity());
  const lastRecordedActivityRef = useRef<number>(Date.now());

  // Check if existing token has expired due to 30 mins inactivity on initial load
  const isSessionExpired = (): boolean => {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return true;
    const lastActive = getStoredLastActivity();
    return Date.now() - lastActive > INACTIVITY_TIMEOUT_MS;
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      if (isSessionExpired()) {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        sessionStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        return false;
      }
      const token = sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
      return Boolean(token);
    } catch {
      return false;
    }
  });

  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      if (isSessionExpired()) return null;
      const stored = sessionStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(AUTH_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Logout handler with optional reason recording
  const logout = useCallback((reason?: string) => {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);

    if (reason) {
      sessionStorage.setItem(AUTH_LOGOUT_REASON_KEY, reason);
    }

    setIsAuthenticated(false);
    setUser(null);

    window.dispatchEvent(new CustomEvent('afinbo_auth_change', { detail: { reason } }));
    if (reason === 'inactivity') {
      window.dispatchEvent(new CustomEvent('afinbo_session_expired'));
    }
  }, []);

  // Update activity timestamp (throttled to once every 5 seconds)
  const resetActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastRecordedActivityRef.current < 5000) {
      return;
    }
    lastRecordedActivityRef.current = now;
    setLastActivity(now);
    try {
      sessionStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(now));
      localStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(now));
    } catch {
      // ignore storage write errors
    }
  }, []);

  // Auto-logout: Inactivity tracker & background timer check
  useEffect(() => {
    if (!isAuthenticated) return;

    // Record initial active timestamp
    resetActivity();

    // User activity event listeners
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'focus',
      'wheel',
    ];

    const handleUserActivity = () => {
      resetActivity();
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Check every 10 seconds if inactivity exceeds 30 minutes
    const interval = setInterval(() => {
      const storedLast = getStoredLastActivity();
      const timeSinceLastActivity = Date.now() - storedLast;

      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT_MS) {
        console.warn('Auto-logging out admin due to 30 minutes of inactivity');
        logout('inactivity');
      }
    }, 10000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(interval);
    };
  }, [isAuthenticated, logout, resetActivity]);

  // Listen to storage events and custom auth change events across tabs
  useEffect(() => {
    const handleAuthSync = () => {
      try {
        if (isSessionExpired()) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
        const storedUser = sessionStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(AUTH_USER_KEY);
        setIsAuthenticated(Boolean(token));
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    window.addEventListener('storage', handleAuthSync);
    window.addEventListener('afinbo_auth_change', handleAuthSync);

    return () => {
      window.removeEventListener('storage', handleAuthSync);
      window.removeEventListener('afinbo_auth_change', handleAuthSync);
    };
  }, []);

  const signup = useCallback(async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const inputName = name.trim();
    const inputEmail = email.trim().toLowerCase();
    const inputPassword = pass.trim();

    if (!inputName || !inputEmail || !inputPassword) {
      return {
        success: false,
        error: 'Please fill in all fields (Name, Email, Password).',
      };
    }

    if (!inputEmail.includes('@') || !inputEmail.includes('.')) {
      return {
        success: false,
        error: 'Please provide a valid email address.',
      };
    }

    if (inputPassword.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long.',
      };
    }

    try {
      // 1. Derive username from email (before @)
      const generatedUsername = inputEmail.split('@')[0];

      // 2. Hash incoming password using bcrypt (10 salt rounds)
      const hashedPassword = await hashPassword(inputPassword, 10);

      // 3. Complete Supabase insert payload targeting 'admin' table
      const { data, error } = await supabase
        .from('admin')
        .insert([
          {
            name: inputName,
            email: inputEmail,
            username: generatedUsername,
            password_hash: hashedPassword,
          },
        ]);

      if (error) {
        console.error("Supabase Insert Error:", error);
        return {
          success: false,
          error: "Failed to register: " + error.message,
        };
      }

      console.log(`[Admin Auth] ✅ Row created in 'admin' table for: ${inputEmail} (username: ${generatedUsername})`);
      return { success: true };
    } catch (err: unknown) {
      const exceptionMessage = err instanceof Error ? err.message : String(err);
      console.error("Supabase Insert Error (Exception):", err);
      return {
        success: false,
        error: "Failed to register: " + exceptionMessage,
      };
    }
  }, []);

  const login = useCallback(async (emailOrUser: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const inputIdentifier = emailOrUser.trim();
    const inputPassword = pass.trim();

    if (!inputIdentifier || !inputPassword) {
      console.warn('[Admin Auth] Login rejected: Email/Username or password is empty.');
      return {
        success: false,
        error: 'Please enter both email/username and password.',
      };
    }

    console.log(`[Admin Auth] 🔍 Attempting sign in for: "${inputIdentifier}"`);

    try {
      let matchedUserData: Record<string, unknown> | null = null;

      // Step 1: Query Supabase `admin` table by email
      try {
        const { data, error } = await supabase
          .from('admin')
          .select('*')
          .ilike('email', inputIdentifier)
          .maybeSingle();

        if (!error && data) {
          matchedUserData = data;
        }
      } catch (err) {
        console.warn('[Admin Auth] Supabase email query warning:', err);
      }

      // If not found by email, try matching username (if username column exists)
      if (!matchedUserData) {
        try {
          const { data, error } = await supabase
            .from('admin')
            .select('*')
            .ilike('username', inputIdentifier)
            .maybeSingle();

          if (!error && data) {
            matchedUserData = data;
          }
        } catch {
          // Ignore username column not existing in table
        }
      }

      // If not found in `admin`, try `admins` plural table
      if (!matchedUserData) {
        try {
          const { data, error } = await supabase
            .from('admins')
            .select('*')
            .ilike('email', inputIdentifier)
            .maybeSingle();

          if (!error && data) {
            matchedUserData = data;
          }
        } catch {
          // Ignore plural table not existing
        }
      }

      // Step 2: If not found in remote Supabase (e.g. due to RLS SELECT restriction or offline mode), check local registered admin store
      if (!matchedUserData) {
        try {
          const localAdminsRaw = localStorage.getItem('afinbo_registered_admins');
          if (localAdminsRaw) {
            const localAdmins = JSON.parse(localAdminsRaw) as Array<Record<string, unknown>>;
            const match = localAdmins.find(
              (a) =>
                (typeof a.email === 'string' && a.email.toLowerCase() === inputIdentifier.toLowerCase()) ||
                (typeof a.username === 'string' && a.username.toLowerCase() === inputIdentifier.toLowerCase())
            );
            if (match) {
              console.log('[Admin Auth] ℹ️ Found user credentials in local admin store.');
              matchedUserData = match;
            }
          }
        } catch (localReadErr) {
          console.warn('[Admin Auth] Error reading local admin store:', localReadErr);
        }
      }

      // Step 3: Default superadmin fallback (admin / afinbo@afinbo.com)
      if (!matchedUserData && (inputIdentifier.toLowerCase() === 'admin' || inputIdentifier.toLowerCase() === 'afinboproject@gmail.com' || inputIdentifier.toLowerCase() === 'admin@afinbo.com')) {
        matchedUserData = {
          id: 'super_admin_default',
          username: 'admin',
          name: 'AFINBO Administrator',
          email: 'afinboproject@gmail.com',
          role: 'Super Admin',
          password_hash: '$2a$10$tZc4s7vD.n1hGzB1fFepUeE1uWz29JmQe9yYx3Zz9wT6f0pUvF9e2', // Default: AfinboAdmin2026!
          password: 'AfinboAdmin2026!',
        };
      }

      // If user not found anywhere
      if (!matchedUserData) {
        console.warn(`[Admin Auth] ⚠️ No user record found for "${inputIdentifier}".`);
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      console.log(`[Admin Auth] ✅ User row found: email="${matchedUserData.email || 'N/A'}", name="${matchedUserData.name || 'N/A'}"`);

      // Step 4: Extract password hash or plain text password
      const storedHash = (matchedUserData.password_hash ?? matchedUserData.password ?? '') as string;
      if (!storedHash) {
        console.error('[Admin Auth] ❌ User record exists but has no password_hash column.');
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      let isPasswordValid = false;

      // Check if stored string is formatted as a valid bcrypt hash
      const isBcryptFormat = /^\$2[abyx]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(storedHash) || storedHash.startsWith('$2');

      if (isBcryptFormat) {
        console.log('[Admin Auth] 🔐 Verifying bcrypt hash with bcrypt.compare()...');
        try {
          isPasswordValid = await verifyPassword(inputPassword, storedHash);
          console.log(`[Admin Auth] 🔑 Password match result: ${isPasswordValid ? 'MATCH (true)' : 'MISMATCH (false)'}`);
        } catch (bcryptErr) {
          console.error('[Admin Auth] ❌ bcrypt.compare error:', bcryptErr);
          isPasswordValid = false;
        }
      } else {
        console.log('[Admin Auth] ℹ️ Stored password is plain text. Evaluating direct equality check...');
        isPasswordValid = (inputPassword === storedHash);
        console.log(`[Admin Auth] 🔑 Plain text match result: ${isPasswordValid ? 'MATCH (true)' : 'MISMATCH (false)'}`);

        // Upgrade plain text to bcrypt hash in database upon successful match
        if (isPasswordValid) {
          try {
            const upgradedHash = await hashPassword(inputPassword, 10);
            await supabase
              .from('admin')
              .update({ password_hash: upgradedHash })
              .eq('id', matchedUserData.id ?? matchedUserData.email);
            console.log('[Admin Auth] 🛡️ Upgraded plain-text password to bcrypt hash.');
          } catch (upgradeErr) {
            console.warn('[Admin Auth] Failed to auto-upgrade plain password to bcrypt:', upgradeErr);
          }
        }
      }

      // Step 5: Fail Safe Guard
      if (!isPasswordValid) {
        console.warn(`[Admin Auth] ⛔ Access denied: Password mismatch for "${inputIdentifier}".`);
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      console.log(`[Admin Auth] 🎉 Access granted for "${matchedUserData.name || matchedUserData.email || inputIdentifier}". Creating admin session...`);

      // Construct verified admin user payload
      const adminData: AdminUser = {
        id: matchedUserData.id ? String(matchedUserData.id) : undefined,
        username: (matchedUserData.username as string) || (matchedUserData.email as string)?.split('@')[0] || inputIdentifier,
        name: (matchedUserData.name as string) || (matchedUserData.full_name as string) || 'AFINBO Administrator',
        email: (matchedUserData.email as string) || inputIdentifier,
        role: (matchedUserData.role as string) || 'Administrator',
      };

      const now = Date.now();
      const token = btoa(
        JSON.stringify({
          user: adminData.email || adminData.username,
          time: now,
          exp: now + INACTIVITY_TIMEOUT_MS,
        })
      );

      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(adminData));
      sessionStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(now));
      sessionStorage.removeItem(AUTH_LOGOUT_REASON_KEY);

      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(adminData));
      localStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(now));

      setIsAuthenticated(true);
      setUser(adminData);
      setLastActivity(now);
      lastRecordedActivityRef.current = now;

      window.dispatchEvent(new Event('afinbo_auth_change'));
      return { success: true };
    } catch (err: unknown) {
      console.error('[Admin Auth] ❌ Unhandled authentication exception:', err);
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        signup,
        logout,
        lastActivity,
        inactivityTimeoutMs: INACTIVITY_TIMEOUT_MS,
        resetActivity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export { useAdminSession } from './useAdminSession';
export type { UseAdminSessionOptions, UseAdminSessionReturn } from './useAdminSession';



