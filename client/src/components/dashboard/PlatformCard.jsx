import { Star, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card.jsx';
import { getIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

/**
 * Full platform card. The whole card is the primary click target (opens the
 * platform); the favorite star and CTA are nested interactive controls.
 */
export function PlatformCard({ platform, isFavorite, onOpen, onToggleFavorite }) {
  const Icon = getIcon(platform.iconName);

  return (
    <Card
      role="link"
      tabIndex={0}
      aria-label={`Open ${platform.name}`}
      onClick={() => onOpen(platform)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(platform);
        }
      }}
      className="group flex cursor-pointer flex-col p-5 transition-all hover:border-accent-300 hover:shadow-card-hover focus-visible:outline-none"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="font-semibold text-gray-900">{platform.name}</h3>
      </div>

      <p className="mt-3 line-clamp-2 flex-1 text-sm text-gray-500">{platform.description}</p>

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(platform);
          }}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Remove ${platform.name} from favorites` : `Add ${platform.name} to favorites`}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-gray-500 hover:text-amber-500"
        >
          <Star className={cn('h-4 w-4', isFavorite && 'fill-amber-400 text-amber-400')} aria-hidden="true" />
          <span className="hidden sm:inline">{isFavorite ? 'Favorited' : 'Favorite'}</span>
        </button>

        <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-1.5 text-sm font-medium text-white transition-colors group-hover:bg-accent-700">
          Open <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Card>
  );
}

/** Compact variant for the Favorites / Recently Used horizontal rows. */
export function PlatformChip({ platform, onOpen }) {
  const Icon = getIcon(platform.iconName);
  return (
    <button
      type="button"
      onClick={() => onOpen(platform)}
      aria-label={`Open ${platform.name}`}
      className="flex w-44 shrink-0 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-card transition-all hover:border-accent-300 hover:shadow-card-hover"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="truncate text-sm font-medium text-gray-800">{platform.name}</span>
    </button>
  );
}
