/**
 * Sequence Diagram Connector Configuration
 * Defines all available sequence diagram message types
 */

import type { ComponentType } from 'react';
import {
  TbArrowRight,
  TbArrowBack,
  TbArrowBigRight,
  TbCirclePlus,
  TbCircleX,
  TbArrowLoopRight,
} from 'react-icons/tb';
import type { ArrowType, LineType } from '@/entities/connector';

/**
 * Connector tool definition interface
 * Represents a message connector type that can be created on the canvas
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
  /** Default routing style - sequence messages use 'straight' for horizontal lines */
  style: 'straight' | 'orthogonal' | 'curved';
  /** Marker at the start of the connector */
  markerStart: ArrowType;
  /** Marker at the end of the connector */
  markerEnd: ArrowType;
  /** Line style */
  lineType: LineType;
  /** Description of the message type */
  description?: string;
}

/**
 * Sequence Diagram Message Connector Tools
 * Different types of messages that can be sent between lifelines
 */
const sequenceMessageTools: ConnectorTool[] = [
  {
    id: 'synchronous',
    name: 'Synchronous Message',
    icon: TbArrowRight,
    connectorType: 'sequence-synchronous',
    style: 'straight',
    markerStart: 'none',
    markerEnd: 'filled-arrow',
    lineType: 'solid',
    description: 'A synchronous call that waits for a response',
  },
  {
    id: 'asynchronous',
    name: 'Asynchronous Message',
    icon: TbArrowBigRight,
    connectorType: 'sequence-asynchronous',
    style: 'straight',
    markerStart: 'none',
    markerEnd: 'arrow',
    lineType: 'solid',
    description: 'An asynchronous call that does not wait for a response',
  },
  {
    id: 'return',
    name: 'Return Message',
    icon: TbArrowBack,
    connectorType: 'sequence-return',
    style: 'straight',
    markerStart: 'none',
    markerEnd: 'arrow',
    lineType: 'dashed',
    description: 'A return message indicating the completion of a call',
  },
  {
    id: 'create',
    name: 'Create Message',
    icon: TbCirclePlus,
    connectorType: 'sequence-create',
    style: 'straight',
    markerStart: 'none',
    markerEnd: 'arrow',
    lineType: 'dashed',
    description: 'A message that creates a new participant',
  },
  {
    id: 'destroy',
    name: 'Destroy Message',
    icon: TbCircleX,
    connectorType: 'sequence-destroy',
    style: 'straight',
    markerStart: 'none',
    markerEnd: 'cross',
    lineType: 'solid',
    description: 'A message that destroys a participant',
  },
  {
    id: 'self',
    name: 'Self Message',
    icon: TbArrowLoopRight,
    connectorType: 'sequence-self',
    style: 'curved',
    markerStart: 'none',
    markerEnd: 'filled-arrow',
    lineType: 'solid',
    description: 'A message from a participant to itself',
  },
];

/**
 * All Sequence connector tools
 */
export const allSequenceConnectorTools: ConnectorTool[] = sequenceMessageTools;

/**
 * Default Sequence connector type
 */
export const defaultSequenceConnectorType = 'sequence-synchronous';

/**
 * Get connector tool by ID
 */
export function getSequenceConnectorToolById(id: string): ConnectorTool | undefined {
  return allSequenceConnectorTools.find((tool) => tool.id === id);
}

/**
 * Get connector tool by connector type
 */
export function getSequenceConnectorToolByType(type: string): ConnectorTool | undefined {
  return allSequenceConnectorTools.find((tool) => tool.connectorType === type);
}
