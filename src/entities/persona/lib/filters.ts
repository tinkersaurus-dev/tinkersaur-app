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
