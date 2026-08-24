import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface AdminUser {
  username: string;
  name: string;
  email?: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  login: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => ({ success: false }),
  logout: () => {},
});

const AUTH_TOKEN_KEY = 'afinbo_admin_token';
const AUTH_USER_KEY = 'afinbo_admin_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const token = sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
      return Boolean(token);
    } catch {
      return false;
    }
  });

  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(AUTH_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Listen to storage events and custom auth change events across components
  useEffect(() => {
    const handleAuthSync = () => {
      try {
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
    const trimmedUser = username.trim();
    const trimmedPass = pass.trim();

    // Default admin credentials: admin / AfinboAdmin2026! or password >= 6 chars
    if (
      (trimmedUser.toLowerCase() === 'admin' && trimmedPass === 'AfinboAdmin2026!') ||
      trimmedPass.length >= 6
    ) {
      const adminData: AdminUser = {
        username: trimmedUser,
        name: 'AFINBO Administrator',
        email: 'afinboproject@gmail.com',
        role: 'Super Admin',
      };

      const token = btoa(JSON.stringify({ user: trimmedUser, time: Date.now(), exp: Date.now() + 86400000 }));
      
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(adminData));
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(adminData));

      setIsAuthenticated(true);
      setUser(adminData);

      window.dispatchEvent(new Event('afinbo_auth_change'));
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid administrator credentials. (Default: admin / AfinboAdmin2026!)',
    };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);

    setIsAuthenticated(false);
    setUser(null);

    window.dispatchEvent(new Event('afinbo_auth_change'));
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
