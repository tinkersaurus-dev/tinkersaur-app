/**
 * UML Class Diagram Connector Configuration
 * Defines all available UML class diagram connector types
 */

import type { ComponentType } from 'react';
import {
  TbArrowRight,
  TbLine,
  TbDiamond,
  TbDiamondFilled,
  TbArrowBigRightLines,
  TbTriangle,
  TbArrowsDiagonal,
} from 'react-icons/tb';
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
 * UML Class Diagram Connector Tools
 */
const classConnectorTools: ConnectorTool[] = [
  {
    id: 'association',
    name: 'Association',
    icon: TbLine,
    connectorType: 'association',
    style: 'orthogonal',
    markerStart: 'none',
    markerEnd: 'none',
    lineType: 'solid',
    supportsCardinality: true,
  },
  {
    id: 'directed-association',
    name: 'Directed Association',
    icon: TbArrowRight,
    connectorType: 'directed-association',
    style: 'orthogonal',
    markerStart: 'none',
    markerEnd: 'arrow',
    lineType: 'solid',
    supportsCardinality: true,
  },
  {
    id: 'aggregation',
    name: 'Aggregation',
    icon: TbDiamond,
    connectorType: 'aggregation',
    style: 'orthogonal',
    markerStart: 'diamond',
    markerEnd: 'none',
    lineType: 'solid',
    supportsCardinality: true,
  },
  {
    id: 'composition',
    name: 'Composition',
    icon: TbDiamondFilled,
    connectorType: 'composition',
    style: 'orthogonal',
    markerStart: 'filled-diamond',
    markerEnd: 'none',
    lineType: 'solid',
    supportsCardinality: true,
  },
  {
    id: 'dependency',
    name: 'Dependency',
    icon: TbArrowBigRightLines,
    connectorType: 'dependency',
    style: 'orthogonal',
    markerStart: 'none',
    markerEnd: 'arrow',
    lineType: 'dashed',
    supportsCardinality: true,
  },
  {
    id: 'inheritance',
    name: 'Inheritance',
    icon: TbTriangle,
    connectorType: 'inheritance',
    style: 'orthogonal',
    markerStart: 'none',
    markerEnd: 'triangle',
    lineType: 'solid',
    supportsCardinality: true,
  },
  {
    id: 'realization',
    name: 'Realization',
    icon: TbArrowsDiagonal,
    connectorType: 'realization',
    style: 'orthogonal',
    markerStart: 'none',
    markerEnd: 'triangle',
    lineType: 'dashed',
    supportsCardinality: true,
  },
];

/**
 * All Class connector tools
 */
export const allClassConnectorTools: ConnectorTool[] = classConnectorTools;

/**
 * Default Class connector type
 */
export const defaultClassConnectorType = 'association';

/**
 * Get connector tool by ID
 */
export function getClassConnectorToolById(id: string): ConnectorTool | undefined {
  return allClassConnectorTools.find(tool => tool.id === id);
}

/**
 * Get connector tool by connector type
 */
export function getClassConnectorToolByType(type: string): ConnectorTool | undefined {
  return allClassConnectorTools.find(tool => tool.connectorType === type);
}
