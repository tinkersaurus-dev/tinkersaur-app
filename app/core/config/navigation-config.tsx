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
} from 'react-icons/fi';

export type ModuleType = 'discovery' | 'strategy' | 'design' | 'delivery';

export interface NavSection {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: { key: string; label: string; path: string; icon: React.ReactNode }[];
}

export const MODULE_NAVIGATION: Record<ModuleType, NavSection[]> = {
  strategy: [
    {
      key: 'scope',
      label: 'Scope',
      icon: <FiCompass />,
      path: '/strategy/scope',
    },
    {
      key: 'plan',
      label: 'Plan',
      icon: <FiCalendar />,
      path: '/strategy/plan',
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
    },
    {
      key: 'analyze',
      label: 'Analyze',
      icon: <FiBarChart2 />,
      path: '/discovery/analyze',
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
      ],
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
