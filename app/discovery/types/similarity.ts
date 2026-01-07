import type { SimilarPersonaResult, SimilarUseCaseResult } from '~/core/entities/product-management/types';
import type { SimilarFeedbackResult, SimilarOutcomeResult } from '~/core/entities/discovery/types';

export interface SimilarPersonaInfo {
  personaIndex: number;
  personaName: string;
  similarResults: SimilarPersonaResult[];
}

export interface SimilarUseCaseInfo {
  useCaseIndex: number;
  useCaseName: string;
  similarResults: SimilarUseCaseResult[];
}

export interface SimilarFeedbackInfo {
  feedbackIndex: number;
  feedbackContent: string;
  similarResults: SimilarFeedbackResult[];
}

export interface SimilarOutcomeInfo {
  outcomeIndex: number;
  outcomeDescription: string;
  similarResults: SimilarOutcomeResult[];
}
