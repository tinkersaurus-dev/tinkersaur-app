import { useEffect, useCallback, useRef } from 'react';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type { DiagramType } from '~/core/entities/design-studio/types/Diagram';
import { getMermaidExporter } from '../lib/mermaid';
import { useMermaidViewerStore } from '../store/mermaid/mermaidViewerStore';

/**
 * Debounce time in milliseconds for mermaid syntax generation
 * Prevents excessive regeneration during rapid changes
 */
const MERMAID_UPDATE_DEBOUNCE_MS = 300;

/**
 * Props for the useMermaidSync hook
 */
interface UseMermaidSyncProps {
  shapes: Shape[];
  connectors: Connector[];
  diagramType: DiagramType | undefined;
  enabled?: boolean;
}

/**
 * Hook to automatically sync diagram shapes/connectors to mermaid syntax
 *
 * This hook watches the shapes and connectors and automatically generates
 * mermaid syntax, storing it in the global mermaid viewer store.
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
  enabled = true,
}: UseMermaidSyncProps) {
  const { setSyntax, setError } = useMermaidViewerStore();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Generate mermaid syntax from current shapes and connectors
   */
  const generateMermaid = useCallback(() => {
    // Clear any existing error
    setError(null);

    // If no shapes, clear syntax and return
    if (shapes.length === 0) {
      setSyntax('');
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
    setSyntax(exportResult.value.syntax);
  }, [shapes, connectors, diagramType, setSyntax, setError]);

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
    };
  }, [shapes, connectors, diagramType, enabled, generateMermaid]);

  return {
    generateMermaid,
  };
}
