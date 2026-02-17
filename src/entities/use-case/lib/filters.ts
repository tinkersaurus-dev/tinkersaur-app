import type { UseCase } from '../model/types';

export const WEAK_EVIDENCE_THRESHOLD = 2;

export function getEvidenceCount(uc: UseCase): number {
  return (uc.personaIds?.length ?? 0) + (uc.feedbackIds?.length ?? 0);
}

export function hasWeakEvidence(uc: UseCase, threshold = WEAK_EVIDENCE_THRESHOLD): boolean {
  return getEvidenceCount(uc) < threshold;
}

export function filterWeakEvidenceUseCases(useCases: UseCase[], threshold = WEAK_EVIDENCE_THRESHOLD): UseCase[] {
  return useCases.filter((uc) => hasWeakEvidence(uc, threshold));
}
