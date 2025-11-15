import type { Result } from '~/core/lib/utils/result';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type { MermaidImportOptions, MermaidImportResult } from '../mermaid-importer';
import { BaseMermaidImporter } from '../mermaid-importer';

/**
 * Parsed participant information from Mermaid syntax
 */
interface ParsedParticipant {
  name: string;
  displayLabel: string;
  type: 'actor' | 'participant';
}

/**
 * Parsed message information from Mermaid syntax
 */
interface ParsedMessage {
  sourceName: string;
  targetName: string;
  messageType: string;
  label?: string;
  hasActivation?: boolean;
  hasDeactivation?: boolean;
}

/**
 * Mermaid importer for Sequence diagrams
 * Parses Mermaid sequence diagram syntax back to lifelines and messages
 */
export class SequenceMermaidImporter extends BaseMermaidImporter {
  getDiagramType(): string {
    return 'sequence';
  }

  validate(mermaidSyntax: string): Result<void> {
    const baseValidation = super.validate(mermaidSyntax);
    if (!baseValidation.ok) {
      return baseValidation;
    }

    // Check if it's a sequence diagram
    const trimmed = mermaidSyntax.trim();
    if (!trimmed.startsWith('sequenceDiagram')) {
      return {
        ok: false,
        error: 'Incorrect format for sequence diagram. Expected sequenceDiagram syntax.',
      };
    }

    return { ok: true, value: undefined };
  }

