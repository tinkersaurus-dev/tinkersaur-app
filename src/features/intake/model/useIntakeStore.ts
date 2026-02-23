import { create } from 'zustand';
import type { SimilarPersonaResult } from '@/entities/persona';
import type { SourceTypeKey } from '@/entities/source-type';
import type {
  AgentSession,
  AnalysisPhase,
  DocumentType,
  Extraction,
  ExtractionType,
  DocumentHighlight,
  PersonaPendingMerge,
  InlineSimilarityMatch,
  FeedbackPendingMerge,
  UserGoalPendingMerge,
  OutcomePendingMerge,
} from './types';

interface IntakeState {
  // Session
  session: AgentSession | null;
  phase: AnalysisPhase;

  // Document
  documentContent: string;
  documentType: DocumentType | null;

  // Suggestions (shown after type detection)
  suggestedExtractions: ExtractionType[];
  selectedExtractions: ExtractionType[];

  // Extractions
  extractions: Map<string, Extraction>;
  highlights: Map<string, DocumentHighlight>;

  // UI state
  activeHighlightId: string | null;
  activeExtractionId: string | null;
  newExtractionIds: Set<string>; // Track recently added extractions for entrance animation

  // Error state
  error: string | null;

  // Persona matching state
  personaMatches: Map<string, SimilarPersonaResult[]>;
  checkingPersonas: Set<string>;
  pendingPersonaMerges: Map<string, PersonaPendingMerge>;

  // Inline similarity state (feedback, userGoals, outcomes)
  inlineSimilarityMatches: Map<string, InlineSimilarityMatch>;
  checkingInlineSimilarity: Set<string>;
  dismissedSimilarities: Set<string>;

  // Inline pending merges
  pendingFeedbackMerges: Map<string, FeedbackPendingMerge>;
  pendingUserGoalMerges: Map<string, UserGoalPendingMerge>;
  pendingOutcomeMerges: Map<string, OutcomePendingMerge>;

  // Solution & source metadata
  selectedSolutionId: string | null;
  selectedSourceType: SourceTypeKey | null;
  sourceMetadata: Record<string, string>;

  // Actions
  setDocumentContent: (content: string) => void;
  setPhase: (phase: AnalysisPhase) => void;
  startSession: (sessionId: string) => void;
  setDocumentType: (type: DocumentType) => void;
  setSuggestedExtractions: (types: ExtractionType[]) => void;
  toggleExtractionType: (type: ExtractionType) => void;
  setSelectedExtractions: (types: ExtractionType[]) => void;

  // Extraction actions
  addExtraction: (extraction: Extraction) => void;
  updateExtraction: (id: string, updates: Partial<Extraction>) => void;
  removeExtraction: (id: string) => void;
  acceptExtraction: (id: string) => void;
  acceptAllExtractions: () => void;
  rejectExtraction: (id: string) => void;

  // Highlight actions
  addHighlight: (highlight: DocumentHighlight) => void;
  setActiveHighlight: (id: string | null) => void;
  setActiveExtraction: (id: string | null) => void;

  // Error handling
  setError: (error: string | null) => void;

  // Animation
  clearNewExtractionFlag: (id: string) => void;

  // Persona matching actions
  setPersonaMatches: (extractionId: string, matches: SimilarPersonaResult[]) => void;
  setCheckingPersona: (extractionId: string, isChecking: boolean) => void;
  addPendingPersonaMerge: (extractionId: string, merge: PersonaPendingMerge) => void;
  removePendingPersonaMerge: (extractionId: string) => void;
  clearPersonaMatches: (extractionId: string) => void;

  // Inline similarity actions
  setInlineSimilarityMatch: (extractionId: string, match: InlineSimilarityMatch | null) => void;
  setCheckingInlineSimilarity: (extractionId: string, isChecking: boolean) => void;
  dismissSimilarity: (extractionId: string) => void;

  // Solution & source metadata actions
  setSelectedSolutionId: (id: string | null) => void;
  setSelectedSourceType: (type: SourceTypeKey | null) => void;
  setSourceMetadata: (metadata: Record<string, string>) => void;
  updateSourceMetadataField: (name: string, value: string) => void;

