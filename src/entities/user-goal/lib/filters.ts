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
