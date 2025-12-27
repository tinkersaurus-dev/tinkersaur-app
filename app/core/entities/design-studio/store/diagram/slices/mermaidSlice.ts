import { diagramApi } from '../../../api';
import type { DiagramSlice, MermaidSlice } from '../types';

/**
 * Mermaid sync slice - utility for updating cached mermaid syntax.
 *
 * Used by useMermaidSync hook to persist mermaid export without
 * triggering loading states or re-initialization of canvas local state.
 */
export const createMermaidSlice: DiagramSlice<MermaidSlice> = (set, get) => ({
  _internalUpdateDiagramMermaid: (diagramId: string, mermaidSyntax: string) => {
    const diagram = get().diagrams[diagramId];
    if (diagram) {
      set((state) => ({
        diagrams: {
          ...state.diagrams,
          [diagramId]: {
            ...diagram,
            mermaidSyntax,
          },
        },
      }));
      // Persist to storage
      diagramApi.update(diagramId, { mermaidSyntax });
    }
  },
});
