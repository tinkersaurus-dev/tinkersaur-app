/**
 * Module Configuration
 * Defines module icons and default routes for the Module Bar
 */

import { FiSearch, FiTarget, FiPenTool, FiPackage } from 'react-icons/fi';
import type { ModuleType } from './navigation-config';

export interface ModuleConfig {
  key: ModuleType;
  label: string;
  icon: React.ReactNode;
  defaultRoute: string;
}

export const MODULE_CONFIG: ModuleConfig[] = [
  {
    key: 'discovery',
    label: 'Discovery',
    icon: <FiSearch size={10} />,
    defaultRoute: '/discovery/intake',
  },
  {
    key: 'solutions',
    label: 'Solutions',
    icon: <FiTarget size={10} />,
    defaultRoute: '/solutions/strategy/overview',
  },
  {
    key: 'design',
    label: 'Design',
    icon: <FiPenTool size={10} />,
    defaultRoute: '/design/spec',
  },
  {
    key: 'delivery',
    label: 'Delivery',
    icon: <FiPackage size={10} />,
    defaultRoute: '/delivery/prioritize',
  },
];
