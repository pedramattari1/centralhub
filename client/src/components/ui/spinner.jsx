import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin', className)} aria-hidden="true" />;
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50" role="status" aria-label="Loading">
      <Spinner className="h-8 w-8 text-accent-600" />
    </div>
  );
}