  // Inline merge actions
  addPendingFeedbackMerge: (extractionId: string, merge: FeedbackPendingMerge) => void;
  removePendingFeedbackMerge: (extractionId: string) => void;
  addPendingUserGoalMerge: (extractionId: string, merge: UserGoalPendingMerge) => void;
  removePendingUserGoalMerge: (extractionId: string) => void;
  addPendingOutcomeMerge: (extractionId: string, merge: OutcomePendingMerge) => void;
  removePendingOutcomeMerge: (extractionId: string) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  session: null,
  phase: 'idle' as AnalysisPhase,
  documentContent: '',
  documentType: null,
  suggestedExtractions: [] as ExtractionType[],
  selectedExtractions: [] as ExtractionType[],
  extractions: new Map<string, Extraction>(),
  highlights: new Map<string, DocumentHighlight>(),
  activeHighlightId: null,
  activeExtractionId: null,
  newExtractionIds: new Set<string>(),
  error: null,
  // Persona matching state
  personaMatches: new Map<string, SimilarPersonaResult[]>(),
  checkingPersonas: new Set<string>(),
  pendingPersonaMerges: new Map<string, PersonaPendingMerge>(),
  // Inline similarity state
  inlineSimilarityMatches: new Map<string, InlineSimilarityMatch>(),
  checkingInlineSimilarity: new Set<string>(),
  dismissedSimilarities: new Set<string>(),
  // Inline pending merges
  pendingFeedbackMerges: new Map<string, FeedbackPendingMerge>(),
  pendingUserGoalMerges: new Map<string, UserGoalPendingMerge>(),
  pendingOutcomeMerges: new Map<string, OutcomePendingMerge>(),
  // Solution & source metadata
  selectedSolutionId: null,
  selectedSourceType: null,
  sourceMetadata: {},
};

