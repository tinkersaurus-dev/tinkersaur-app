/**
 * useGeneratorReferences Hook
 *
 * Manages referenced diagrams for the LLM diagram generator.
 * Handles fetching, displaying, adding (via drag/drop), and removing diagram references.
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useQueries } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDiagramStore } from '@/entities/diagram/store/useDiagramStore';
import { useCanvasDiagram } from '@/widgets/canvas/ui/contexts/CanvasDiagramContext';
import { useCanvasInstance } from '@/app/model/stores/canvas/useCanvasInstance';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { diagramApi } from '@/entities/diagram';
import type { LLMGeneratorShapeData, Shape } from '@/entities/shape';
import type { Diagram } from '@/entities/diagram';

export interface UseGeneratorReferencesReturn {
  referencedDiagrams: Diagram[];
  handleDrop: (e: React.DragEvent) => Promise<void>;
  handleRemoveReference: (diagramIdToRemove: string) => Promise<void>;
  handleDragOver: (e: React.DragEvent) => void;
}

export function useGeneratorReferences(shape: Shape): UseGeneratorReferencesReturn {
  // Get diagram info from canvas diagram context
  const { diagramId, diagram } = useCanvasDiagram();

  // Get canvas instance store for local state updates
  const canvasInstance = useCanvasInstance(diagramId, diagram?.type);
  const updateLocalShape = canvasInstance((state) => state.updateLocalShape);

  // Get entity store methods for persistence
  const _internalUpdateShape = useDiagramStore((state) => state._internalUpdateShape);
  const storedDiagrams = useDiagramStore((state) => state.diagrams);
  const setDiagram = useDiagramStore((state) => state.setDiagram);

  // Parse shape data - this will update when shape.data changes
  const generatorData = useMemo(() => (shape.data || {}) as LLMGeneratorShapeData, [shape.data]);

  // Referenced diagrams - read directly from shape data (reactive)
  const referencedDiagramIds = useMemo(
    () => generatorData.referencedDiagramIds || [],
    [generatorData.referencedDiagramIds]
  );

  // Use TanStack Query to fetch referenced diagrams
  const referencedDiagramQueries = useQueries({
    queries: referencedDiagramIds.map((id) => ({
      queryKey: queryKeys.diagrams.detail(id),
      queryFn: () => diagramApi.get(id),
      staleTime: STALE_TIMES.diagrams,
    })),
  });

  // Extract query data to stabilize dependencies (avoid infinite loop from array reference changes)
  const fetchedDiagrams = useMemo(() => {
    return referencedDiagramQueries
      .map((query) => query.data)
      .filter((d): d is Diagram => d !== undefined && d !== null);
  }, [referencedDiagramQueries]);

  // Sync fetched diagrams to Zustand store - only when we have new data
  useEffect(() => {
    fetchedDiagrams.forEach((diagram) => {
      // Only set if not already in store to avoid unnecessary updates
      if (!storedDiagrams[diagram.id]) {
        setDiagram(diagram);
      }
    });
  }, [fetchedDiagrams, storedDiagrams, setDiagram]);

  // Combine diagrams from queries and store
  const referencedDiagrams = useMemo(() => {
    return referencedDiagramIds
      .map((id) => {
        // Check store first (for immediate updates), then query results
        if (storedDiagrams[id]) return storedDiagrams[id];
        return fetchedDiagrams.find((d) => d.id === id);
      })
      .filter((d): d is Diagram => d !== undefined && d !== null);
  }, [referencedDiagramIds, storedDiagrams, fetchedDiagrams]);

  // Handle drag over to allow drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Handle drop of diagram from sidebar
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const dragDataStr = e.dataTransfer.getData('application/json');

      if (!dragDataStr) return;

      const dragData = JSON.parse(dragDataStr);

      // Only handle diagram drops (not reference drops)
      if (dragData.type !== 'diagram') {
        return;
      }

      const { diagramId: droppedDiagramId } = dragData;

      // Don't add if already referenced
      if (referencedDiagramIds.includes(droppedDiagramId)) {
        toast.info('This diagram is already referenced');
        return;
      }

      // Add to referenced diagrams
      const updatedReferencedDiagramIds = [...referencedDiagramIds, droppedDiagramId];

      const updatedData = {
        ...generatorData,
        referencedDiagramIds: updatedReferencedDiagramIds,
      };

      // Update BOTH stores: local canvas state (for immediate UI update) and entity store (for persistence)
      updateLocalShape(shape.id, {
        data: updatedData,
      });

      await _internalUpdateShape(diagramId, shape.id, {
        data: updatedData,
      });

      toast.success('Diagram reference added');
    } catch (err) {
      console.error('Failed to handle diagram drop:', err);
      toast.error('Failed to add diagram reference');
    }
  }, [referencedDiagramIds, generatorData, shape.id, diagramId, updateLocalShape, _internalUpdateShape]);

  // Handle removing a reference
  const handleRemoveReference = useCallback(async (diagramIdToRemove: string) => {
    const updatedReferencedDiagramIds = referencedDiagramIds.filter(
      (id) => id !== diagramIdToRemove
    );

    const updatedData = {
      ...generatorData,
      referencedDiagramIds: updatedReferencedDiagramIds,
    };

    // Update BOTH stores: local canvas state (for immediate UI update) and entity store (for persistence)
    updateLocalShape(shape.id, {
      data: updatedData,
    });

    await _internalUpdateShape(diagramId, shape.id, {
      data: updatedData,
    });

    toast.success('Diagram reference removed');
  }, [referencedDiagramIds, generatorData, shape.id, diagramId, updateLocalShape, _internalUpdateShape]);

  return {
    referencedDiagrams,
    handleDrop,
    handleRemoveReference,
    handleDragOver,
  };
}
