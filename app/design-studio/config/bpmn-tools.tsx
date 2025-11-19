/**
 * BPMN Toolset Configuration
 * Defines all available BPMN tools organized by type
 */

import type { ComponentType } from 'react';
import {
  FaPlay,
  FaStop,
  FaCircle,
  FaPaperPlane,
  FaEnvelope,
  FaClock,
  FaExclamationTriangle,
  FaTimes,
  FaStream,
} from 'react-icons/fa';
import { LuSquareUserRound, LuSettings, LuSquareCode } from "react-icons/lu";
import { globalToolGroup } from './global-tools';

/**
 * Tool definition interface
 * Represents a single tool that can create shapes on the canvas
 */
export interface Tool {
  /** Unique identifier for the tool */
  id: string;
  /** Display name for the tool */
  name: string;
  /** Icon component from react-icons */
  icon: ComponentType<{ size?: number }>;
  /** Shape type (e.g., 'bpmn-task', 'bpmn-event', 'bpmn-gateway') */
  shapeType: string;
  /** Shape subtype (e.g., 'user', 'service', 'start') */
  shapeSubtype: string;
  /** Default size for the shape */
  defaultSize: {
    width: number;
    height: number;
  };
  /** Position offset for shape creation (in pixels) */
  creationOffset?: {
    x?: number;
    y?: number;
  };
}

/**
 * Tool group definition
 * Organizes tools by type (e.g., Tasks, Events, Gateways)
 */
export interface ToolGroup {
  /** Group type identifier */
  type: string;
  /** Display label for the group */
  label: string;
  /** Tools in this group */
  tools: Tool[];
}

/**
 * BPMN Task Tools
 * Rounded rectangles representing different types of tasks
 */
const taskTools: Tool[] = [
  {
    id: 'user-task',
    name: 'User Task',
    icon: LuSquareUserRound,
    shapeType: 'bpmn-task',
    shapeSubtype: 'user',
    defaultSize: { width: 120, height: 80 },
  },
  {
    id: 'service-task',
    name: 'Service Task',
    icon: LuSettings,
    shapeType: 'bpmn-task',
    shapeSubtype: 'service',
    defaultSize: { width: 120, height: 80 },
  },
  {
    id: 'script-task',
    name: 'Script Task',
    icon: LuSquareCode,
    shapeType: 'bpmn-task',
    shapeSubtype: 'script',
    defaultSize: { width: 120, height: 80 },
  },
];

/**
 * BPMN Event Tools
 * Circles representing different types of events
 */
const eventTools: Tool[] = [
  {
    id: 'start-event',
    name: 'Start Event',
    icon: FaPlay,
    shapeType: 'bpmn-event',
    shapeSubtype: 'start',
    defaultSize: { width: 40, height: 40 },
  },
  {
    id: 'end-event',
    name: 'End Event',
    icon: FaStop,
    shapeType: 'bpmn-event',
    shapeSubtype: 'end',
    defaultSize: { width: 40, height: 40 },
  },
  {
    id: 'intermediate-catching-event',
    name: 'Intermediate Catching Event',
    icon: FaCircle,
    shapeType: 'bpmn-event',
    shapeSubtype: 'catching',
    defaultSize: { width: 40, height: 40 },
  },
  {
    id: 'intermediate-throwing-event',
    name: 'Intermediate Throwing Event',
    icon: FaCircle,
    shapeType: 'bpmn-event',
    shapeSubtype: 'throwing',
    defaultSize: { width: 40, height: 40 },
  },
  {
    id: 'message-send-event',
    name: 'Message Send Event',
    icon: FaPaperPlane,
    shapeType: 'bpmn-event',
    shapeSubtype: 'message-send',
    defaultSize: { width: 40, height: 40 },
  },
  {
    id: 'message-receive-event',
    name: 'Message Receive Event',
    icon: FaEnvelope,
    shapeType: 'bpmn-event',
    shapeSubtype: 'message-receive',
    defaultSize: { width: 40, height: 40 },
  },
  {
    id: 'timer-event',
    name: 'Timer Event',
    icon: FaClock,
    shapeType: 'bpmn-event',
    shapeSubtype: 'timer',
    defaultSize: { width: 40, height: 40 },
  },
  {
    id: 'error-event',
    name: 'Error Event',
    icon: FaExclamationTriangle,
    shapeType: 'bpmn-event',
    shapeSubtype: 'error',
    defaultSize: { width: 40, height: 40 },
  },
];

/**
 * BPMN Gateway Tools
 * Diamond shapes representing different types of gateways
 */
const gatewayTools: Tool[] = [
  {
    id: 'exclusive-gateway',
    name: 'Exclusive Gateway',
    icon: FaTimes,
    shapeType: 'bpmn-gateway',
    shapeSubtype: 'exclusive',
    defaultSize: { width: 40, height: 40 },
  },
  {
    id: 'inclusive-gateway',
    name: 'Inclusive Gateway',
    icon: FaCircle,
    shapeType: 'bpmn-gateway',
    shapeSubtype: 'inclusive',
    defaultSize: { width: 40, height: 40 },
  },
  {
    id: 'parallel-gateway',
    name: 'Parallel Gateway',
    icon: FaStream,
    shapeType: 'bpmn-gateway',
    shapeSubtype: 'parallel',
    defaultSize: { width: 40, height: 40 },
  },
];

/**
 * BPMN Tool Groups
 * Organized collection of all BPMN tools by type
 */
export const bpmnToolGroups: ToolGroup[] = [
  {
    type: 'task',
    label: 'Tasks',
    tools: taskTools,
  },
  {
    type: 'event',
    label: 'Events',
    tools: eventTools,
  },
  {
    type: 'gateway',
    label: 'Gateways',
    tools: gatewayTools,
  },
  globalToolGroup, // Global tools available in all diagram types
];

/**
 * Flat list of all BPMN tools
 * Useful for lookups and iteration
 */
export const allBpmnTools: Tool[] = [
  ...taskTools,
  ...eventTools,
  ...gatewayTools,
];

/**
 * Get tool by ID
 */
export function getToolById(id: string): Tool | undefined {
  return allBpmnTools.find(tool => tool.id === id);
}