export const useIntakeStore = create<IntakeState>((set, _get) => ({
  ...initialState,

  setDocumentContent: (content) => set({ documentContent: content }),

  setPhase: (phase) => set({ phase }),

  startSession: (sessionId) =>
    set({
      session: { id: sessionId, startedAt: new Date() },
      phase: 'detecting',
      error: null,
    }),

  setDocumentType: (type) => set({ documentType: type, selectedSourceType: type as SourceTypeKey }),

  setSuggestedExtractions: (types) =>
    set({
      suggestedExtractions: types,
      selectedExtractions: types, // Default all selected
      phase: 'suggesting',
    }),

  toggleExtractionType: (type) =>
    set((state) => {
      const selected = new Set(state.selectedExtractions);
      if (selected.has(type)) {
        selected.delete(type);
      } else {
        selected.add(type);
      }
      return { selectedExtractions: Array.from(selected) };
    }),

  setSelectedExtractions: (types) => set({ selectedExtractions: types }),

  addExtraction: (extraction) =>
    set((state) => {
      const extractions = new Map(state.extractions);
      extractions.set(extraction.id, extraction);
      const newExtractionIds = new Set(state.newExtractionIds);
      newExtractionIds.add(extraction.id);
      return { extractions, newExtractionIds };
    }),

  updateExtraction: (id, updates) =>
    set((state) => {
      const extractions = new Map(state.extractions);
      const existing = extractions.get(id);
      if (existing) {
        extractions.set(id, { ...existing, ...updates });
      }
      return { extractions };
    }),

  removeExtraction: (id) =>
    set((state) => {
      const extractions = new Map(state.extractions);
      const highlights = new Map(state.highlights);
      extractions.delete(id);
      // Remove associated highlight
      for (const [hId, h] of highlights) {
        if (h.extractionId === id) {
          highlights.delete(hId);
        }
      }
      return { extractions, highlights };
    }),

  acceptExtraction: (id) =>
    set((state) => {
      const extractions = new Map(state.extractions);
      const extraction = extractions.get(id);
      if (extraction) {
        extractions.set(id, { ...extraction, status: 'accepted' });
      }
      return { extractions };
    }),

  acceptAllExtractions: () =>
    set((state) => {
      const extractions = new Map(state.extractions);
      for (const [id, extraction] of extractions) {
        if (extraction.status === 'pending') {
          extractions.set(id, { ...extraction, status: 'accepted' });
        }
      }
      return { extractions };
    }),

  rejectExtraction: (id) =>
    set((state) => {
      const extractions = new Map(state.extractions);
      const highlights = new Map(state.highlights);
      // Also clean up any pending merges and similarity state
      const pendingFeedbackMerges = new Map(state.pendingFeedbackMerges);
      const pendingUserGoalMerges = new Map(state.pendingUserGoalMerges);
      const pendingOutcomeMerges = new Map(state.pendingOutcomeMerges);
      const inlineSimilarityMatches = new Map(state.inlineSimilarityMatches);
      const dismissedSimilarities = new Set(state.dismissedSimilarities);

      extractions.delete(id);
      for (const [hId, h] of highlights) {
        if (h.extractionId === id) {
          highlights.delete(hId);
        }
      }
      pendingFeedbackMerges.delete(id);
      pendingUserGoalMerges.delete(id);
      pendingOutcomeMerges.delete(id);
      inlineSimilarityMatches.delete(id);
      dismissedSimilarities.delete(id);

      return {
        extractions,
        highlights,
        pendingFeedbackMerges,
        pendingUserGoalMerges,
        pendingOutcomeMerges,
        inlineSimilarityMatches,
        dismissedSimilarities,
      };
    }),

  addHighlight: (highlight) =>
    set((state) => {
      const highlights = new Map(state.highlights);
      highlights.set(highlight.id, highlight);
      return { highlights };
    }),

  setActiveHighlight: (id) =>
    set((state) => ({
      activeHighlightId: id,
      activeExtractionId: id
        ? state.highlights.get(id)?.extractionId ?? null
        : null,
    })),

  setActiveExtraction: (id) =>
    set((state) => {
      // Find associated highlight
      let highlightId: string | null = null;
      for (const [hId, h] of state.highlights) {
        if (h.extractionId === id) {
          highlightId = hId;
          break;
        }
      }
      return { activeExtractionId: id, activeHighlightId: highlightId };
    }),

  setError: (error) => set({ error }),

  clearNewExtractionFlag: (id) =>
    set((state) => {
      const newExtractionIds = new Set(state.newExtractionIds);
      newExtractionIds.delete(id);
      return { newExtractionIds };
    }),

  // Persona matching actions
  setPersonaMatches: (extractionId, matches) =>
    set((state) => {
      const personaMatches = new Map(state.personaMatches);
      personaMatches.set(extractionId, matches);
      return { personaMatches };
    }),

  setCheckingPersona: (extractionId, isChecking) =>
    set((state) => {
      const checkingPersonas = new Set(state.checkingPersonas);
      if (isChecking) {
        checkingPersonas.add(extractionId);
      } else {
        checkingPersonas.delete(extractionId);
      }
      return { checkingPersonas };
    }),

  addPendingPersonaMerge: (extractionId, merge) =>
    set((state) => {
      const pendingPersonaMerges = new Map(state.pendingPersonaMerges);
      pendingPersonaMerges.set(extractionId, merge);
      return { pendingPersonaMerges };
    }),

  removePendingPersonaMerge: (extractionId) =>
    set((state) => {
      const pendingPersonaMerges = new Map(state.pendingPersonaMerges);
      pendingPersonaMerges.delete(extractionId);
      return { pendingPersonaMerges };
    }),

  clearPersonaMatches: (extractionId) =>
    set((state) => {
      const personaMatches = new Map(state.personaMatches);
      personaMatches.delete(extractionId);
      return { personaMatches };
    }),

  // Inline similarity actions
  setInlineSimilarityMatch: (extractionId, match) =>
    set((state) => {
      const inlineSimilarityMatches = new Map(state.inlineSimilarityMatches);
      if (match) {
        inlineSimilarityMatches.set(extractionId, match);
      } else {
        inlineSimilarityMatches.delete(extractionId);
      }
      return { inlineSimilarityMatches };
    }),

  setCheckingInlineSimilarity: (extractionId, isChecking) =>
    set((state) => {
      const checkingInlineSimilarity = new Set(state.checkingInlineSimilarity);
      if (isChecking) {
        checkingInlineSimilarity.add(extractionId);
      } else {
        checkingInlineSimilarity.delete(extractionId);
      }
      return { checkingInlineSimilarity };
    }),

  dismissSimilarity: (extractionId) =>
    set((state) => {
      const dismissedSimilarities = new Set(state.dismissedSimilarities);
      dismissedSimilarities.add(extractionId);
      return { dismissedSimilarities };
    }),

  // Solution & source metadata actions
  setSelectedSolutionId: (id) => set({ selectedSolutionId: id }),

  setSelectedSourceType: (type) => set({ selectedSourceType: type, sourceMetadata: {} }),

  setSourceMetadata: (metadata) => set({ sourceMetadata: metadata }),

  updateSourceMetadataField: (name, value) =>
    set((state) => ({
      sourceMetadata: { ...state.sourceMetadata, [name]: value },
    })),

  // Inline merge actions
  addPendingFeedbackMerge: (extractionId, merge) =>
    set((state) => {
      const pendingFeedbackMerges = new Map(state.pendingFeedbackMerges);
      pendingFeedbackMerges.set(extractionId, merge);
      return { pendingFeedbackMerges };
    }),

  removePendingFeedbackMerge: (extractionId) =>
    set((state) => {
      const pendingFeedbackMerges = new Map(state.pendingFeedbackMerges);
      pendingFeedbackMerges.delete(extractionId);
      return { pendingFeedbackMerges };
    }),

  addPendingUserGoalMerge: (extractionId, merge) =>
    set((state) => {
      const pendingUserGoalMerges = new Map(state.pendingUserGoalMerges);
      pendingUserGoalMerges.set(extractionId, merge);
      return { pendingUserGoalMerges };
    }),

  removePendingUserGoalMerge: (extractionId) =>
    set((state) => {
      const pendingUserGoalMerges = new Map(state.pendingUserGoalMerges);
      pendingUserGoalMerges.delete(extractionId);
      return { pendingUserGoalMerges };
    }),

  addPendingOutcomeMerge: (extractionId, merge) =>
    set((state) => {
      const pendingOutcomeMerges = new Map(state.pendingOutcomeMerges);
      pendingOutcomeMerges.set(extractionId, merge);
      return { pendingOutcomeMerges };
    }),

  removePendingOutcomeMerge: (extractionId) =>
    set((state) => {
      const pendingOutcomeMerges = new Map(state.pendingOutcomeMerges);
      pendingOutcomeMerges.delete(extractionId);
      return { pendingOutcomeMerges };
    }),

  reset: () => set({
    ...initialState,
    extractions: new Map(),
    highlights: new Map(),
    newExtractionIds: new Set(),
    personaMatches: new Map(),
    checkingPersonas: new Set(),
    pendingPersonaMerges: new Map(),
    inlineSimilarityMatches: new Map(),
    checkingInlineSimilarity: new Set(),
    dismissedSimilarities: new Set(),
    pendingFeedbackMerges: new Map(),
    pendingUserGoalMerges: new Map(),
    pendingOutcomeMerges: new Map(),
    selectedSolutionId: null,
    selectedSourceType: null,
    sourceMetadata: {},
  }),
}));

// Selector hooks for derived state
export const useExtractionsByType = (type: ExtractionType): Extraction[] => {
  const extractions = useIntakeStore((state) => state.extractions);
  return Array.from(extractions.values()).filter((e) => e.type === type);
};

export const useGroupedExtractions = (): Record<ExtractionType, Extraction[]> => {
  const extractions = useIntakeStore((state) => state.extractions);
  const groups: Record<ExtractionType, Extraction[]> = {
    personas: [],
    userGoals: [],
    feedback: [],
    outcomes: [],
    requirements: [],
  };

  for (const extraction of extractions.values()) {
    if (groups[extraction.type]) {
      groups[extraction.type].push(extraction);
    }
  }

  return groups;
};
