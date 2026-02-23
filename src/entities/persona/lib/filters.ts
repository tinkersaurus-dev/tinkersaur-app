import type { Persona } from '../model/types';

export const STALE_THRESHOLD_DAYS = 30;

export function getDaysSinceUpdate(p: Persona): number {
  return Math.floor(
    (Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function isStalePersona(p: Persona, thresholdDays = STALE_THRESHOLD_DAYS): boolean {
  return getDaysSinceUpdate(p) >= thresholdDays;
}

export function filterStalePersonas(personas: Persona[], thresholdDays = STALE_THRESHOLD_DAYS): Persona[] {
  return personas.filter((p) => isStalePersona(p, thresholdDays));
}

// Freshness helpers (based on last intake: most recent UserGoal or Feedback association)

export const FRESH_THRESHOLD_DAYS = 14;
export const MODERATE_THRESHOLD_DAYS = 30;

export type Freshness = 'Fresh' | 'Moderate' | 'Stale';

export function getDaysSinceLastIntake(p: Persona): number | null {
  if (!p.lastIntakeAt) return null;
  return Math.floor(
    (Date.now() - new Date(p.lastIntakeAt).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function getFreshness(p: Persona): Freshness | null {
  const days = getDaysSinceLastIntake(p);
  if (days === null) return null;
  if (days < FRESH_THRESHOLD_DAYS) return 'Fresh';
  if (days <= MODERATE_THRESHOLD_DAYS) return 'Moderate';
  return 'Stale';
}
