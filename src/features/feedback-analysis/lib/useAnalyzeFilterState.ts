import { useState, useCallback } from 'react';
import type { FeedbackType, TimeGranularity } from '@/entities/feedback';

interface AnalyzeFilterState {
  selectedTypes: FeedbackType[];
  selectedTags: string[];
  selectedSolutionId: string | null;
  selectedFeedbackId: string | null;
  granularity: TimeGranularity;
}

export function useAnalyzeFilterState() {
  const [state, setState] = useState<AnalyzeFilterState>({
    selectedTypes: [],
    selectedTags: [],
    selectedSolutionId: null,
    selectedFeedbackId: null,
    granularity: 'day',
  });

  const setSelectedTypes = useCallback((types: FeedbackType[]) => {
    setState((prev) => ({ ...prev, selectedTypes: types }));
  }, []);

  const toggleType = useCallback((type: FeedbackType) => {
    setState((prev) => {
      const exists = prev.selectedTypes.includes(type);
      return {
        ...prev,
        selectedTypes: exists
          ? prev.selectedTypes.filter((t) => t !== type)
          : [...prev.selectedTypes, type],
      };
    });
  }, []);

  const setSelectedTags = useCallback((tags: string[]) => {
    setState((prev) => ({ ...prev, selectedTags: tags }));
  }, []);

  const setSelectedSolutionId = useCallback((solutionId: string | null) => {
    setState((prev) => ({ ...prev, selectedSolutionId: solutionId }));
  }, []);

  const setSelectedFeedbackId = useCallback((feedbackId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedFeedbackId: prev.selectedFeedbackId === feedbackId ? null : feedbackId,
    }));
  }, []);

  const setGranularity = useCallback((granularity: TimeGranularity) => {
    setState((prev) => ({ ...prev, granularity }));
  }, []);

  const clearAll = useCallback(() => {
    setState({
      selectedTypes: [],
      selectedTags: [],
      selectedSolutionId: null,
      selectedFeedbackId: null,
      granularity: 'week',
    });
  }, []);

  const hasActiveFilters =
    state.selectedTypes.length > 0 ||
    state.selectedTags.length > 0 ||
    state.selectedSolutionId !== null ||
    state.selectedFeedbackId !== null;

  return {
    ...state,
    hasActiveFilters,
    setSelectedTypes,
    toggleType,
    setSelectedTags,
    setSelectedSolutionId,
    setSelectedFeedbackId,
    setGranularity,
    clearAll,
  };
}
