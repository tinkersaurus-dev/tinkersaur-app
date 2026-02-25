import type { UserGoal } from '../model/types';

export const WEAK_EVIDENCE_THRESHOLD = 3;
export const STRONG_EVIDENCE_THRESHOLD = 6;

export type EvidenceStrength = 'Weak' | 'Evident' | 'Strong';

export function getEvidenceCount(ug: UserGoal): number {
  return (ug.personaIds?.length ?? 0) + (ug.feedbackIds?.length ?? 0);
}

export function getEvidenceStrength(ug: UserGoal): EvidenceStrength {
  const count = getEvidenceCount(ug);
  if (count >= STRONG_EVIDENCE_THRESHOLD) return 'Strong';
  if (count >= WEAK_EVIDENCE_THRESHOLD) return 'Evident';
  return 'Weak';
}

export function hasWeakEvidence(ug: UserGoal, threshold = WEAK_EVIDENCE_THRESHOLD): boolean {
  return getEvidenceCount(ug) < threshold;
}

export function filterWeakEvidenceUserGoals(
  userGoals: UserGoal[],
  threshold = WEAK_EVIDENCE_THRESHOLD,
): UserGoal[] {
  return userGoals.filter((ug) => hasWeakEvidence(ug, threshold));
}

// Freshness helpers (based on last intake: most recent Feedback association)

export const FRESH_THRESHOLD_DAYS = 14;
export const MODERATE_THRESHOLD_DAYS = 30;

export type Freshness = 'Fresh' | 'Moderate' | 'Stale';

export function getDaysSinceLastIntake(ug: UserGoal): number | null {
  if (!ug.lastIntakeAt) return null;
  return Math.floor(
    (Date.now() - new Date(ug.lastIntakeAt).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function getFreshness(ug: UserGoal): Freshness | null {
  const days = getDaysSinceLastIntake(ug);
  if (days === null) return null;
  if (days < FRESH_THRESHOLD_DAYS) return 'Fresh';
  if (days <= MODERATE_THRESHOLD_DAYS) return 'Moderate';
  return 'Stale';
}
