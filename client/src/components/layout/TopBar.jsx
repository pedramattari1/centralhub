import { Menu } from 'lucide-react';

// Mobile-only top bar with a hamburger to open the nav drawer.
export function TopBar({ onOpenNav }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/80 px-4 backdrop-blur lg:hidden">
      <button
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="text-base font-semibold tracking-tight text-gray-900">
        Central<span className="text-accent-600">Hub</span>
      </span>
    </header>
  );
}
