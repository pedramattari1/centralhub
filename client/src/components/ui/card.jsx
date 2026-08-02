import { cn } from '@/lib/utils';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn('rounded-xl border border-gray-200 bg-white shadow-card', className)}
      {...props}
    />
  );
}
