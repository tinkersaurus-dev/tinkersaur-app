import type { Shape, Connector } from '~/core/entities/design-studio/types';
import type { ViewportTransform } from '../../../utils/viewport';
import { ConnectorRenderer } from '../../../rendering/connectors/ConnectorRenderer';
import type { ConnectorRenderContext } from '../../../rendering/connectors/types';

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
 * Renders all connectors on the canvas
 */
export function CanvasConnectorsList({
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
  return (
    <>
      {connectors.map((connector) => {
        const sourceShape = shapes.find((s) => s.id === connector.sourceShapeId);
        const targetShape = shapes.find((s) => s.id === connector.targetShapeId);

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
