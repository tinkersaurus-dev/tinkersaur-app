import type { SimilarPersonaResult, SimilarUseCaseResult } from '~/core/entities/product-management/types';
import type { SimilarFeedbackResult } from '~/core/entities/discovery/types';

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
