/**
 * Hook for generating and displaying AI-powered diagram improvement suggestions
 *
 * Orchestrates the full flow:
 * 1. Get current mermaid syntax
 * 2. Call API to generate suggestions
 * 3. Match suggestions to shapes by label
 * 4. Calculate positions for suggestion shapes
 * 5. Create suggestion shapes and connectors
 * 6. Add to diagram and show overlay
 */

import { useState, useCallback } from 'react';
import { generateSuggestions } from '@/features/llm-generation';
import { useMermaidViewerStore } from '@/app/model/stores/mermaid';
import { useOverlayVisibilityStore } from '@/app/model/stores/overlay';
import { useDiagramCRUD } from '../api/useDiagramCRUD';
import { useAuthStore } from '@/features/auth';
import type { Shape, CreateShapeDTO, SuggestionCommentShapeData } from '@/entities/shape';
import type { CreateConnectorDTO } from '@/entities/connector';
import {
  findSuggestionPosition,
  SUGGESTION_SHAPE_WIDTH,
  SUGGESTION_SHAPE_HEIGHT,
} from '@/widgets/canvas/lib/utils/suggestionPositioning';

interface UseSuggestionsGeneratorProps {
  diagramId: string | undefined;
  diagramType: string | undefined;
  shapes: Shape[];
}

interface UseSuggestionsGeneratorReturn {
  isLoading: boolean;
  error: string | null;
  generateAndDisplaySuggestions: () => Promise<void>;
}

/**
 * Hook for generating AI suggestions and displaying them on the canvas
 */
export function useSuggestionsGenerator({
  diagramId,
  diagramType,
  shapes,
}: UseSuggestionsGeneratorProps): UseSuggestionsGeneratorReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get mermaid syntax from store
  const mermaidSyntax = useMermaidViewerStore((state) => state.mermaidSyntax);

  // Get overlay visibility actions
  const { showOverlay } = useOverlayVisibilityStore();

  // Get CRUD operations
  const { addShape, addConnector } = useDiagramCRUD(diagramId);

  // Get teamId for API calls
  const teamId = useAuthStore((state) => state.selectedTeam?.teamId ?? '');

  /**
   * Find a shape by its label (case-insensitive matching)
   */
  const findShapeByLabel = useCallback(
    (label: string): Shape | undefined => {
      // Try exact match first
      let match = shapes.find(
        (s) => s.label?.toLowerCase() === label.toLowerCase()
      );

      if (match) return match;

      // Try partial match (label contains the search term)
      match = shapes.find(
        (s) => s.label?.toLowerCase().includes(label.toLowerCase())
      );

      if (match) return match;

      // Try if search term contains the shape label
      match = shapes.find(
        (s) => s.label && label.toLowerCase().includes(s.label.toLowerCase())
      );

      return match;
    },
    [shapes]
  );

  /**
   * Generate suggestions and add them to the diagram
   */
  const generateAndDisplaySuggestions = useCallback(async () => {
    if (!diagramId || !diagramType || !addShape || !addConnector) {
      setError('Diagram not ready');
      return;
    }

    if (!mermaidSyntax || mermaidSyntax.trim().length === 0) {
      setError('No diagram content to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call API to get suggestions
      const suggestions = await generateSuggestions(mermaidSyntax, diagramType, teamId);

      if (suggestions.length === 0) {
        setError('No suggestions generated - your diagram looks good!');
        setIsLoading(false);
        return;
      }

      // Track how many suggestions we've added per target shape
      const suggestionsPerTarget = new Map<string, number>();

      // Get all current shapes including any we're about to add
      const allShapes = [...shapes];

      // Process each suggestion
      for (const suggestion of suggestions) {
        // Find the target shape
        const targetShape = findShapeByLabel(suggestion.shapeLabel);

        if (!targetShape) {
          console.warn(
            `Could not find shape matching label: "${suggestion.shapeLabel}"`
          );
          continue;
        }

        // Get count of existing suggestions for this target
        const existingCount = suggestionsPerTarget.get(targetShape.id) || 0;
        suggestionsPerTarget.set(targetShape.id, existingCount + 1);

        // Calculate position for the suggestion shape
        const position = findSuggestionPosition(
          targetShape,
          allShapes,
          SUGGESTION_SHAPE_WIDTH,
          SUGGESTION_SHAPE_HEIGHT,
          existingCount
        );

        // Create the suggestion shape data
        const shapeData: SuggestionCommentShapeData = {
          targetShapeId: targetShape.id,
          suggestion: suggestion.suggestion,
        };

        // Create the suggestion shape
        const suggestionShapeDTO: CreateShapeDTO = {
          type: 'suggestion-comment',
          x: position.x,
          y: position.y,
          width: SUGGESTION_SHAPE_WIDTH,
          height: SUGGESTION_SHAPE_HEIGHT,
          label: suggestion.suggestion,
          zIndex: 100, // High z-index to appear on top
          locked: false,
          isPreview: false,
          data: shapeData,
          overlayTag: 'suggestion',
        };

        // Add the shape and get its ID
        const suggestionShapeId = await addShape(suggestionShapeDTO);

        // Add the shape to our tracking array for collision detection
        allShapes.push({
          id: suggestionShapeId,
          ...suggestionShapeDTO,
        } as Shape);

        // Create a curved connector from suggestion to target
        const connectorDTO: CreateConnectorDTO = {
          type: 'suggestion-connector',
          sourceShapeId: suggestionShapeId,
          targetShapeId: targetShape.id,
          style: 'curved',
          markerStart: 'none',
          markerEnd: 'none',
          lineType: 'dashed',
          zIndex: 99, // Just below the suggestion shapes
          overlayTag: 'suggestion',
        };

        await addConnector(connectorDTO);
      }

      // Show the suggestion overlay
      showOverlay('suggestion');

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to generate suggestions'
      );
      setIsLoading(false);
    }
  }, [
    diagramId,
    diagramType,
    teamId,
    mermaidSyntax,
    shapes,
    addShape,
    addConnector,
    findShapeByLabel,
    showOverlay,
  ]);

  return {
    isLoading,
    error,
    generateAndDisplaySuggestions,
  };
}
