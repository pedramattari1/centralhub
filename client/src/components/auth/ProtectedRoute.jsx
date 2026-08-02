import { useAuth } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { FullPageSpinner } from '@/components/ui/spinner.jsx';

/**
 * Gates authenticated routes. Not signed in → /sign-in. Clerk's org-membership
 * and admin checks are enforced server-side; the client shell surfaces the
 * NOT_ORG_MEMBER error by redirecting to /unauthorized (see AppShell).
 */
export function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) return <FullPageSpinner />;
  if (!isSignedIn) return <Navigate to="/sign-in" state={{ from: location }} replace />;
  return children;
}
