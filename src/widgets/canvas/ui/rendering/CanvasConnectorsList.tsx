import { memo, useMemo } from 'react';
import type { Shape } from '@/entities/shape';
import type { Connector } from '@/entities/connector';
import type { ViewportTransform } from '../../lib/utils/viewport';
import { ConnectorRenderer } from '@/features/diagram-rendering/shared/rendering/ConnectorRenderer';
import type { ConnectorRenderContext } from '@/features/diagram-rendering/shared/rendering/connector-types';
import {
  useOverlayVisibilityStore,
  isOverlayElementVisible,
} from '@/app/model/stores/overlay/overlayVisibilityStore';

interface CanvasConnectorsListProps {
  connectors: Connector[];
  shapes: Shape[];
  selectedConnectorIds: string[];
  hoveredConnectorId: string | null;
  viewportTransform: ViewportTransform;
  editingEntityId: string | null;
  editingEntityType: 'shape' | 'connector' | null;
  onMouseDown: (e: React.MouseEvent, connectorId: string) => void;
  onMouseEnter: (e: React.MouseEvent, connectorId: string) => void;
  onMouseLeave: (e: React.MouseEvent, connectorId: string) => void;
  onDoubleClick: (connectorId: string) => void;
  onLabelChange: (entityId: string, entityType: 'shape' | 'connector', newLabel: string) => void;
  onFinishEditing: () => void;
}

/**
 * Custom comparison function for React.memo
 * Only re-render if props that affect rendering have actually changed
 */
function arePropsEqual(
  prevProps: CanvasConnectorsListProps,
  nextProps: CanvasConnectorsListProps
): boolean {
  // Check connectors and shapes arrays by reference (from useMemo in parent)
  if (prevProps.connectors !== nextProps.connectors) return false;
  if (prevProps.shapes !== nextProps.shapes) return false;

  // Compare selection arrays by content
  if (prevProps.selectedConnectorIds.length !== nextProps.selectedConnectorIds.length) return false;
  for (let i = 0; i < prevProps.selectedConnectorIds.length; i++) {
    if (prevProps.selectedConnectorIds[i] !== nextProps.selectedConnectorIds[i]) return false;
  }

  // Compare primitive values
  if (prevProps.hoveredConnectorId !== nextProps.hoveredConnectorId) return false;
  if (prevProps.editingEntityId !== nextProps.editingEntityId) return false;
  if (prevProps.editingEntityType !== nextProps.editingEntityType) return false;

  // Only compare viewport zoom (the only value used for rendering)
  if (prevProps.viewportTransform.viewport.zoom !== nextProps.viewportTransform.viewport.zoom) {
    return false;
  }

  // Callbacks are from useCallback, assume stable
  if (prevProps.onMouseDown !== nextProps.onMouseDown) return false;
  if (prevProps.onMouseEnter !== nextProps.onMouseEnter) return false;
  if (prevProps.onMouseLeave !== nextProps.onMouseLeave) return false;
  if (prevProps.onDoubleClick !== nextProps.onDoubleClick) return false;
  if (prevProps.onLabelChange !== nextProps.onLabelChange) return false;
  if (prevProps.onFinishEditing !== nextProps.onFinishEditing) return false;

  return true;
}

/**
 * Renders all connectors on the canvas
 */
function CanvasConnectorsListComponent({
  connectors,
  shapes,
  selectedConnectorIds,
  hoveredConnectorId,
  viewportTransform,
  editingEntityId,
  editingEntityType,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
  onLabelChange,
  onFinishEditing,
}: CanvasConnectorsListProps) {
  // Get overlay visibility state
  const visibleOverlays = useOverlayVisibilityStore((state) => state.visibleOverlays);

  // Pre-build shape lookup map for O(1) access instead of O(n) find() calls
  const shapeById = useMemo(
    () => new Map(shapes.map((s) => [s.id, s])),
    [shapes]
  );

  return (
    <>
      {connectors.map((connector) => {
        // Skip rendering if connector's overlay is hidden
        if (!isOverlayElementVisible(connector.overlayTag, visibleOverlays)) {
          return null;
        }
        const sourceShape = shapeById.get(connector.sourceShapeId);
        const targetShape = shapeById.get(connector.targetShapeId);

        // Skip rendering if either shape is missing
        if (!sourceShape || !targetShape) {
          console.warn(
            `Connector ${connector.id} references missing shape(s): ` +
              `source=${connector.sourceShapeId}, target=${connector.targetShapeId}`
          );
          console.warn('Available shape IDs:', shapes.map(s => s.id));
          return null;
        }

        const connectorContext: ConnectorRenderContext = {
          isSelected: selectedConnectorIds.includes(connector.id),
          isHovered: connector.id === hoveredConnectorId,
          zoom: viewportTransform.viewport.zoom,
          readOnly: false,
          allShapes: shapes, // Provide all shapes for obstacle avoidance
        };

        const isEditing = editingEntityId === connector.id && editingEntityType === 'connector';

        return (
          <svg
            key={connector.id}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              overflow: 'visible',
              pointerEvents: 'none',
              zIndex: 2, // Connectors on top of shapes
            }}
          >
            <ConnectorRenderer
              connector={connector}
              sourceShape={sourceShape}
              targetShape={targetShape}
              context={connectorContext}
              isEditing={isEditing}
              onMouseDown={onMouseDown}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              onDoubleClick={onDoubleClick}
              onLabelChange={onLabelChange}
              onFinishEditing={onFinishEditing}
            />
          </svg>
        );
      })}
    </>
  );
}

/**
 * Memoized CanvasConnectorsList to prevent unnecessary re-renders
 * This is critical for performance - prevents re-rendering all connectors when
 * unrelated state changes (e.g., menu state, toolbar updates)
 */
export const CanvasConnectorsList = memo(CanvasConnectorsListComponent, arePropsEqual);
