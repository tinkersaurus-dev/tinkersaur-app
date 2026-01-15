import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuthStore } from './useAuthStore';

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password', '/set-password'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initialized = useAuthStore((state) => state.initialized);
  const initialize = useAuthStore((state) => state.initialize);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Redirect to login if not authenticated and not on public route (only after initialization)
  useEffect(() => {
    if (!initialized) return;

    const isPublicRoute = PUBLIC_ROUTES.some(route => location.pathname.startsWith(route));

    if (!isAuthenticated && !isPublicRoute) {
      navigate('/login', { replace: true });
    }
  }, [initialized, isAuthenticated, location.pathname, navigate]);

  // Wait for initialization before rendering
  if (!initialized) {
    return null;
  }

  // Allow rendering if on public route or authenticated
  const isPublicRoute = PUBLIC_ROUTES.some(route => location.pathname.startsWith(route));
  if (!isAuthenticated && !isPublicRoute) {
    return null; // Don't render until redirect happens
  }

  return <>{children}</>;
}
