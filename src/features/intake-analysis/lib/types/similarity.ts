import type { SimilarPersonaResult } from '@/entities/persona';
import type { SimilarUseCaseResult } from '@/entities/use-case';
import type { SimilarFeedbackResult } from '@/entities/feedback';
import type { SimilarOutcomeResult } from '@/entities/outcome';

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
