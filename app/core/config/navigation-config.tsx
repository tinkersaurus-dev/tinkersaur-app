/**
 * Navigation Configuration
 * Defines navigation sections for each module
 */

import {
  FiCompass,
  FiPenTool,
  FiCalendar,
  FiUsers,
  FiInbox,
  FiBarChart2,
  FiFolder,
  FiList,
  FiPackage,
  FiTool,
  FiTarget,
  FiMessageSquare,
  FiLifeBuoy,
  FiClipboard,
  FiTrendingUp,
  FiEye,
} from 'react-icons/fi';
import { SOURCE_TYPES } from '~/core/entities/discovery';

// Maps icon name strings (from SOURCE_TYPES) to React Icon components
const ICON_MAP: Record<string, React.ReactNode> = {
  FiMessageSquare: <FiMessageSquare />,
  FiUsers: <FiUsers />,
  FiLifeBuoy: <FiLifeBuoy />,
  FiClipboard: <FiClipboard />,
};

function getIconElement(iconName: string): React.ReactNode {
  return ICON_MAP[iconName] || <FiInbox />;
}

export type ModuleType = 'discovery' | 'solutions' | 'design' | 'delivery';

export interface NavSection {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: { key: string; label: string; path: string; icon: React.ReactNode }[];
}

export const MODULE_NAVIGATION: Record<ModuleType, NavSection[]> = {
  solutions: [
    {
      key: 'strategy',
      label: 'Strategy',
      icon: <FiEye />,
      path: '/solutions/strategy/overview',
      children: [
        { key: 'overview', label: 'Overview', path: '/solutions/strategy/overview', icon: <FiTrendingUp /> },
        { key: 'market-research', label: 'Market Research', path: '/solutions/strategy/market-research', icon: <FiBarChart2 /> },
      ],
    },
    {
      key: 'scope',
      label: 'Scope',
      icon: <FiCompass />,
      path: '/solutions/scope',
    },
    {
      key: 'plan',
      label: 'Plan',
      icon: <FiCalendar />,
      path: '/solutions/plan',
    },
  ],
  design: [
    {
      key: 'spec',
      label: 'Spec',
      icon: <FiPenTool />,
      path: '/design/spec',
    },
  ],
  discovery: [
    {
      key: 'intake',
      label: 'Intake',
      icon: <FiInbox />,
      path: '/discovery/intake',
      children: Object.values(SOURCE_TYPES).map((sourceType) => ({
        key: sourceType.key,
        label: sourceType.label,
        path: `/discovery/intake?sourceType=${sourceType.key}`,
        icon: getIconElement(sourceType.icon),
      })),
    },
    {
      key: 'organize',
      label: 'Organize',
      icon: <FiFolder />,
      path: '/discovery/organize',
      children: [
        { key: 'personas', label: 'Personas', path: '/discovery/organize/personas', icon: <FiUsers /> },
        { key: 'use-cases', label: 'Use Cases', path: '/discovery/organize/use-cases', icon: <FiTarget /> },
        { key: 'feedback', label: 'Feedback', path: '/discovery/organize/feedback', icon: <FiMessageSquare /> },
        { key: 'outcomes', label: 'Outcomes', path: '/discovery/organize/outcomes', icon: <FiTrendingUp /> },
      ],
    },
    {
      key: 'analyze',
      label: 'Analyze',
      icon: <FiBarChart2 />,
      path: '/discovery/analyze',
    },
  ],
  delivery: [
    {
      key: 'prioritize',
      label: 'Prioritize',
      icon: <FiList />,
      path: '/delivery/prioritize',
    },
    {
      key: 'build',
      label: 'Build',
      icon: <FiTool />,
      path: '/delivery/build',
    },
    {
      key: 'release',
      label: 'Release',
      icon: <FiPackage />,
      path: '/delivery/release',
    },
  ],
};
