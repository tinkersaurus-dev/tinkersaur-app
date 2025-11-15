import type { Result } from '~/core/lib/utils/result';
import type { DiagramType } from '~/core/entities/design-studio/types/Diagram';
import type { MermaidExporter, MermaidExportOptions } from './mermaid-exporter';
import type { MermaidImporter, MermaidImportOptions } from './mermaid-importer';

/**
 * Factory function type for creating mermaid exporters
 */
type MermaidExporterFactory = (options?: MermaidExportOptions) => MermaidExporter;

/**
 * Factory function type for creating mermaid importers
 */
type MermaidImporterFactory = (options?: MermaidImportOptions) => MermaidImporter;

/**
 * Registry of mermaid exporters by diagram type
 */
const exporterRegistry: Partial<Record<DiagramType, MermaidExporterFactory>> = {};

/**
 * Registry of mermaid importers by diagram type
 */
const importerRegistry: Partial<Record<DiagramType, MermaidImporterFactory>> = {};

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

/**
 * Register a mermaid importer for a diagram type
 */
export function registerMermaidImporter(
  diagramType: DiagramType,
  factory: MermaidImporterFactory
): void {
  importerRegistry[diagramType] = factory;
}

/**
 * Get a mermaid importer for a diagram type
 */
export function getMermaidImporter(
  diagramType: DiagramType,
  options?: MermaidImportOptions
): Result<MermaidImporter> {
  const importerFactory = importerRegistry[diagramType];

  if (!importerFactory) {
    return {
      ok: false,
      error: `No Mermaid importer registered for diagram type: ${diagramType}`,
    };
  }

  try {
    const importer = importerFactory(options);
    return { ok: true, value: importer };
  } catch (error) {
    return {
      ok: false,
      error: `Failed to create Mermaid importer: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if a mermaid importer is available for a diagram type
 */
export function hasMermaidImporter(diagramType: DiagramType): boolean {
  return diagramType in importerRegistry;
}

/**
 * Get all registered diagram types that support mermaid import
 */
export function getSupportedImportDiagramTypes(): DiagramType[] {
  return Object.keys(importerRegistry) as DiagramType[];
}
