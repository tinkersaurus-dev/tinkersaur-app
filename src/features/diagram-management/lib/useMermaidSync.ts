import { useEffect, useCallback, useRef } from 'react';
import type { Shape } from '@/entities/shape';
import type { Connector } from '@/entities/connector';
import type { DiagramType } from '@/entities/diagram';
import { getMermaidExporter } from '@/features/diagram-rendering/shared/mermaid';
import { useMermaidViewerStore } from '@/shared/store/mermaid/mermaidViewerStore';
import { useDiagramStore } from '@/entities/diagram';

/**
 * Debounce time in milliseconds for mermaid syntax generation
 * Prevents excessive regeneration during rapid changes
 */
const MERMAID_UPDATE_DEBOUNCE_MS = 300;

/**
 * Debounce time in milliseconds for persisting mermaid syntax to diagram
 * Longer than generation to allow multiple rapid edits to settle
 */
const MERMAID_PERSIST_DEBOUNCE_MS = 1000;

/**
 * Props for the useMermaidSync hook
 */
interface UseMermaidSyncProps {
  shapes: Shape[];
  connectors: Connector[];
  diagramType: DiagramType | undefined;
  diagramId?: string;
  enabled?: boolean;
}

/**
 * Hook to automatically sync diagram shapes/connectors to mermaid syntax
 *
 * This hook watches the shapes and connectors and automatically generates
 * mermaid syntax, storing it in the global mermaid viewer store.
 *
 * If diagramId is provided, the generated mermaid syntax is also persisted
 * to the diagram object for reuse across the application.
 *
 * The generation is debounced to prevent excessive updates during editing.
 *
 * @param props - Configuration for mermaid sync
 * @returns Object with manual generateMermaid function
 */
export function useMermaidSync({
  shapes,
  connectors,
  diagramType,
  diagramId,
  enabled = true,
}: UseMermaidSyncProps) {
  const { setSyntax, setError } = useMermaidViewerStore();
  const updateDiagramMermaid = useDiagramStore((state) => state._internalUpdateDiagramMermaid);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const persistTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Debounced function to persist mermaid syntax to diagram
   * Uses internal update method to avoid triggering loading states
   */
  const persistMermaidToDiagram = useCallback(
    (syntax: string) => {
      if (!diagramId) {
        return;
      }

      // Clear any existing persist timer
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }

      // Set new timer for debounced persistence
      persistTimerRef.current = setTimeout(() => {
        updateDiagramMermaid(diagramId, syntax);
      }, MERMAID_PERSIST_DEBOUNCE_MS);
    },
    [diagramId, updateDiagramMermaid]
  );

  /**
   * Generate mermaid syntax from current shapes and connectors
   */
  const generateMermaid = useCallback(() => {
    // Clear any existing error
    setError(null);

    // If no shapes, clear syntax and return
    if (shapes.length === 0) {
      setSyntax('');
      // Persist empty syntax to diagram
      persistMermaidToDiagram('');
      return;
    }

    // If no diagram type, cannot generate
    if (!diagramType) {
      setError('Cannot generate Mermaid syntax: diagram type is unknown');
      return;
    }

    // Get the appropriate exporter for this diagram type
    const exporterResult = getMermaidExporter(diagramType, {
      includeMetadata: false,
      includeComments: false,
      direction: 'LR',
    });

    if (!exporterResult.ok) {
      setError(exporterResult.error);
      return;
    }

    const exporter = exporterResult.value;

    // Validate shapes and connectors
    const validationResult = exporter.validate(shapes, connectors);
    if (!validationResult.ok) {
      setError(validationResult.error);
      return;
    }

    // Export to mermaid syntax
    const exportResult = exporter.export(shapes, connectors);

    if (!exportResult.ok) {
      setError(exportResult.error);
      return;
    }

    // Update store with generated syntax
    const syntax = exportResult.value.syntax;
    setSyntax(syntax);

    // Persist to diagram (debounced)
    persistMermaidToDiagram(syntax);
  }, [shapes, connectors, diagramType, setSyntax, setError, persistMermaidToDiagram]);

  /**
   * Effect to auto-generate mermaid syntax when shapes/connectors change
   * Uses debouncing to prevent excessive regeneration
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced generation
    debounceTimerRef.current = setTimeout(() => {
      generateMermaid();
    }, MERMAID_UPDATE_DEBOUNCE_MS);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, [shapes, connectors, diagramType, enabled, generateMermaid]);

  return {
    generateMermaid,
  };
}
