import { Navigate } from 'react-router-dom';
import { useAppData } from '@/hooks/useAppData.jsx';
import { FullPageSpinner } from '@/components/ui/spinner.jsx';

// Admin-only client guard. Server enforces admin on every /api/admin route;
// this just keeps non-admins out of the admin UI. Renders inside the shell,
// so AppData (with user.isAdmin from Clerk) is available.
export function AdminRoute({ children }) {
  const { loading, user } = useAppData();
  if (loading) return <FullPageSpinner />;
  if (!user?.isAdmin) return <Navigate to="/" replace />;
  return children;
}
