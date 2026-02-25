// Entity Relationship Diagram Module
// All ER diagram-specific code is organized here

// Tools & Connectors
export * from './tools';
export * from './connectors';

// Rendering
export { EntityRenderer } from './rendering/EntityRenderer';

// Components
export { EntityAttributeEditor } from './components/EntityAttributeEditor';

// Hooks
export { useEntityShapeEditing } from './hooks';

// Utils
export { calculateEntityHeight } from '@/shared/lib/utils/shapeHeightUtils';

// Commands
export { AddEntityAttributeCommand } from '@/features/canvas-commands/commands/entity-relationship/AddEntityAttributeCommand';
export { DeleteEntityAttributeCommand } from '@/features/canvas-commands/commands/entity-relationship/DeleteEntityAttributeCommand';
export { UpdateEntityAttributeCommand } from '@/features/canvas-commands/commands/entity-relationship/UpdateEntityAttributeCommand';

// Mermaid Import/Export
export { createEntityRelationshipMermaidExporter, EntityRelationshipMermaidExporter } from './mermaid/exporter';
export { createEntityRelationshipMermaidImporter, EntityRelationshipMermaidImporter } from './mermaid/importer';
