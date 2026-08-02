import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AppDataProvider, useAppData } from '@/hooks/useAppData.jsx';
import { Sidebar } from './Sidebar.jsx';
import { TopBar } from './TopBar.jsx';
import { FullPageSpinner } from '@/components/ui/spinner.jsx';
import { Button } from '@/components/ui/button.jsx';

// Inner content: decides between loading / unauthorized / error / app.
function ShellContent() {
  const { loading, error } = useAppData();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (loading) return <FullPageSpinner />;

  // A 403 during initial load means the caller isn't an org member (or was
  // deactivated) - requireAuth rejects with 403 before any data loads.
  if (error?.status === 403) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
        <h1 className="text-lg font-semibold text-gray-900">
          Something went wrong loading your platforms
        </h1>
        <p className="text-sm text-gray-500">Try refreshing the page.</p>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-card"
      >
        Skip to content
      </a>
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <TopBar onOpenNav={() => setMobileNavOpen(true)} />
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export function AppShell() {
  return (
    <AppDataProvider>
      <ShellContent />
    </AppDataProvider>
  );
}
