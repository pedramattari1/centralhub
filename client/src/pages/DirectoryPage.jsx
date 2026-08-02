import { useMemo, useState } from 'react';
import { Search, Check, Plus } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { PlatformCard } from '@/components/dashboard/PlatformCard.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils';
import { openPlatform } from '@/lib/openPlatform';

function matches(p, q) {
  if (!q) return true;
  return (
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    (p.searchKeywords || []).some((k) => k.toLowerCase().includes(q))
  );
}

export default function DirectoryPage() {
  const { platforms, categories, preferences, updatePreference, recordOpen } = useAppData();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const q = query.trim().toLowerCase();
  const open = (platform) => openPlatform(platform, recordOpen);

  const filtered = useMemo(
    () =>
      platforms.filter(
        (p) => matches(p, q) && (activeCategory === 'all' || p.categoryId === activeCategory)
      ),
    [platforms, q, activeCategory]
  );

  async function addToDashboard(platform) {
    try {
      await updatePreference(platform.id, { isVisible: true });
      toast({ message: `${platform.name} added to your dashboard` });
    } catch {
      toast({ message: "Couldn't add. Try again.", variant: 'error' });
    }
  }

  async function toggleFavorite(platform) {
    const next = !preferences[platform.id]?.isFavorite;
    try {
      await updatePreference(platform.id, { isFavorite: next });
    } catch {
      toast({ message: "Couldn't save your change. Try again.", variant: 'error' });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">All Platforms</h1>
        <p className="mt-1 text-sm text-gray-500">Browse every approved platform and add to your dashboard.</p>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search platforms"
          className="pl-9"
          aria-label="Search platforms"
        />
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        <CategoryChip active={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>
          All
        </CategoryChip>
        {categories.map((c) => (
          <CategoryChip key={c.id} active={activeCategory === c.id} onClick={() => setActiveCategory(c.id)}>
            {c.name}
          </CategoryChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">No platforms match your search.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const onDashboard = !!preferences[p.id]?.isVisible;
            return (
              <div key={p.id} className="flex flex-col gap-2">
                <PlatformCard
                  platform={p}
                  isFavorite={!!preferences[p.id]?.isFavorite}
                  onOpen={open}
                  onToggleFavorite={toggleFavorite}
                />
                <Button
                  variant={onDashboard ? 'ghost' : 'secondary'}
                  size="sm"
                  disabled={onDashboard}
                  onClick={() => addToDashboard(p)}
                  className="self-start"
                >
                  {onDashboard ? (
                    <><Check className="h-4 w-4" aria-hidden="true" /> On your dashboard</>
                  ) : (
                    <><Plus className="h-4 w-4" aria-hidden="true" /> Add to Dashboard</>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-accent-600 bg-accent-600 text-white'
          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
      )}
    >
      {children}
    </button>
  );
}
