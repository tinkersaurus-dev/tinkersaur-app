import { useCallback } from 'react';
import type { Shape } from '@/entities/shape';
import type { RenderContext } from '@/features/diagram-rendering/shared/rendering/types';

interface UseShapeInteractivityProps {
  shape: Shape;
  context: RenderContext;
  onConnectionPointMouseDown?: (connectionPointId: string, e: React.MouseEvent) => void;
  onConnectionPointMouseUp?: (connectionPointId: string, e: React.MouseEvent) => void;
}

interface UseShapeInteractivityReturn {
  isInteractive: boolean;
  showHover: boolean;
  showSelected: boolean;
  showHoveredContainer: boolean;
  handleConnectionPointMouseDown: (connectionPointId: string, e: React.MouseEvent) => void;
  handleConnectionPointMouseUp: (connectionPointId: string, e: React.MouseEvent) => void;
}

/**
 * Hook for managing shape interactivity state and connection point handlers.
 *
 * Centralizes the common pattern used across all shape renderers:
 * - Determines if shape is interactive (non-preview shapes)
 * - Computes hover/selected states based on interactivity
 * - Wraps connection point handlers to prepend shape ID
 */
export function useShapeInteractivity({
  shape,
  context,
  onConnectionPointMouseDown,
  onConnectionPointMouseUp,
}: UseShapeInteractivityProps): UseShapeInteractivityReturn {
  const { isSelected, isHovered, isHoveredContainer } = context;

  const isInteractive = !shape.isPreview;
  const showHover = isInteractive && isHovered;
  const showSelected = isInteractive && isSelected;
  const showHoveredContainer = isInteractive && isHoveredContainer;

  const handleConnectionPointMouseDown = useCallback(
    (connectionPointId: string, e: React.MouseEvent) => {
      onConnectionPointMouseDown?.(`${shape.id}-${connectionPointId}`, e);
    },
    [shape.id, onConnectionPointMouseDown]
  );

  const handleConnectionPointMouseUp = useCallback(
    (connectionPointId: string, e: React.MouseEvent) => {
      onConnectionPointMouseUp?.(`${shape.id}-${connectionPointId}`, e);
    },
    [shape.id, onConnectionPointMouseUp]
  );

  return {
    isInteractive,
    showHover,
    showSelected,
    showHoveredContainer,
    handleConnectionPointMouseDown,
    handleConnectionPointMouseUp,
  };
}
