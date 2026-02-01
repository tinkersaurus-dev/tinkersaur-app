/**
 * Architecture Connector Configuration
 * Defines all available architecture diagram connector types
 */

import type { ComponentType } from 'react';
import { TbArrowRight, TbArrowLeft, TbArrowsLeftRight } from 'react-icons/tb';
import type { ArrowType, LineType } from '@/entities/connector';

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
}

/**
 * Architecture Connector Tools
 * Supports directional connections for architectural diagrams
 */
const architectureConnectorTools: ConnectorTool[] = [
  {
    id: 'directed-edge',
    name: 'Directed Edge',
    icon: TbArrowRight,
    connectorType: 'directed-edge',
    style: 'orthogonal',
    markerStart: 'none',
    markerEnd: 'arrow',
    lineType: 'solid',
  },
  {
    id: 'reverse-edge',
    name: 'Reverse Edge',
    icon: TbArrowLeft,
    connectorType: 'reverse-edge',
    style: 'orthogonal',
    markerStart: 'arrow',
    markerEnd: 'none',
    lineType: 'solid',
  },
  {
    id: 'bidirectional-edge',
    name: 'Bidirectional Edge',
    icon: TbArrowsLeftRight,
    connectorType: 'bidirectional-edge',
    style: 'orthogonal',
    markerStart: 'arrow',
    markerEnd: 'arrow',
    lineType: 'solid',
  },
];

/**
 * All architecture connector tools
 */
export const allArchitectureConnectorTools: ConnectorTool[] = architectureConnectorTools;

/**
 * Default architecture connector type
 */
export const defaultArchitectureConnectorType = 'directed-edge';

/**
 * Get connector tool by ID
 */
export function getArchitectureConnectorToolById(id: string): ConnectorTool | undefined {
  return allArchitectureConnectorTools.find(tool => tool.id === id);
}

/**
 * Get connector tool by connector type
 */
export function getArchitectureConnectorToolByType(type: string): ConnectorTool | undefined {
  return allArchitectureConnectorTools.find(tool => tool.connectorType === type);
}
