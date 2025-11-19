import { memo } from 'react';
import type { ConnectorRendererProps, ConnectorRendererComponent } from './types';
import { LineConnectorRenderer } from './LineConnectorRenderer';
import { MessageConnectorRenderer } from './MessageConnectorRenderer';

/**
 * Connector Renderer Registry
 *
 * Maps connector types to their renderer components.
 * This registry pattern allows easy addition of new connector types.
 */

const connectorRenderers: Record<string, ConnectorRendererComponent> = {
  line: LineConnectorRenderer,
  // Sequence diagram message connectors
  'sequence-synchronous': MessageConnectorRenderer,
  'sequence-asynchronous': MessageConnectorRenderer,
  'sequence-return': MessageConnectorRenderer,
  'sequence-create': MessageConnectorRenderer,
  'sequence-destroy': MessageConnectorRenderer,
  'sequence-self': MessageConnectorRenderer,
  // Future connector types can be added here:
  // arrow: ArrowRenderer, (if different from line)
  // association: AssociationRenderer,
  // dependency: DependencyRenderer,
  // etc.
};

/**
 * Connector Renderer Component
 *
 * Routes a connector to its appropriate renderer based on type.
 * Falls back to LineConnectorRenderer if type is not registered.
 */
function ConnectorRendererComponent(props: ConnectorRendererProps) {
  const { connector } = props;
  const Renderer = connectorRenderers[connector.type] || LineConnectorRenderer;

  return <Renderer {...props} />;
}

/**
 * Custom comparison function for React.memo
 * Only re-render if connector, connected shapes, or context have changed
 */
function arePropsEqual(prevProps: ConnectorRendererProps, nextProps: ConnectorRendererProps): boolean {
  // Always re-render if editing state changes
  if (prevProps.isEditing !== nextProps.isEditing) {
    return false;
  }

  const prevConnector = prevProps.connector;
  const nextConnector = nextProps.connector;

  // Check connector ID and type
  if (prevConnector.id !== nextConnector.id || prevConnector.type !== nextConnector.type) {
    return false;
  }

  // Check connector label
  if (prevConnector.label !== nextConnector.label) {
    return false;
  }

  // Check source and target shape IDs
  if (prevConnector.sourceShapeId !== nextConnector.sourceShapeId ||
      prevConnector.targetShapeId !== nextConnector.targetShapeId) {
    return false;
  }

  // Check source shape position/size (critical - connectors need to update when shapes move)
  const prevSource = prevProps.sourceShape;
  const nextSource = nextProps.sourceShape;

  if (prevSource?.id !== nextSource?.id ||
      prevSource?.x !== nextSource?.x ||
      prevSource?.y !== nextSource?.y ||
      prevSource?.width !== nextSource?.width ||
      prevSource?.height !== nextSource?.height) {
    return false;
  }

  // Check target shape position/size
  const prevTarget = prevProps.targetShape;
  const nextTarget = nextProps.targetShape;

  if (prevTarget?.id !== nextTarget?.id ||
      prevTarget?.x !== nextTarget?.x ||
      prevTarget?.y !== nextTarget?.y ||
      prevTarget?.width !== nextTarget?.width ||
      prevTarget?.height !== nextTarget?.height) {
    return false;
  }

  // Check context changes
  const prevContext = prevProps.context;
  const nextContext = nextProps.context;

  if (
    prevContext.isSelected !== nextContext.isSelected ||
    prevContext.isHovered !== nextContext.isHovered ||
    prevContext.zoom !== nextContext.zoom ||
    prevContext.readOnly !== nextContext.readOnly
  ) {
    return false;
  }

  // Event handlers check
  if (
    prevProps.onMouseDown !== nextProps.onMouseDown ||
    prevProps.onMouseEnter !== nextProps.onMouseEnter ||
    prevProps.onMouseLeave !== nextProps.onMouseLeave ||
    prevProps.onDoubleClick !== nextProps.onDoubleClick
  ) {
    return false;
  }

  // Props are equal - skip re-render
  return true;
}

/**
 * Memoized ConnectorRenderer to prevent unnecessary re-renders
 * Will update when connected shapes move during drag
 */
export const ConnectorRenderer = memo(ConnectorRendererComponent, arePropsEqual);
