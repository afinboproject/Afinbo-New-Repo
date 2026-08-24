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
  login: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
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

  const login = useCallback(async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const inputUsername = username.trim();
    const inputPassword = pass.trim();

    if (!inputUsername || !inputPassword) {
      console.warn('[Admin Auth] Login rejected: Username or password is empty after trimming.');
      return {
        success: false,
        error: 'Please enter both username and password.',
      };
    }

    console.log(`[Admin Auth] 🔍 Attempting login for username: "${inputUsername}"`);

    try {
      // Step 1: Fetch user record from `admin` table using case-insensitive .ilike()
      const { data, error } = await supabase
        .from('admin')
        .select('*')
        .ilike('username', inputUsername)
        .maybeSingle();

      // Diagnostics: Log query outcome and RLS status
      if (error) {
        console.error('[Admin Auth] ❌ Supabase query error (Check RLS SELECT policy on "admin" table):', error.message, error);
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      if (!data) {
        console.warn(`[Admin Auth] ⚠️ No user record found in 'admin' table matching username: "${inputUsername}" (Check if RLS is blocking SELECT for anon role or username is spelled differently).`);
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      console.log(`[Admin Auth] ✅ User row found in Supabase: id=${data.id ?? 'N/A'}, username="${data.username}"`);

      // Step 2: Extract password hash or plain text password field
      const storedHash = (data.password_hash ?? data.password ?? '') as string;
      if (!storedHash) {
        console.error('[Admin Auth] ❌ User record exists but has no password_hash or password column populated.');
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      let isPasswordValid = false;

      // Check if stored string is formatted as a valid bcrypt hash ($2a$, $2b$, $2y$, $2x$)
      const isBcryptFormat = /^\$2[abyx]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(storedHash) || storedHash.startsWith('$2');

      if (isBcryptFormat) {
        console.log('[Admin Auth] 🔐 Detected bcrypt hash format in database. Running bcrypt.compare()...');
        try {
          isPasswordValid = await verifyPassword(inputPassword, storedHash);
          console.log(`[Admin Auth] 🔑 Bcrypt comparison evaluation result: ${isPasswordValid ? 'MATCH (true)' : 'MISMATCH (false)'}`);
        } catch (bcryptErr) {
          console.error('[Admin Auth] ❌ bcrypt.compare failed due to an error or invalid hash structure:', bcryptErr);
          isPasswordValid = false;
        }
      } else {
        console.log('[Admin Auth] ℹ️ Stored password is plain text (not bcrypt format). Running direct equality check...');
        isPasswordValid = (inputPassword === storedHash);
        console.log(`[Admin Auth] 🔑 Plain-text comparison evaluation result: ${isPasswordValid ? 'MATCH (true)' : 'MISMATCH (false)'}`);

        // Upgrade plain text to bcrypt hash in database upon successful match
        if (isPasswordValid) {
          try {
            const upgradedHash = await hashPassword(inputPassword, 10);
            await supabase
              .from('admin')
              .update({ password_hash: upgradedHash })
              .eq('id', data.id ?? data.username);
            console.log('[Admin Auth] 🛡️ Automatically upgraded plain-text password to bcrypt hash in Supabase.');
          } catch (upgradeErr) {
            console.warn('[Admin Auth] Failed to auto-upgrade plain password to bcrypt in Supabase:', upgradeErr);
          }
        }
      }

      // Step 3: Fail Safe Check
      if (!isPasswordValid) {
        console.warn(`[Admin Auth] ⛔ Access denied: Password mismatch for user "${inputUsername}".`);
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      console.log(`[Admin Auth] 🎉 Access granted for user "${data.username || inputUsername}". Creating session...`);

      // Construct verified admin user payload
      const adminData: AdminUser = {
        id: data.id ? String(data.id) : undefined,
        username: data.username || inputUsername,
        name: data.name || data.full_name || 'AFINBO Administrator',
        email: data.email || 'afinboproject@gmail.com',
        role: data.role || 'Super Admin',
      };

      const now = Date.now();
      const token = btoa(
        JSON.stringify({
          user: adminData.username,
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
        error: 'Invalid credentials',
      };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
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


