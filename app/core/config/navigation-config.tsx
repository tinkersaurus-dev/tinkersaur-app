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
} from 'react-icons/fi';

export type ModuleType = 'discovery' | 'solution' | 'delivery';

export interface NavSection {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: { key: string; label: string; path: string; icon: React.ReactNode }[];
}

export const MODULE_NAVIGATION: Record<ModuleType, NavSection[]> = {
  solution: [
    {
      key: 'scope',
      label: 'Scope',
      icon: <FiCompass />,
      path: '/solution/scope',
    },
    {
      key: 'design',
      label: 'Design',
      icon: <FiPenTool />,
      path: '/solution/design',
    },
    {
      key: 'plan',
      label: 'Plan',
      icon: <FiCalendar />,
      path: '/solution/plan',
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
