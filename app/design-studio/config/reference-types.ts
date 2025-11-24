import type { CreateShapeDTO } from '~/core/entities/design-studio/types/Shape';
import type { DiagramType } from '~/core/entities/design-studio/types/Diagram';
import type { ContentType } from '~/core/entities/design-studio/types/Reference';

/**
 * Configuration for a reference type
 * Defines how a source shape can be used as a reference in other content
 */
export interface ReferenceTypeConfig {
  /** Unique identifier for this reference type */
  id: string;

  /** The shape type that can be a reference source (e.g., 'bpmn-event') */
  sourceShapeType: string;

  /** The shape subtype that can be a reference source (e.g., 'throwing', 'message-send') */
  sourceShapeSubtype?: string;

  /** Content types where this reference can be used (e.g., ['diagram']) */
  supportedContentTypes: ContentType[];

  /** Diagram types where this reference can be used (e.g., ['bpmn']) */
  supportedDiagramTypes?: DiagramType[];

  /**
   * Function to create the target shape when reference is dropped
   * @param label - Label for the created shape
   * @param dropX - X coordinate where reference was dropped
   * @param dropY - Y coordinate where reference was dropped
   * @returns Shape data to create
   */
  createTargetShape: (
    label: string,
    dropX: number,
    dropY: number
  ) => CreateShapeDTO;
}

/**
 * Registry of all reference type configurations
 */
const referenceTypeConfigs: ReferenceTypeConfig[] = [
  // BPMN: Throwing Event -> Catching Event
  {
    id: 'bpmn-throwing-catching',
    sourceShapeType: 'bpmn-event',
    sourceShapeSubtype: 'throwing',
    supportedContentTypes: ['diagram'],
    supportedDiagramTypes: ['bpmn'],
    createTargetShape: (label, dropX, dropY) => ({
      type: 'bpmn-event',
      subtype: 'catching',
      x: dropX - 20, // Center the 40px circle
      y: dropY - 20,
      width: 40,
      height: 40,
      label,
      zIndex: 0,
      locked: false,
      isPreview: false,
    }),
  },

  // BPMN: Message Send Event -> Message Receive Event
  {
    id: 'bpmn-message-send-receive',
    sourceShapeType: 'bpmn-event',
    sourceShapeSubtype: 'message-send',
    supportedContentTypes: ['diagram'],
    supportedDiagramTypes: ['bpmn'],
    createTargetShape: (label, dropX, dropY) => ({
      type: 'bpmn-event',
      subtype: 'message-receive',
      x: dropX - 20, // Center the 40px circle
      y: dropY - 20,
      width: 40,
      height: 40,
      label,
      zIndex: 0,
      locked: false,
      isPreview: false,
    }),
  },
];

/**
 * Get reference config for a shape type/subtype
 */
export function getReferenceConfigForShape(
  shapeType: string,
  shapeSubtype?: string
): ReferenceTypeConfig | null {
  return (
    referenceTypeConfigs.find(
      (config) =>
        config.sourceShapeType === shapeType &&
        (config.sourceShapeSubtype === undefined ||
          config.sourceShapeSubtype === shapeSubtype)
    ) || null
  );
}

/**
 * Check if a shape can be a reference source
 */
export function canShapeBeReferenceSource(
  shapeType: string,
  shapeSubtype?: string
): boolean {
  return getReferenceConfigForShape(shapeType, shapeSubtype) !== null;
}

/**
 * Check if a reference can be dropped into specific content
 */
export function canReferenceBeDroppedInContent(
  referenceConfig: ReferenceTypeConfig,
  contentType: ContentType,
  diagramType?: DiagramType
): boolean {
  // Check if content type is supported
  if (!referenceConfig.supportedContentTypes.includes(contentType)) {
    return false;
  }

  // For diagrams, also check diagram type if specified
  if (
    contentType === 'diagram' &&
    diagramType &&
    referenceConfig.supportedDiagramTypes
  ) {
    return referenceConfig.supportedDiagramTypes.includes(diagramType);
  }

  return true;
}

/**
 * Get all reference configs
 */
export function getAllReferenceConfigs(): ReferenceTypeConfig[] {
  return referenceTypeConfigs;
}