  import(
    mermaidSyntax: string,
    options?: MermaidImportOptions
  ): Result<MermaidImportResult> {
    const validationResult = this.validate(mermaidSyntax);
    if (!validationResult.ok) {
      return validationResult;
    }

    try {
      const opts = this.mergeOptions(options);

      // Parse the mermaid syntax
      const parseResult = this.parseMermaidSyntax(mermaidSyntax);
      if (!parseResult.ok) {
        return parseResult;
      }

      const { participants, messages } = parseResult.value;

      // Create ID mapping from participant names to generated UUIDs
      const idMapping = new Map<string, string>();
      participants.forEach((participant) => {
        idMapping.set(participant.name, this.generateShapeId());
      });

      // Convert parsed participants to lifeline shapes with layout
      const shapes = this.createShapesWithLayout(participants, idMapping, opts);

      // Convert parsed messages to connectors
      const connectors = this.createConnectors(messages, idMapping);

      const result: MermaidImportResult = {
        shapes,
        connectors,
        metadata: {
          diagramType: this.getDiagramType(),
          nodeCount: shapes.length,
          edgeCount: connectors.length,
          importedAt: new Date(),
        },
      };

      return { ok: true, value: result };
    } catch (error) {
      return {
        ok: false,
        error: `Failed to import sequence diagram: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Parse mermaid sequence diagram syntax into participants and messages
   */
  private parseMermaidSyntax(
    syntax: string
  ): Result<{ participants: ParsedParticipant[]; messages: ParsedMessage[] }> {
    try {
      const lines = syntax
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('%%')); // Remove comments

      const participants = new Map<string, ParsedParticipant>();
      const messages: ParsedMessage[] = [];

      for (const line of lines) {
        // Skip the header line
        if (line.startsWith('sequenceDiagram')) {
          continue;
        }

        // Parse participant/actor declarations
        const participantMatch = line.match(/^(participant|actor)\s+([A-Za-z0-9_]+)(?:\s+as\s+(.+))?$/);
        if (participantMatch) {
          const type = participantMatch[1] as 'actor' | 'participant';
          const name = participantMatch[2];
          const displayLabel = participantMatch[3] || name;

          if (!participants.has(name)) {
            participants.set(name, {
              name,
              displayLabel: this.unsanitizeText(displayLabel),
              type,
            });
          }
          continue;
        }

        // Parse message lines
        const messageResult = this.parseMessageLine(line, participants);
        if (messageResult) {
          messages.push(messageResult);
        }
      }

      return {
        ok: true,
        value: {
          participants: Array.from(participants.values()),
          messages,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: `Failed to parse mermaid syntax: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Parse a message line (e.g., "Alice->>Bob: Hello", "Bob-->>Alice: Response")
   */
  private parseMessageLine(
    line: string,
    participants: Map<string, ParsedParticipant>
  ): ParsedMessage | null {
    // Match message patterns with various arrow types
    const messagePatterns = [
      /^([A-Za-z0-9_]+)\s*(->>[+-]?)\s*([A-Za-z0-9_]+)\s*:\s*(.+)$/, // Synchronous with optional activation/deactivation
      /^([A-Za-z0-9_]+)\s*(-->>[+-]?)\s*([A-Za-z0-9_]+)\s*:\s*(.+)$/, // Return/async with optional activation/deactivation
      /^([A-Za-z0-9_]+)\s*(->>[+-]?)\s*([A-Za-z0-9_]+)$/, // Message without label
      /^([A-Za-z0-9_]+)\s*(-->>[+-]?)\s*([A-Za-z0-9_]+)$/, // Return without label
    ];

    for (const pattern of messagePatterns) {
      const match = line.match(pattern);
      if (match) {
        const sourceName = match[1];
        const arrow = match[2];
        const targetName = match[3];
        const label = match[4]?.trim();

        // Ensure both participants exist (create simple participants if they don't)
        if (!participants.has(sourceName)) {
          participants.set(sourceName, {
            name: sourceName,
            displayLabel: sourceName,
            type: 'participant',
          });
        }
        if (!participants.has(targetName)) {
          participants.set(targetName, {
            name: targetName,
            displayLabel: targetName,
            type: 'participant',
          });
        }

        // Determine message type from arrow
        let messageType = 'sequence-synchronous';
        let hasActivation = false;
        let hasDeactivation = false;

        if (arrow.startsWith('-->>')) {
          messageType = 'sequence-return';
        } else if (arrow.startsWith('->>')) {
          messageType = 'sequence-synchronous';
        }

        // Check for activation/deactivation markers
        if (arrow.includes('+')) {
          hasActivation = true;
        }
        if (arrow.includes('-')) {
          hasDeactivation = true;
        }

        return {
          sourceName,
          targetName,
          messageType,
          label: label ? this.unsanitizeText(label) : undefined,
          hasActivation,
          hasDeactivation,
        };
      }
    }

    return null;
  }

  /**
   * Create shapes with horizontal layout for sequence diagram
   */
  private createShapesWithLayout(
    participants: ParsedParticipant[],
    idMapping: Map<string, string>,
    options: Required<MermaidImportOptions>
  ): Shape[] {
    const shapes: Shape[] = [];
    const spacing = options.nodeSpacing.horizontal;

    // Sequence diagrams arrange participants horizontally
    participants.forEach((participant, index) => {
      const shapeId = idMapping.get(participant.name)!;

      const x = index * spacing;
      const y = 50; // Start at top

      const shape: Shape = {
        id: shapeId,
        type: 'sequence-lifeline',
        subtype: participant.type,
        x,
        y,
        width: 100,
        height: 400, // Default lifeline height
        label: participant.displayLabel,
        zIndex: 1,
        locked: false,
        data: {
          lifelineStyle: 'dashed',
          activations: [],
        },
      };

      shapes.push(shape);
    });

    // Center all shapes around the target point
    return this.centerShapes(shapes, options.centerPoint);
  }

  /**
   * Create connectors from parsed messages
   */
  private createConnectors(
    messages: ParsedMessage[],
    idMapping: Map<string, string>
  ): Connector[] {
    return messages.map((message, index) => {
      const sourceShapeId = idMapping.get(message.sourceName);
      const targetShapeId = idMapping.get(message.targetName);

      if (!sourceShapeId || !targetShapeId) {
        throw new Error(`Invalid message: missing participant mapping`);
      }

      // Determine connector properties from message type
      const { arrowType, lineType } = this.getConnectorProperties(message.messageType);

      // Use connection point indices to maintain message order
      const connectionIndex = index;

      const connector: Connector = {
        id: this.generateConnectorId(),
        type: message.messageType,
        sourceShapeId,
        targetShapeId,
        sourceConnectionPoint: `e-${connectionIndex}`,
        targetConnectionPoint: `w-${connectionIndex}`,
        style: 'straight',
        arrowType,
        markerStart: 'none',
        markerEnd: arrowType,
        lineType,
        label: message.label,
        zIndex: 0,
      };

      return connector;
    });
  }

  /**
   * Get connector properties from message type
   */
  private getConnectorProperties(messageType: string): {
    arrowType: 'arrow' | 'none';
    lineType: 'solid' | 'dashed' | 'dotted';
  } {
    switch (messageType) {
      case 'sequence-synchronous':
      case 'sequence-asynchronous':
      case 'sequence-create':
      case 'sequence-destroy':
      case 'sequence-self':
        return {
          arrowType: 'arrow',
          lineType: 'solid',
        };
      case 'sequence-return':
        return {
          arrowType: 'arrow',
          lineType: 'dashed',
        };
      default:
        return {
          arrowType: 'arrow',
          lineType: 'solid',
        };
    }
  }
}

/**
 * Factory function to create a sequence diagram mermaid importer
 */
export function createSequenceMermaidImporter(
  _options?: MermaidImportOptions
): SequenceMermaidImporter {
  return new SequenceMermaidImporter();
}
