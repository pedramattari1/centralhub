import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Search } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Input } from '@/components/ui/input.jsx';
import { getIcon } from '@/lib/icons';

/**
 * Right-side drawer to toggle platform visibility. Each toggle auto-saves.
 * Radix Dialog gives us the focus trap, Escape-to-close, backdrop, and the
 * dialog/aria-modal semantics for free.
 */
export function CustomizeDrawer({ open, onOpenChange }) {
  const { platforms, categories, preferences, updatePreference, resetPreferences } = useAppData();
  const { toast } = useToast();
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = platforms.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.searchKeywords || []).some((k) => k.toLowerCase().includes(q))
    );
    return categories
      .map((c) => ({ category: c, items: filtered.filter((p) => p.categoryId === c.id) }))
      .filter((g) => g.items.length > 0);
  }, [platforms, categories, query]);

  async function handleToggle(platform, next) {
    try {
      await updatePreference(platform.id, { isVisible: next });
      toast({ message: `${platform.name} ${next ? 'added to' : 'removed from'} your dashboard` });
    } catch {
      toast({ message: "Couldn't save your change. Try again.", variant: 'error' });
    }
  }

  async function handleReset() {
    try {
      await resetPreferences();
      toast({ message: 'Dashboard reset to defaults' });
    } catch {
      toast({ message: "Couldn't reset. Try again.", variant: 'error' });
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 data-[state=open]:animate-in" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col bg-white shadow-xl focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              Customize Dashboard
            </Dialog.Title>
            <Dialog.Close aria-label="Close" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="border-b border-gray-100 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search platforms"
                className="pl-9"
                aria-label="Search platforms"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {grouped.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">No platforms match your search.</p>
            )}
            {grouped.map(({ category, items }) => (
              <div key={category.id} className="mb-5">
                <h4 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {category.name}
                </h4>
                <div className="space-y-1">
                  {items.map((p) => {
                    const Icon = getIcon(p.iconName);
                    const isVisible = preferences[p.id]?.isVisible ?? false;
                    return (
                      <div key={p.id} className="flex items-center gap-3 rounded-lg px-1 py-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-800">{p.name}</p>
                          <p className="truncate text-xs text-gray-400">{p.description}</p>
                        </div>
                        <Switch
                          checked={isVisible}
                          onCheckedChange={(next) => handleToggle(p, next)}
                          aria-label={`Show ${p.name} on dashboard`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 p-4">
            <button
              onClick={handleReset}
              className="text-sm font-medium text-accent-600 hover:text-accent-700"
            >
              Reset to Defaults
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
