import type { Outcome } from '../model/types';

export function isUnlinkedOutcome(o: Outcome): boolean {
  return !o.solutionId;
}

export function filterUnlinkedOutcomes(outcomes: Outcome[]): Outcome[] {
  return outcomes.filter(isUnlinkedOutcome);
}
