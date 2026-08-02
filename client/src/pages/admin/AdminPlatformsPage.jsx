import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Ban } from 'lucide-react';
import { useApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card } from '@/components/ui/card.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { getIcon } from '@/lib/icons';

export default function AdminPlatformsPage() {
  const api = useApi();
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState(null);

  const load = useCallback(async () => {
    const { platforms } = await api.get('/admin/platforms');
    setPlatforms(platforms);
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function deactivate(p) {
    if (!window.confirm(`Deactivate "${p.name}"? It will disappear from all dashboards.`)) return;
    try {
      await api.del(`/admin/platforms/${p.id}`);
      toast({ message: `${p.name} deactivated` });
      load();
    } catch {
      toast({ message: 'Could not deactivate platform.', variant: 'error' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Platforms</h1>
          <p className="mt-1 text-sm text-gray-500">Manage the platforms available to the team.</p>
        </div>
        <Link
          to="/admin/platforms/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent-600 px-4 text-sm font-medium text-white transition-colors hover:bg-accent-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Add Platform
        </Link>
      </div>

      {platforms === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : platforms.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">No platforms yet. Add your first platform.</p>
      ) : (
        <Card className="divide-y divide-gray-100">
          {platforms.map((p) => {
            const Icon = getIcon(p.iconName);
            return (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-gray-900">{p.name}</p>
                    {!p.isActive && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inactive</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-gray-400">
                    {p.category?.name} · {p.url}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    to={`/admin/platforms/${p.id}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                  </Link>
                  {p.isActive && (
                    <Button variant="ghost" size="sm" onClick={() => deactivate(p)}>
                      <Ban className="h-4 w-4 text-red-500" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
