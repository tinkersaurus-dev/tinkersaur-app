import type { Result } from '@/shared/lib/utils';
import type { Shape } from '@/entities/shape';
import type { Connector } from '@/entities/connector';
import type {
  MermaidExportOptions,
  MermaidExportResult,
} from '../../shared/mermaid/exporter';
import { BaseMermaidExporter } from '../../shared/mermaid/exporter';
import { isSequenceLifelineData } from '@/entities/shape';
import { FIRST_CONNECTION_POINT_Y, CONNECTION_POINT_SPACING } from '../constants';

/**
 * Mermaid exporter for Sequence diagrams
 * Converts sequence lifelines and messages to Mermaid sequence diagram syntax
 */
export class SequenceMermaidExporter extends BaseMermaidExporter {
  getDiagramType(): string {
    return 'sequence';
  }

  export(shapes: Shape[], connectors: Connector[]): Result<MermaidExportResult> {
    // Filter out overlay elements (e.g., suggestions) before export
    const filteredShapes = this.filterOverlayElements(shapes);
    const filteredConnectors = this.filterOverlayConnectors(connectors);

    const validationResult = this.validate(filteredShapes, filteredConnectors);
    if (!validationResult.ok) {
      return validationResult;
    }

    try {
      const lines: string[] = [];

      // Add diagram type
      lines.push('sequenceDiagram');

      // Add metadata comments if enabled
      if (this.options.includeComments) {
        lines.push('');
        lines.push(`    %% Generated: ${new Date().toISOString()}`);
        lines.push(`    %% Participants: ${filteredShapes.filter(s => s.type === 'sequence-lifeline').length}, Messages: ${filteredConnectors.length}`);
        lines.push('');
      }

      // Create shape lookup for quick access
      const shapeMap = new Map<string, Shape>();
      filteredShapes.forEach((shape) => shapeMap.set(shape.id, shape));

      // Filter lifeline shapes and create participant name mapping
      const lifelineShapes = filteredShapes.filter((shape) => shape.type === 'sequence-lifeline');
      const participantNameMap = this.createParticipantNameMap(lifelineShapes);

      // Export participant declarations
      for (const shape of lifelineShapes) {
        const participantLine = this.getParticipantDeclaration(shape, participantNameMap);
        if (participantLine) {
          lines.push(`    ${participantLine}`);
        }
      }

      // Add spacing between participants and messages
      if (filteredConnectors.length > 0 && lifelineShapes.length > 0) {
        lines.push('');
      }

      // Sort connectors by connection point index to maintain chronological order
      // The connection point index (e.g., e-0, e-1, e-2) represents the visual
      // position on the lifeline, which corresponds to the chronological order
      const sortedConnectors = [...filteredConnectors].sort((a, b) => {
        const aOrder = this.getMessageSequenceOrder(a);
        const bOrder = this.getMessageSequenceOrder(b);
        return aOrder - bOrder;
      });

      // Export messages
      for (const connector of sortedConnectors) {
        const sourceShape = shapeMap.get(connector.sourceShapeId);
        const targetShape = shapeMap.get(connector.targetShapeId);

        // Skip connector if source or target shape not found
        if (!sourceShape || !targetShape) {
          continue;
        }

        // Only export connectors between lifelines
        if (sourceShape.type !== 'sequence-lifeline' || targetShape.type !== 'sequence-lifeline') {
          continue;
        }

        const messageLine = this.getMessageSyntax(
          connector,
          sourceShape,
          targetShape,
          participantNameMap
        );
        if (messageLine) {
          lines.push(`    ${messageLine}`);
        }
      }

      // Export notes (sequence notes are rendered as mermaid notes)
      const noteShapes = filteredShapes.filter((shape) => shape.type === 'sequence-note');
      for (const note of noteShapes) {
        const noteLine = this.getNoteSyntax(note);
        if (noteLine) {
          lines.push(`    ${noteLine}`);
        }
      }

      const syntax = lines.join('\n');

      const metadata = this.options.includeMetadata
        ? {
            diagramType: this.getDiagramType(),
            nodeCount: filteredShapes.length,
            edgeCount: filteredConnectors.length,
            exportedAt: new Date(),
          }
        : undefined;

      return {
        ok: true,
        value: {
          syntax,
          metadata,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: `Failed to export Sequence diagram: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create participant name mapping (sanitized participant names from shape labels)
   */
  private createParticipantNameMap(shapes: Shape[]): Map<string, string> {
    const participantNameMap = new Map<string, string>();
    const usedNames = new Set<string>();

    shapes.forEach((shape) => {
      const participantName = this.sanitizeParticipantName(shape.label || 'Participant');

      // Ensure unique participant names
      let uniqueName = participantName;
      let counter = 1;
      while (usedNames.has(uniqueName)) {
        uniqueName = `${participantName}${counter}`;
        counter++;
      }

      participantNameMap.set(shape.id, uniqueName);
      usedNames.add(uniqueName);
    });

    return participantNameMap;
  }

  /**
   * Sanitize participant name for mermaid
   */
  private sanitizeParticipantName(name: string): string {
    // Replace spaces with underscores, remove special characters
    let sanitized = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

    // Ensure starts with a letter or underscore
    if (sanitized.length === 0 || /^[0-9]/.test(sanitized)) {
      sanitized = 'P' + sanitized;
    }

    return sanitized;
  }

  /**
   * Get participant declaration line
   */
  private getParticipantDeclaration(shape: Shape, participantNameMap: Map<string, string>): string | null {
    const participantName = participantNameMap.get(shape.id);
    if (!participantName) return null;

    const displayLabel = this.sanitizeText(shape.label || 'Participant');

    // Use subtype to determine participant type (actor, participant, etc.)
    const subtype = shape.subtype || 'participant';

    if (subtype === 'actor') {
      return `actor ${participantName} as ${displayLabel}`;
    } else {
      return `participant ${participantName} as ${displayLabel}`;
    }
  }

  /**
   * Get message syntax line
   */
  private getMessageSyntax(
    connector: Connector,
    sourceShape: Shape,
    targetShape: Shape,
    participantNameMap: Map<string, string>
  ): string | null {
    const sourceName = participantNameMap.get(sourceShape.id);
    const targetName = participantNameMap.get(targetShape.id);

    if (!sourceName || !targetName) return null;

    // Determine base arrow syntax based on connector type
    let arrow = '->>';
    switch (connector.type) {
      case 'sequence-synchronous':
        arrow = '->>';
        break;
      case 'sequence-asynchronous':
        arrow = '->>';
        break;
      case 'sequence-return':
        arrow = '-->>';
        break;
      case 'sequence-create':
        // For create messages, we'll let the activation logic handle the +
        arrow = '->>';
        break;
      case 'sequence-destroy':
        arrow = '->>';
        break;
      case 'sequence-self':
        arrow = '->>';
        break;
      default:
        arrow = '->>';
    }

    // Check for activation markers
    const endsSourceActivation = this.endsActivation(connector, sourceShape);
    const startsTargetActivation = this.startsActivation(connector, targetShape);

    // Build the complete arrow with activation markers
    // Note: In Mermaid, the activation marker goes after the arrow
    // e.g., "->>+" to activate, "-->-" to deactivate
    let fullArrow = arrow;

    // For source deactivation, add '-' at the end
    if (endsSourceActivation) {
      fullArrow = arrow + '-';
    }

    // For target activation, add '+' at the end
    // If both occur, target activation takes precedence (common pattern)
    if (startsTargetActivation) {
      fullArrow = arrow + '+';
    }

    const label = connector.label ? this.sanitizeText(connector.label) : '';

    if (label) {
      return `${sourceName}${fullArrow}${targetName}: ${label}`;
    } else {
      return `${sourceName}${fullArrow}${targetName}`;
    }
  }

  /**
   * Get note syntax line
   */
  private getNoteSyntax(note: Shape): string | null {
    const noteText = this.sanitizeText(note.label || 'Note');

    // For now, render notes as general notes
    // In a more sophisticated implementation, we could detect which participant the note is near
    return `Note over : ${noteText}`;
  }

  /**
   * Extract the numeric index from a connection point ID
   * Connection points have format "e-0", "w-1", "e-2", etc.
   * Returns Infinity if no valid index found (to sort to end)
   */
  private getConnectionPointIndex(connectionPointId: string | undefined): number {
    if (!connectionPointId) return Infinity;

    // Extract numeric index from format "e-0", "w-1", etc.
    const match = connectionPointId.match(/[ew]-(\d+)/);
    return match ? parseInt(match[1], 10) : Infinity;
  }

  /**
   * Get the sequence order for a message connector
   * Uses the connection point index which represents the visual position on the lifeline
   * This corresponds to the chronological order in sequence diagrams
   */
  private getMessageSequenceOrder(connector: Connector): number {
    const sourceIndex = this.getConnectionPointIndex(connector.sourceConnectionPoint);
    const targetIndex = this.getConnectionPointIndex(connector.targetConnectionPoint);

    // Use the minimum index (earliest connection point involved)
    // For normal messages, source and target have the same index
    // For self-messages or edge cases, use the earlier one
    return Math.min(sourceIndex, targetIndex);
  }

  /**
   * Calculate the Y-coordinate of a connection point relative to the lifeline
   * Connection points use format "e-0", "w-1", etc. where the number is the index
   */
  private getConnectionPointY(connectionPointId: string | undefined): number | null {
    const index = this.getConnectionPointIndex(connectionPointId);
    if (index === Infinity) return null;

    return FIRST_CONNECTION_POINT_Y + (index * CONNECTION_POINT_SPACING);
  }

  /**
   * Check if a message starts an activation on the target lifeline
   * Returns true if the target connection point Y matches the start of an activation box
   */
  private startsActivation(connector: Connector, targetShape: Shape): boolean {
    const targetY = this.getConnectionPointY(connector.targetConnectionPoint);
    if (targetY === null) return false;

    // Check if target shape has activation data
    if (!targetShape.data || !isSequenceLifelineData(targetShape.data)) {
      return false;
    }

    // Check if any activation starts at this Y coordinate
    return targetShape.data.activations.some(
      (activation) => activation.startY === targetY
    );
  }

  /**
   * Check if a message ends an activation on the source lifeline
   * Returns true if the source connection point Y matches the end of an activation box
   */
  private endsActivation(connector: Connector, sourceShape: Shape): boolean {
    const sourceY = this.getConnectionPointY(connector.sourceConnectionPoint);
    if (sourceY === null) return false;

    // Check if source shape has activation data
    if (!sourceShape.data || !isSequenceLifelineData(sourceShape.data)) {
      return false;
    }

    // Check if any activation ends at this Y coordinate
    return sourceShape.data.activations.some(
      (activation) => activation.endY === sourceY
    );
  }
}

/**
 * Factory function to create a sequence mermaid exporter
 */
export function createSequenceMermaidExporter(options?: MermaidExportOptions) {
  return new SequenceMermaidExporter(options);
}
