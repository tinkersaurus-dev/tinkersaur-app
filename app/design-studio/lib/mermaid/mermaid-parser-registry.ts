import type { Result } from '~/core/lib/utils/result';
import type { DiagramType } from '~/core/entities/design-studio/types/Diagram';
import type { MermaidExporter, MermaidExportOptions } from './mermaid-exporter';

/**
 * Factory function type for creating mermaid exporters
 */
type MermaidExporterFactory = (options?: MermaidExportOptions) => MermaidExporter;

/**
 * Registry of mermaid exporters by diagram type
 */
const exporterRegistry: Partial<Record<DiagramType, MermaidExporterFactory>> = {};

/**
 * Register a mermaid exporter for a diagram type
 */
export function registerMermaidExporter(
  diagramType: DiagramType,
  factory: MermaidExporterFactory
): void {
  exporterRegistry[diagramType] = factory;
}

/**
 * Get a mermaid exporter for a diagram type
 */
export function getMermaidExporter(
  diagramType: DiagramType,
  options?: MermaidExportOptions
): Result<MermaidExporter> {
  const exporterFactory = exporterRegistry[diagramType];

  if (!exporterFactory) {
    return {
      ok: false,
      error: `No Mermaid exporter registered for diagram type: ${diagramType}`,
    };
  }

  try {
    const exporter = exporterFactory(options);
    return { ok: true, value: exporter };
  } catch (error) {
    return {
      ok: false,
      error: `Failed to create Mermaid exporter: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if a mermaid exporter is available for a diagram type
 */
export function hasMermaidExporter(diagramType: DiagramType): boolean {
  return diagramType in exporterRegistry;
}

/**
 * Get all registered diagram types that support mermaid export
 */
export function getSupportedDiagramTypes(): DiagramType[] {
  return Object.keys(exporterRegistry) as DiagramType[];
}
