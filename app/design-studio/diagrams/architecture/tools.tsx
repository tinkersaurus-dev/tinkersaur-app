/**
 * Architecture Toolset Configuration
 * Defines all available architecture diagram tools organized by type
 */

import type { ComponentType } from 'react';
import { LuCloud, LuDatabase, LuServer, LuHardDrive, LuGlobe, LuBox, LuMonitor, LuSmartphone, LuCode, LuTvMinimal, LuTablet } from "react-icons/lu";
import { globalToolGroup } from '~/design-studio/config/global-tools';
import { DESIGN_STUDIO_CONFIG } from '~/design-studio/config/design-studio-config';

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

const { service: serviceSize, group: groupSize } = DESIGN_STUDIO_CONFIG.shapes.architecture;

/**
 * Architecture Service Tools
 * Services represent individual nodes/endpoints with different icons.
 * The shapeSubtype is the source of truth for categorization.
 */
const serviceTools: Tool[] = [
  {
    id: 'cloud-service',
    name: 'Cloud Service',
    icon: LuCloud,
    shapeType: 'architecture-service',
    shapeSubtype: 'cloud',
    defaultSize: { width: serviceSize.width, height: serviceSize.height },
    initialData: { icon: 'cloud' },
  },
  {
    id: 'database-service',
    name: 'Database',
    icon: LuDatabase,
    shapeType: 'architecture-service',
    shapeSubtype: 'database',
    defaultSize: { width: serviceSize.width, height: serviceSize.height },
    initialData: { icon: 'database' },
  },
  {
    id: 'server-service',
    name: 'Server',
    icon: LuServer,
    shapeType: 'architecture-service',
    shapeSubtype: 'server',
    defaultSize: { width: serviceSize.width, height: serviceSize.height },
    initialData: { icon: 'server' },
  },
  {
    id: 'disk-service',
    name: 'Disk Storage',
    icon: LuHardDrive,
    shapeType: 'architecture-service',
    shapeSubtype: 'disk',
    defaultSize: { width: serviceSize.width, height: serviceSize.height },
    initialData: { icon: 'disk' },
  },
  {
    id: 'internet-service',
    name: 'Internet',
    icon: LuGlobe,
    shapeType: 'architecture-service',
    shapeSubtype: 'internet',
    defaultSize: { width: serviceSize.width, height: serviceSize.height },
    initialData: { icon: 'internet' },
  },
  {
    id: 'web-service',
    name: 'Web App',
    icon: LuMonitor,
    shapeType: 'architecture-service',
    shapeSubtype: 'web',
    defaultSize: { width: serviceSize.width, height: serviceSize.height },
    initialData: { icon: 'web' },
  },
  {
    id: 'mobile-service',
    name: 'Mobile App',
    icon: LuSmartphone,
    shapeType: 'architecture-service',
    shapeSubtype: 'mobile',
    defaultSize: { width: serviceSize.width, height: serviceSize.height },
    initialData: { icon: 'mobile' },
  },
  {
    id: 'react-service',
    name: 'React App',
    icon: LuCode,
    shapeType: 'architecture-service',
    shapeSubtype: 'react',
    defaultSize: { width: serviceSize.width, height: serviceSize.height },
    initialData: { icon: 'react' },
  },
  {
    id: 'frontend-service',
    name: 'Frontend UI',
    icon: LuTvMinimal,
    shapeType: 'architecture-service',
    shapeSubtype: 'frontend',
    defaultSize: { width: serviceSize.width, height: serviceSize.height },
    initialData: { icon: 'frontend' },
  },
  {
    id: 'tablet-service',
    name: 'Tablet App',
    icon: LuTablet,
    shapeType: 'architecture-service',
    shapeSubtype: 'tablet',
    defaultSize: { width: serviceSize.width, height: serviceSize.height },
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
    defaultSize: { width: groupSize.minWidth * 2, height: groupSize.minHeight * 2 },
    initialData: { icon: 'box' },
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
  globalToolGroup, // AI-powered diagram generation
];
