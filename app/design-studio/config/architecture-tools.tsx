/**
 * Architecture Toolset Configuration
 * Defines all available architecture diagram tools organized by type
 */

import type { ComponentType } from 'react';
import { LuCloud, LuDatabase, LuServer, LuHardDrive, LuGlobe, LuBox, LuCircleDot, LuMonitor, LuSmartphone, LuCode, LuTvMinimal, LuTablet } from "react-icons/lu";
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
  /** Shape type (e.g., 'architecture-service', 'architecture-group') */
  shapeType: string;
  /** Shape subtype (optional) */
  shapeSubtype?: string;
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
  /** Initial data for the shape */
  initialData?: Record<string, unknown>;
}

/**
 * Tool group definition
 * Organizes tools by type (e.g., Services, Containers, Utilities)
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
 * Architecture Service Tools
 * Services represent individual nodes/endpoints with different icons
 */
const serviceTools: Tool[] = [
  {
    id: 'cloud-service',
    name: 'Cloud Service',
    icon: LuCloud,
    shapeType: 'architecture-service',
    defaultSize: { width: 100, height: 80 },
    initialData: { icon: 'cloud' },
  },
  {
    id: 'database-service',
    name: 'Database',
    icon: LuDatabase,
    shapeType: 'architecture-service',
    defaultSize: { width: 100, height: 80 },
    initialData: { icon: 'database' },
  },
  {
    id: 'server-service',
    name: 'Server',
    icon: LuServer,
    shapeType: 'architecture-service',
    defaultSize: { width: 100, height: 80 },
    initialData: { icon: 'server' },
  },
  {
    id: 'disk-service',
    name: 'Disk Storage',
    icon: LuHardDrive,
    shapeType: 'architecture-service',
    defaultSize: { width: 100, height: 80 },
    initialData: { icon: 'disk' },
  },
  {
    id: 'internet-service',
    name: 'Internet',
    icon: LuGlobe,
    shapeType: 'architecture-service',
    defaultSize: { width: 100, height: 80 },
    initialData: { icon: 'internet' },
  },
  {
    id: 'web-service',
    name: 'Web App',
    icon: LuMonitor,
    shapeType: 'architecture-service',
    defaultSize: { width: 100, height: 80 },
    initialData: { icon: 'web' },
  },
  {
    id: 'mobile-service',
    name: 'Mobile App',
    icon: LuSmartphone,
    shapeType: 'architecture-service',
    defaultSize: { width: 100, height: 80 },
    initialData: { icon: 'mobile' },
  },
  {
    id: 'react-service',
    name: 'React App',
    icon: LuCode,
    shapeType: 'architecture-service',
    defaultSize: { width: 100, height: 80 },
    initialData: { icon: 'react' },
  },
  {
    id: 'frontend-service',
    name: 'Frontend UI',
    icon: LuTvMinimal,
    shapeType: 'architecture-service',
    defaultSize: { width: 100, height: 80 },
    initialData: { icon: 'frontend' },
  },
  {
    id: 'tablet-service',
    name: 'Tablet App',
    icon: LuTablet,
    shapeType: 'architecture-service',
    defaultSize: { width: 100, height: 80 },
    initialData: { icon: 'tablet' },
  },
];

/**
 * Architecture Container Tools
 * Groups organize related services and can be nested
 */
const containerTools: Tool[] = [
  {
    id: 'group',
    name: 'Group',
    icon: LuBox,
    shapeType: 'architecture-group',
    defaultSize: { width: 300, height: 200 },
    initialData: { icon: 'box' },
  },
];

/**
 * Architecture Utility Tools
 * Junctions and other routing elements
 */
const utilityTools: Tool[] = [
  {
    id: 'junction',
    name: 'Junction',
    icon: LuCircleDot,
    shapeType: 'architecture-junction',
    defaultSize: { width: 20, height: 20 },
  },
];

/**
 * All tool groups for architecture diagrams
 * Includes services, containers, utilities, and global AI tools
 */
export const architectureToolGroups: ToolGroup[] = [
  {
    type: 'service',
    label: 'Services',
    tools: serviceTools,
  },
  {
    type: 'container',
    label: 'Containers',
    tools: containerTools,
  },
  {
    type: 'utility',
    label: 'Utilities',
    tools: utilityTools,
  },
  globalToolGroup, // AI-powered diagram generation
];
