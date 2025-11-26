/**
 * BPMN Connector Configuration
 * Defines all available BPMN connector types
 */

import type { ComponentType } from 'react';
import { TbArrowRight, TbDatabaseShare } from 'react-icons/tb';
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
}

/**
 * BPMN Connector Tools
 */
const bpmnConnectorTools: ConnectorTool[] = [
  {
    id: 'sequence-flow',
    name: 'Sequence Flow',
    icon: TbArrowRight,
    connectorType: 'sequence-flow',
    style: 'orthogonal',
    markerStart: 'none',
    markerEnd: 'arrow',
    lineType: 'solid',
  },
  {
    id: 'data-flow',
    name: 'Data Flow',
    icon: TbDatabaseShare,
    connectorType: 'data-flow',
    style: 'orthogonal',
    markerStart: 'none',
    markerEnd: 'triangle',
    lineType: 'dashed',
  },
];

/**
 * All BPMN connector tools
 */
export const allBpmnConnectorTools: ConnectorTool[] = bpmnConnectorTools;

/**
 * Default BPMN connector type
 */
export const defaultBpmnConnectorType = 'sequence-flow';

/**
 * Get connector tool by ID
 */
export function getBpmnConnectorToolById(id: string): ConnectorTool | undefined {
  return allBpmnConnectorTools.find(tool => tool.id === id);
}

/**
 * Get connector tool by connector type
 */
export function getBpmnConnectorToolByType(type: string): ConnectorTool | undefined {
  return allBpmnConnectorTools.find(tool => tool.connectorType === type);
}
