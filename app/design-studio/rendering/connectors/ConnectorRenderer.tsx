import type { ConnectorRendererProps, ConnectorRendererComponent } from './types';
import { LineConnectorRenderer } from './LineConnectorRenderer';

/**
 * Connector Renderer Registry
 *
 * Maps connector types to their renderer components.
 * This registry pattern allows easy addition of new connector types.
 */

const connectorRenderers: Record<string, ConnectorRendererComponent> = {
  line: LineConnectorRenderer,
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
export function ConnectorRenderer(props: ConnectorRendererProps) {
  const { connector } = props;
  const Renderer = connectorRenderers[connector.type] || LineConnectorRenderer;

  return <Renderer {...props} />;
}
