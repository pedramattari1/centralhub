import { useMemo, useState } from 'react';
import { Search, Sliders, Star } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { PlatformCard, PlatformChip } from '@/components/dashboard/PlatformCard.jsx';
import { CustomizeDrawer } from '@/components/platforms/CustomizeDrawer.jsx';
import { PlatformCardSkeleton } from '@/components/ui/skeleton.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { greeting } from '@/lib/utils';
import { openPlatform } from '@/lib/openPlatform';

function matches(p, q) {
  if (!q) return true;
  return (
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    (p.searchKeywords || []).some((k) => k.toLowerCase().includes(q))
  );
}

export default function DashboardPage() {
  const { user, platforms, categories, preferences, recentlyUsed, updatePreference, recordOpen } =
    useAppData();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const firstName = (user?.displayName || '').split(' ')[0];

  const open = (platform) => openPlatform(platform, recordOpen);

  async function toggleFavorite(platform) {
    const next = !preferences[platform.id]?.isFavorite;
    try {
      await updatePreference(platform.id, { isFavorite: next });
    } catch {
      toast({ message: "Couldn't save your change. Try again.", variant: 'error' });
    }
  }

  // Visible = has a preference row with isVisible true (missing row = hidden).
  const visiblePlatforms = useMemo(
    () => platforms.filter((p) => preferences[p.id]?.isVisible && matches(p, q)),
    [platforms, preferences, q]
  );

  const favorites = useMemo(
    () => platforms.filter((p) => preferences[p.id]?.isFavorite),
    [platforms, preferences]
  );

  const byCategory = useMemo(() => {
    return categories
      .map((c) => ({ category: c, items: visiblePlatforms.filter((p) => p.categoryId === c.id) }))
      .filter((g) => g.items.length > 0);
  }, [categories, visiblePlatforms]);

  const hasAnyVisible = platforms.some((p) => preferences[p.id]?.isVisible);

  return (
    <div className="space-y-8">
      {/* Greeting + search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {greeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Your workplace platforms, all in one place.</p>
        </div>
        <div className="relative w-full sm:w-72">
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

      {/* Favorites */}
      <section aria-labelledby="favorites-heading">
        <h2 id="favorites-heading" className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Star className="h-4 w-4 text-amber-400" aria-hidden="true" /> Favorites
        </h2>
        {favorites.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {favorites.map((p) => (
              <PlatformChip key={p.id} platform={p} onOpen={open} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Star your most-used platforms for quick access.</p>
        )}
      </section>

      {/* Recently used - hidden entirely when empty */}
      {recentlyUsed.length > 0 && (
        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="mb-3 text-sm font-semibold text-gray-700">
            Recently Used
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {recentlyUsed.map((r) => (
              <PlatformChip key={r.id} platform={r.platform} onOpen={open} />
            ))}
          </div>
        </section>
      )}

      {/* My Platforms */}
      <section aria-labelledby="platforms-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="platforms-heading" className="text-sm font-semibold text-gray-700">
            My Platforms
          </h2>
          <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
            <Sliders className="h-4 w-4" aria-hidden="true" /> Customize
          </Button>
        </div>

        {!hasAnyVisible ? (
          <EmptyState
            title="Your dashboard is empty"
            body="Click 'Customize' to add platforms to your dashboard."
            action={<Button onClick={() => setDrawerOpen(true)}>Customize Dashboard</Button>}
          />
        ) : visiblePlatforms.length === 0 ? (
          <EmptyState title="No platforms match your search." />
        ) : (
          <div className="space-y-8">
            {byCategory.map(({ category, items }) => (
              <div key={category.id}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {category.name}
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => (
                    <PlatformCard
                      key={p.id}
                      platform={p}
                      isFavorite={!!preferences[p.id]?.isFavorite}
                      onOpen={open}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <CustomizeDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}

function EmptyState({ title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white/50 px-6 py-12 text-center">
      <p className="font-medium text-gray-700">{title}</p>
      {body && <p className="max-w-sm text-sm text-gray-500">{body}</p>}
      {action}
    </div>
  );
}

// Skeleton shown by the shell while data loads is handled at AppShell level;
// this local skeleton is exported for potential reuse.
export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <PlatformCardSkeleton key={i} />
      ))}
    </div>
  );
}
