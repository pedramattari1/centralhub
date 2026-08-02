import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx';
import { AdminRoute } from './components/auth/AdminRoute.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

import SignInPage from './pages/SignInPage.jsx';
import UnauthorizedPage from './pages/UnauthorizedPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DirectoryPage from './pages/DirectoryPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AdminPlatformsPage from './pages/admin/AdminPlatformsPage.jsx';
import AdminPlatformFormPage from './pages/admin/AdminPlatformFormPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Authenticated app — shell provides layout + data context. */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/platforms" element={<DirectoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          <Route
            path="/admin/platforms"
            element={
              <AdminRoute>
                <AdminPlatformsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/platforms/new"
            element={
              <AdminRoute>
                <AdminPlatformFormPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/platforms/:id"
            element={
              <AdminRoute>
                <AdminPlatformFormPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
        </Route>

        {/* Unknown route → home (redirects to sign-in if unauthenticated). */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
