import type { Result } from '~/core/lib/utils/result';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';

/**
 * Result of a mermaid export operation
 */
export interface MermaidExportResult {
  syntax: string;
  metadata?: {
    diagramType: string;
    nodeCount: number;
    edgeCount: number;
    exportedAt: Date;
  };
}

/**
 * Options for mermaid export
 */
export interface MermaidExportOptions {
  includeComments?: boolean;
  direction?: 'TB' | 'TD' | 'BT' | 'RL' | 'LR';
  indent?: number;
  includeMetadata?: boolean;
}

/**
 * Base interface for mermaid exporters
 * Each diagram type should implement this interface
 */
export interface MermaidExporter {
  /**
   * Export shapes and connectors to mermaid syntax
   */
  export(shapes: Shape[], connectors: Connector[]): Result<MermaidExportResult>;

  /**
   * Get the diagram type this exporter handles
   */
  getDiagramType(): string;

  /**
   * Validate that shapes and connectors can be exported
   */
  validate(shapes: Shape[], connectors: Connector[]): Result<void>;
}

/**
 * Base abstract class for mermaid exporters with common utilities
 */
export abstract class BaseMermaidExporter implements MermaidExporter {
  protected options: Required<MermaidExportOptions>;

  constructor(options?: MermaidExportOptions) {
    this.options = {
      includeComments: options?.includeComments ?? false,
      direction: options?.direction ?? 'LR',
      indent: options?.indent ?? 2,
      includeMetadata: options?.includeMetadata ?? true,
    };
  }

  abstract export(
    shapes: Shape[],
    connectors: Connector[]
  ): Result<MermaidExportResult>;

  abstract getDiagramType(): string;

  validate(shapes: Shape[], _connectors: Connector[]): Result<void> {
    if (shapes.length === 0) {
      return { ok: false, error: 'No shapes to export' };
    }
    return { ok: true, value: undefined };
  }

  /**
   * Sanitize text for mermaid syntax (escape quotes, remove newlines)
   */
  protected sanitizeText(text: string): string {
    return text
      .replace(/"/g, '#quot;')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .trim();
  }

  /**
   * Sanitize ID for mermaid (alphanumeric only)
   */
  protected sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Create alphabetic ID map (A, B, C, ... Z, AA, AB, ...)
   */
  protected createAlphabeticIdMap(shapes: Shape[]): Map<string, string> {
    const idMap = new Map<string, string>();
    shapes.forEach((shape, index) => {
      idMap.set(shape.id, this.getAlphabeticId(index));
    });
    return idMap;
  }

  /**
   * Convert numeric index to alphabetic ID (0->A, 1->B, ... 26->AA)
   */
  protected getAlphabeticId(index: number): string {
    let result = '';
    let num = index;

    do {
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26) - 1;
    } while (num >= 0);

    return result;
  }

  /**
   * Get indent string based on level and indent size
   */
  protected getIndent(level: number = 1): string {
    return ' '.repeat(this.options.indent * level);
  }
}
