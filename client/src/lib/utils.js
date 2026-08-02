import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Class name combiner (shadcn/ui convention).
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Time-of-day greeting.
export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
