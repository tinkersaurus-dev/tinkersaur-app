import { useCallback } from 'react';
import type { Shape, Connector } from '~/core/entities/design-studio/types';

interface UseCanvasLabelEditingProps {
  localShapes: Shape[];
  localConnectors: Connector[];
  editingEntityId: string | null;
  editingEntityType: 'shape' | 'connector' | null;
  editingOriginalLabel: string | undefined;
  setEditingEntity: (entityId: string, entityType: 'shape' | 'connector', originalLabel: string) => void;
  clearEditingEntity: () => void;
  updateLocalShape: (shapeId: string, updates: Partial<Shape>) => void;
  updateLocalConnector: (connectorId: string, updates: Partial<Connector>) => void;
  updateShapeLabel: (diagramId: string, shapeId: string, label: string) => Promise<void>;
  updateConnectorLabel: (diagramId: string, connectorId: string, label: string) => Promise<void>;
  diagramId: string;
}

/**
 * Hook for managing label editing on shapes and connectors
 */
export function useCanvasLabelEditing({
  localShapes,
  localConnectors,
  editingEntityId,
  editingEntityType,
  editingOriginalLabel,
  setEditingEntity,
  clearEditingEntity,
  updateLocalShape,
  updateLocalConnector,
  updateShapeLabel,
  updateConnectorLabel,
  diagramId,
}: UseCanvasLabelEditingProps) {
  const handleShapeDoubleClick = useCallback(
    (shapeId: string) => {
      const shape = localShapes.find((s) => s.id === shapeId);
      if (shape) {
        setEditingEntity(shapeId, 'shape', shape.label || '');
      }
    },
    [localShapes, setEditingEntity]
  );

  const handleConnectorDoubleClick = useCallback(
    (connectorId: string) => {
      const connector = localConnectors.find((c) => c.id === connectorId);
      if (connector) {
        setEditingEntity(connectorId, 'connector', connector.label || '');
      }
    },
    [localConnectors, setEditingEntity]
  );

  const handleLabelChange = useCallback(
    (entityId: string, entityType: 'shape' | 'connector', newLabel: string) => {
      if (entityType === 'shape') {
        updateLocalShape(entityId, { label: newLabel });
      } else {
        updateLocalConnector(entityId, { label: newLabel });
      }
    },
    [updateLocalShape, updateLocalConnector]
  );

  const handleFinishEditing = useCallback(
    async () => {
      if (!editingEntityId || !editingEntityType) return;

      // Get current label
      let currentLabel: string | undefined;
      if (editingEntityType === 'shape') {
        const shape = localShapes.find((s) => s.id === editingEntityId);
        currentLabel = shape?.label;
      } else {
        const connector = localConnectors.find((c) => c.id === editingEntityId);
        currentLabel = connector?.label;
      }

      // Only create command if label actually changed
      if (currentLabel !== editingOriginalLabel) {
        if (editingEntityType === 'shape') {
          await updateShapeLabel(diagramId, editingEntityId, currentLabel || '');
        } else {
          await updateConnectorLabel(diagramId, editingEntityId, currentLabel || '');
        }
      }

      // Clear editing state
      clearEditingEntity();
    },
    [
      editingEntityId,
      editingEntityType,
      editingOriginalLabel,
      localShapes,
      localConnectors,
      updateShapeLabel,
      updateConnectorLabel,
      diagramId,
      clearEditingEntity,
    ]
  );

  return {
    handleShapeDoubleClick,
    handleConnectorDoubleClick,
    handleLabelChange,
    handleFinishEditing,
  };
}
