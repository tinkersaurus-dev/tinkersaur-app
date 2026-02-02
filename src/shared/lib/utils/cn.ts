import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes intelligently.
 * Later classes override earlier conflicting ones.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return twMerge(classes.filter(Boolean).join(' '));
}
