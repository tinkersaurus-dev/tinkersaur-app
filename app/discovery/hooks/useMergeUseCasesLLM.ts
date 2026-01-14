/**
 * Hook for merging use cases using the LLM API
 * Sends use cases to Bedrock for intelligent merging
 */

import { createLLMMergeHook } from './createLLMMergeHook';
import type { MergedUseCaseData, UseCase } from '~/core/entities/product-management/types';

interface UseCaseInput {
  name: string;
  description: string;
}

export const useMergeUseCasesLLM = createLLMMergeHook<UseCaseInput, UseCase | UseCaseInput, MergedUseCaseData>({
  endpoint: '/api/ai/merge-use-cases',
  itemsFieldName: 'useCases',
  toInput: (uc) => ({
    name: uc.name,
    description: uc.description,
  }),
  getMergedResult: (response) => response.useCase as MergedUseCaseData | undefined,
});
