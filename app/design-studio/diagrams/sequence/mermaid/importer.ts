import type { Result } from '~/core/lib/utils/result';
import type { CreateShapeDTO, SequenceLifelineData } from '~/core/entities/design-studio/types/Shape';
import type { MermaidImportOptions, MermaidImportResult, MermaidConnectorRef } from '../../shared/mermaid/importer';
import { BaseMermaidImporter } from '../../shared/mermaid/importer';
import { DESIGN_STUDIO_CONFIG } from '~/design-studio/config/design-studio-config';
import { DEFAULT_SHAPE_SUBTYPES } from '~/design-studio/config/default-shape-subtypes';

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

      // Create index mapping from participant names to array indices
      const indexMapping = new Map<string, number>();
      participants.forEach((participant, index) => {
        indexMapping.set(participant.name, index);
      });

      // Convert parsed participants to lifeline shapes with layout (no IDs)
      const shapes = this.createShapesWithLayout(participants, opts);

      // Convert parsed messages to connector refs (using indices)
      const connectors = this.createConnectors(messages, indexMapping);

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
   * Create shapes with horizontal layout for sequence diagram (no IDs)
   */
  private createShapesWithLayout(
    participants: ParsedParticipant[],
    options: Required<MermaidImportOptions>
  ): CreateShapeDTO[] {
    const shapes: CreateShapeDTO[] = [];
    const spacing = options.nodeSpacing.horizontal;

    // Sequence diagrams arrange participants horizontally
    participants.forEach((participant, index) => {
      const x = index * spacing;
      const y = 50; // Start at top

      const lifelineData: SequenceLifelineData = {
        lifelineStyle: 'dashed',
        activations: [],
      };

      // Map mermaid participant type to sequence-lifeline subtype
      // 'actor' stays as 'actor', 'participant' becomes the default (object)
      const subtype = participant.type === 'actor'
        ? 'actor'
        : DEFAULT_SHAPE_SUBTYPES['sequence-lifeline'];

      const shape: CreateShapeDTO = {
        type: 'sequence-lifeline',
        subtype,
        x,
        y,
        width: DESIGN_STUDIO_CONFIG.shapes.sequence.lifeline.width,
        height: DESIGN_STUDIO_CONFIG.shapes.sequence.lifeline.height,
        label: participant.displayLabel,
        zIndex: 0,
        locked: false,
        isPreview: false,
        data: lifelineData,
      };

      shapes.push(shape);
    });

    // Center all shapes around the target point
    return this.centerShapesDTO(shapes, options.centerPoint);
  }

  /**
   * Create connector refs from parsed messages (using shape indices)
   */
  private createConnectors(
    messages: ParsedMessage[],
    indexMapping: Map<string, number>
  ): MermaidConnectorRef[] {
    return messages.map((message, messageIndex) => {
      const fromShapeIndex = indexMapping.get(message.sourceName);
      const toShapeIndex = indexMapping.get(message.targetName);

      if (fromShapeIndex === undefined || toShapeIndex === undefined) {
        throw new Error(`Invalid message: missing participant mapping for ${message.sourceName} or ${message.targetName}`);
      }

      // Determine connector properties from message type
      const { lineType } = this.getConnectorProperties(message.messageType);

      // Determine direction based on lifeline positions
      const isGoingRight = toShapeIndex > fromShapeIndex;

      // Assign connection points based on message index
      // Use east/west connection points to ensure proper vertical progression
      const sourceConnectionPoint = isGoingRight ? `e-${messageIndex}` : `w-${messageIndex}`;
      const targetConnectionPoint = isGoingRight ? `w-${messageIndex}` : `e-${messageIndex}`;

      const connector: MermaidConnectorRef = {
        type: message.messageType,
        fromShapeIndex,
        toShapeIndex,
        style: 'straight',
        markerStart: 'none',
        markerEnd: 'arrow',
        lineType,
        label: message.label,
        zIndex: 0,
        sourceConnectionPoint,
        targetConnectionPoint,
      };

      return connector;
    });
  }

  /**
   * Get connector properties from message type
   */
  private getConnectorProperties(messageType: string): {
    lineType: 'solid' | 'dashed' | 'dotted';
  } {
    switch (messageType) {
      case 'sequence-synchronous':
      case 'sequence-asynchronous':
      case 'sequence-create':
      case 'sequence-destroy':
      case 'sequence-self':
        return {
          lineType: 'solid',
        };
      case 'sequence-return':
        return {
          lineType: 'dashed',
        };
      default:
        return {
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
