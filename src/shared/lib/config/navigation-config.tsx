/**
 * Navigation Configuration
 * Defines navigation sections for each module
 */

import {
  FiActivity,
  FiCompass,
  FiPenTool,
  FiCalendar,
  FiUsers,
  FiInbox,
  FiBarChart2,
  FiFolder,
  FiGrid,
  FiList,
  FiPackage,
  FiTool,
  FiTarget,
  FiMessageSquare,
  FiTrendingUp,
  FiEye,
  FiFileText,
  FiLayers,
} from 'react-icons/fi';

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
      children: [
        { key: 'use-cases', label: 'Use Cases', path: '/solutions/scope', icon: <FiTarget /> },
        { key: 'specification', label: 'Specification', path: '/solutions/scope/specification', icon: <FiFileText /> },
      ],
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
      key: 'coverage',
      label: 'Coverage',
      icon: <FiLayers />,
      path: '/discovery/coverage',
    },
    {
      key: 'intake',
      label: 'Intake',
      icon: <FiInbox />,
      path: '/discovery/intake',
    },
    {
      key: 'organize',
      label: 'Organize',
      icon: <FiFolder />,
      path: '/discovery/organize',
      children: [
        { key: 'personas', label: 'Personas', path: '/discovery/organize/personas', icon: <FiUsers /> },
        { key: 'user-goals', label: 'User Goals', path: '/discovery/organize/user-goals', icon: <FiTarget /> },
        { key: 'feedback', label: 'Feedback', path: '/discovery/organize/feedback', icon: <FiMessageSquare /> },
        { key: 'outcomes', label: 'Outcomes', path: '/discovery/organize/outcomes', icon: <FiTrendingUp /> },
      ],
    },
    {
      key: 'analyze',
      label: 'Analyze',
      icon: <FiBarChart2 />,
      path: '/discovery/analyze',
      children: [
        { key: 'heatmap', label: 'Heatmap', path: '/discovery/analyze/heatmap', icon: <FiGrid /> },
        { key: 'signal-strength', label: 'Signal Strength', path: '/discovery/analyze/signal-strength', icon: <FiActivity /> },
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
