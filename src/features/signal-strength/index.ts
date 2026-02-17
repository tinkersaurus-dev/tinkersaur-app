/**
 * Signal Strength Feature
 *
 * Computes and visualizes tag-based signal strength, combining
 * feedback volume, persona diversity, and source diversity.
 *
 * @module features/signal-strength
 */

// Lib
export { useSignalStrengthData } from './lib/useSignalStrengthData';
export { useSignalStrengthFilterState } from './lib/useSignalStrengthFilterState';
export { useFilteredFeedback } from './lib/useFilteredFeedback';
export type { TagSignal, PainRadarRow } from './lib/types';
export { PAIN_TYPES, OPPORTUNITY_TYPES } from './lib/types';

// UI
export { TagSignalCard } from './ui/TagSignalCard';
export { PainRadar } from './ui/PainRadar';
export { SignalFeedbackList } from './ui/SignalFeedbackList';
