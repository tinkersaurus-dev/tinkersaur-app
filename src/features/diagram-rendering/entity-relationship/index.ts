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
export { calculateEntityHeight } from './utils';

// Commands
export { AddEntityAttributeCommand } from './commands/AddEntityAttributeCommand';
export { DeleteEntityAttributeCommand } from './commands/DeleteEntityAttributeCommand';
export { UpdateEntityAttributeCommand } from './commands/UpdateEntityAttributeCommand';

// Mermaid Import/Export
export { createEntityRelationshipMermaidExporter, EntityRelationshipMermaidExporter } from './mermaid/exporter';
export { createEntityRelationshipMermaidImporter, EntityRelationshipMermaidImporter } from './mermaid/importer';
