/**
 * Entity Relationship Diagram Connector Configuration
 * Defines relationship connectors with crow's foot notation
 */

import type { ComponentType } from 'react';
import { TbLine, TbLineDashed } from 'react-icons/tb';
import type { ArrowType, LineType } from '~/core/entities/design-studio/types/Connector';

/**
 * Connector tool definition interface
 * Represents a connector type that can be created on the canvas
 */
export interface ConnectorTool {
  /** Unique identifier for the connector type */
  id: string;
  /** Display name for the connector type */
  name: string;
  /** Icon component from react-icons */
  icon: ComponentType<{ size?: number }>;
  /** Connector type identifier */
  connectorType: string;
  /** Default routing style */
  style: 'straight' | 'orthogonal' | 'curved';
  /** Marker at the start of the connector */
  markerStart: ArrowType;
  /** Marker at the end of the connector */
  markerEnd: ArrowType;
  /** Line style */
  lineType: LineType;
  /** Whether this connector type supports cardinality/multiplicity labels */
  supportsCardinality?: boolean;
}

/**
 * ER Diagram Connector Tools
 * Two base types (identifying/non-identifying) with configurable crow's foot cardinality
 */
const erConnectorTools: ConnectorTool[] = [
  {
    id: 'identifying-relationship',
    name: 'Identifying Relationship',
    icon: TbLine,
    connectorType: 'identifying-relationship',
    style: 'orthogonal',
    markerStart: 'crow-one', // Default: exactly one
    markerEnd: 'crow-many', // Default: one or more
    lineType: 'solid',
    supportsCardinality: true,
  },
  {
    id: 'non-identifying-relationship',
    name: 'Non-Identifying Relationship',
    icon: TbLineDashed,
    connectorType: 'non-identifying-relationship',
    style: 'orthogonal',
    markerStart: 'crow-zero-one', // Default: zero or one
    markerEnd: 'crow-zero-many', // Default: zero or more
    lineType: 'dashed',
    supportsCardinality: true,
  },
];

/**
 * All ER connector tools
 */
export const allEntityRelationshipConnectorTools: ConnectorTool[] = erConnectorTools;

/**
 * Default ER connector type
 */
export const defaultEntityRelationshipConnectorType = 'identifying-relationship';

/**
 * Get connector tool by ID
 */
export function getERConnectorToolById(id: string): ConnectorTool | undefined {
  return allEntityRelationshipConnectorTools.find((tool) => tool.id === id);
}

/**
 * Get connector tool by connector type
 */
export function getERConnectorToolByType(type: string): ConnectorTool | undefined {
  return allEntityRelationshipConnectorTools.find((tool) => tool.connectorType === type);
}
