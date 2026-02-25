// Shared Diagram Module
// Cross-diagram utilities and renderers

// Rendering
export { ShapeRenderer } from './rendering/ShapeRenderer';
export { ShapeWrapper } from './rendering/ShapeWrapper';
export { ConnectorRenderer } from './rendering/ConnectorRenderer';
export { LineConnectorRenderer } from './rendering/LineConnectorRenderer';
export { MessageConnectorRenderer } from './rendering/MessageConnectorRenderer';
export { ConnectionPointRenderer } from './rendering/ConnectionPointRenderer';
export { RectangleRenderer } from './rendering/RectangleRenderer';
export { PreviewRenderer } from './rendering/PreviewRenderer';
export { GenerateDiagramRenderer } from './rendering/GenerateDiagramRenderer';
export { MermaidEditorRenderer } from './rendering/MermaidEditorRenderer';
export * from './rendering/pathUtils';
export * from './rendering/types';
export * from './rendering/connector-types';
export * from './rendering/strokeStyles';
export * from './rendering/svgMarkers';
export * from './rendering/labelPositioning';

// Mermaid registration (side-effect import to register all importers/exporters)
// Types and registry functions are in @/shared/lib/mermaid
import './mermaid';
