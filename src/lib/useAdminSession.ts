import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth, AdminUser, INACTIVITY_TIMEOUT_MS } from './auth';
import { useRouter, normalizePath } from './router';

export interface UseAdminSessionOptions {
  /**
   * Callback invoked immediately when session expires due to inactivity
   * or when user logs out. Use this to clear active component state,
   * reset modals, close drawers, and discard uncommitted form data.
   */
  onSessionExpired?: () => void;
  /**
   * Destination route to redirect the user upon session expiration.
   * Defaults to '/admin'.
   */
  redirectTo?: string;
  /**
   * Whether to strictly require authentication and auto-redirect if not logged in.
   * Defaults to true.
   */
  requireAuth?: boolean;
}

export interface UseAdminSessionReturn {
  isAuthenticated: boolean;
  user: AdminUser | null;
  logout: (reason?: string) => void;
  resetActivity: () => void;
  lastActivity: number;
  inactivityTimeoutMs: number;
  timeRemainingMs: number;
  formattedTimeRemaining: string;
  isSessionExpired: boolean;
  clearSessionAndState: () => void;
}

/**
 * useAdminSession hook
 * 
 * Wraps administrator session verification and inactivity detection.
 * If 30 minutes of inactivity elapse, it:
 * 1. Automatically invalidates authentication tokens from session/local storage.
 * 2. Invokes `onSessionExpired` to clear internal dashboard view state, modals, and cached inputs.
 * 3. Immediately redirects the user back to the login page (`/admin`).
 * 4. Cleans up URL search parameters.
 */
export const useAdminSession = (options: UseAdminSessionOptions = {}): UseAdminSessionReturn => {
  const {
    onSessionExpired,
    redirectTo = '/admin',
    requireAuth = true,
  } = options;

  const {
    isAuthenticated,
    user,
    logout,
    lastActivity,
    inactivityTimeoutMs = INACTIVITY_TIMEOUT_MS,
    resetActivity,
  } = useAuth();

  const { navigate, currentPath } = useRouter();

  const [timeRemainingMs, setTimeRemainingMs] = useState<number>(() => {
    const elapsed = Date.now() - lastActivity;
    return Math.max(0, inactivityTimeoutMs - elapsed);
  });

  const onSessionExpiredRef = useRef(onSessionExpired);
  onSessionExpiredRef.current = onSessionExpired;

  const wasAuthenticatedRef = useRef(isAuthenticated);

  // Clear dashboard state helper
  const handleClearState = useCallback(() => {
    if (onSessionExpiredRef.current) {
      try {
        onSessionExpiredRef.current();
      } catch (err) {
        console.warn('[useAdminSession] Error in onSessionExpired callback:', err);
      }
    }
  }, []);

  // Format remaining time as MM:SS
  const formatTimeRemaining = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Immediate manual clearing and redirection
  const clearSessionAndState = useCallback(() => {
    handleClearState();
    logout('inactivity');
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState(null, '', normalizePath(redirectTo));
    }
    navigate(redirectTo, { replace: true });
  }, [handleClearState, logout, navigate, redirectTo]);

  // Dynamic countdown timer ticker
  useEffect(() => {
    if (!isAuthenticated) {
      setTimeRemainingMs(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivity;
      const remaining = Math.max(0, inactivityTimeoutMs - elapsed);
      setTimeRemainingMs(remaining);

      if (remaining <= 0) {
        console.warn('[useAdminSession] Inactivity limit reached. Clearing dashboard view state and redirecting...');
        handleClearState();
        logout('inactivity');
        if (typeof window !== 'undefined' && window.location.search) {
          window.history.replaceState(null, '', normalizePath(redirectTo));
        }
        navigate(redirectTo, { replace: true });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, lastActivity, inactivityTimeoutMs, handleClearState, logout, navigate, redirectTo]);

  // Listen for broadcasted session expiration events across tabs or context
  useEffect(() => {
    const handleExpiredEvent = () => {
      console.warn('[useAdminSession] Received afinbo_session_expired event. Resetting view state.');
      handleClearState();
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState(null, '', normalizePath(redirectTo));
      }
      navigate(redirectTo, { replace: true });
    };

    window.addEventListener('afinbo_session_expired', handleExpiredEvent);
    return () => {
      window.removeEventListener('afinbo_session_expired', handleExpiredEvent);
    };
  }, [handleClearState, navigate, redirectTo]);

  // Monitor when authentication transitions from true -> false
  useEffect(() => {
    if (wasAuthenticatedRef.current && !isAuthenticated) {
      // User logged out or session invalidated
      handleClearState();
      if (requireAuth) {
        const normCurrent = normalizePath(currentPath);
        const normTarget = normalizePath(redirectTo);
        if (normCurrent !== normTarget) {
          navigate(redirectTo, { replace: true });
        }
      }
    }
    wasAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated, handleClearState, requireAuth, currentPath, navigate, redirectTo]);

  return {
    isAuthenticated,
    user,
    logout,
    resetActivity,
    lastActivity,
    inactivityTimeoutMs,
    timeRemainingMs,
    formattedTimeRemaining: formatTimeRemaining(timeRemainingMs),
    isSessionExpired: !isAuthenticated,
    clearSessionAndState,
  };
};
