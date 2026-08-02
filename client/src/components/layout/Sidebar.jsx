import { NavLink } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { LayoutGrid, LayoutList, Settings, Shield, Users, X } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData.jsx';
import { cn } from '@/lib/utils';

const navItem = ({ isActive }) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-accent-50 text-accent-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  );

function NavContents({ onNavigate, isAdmin }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Primary">
      <NavLink to="/" end className={navItem} onClick={onNavigate}>
        <LayoutGrid className="h-4 w-4" aria-hidden="true" /> My Platforms
      </NavLink>
      <NavLink to="/platforms" className={navItem} onClick={onNavigate}>
        <LayoutList className="h-4 w-4" aria-hidden="true" /> All Platforms
      </NavLink>
      <NavLink to="/settings" className={navItem} onClick={onNavigate}>
        <Settings className="h-4 w-4" aria-hidden="true" /> Settings
      </NavLink>

      {isAdmin && (
        <>
          <div className="mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Admin
          </div>
          <NavLink to="/admin/platforms" className={navItem} onClick={onNavigate}>
            <Shield className="h-4 w-4" aria-hidden="true" /> Platforms
          </NavLink>
          <NavLink to="/admin/users" className={navItem} onClick={onNavigate}>
            <Users className="h-4 w-4" aria-hidden="true" /> Users
          </NavLink>
        </>
      )}
    </nav>
  );
}

export function Sidebar({ mobileOpen, onClose }) {
  const { user } = useAppData();
  const isAdmin = !!user?.isAdmin;

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-16 items-center px-6">
          <span className="text-lg font-semibold tracking-tight text-gray-900">
            Central<span className="text-accent-600">Hub</span>
          </span>
        </div>
        <NavContents isAdmin={isAdmin} />
        <div className="flex items-center gap-3 border-t border-gray-100 p-4">
          <UserButton afterSignOutUrl="/sign-in" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-800">
              {user?.displayName || 'Signed in'}
            </p>
            <p className="truncate text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between px-6">
              <span className="text-lg font-semibold tracking-tight text-gray-900">
                Central<span className="text-accent-600">Hub</span>
              </span>
              <button onClick={onClose} aria-label="Close navigation" className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavContents isAdmin={isAdmin} onNavigate={onClose} />
            <div className="flex items-center gap-3 border-t border-gray-100 p-4">
              <UserButton afterSignOutUrl="/sign-in" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">
                  {user?.displayName || 'Signed in'}
                </p>
                <p className="truncate text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
