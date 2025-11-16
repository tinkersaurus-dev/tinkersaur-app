import type { Result } from '~/core/lib/utils/result';
import type { Shape, CreateShapeDTO } from '~/core/entities/design-studio/types/Shape';
import type { CreateConnectorDTO } from '~/core/entities/design-studio/types/Connector';

/**
 * Connector reference that uses shape indices instead of IDs
 * The indices refer to positions in the shapes array of MermaidImportResult
 */
export interface MermaidConnectorRef extends Omit<CreateConnectorDTO, 'sourceShapeId' | 'targetShapeId'> {
  fromShapeIndex: number;
  toShapeIndex: number;
}

/**
 * Result of a mermaid import operation
 * Returns shape data WITHOUT IDs and connectors with shape INDICES
 * IDs will be generated when shapes are added to the diagram
 */
export interface MermaidImportResult {
  shapes: CreateShapeDTO[];
  connectors: MermaidConnectorRef[];
  metadata?: {
    diagramType: string;
    nodeCount: number;
    edgeCount: number;
    importedAt: Date;
  };
}

/**
 * Options for mermaid import
 */
export interface MermaidImportOptions {
  /**
   * Center point for positioning the imported diagram
   */
  centerPoint?: { x: number; y: number };
  /**
   * Spacing between nodes in the layout
   */
  nodeSpacing?: { horizontal: number; vertical: number };
  /**
   * Default dimensions for shapes when not specified
   */
  defaultShapeDimensions?: { width: number; height: number };
}

/**
 * Base interface for mermaid importers
 * Each diagram type should implement this interface
 */
export interface MermaidImporter {
  /**
   * Import mermaid syntax to shapes and connectors
   */
  import(mermaidSyntax: string, options?: MermaidImportOptions): Result<MermaidImportResult>;

  /**
   * Get the diagram type this importer handles
   */
  getDiagramType(): string;

  /**
   * Validate that mermaid syntax can be imported
   */
  validate(mermaidSyntax: string): Result<void>;
}

/**
 * Base abstract class for mermaid importers with common utilities
 */
export abstract class BaseMermaidImporter implements MermaidImporter {
  protected defaultOptions: Required<MermaidImportOptions> = {
    centerPoint: { x: 0, y: 0 },
    nodeSpacing: { horizontal: 200, vertical: 150 },
    defaultShapeDimensions: { width: 120, height: 60 },
  };

  abstract import(
    mermaidSyntax: string,
    options?: MermaidImportOptions
  ): Result<MermaidImportResult>;

  abstract getDiagramType(): string;

  validate(mermaidSyntax: string): Result<void> {
    if (!mermaidSyntax || mermaidSyntax.trim().length === 0) {
      return { ok: false, error: 'Empty mermaid syntax' };
    }
    return { ok: true, value: undefined };
  }

  /**
   * Merge user options with defaults
   */
  protected mergeOptions(options?: MermaidImportOptions): Required<MermaidImportOptions> {
    return {
      centerPoint: options?.centerPoint ?? this.defaultOptions.centerPoint,
      nodeSpacing: options?.nodeSpacing ?? this.defaultOptions.nodeSpacing,
      defaultShapeDimensions:
        options?.defaultShapeDimensions ?? this.defaultOptions.defaultShapeDimensions,
    };
  }

  /**
   * Unsanitize text from mermaid syntax (restore quotes)
   */
  protected unsanitizeText(text: string): string {
    return text.replace(/#quot;/g, '"').trim();
  }

  /**
   * Generate a temporary reference ID for tracking shapes during import
   * This is NOT the final diagram ID - just used to map connectors to shapes
   */
  protected generateTempRef(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Remove quotes from text if present
   */
  protected removeQuotes(text: string): string {
    const trimmed = text.trim();
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  }

  /**
   * Extract direction from mermaid syntax header (e.g., "flowchart TD" -> "TD")
   */
  protected extractDirection(header: string): string | null {
    const match = header.match(/(?:flowchart|graph)\s+(TD|TB|BT|RL|LR)/i);
    return match ? match[1].toUpperCase() : null;
  }

  /**
   * Calculate bounding box of all shapes
   */
  protected calculateBoundingBox(shapes: Shape[]): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  } {
    if (shapes.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    shapes.forEach((shape) => {
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + shape.width);
      maxY = Math.max(maxY, shape.y + shape.height);
    });

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Center shapes around a target point
   */
  protected centerShapes(shapes: Shape[], centerPoint: { x: number; y: number }): Shape[] {
    if (shapes.length === 0) {
      return shapes;
    }

    const bbox = this.calculateBoundingBox(shapes);
    const currentCenterX = bbox.minX + bbox.width / 2;
    const currentCenterY = bbox.minY + bbox.height / 2;

    const offsetX = centerPoint.x - currentCenterX;
    const offsetY = centerPoint.y - currentCenterY;

    return shapes.map((shape) => ({
      ...shape,
      x: shape.x + offsetX,
      y: shape.y + offsetY,
    }));
  }

  /**
   * Center shape DTOs around a target point (for shapes without IDs)
   */
  protected centerShapesDTO(shapes: CreateShapeDTO[], centerPoint: { x: number; y: number }): CreateShapeDTO[] {
    if (shapes.length === 0) {
      return shapes;
    }

    const bbox = this.calculateBoundingBoxDTO(shapes);
    const currentCenterX = bbox.minX + bbox.width / 2;
    const currentCenterY = bbox.minY + bbox.height / 2;

    const offsetX = centerPoint.x - currentCenterX;
    const offsetY = centerPoint.y - currentCenterY;

    return shapes.map((shape) => ({
      ...shape,
      x: shape.x + offsetX,
      y: shape.y + offsetY,
    }));
  }

  /**
   * Calculate bounding box of shape DTOs (for shapes without IDs)
   */
  protected calculateBoundingBoxDTO(shapes: CreateShapeDTO[]): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  } {
    if (shapes.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    shapes.forEach((shape) => {
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + shape.width);
      maxY = Math.max(maxY, shape.y + shape.height);
    });

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
}
