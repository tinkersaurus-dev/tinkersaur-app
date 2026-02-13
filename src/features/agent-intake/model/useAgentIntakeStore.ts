import { create } from 'zustand';
import type { SimilarPersonaResult } from '@/entities/persona';
import type {
  AgentSession,
  AnalysisPhase,
  DocumentType,
  Extraction,
  ExtractionType,
  DocumentHighlight,
  PersonaPendingMerge,
} from './types';

interface AgentIntakeState {
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
};

export const useAgentIntakeStore = create<AgentIntakeState>((set, _get) => ({
  ...initialState,

  setDocumentContent: (content) => set({ documentContent: content }),

  setPhase: (phase) => set({ phase }),

  startSession: (sessionId) =>
    set({
      session: { id: sessionId, startedAt: new Date() },
      phase: 'detecting',
      error: null,
    }),

  setDocumentType: (type) => set({ documentType: type }),

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

  rejectExtraction: (id) =>
    set((state) => {
      const extractions = new Map(state.extractions);
      const highlights = new Map(state.highlights);
      extractions.delete(id);
      for (const [hId, h] of highlights) {
        if (h.extractionId === id) {
          highlights.delete(hId);
        }
      }
      return { extractions, highlights };
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

  reset: () => set({
    ...initialState,
    extractions: new Map(),
    highlights: new Map(),
    newExtractionIds: new Set(),
    personaMatches: new Map(),
    checkingPersonas: new Set(),
    pendingPersonaMerges: new Map(),
  }),
}));

// Selector hooks for derived state
export const useExtractionsByType = (type: ExtractionType): Extraction[] => {
  const extractions = useAgentIntakeStore((state) => state.extractions);
  return Array.from(extractions.values()).filter((e) => e.type === type);
};

export const useGroupedExtractions = (): Record<ExtractionType, Extraction[]> => {
  const extractions = useAgentIntakeStore((state) => state.extractions);
  const groups: Record<ExtractionType, Extraction[]> = {
    personas: [],
    useCases: [],
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
