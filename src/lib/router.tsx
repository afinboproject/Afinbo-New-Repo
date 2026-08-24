/*
vercel.json setup:
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
*/

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, MouseEvent, AnchorHTMLAttributes } from 'react';

export type AppRoute =
  | '/'
  | '/products'
  | '/strippers'
  | '/cleavers'
  | '/testers'
  | '/splicers'
  | '/about-afinbo'
  | string;

export interface RouterContextType {
  currentPath: string;
  navigate: (to: string, options?: { replace?: boolean; scrollToTop?: boolean }) => void;
  push: (to: string, options?: { replace?: boolean; scrollToTop?: boolean }) => void;
  isPathActive: (targetPath: string) => boolean;
}

const RouterContext = createContext<RouterContextType>({
  currentPath: '/',
  navigate: () => {},
  push: () => {},
  isPathActive: () => false,
});

export const normalizePath = (path: string): string => {
  if (!path) return '/';
  // Strip hash and query params for route matching
  const clean = path.split('?')[0].split('#')[0];
  if (!clean.startsWith('/')) return `/${clean}`;
  if (clean.length > 1 && clean.endsWith('/')) return clean.slice(0, -1);
  return clean;
};

export const RouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return normalizePath(window.location.pathname);
    }
    return '/';
  });

  // Handle browser Back / Forward buttons (HTML5 popstate event)
  useEffect(() => {
    const handlePopState = () => {
      const newPath = normalizePath(window.location.pathname);
      setCurrentPath(newPath);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Programmatic client-side navigation using HTML5 pushState
  const navigate = useCallback((to: string, options?: { replace?: boolean; scrollToTop?: boolean }) => {
    const target = normalizePath(to);
    
    if (typeof window !== 'undefined') {
      if (options?.replace) {
        window.history.replaceState(null, '', to);
      } else if (window.location.pathname !== target) {
        window.history.pushState(null, '', to);
      }

      if (options?.scrollToTop !== false) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    setCurrentPath(target);
  }, []);

  const isPathActive = useCallback((targetPath: string) => {
    const normTarget = normalizePath(targetPath);
    const normCurrent = normalizePath(currentPath);

    if (normTarget === '/') {
      return normCurrent === '/';
    }
    return normCurrent === normTarget;
  }, [currentPath]);

  return (
    <RouterContext.Provider value={{ currentPath, navigate, push: navigate, isPathActive }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextType => {
  return useContext(RouterContext);
};

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  className?: string;
  activeClassName?: string;
  children: ReactNode;
  replace?: boolean;
  scrollToTop?: boolean;
}

export const Link: React.FC<LinkProps> = ({
  href,
  className = '',
  activeClassName = '',
  children,
  replace = false,
  scrollToTop = true,
  onClick,
  ...rest
}) => {
  const { currentPath, navigate, isPathActive } = useRouter();
  const active = isPathActive(href);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Let user open new tab with Ctrl/Cmd or Middle Click
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.altKey ||
      e.ctrlKey ||
      e.shiftKey ||
      rest.target === '_blank' ||
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    ) {
      onClick?.(e);
      return;
    }

    e.preventDefault();
    onClick?.(e);
    navigate(href, { replace, scrollToTop });
  };

  const combinedClassName = `${className} ${active ? activeClassName : ''}`.trim();

  return (
    <a href={href} onClick={handleClick} className={combinedClassName} {...rest}>
      {children}
    </a>
  );
};
