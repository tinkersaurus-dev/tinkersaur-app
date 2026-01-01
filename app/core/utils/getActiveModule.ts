/**
 * Module Detection Utility
 * Determines the active module based on the current pathname
 */

import type { ModuleType } from '~/core/config/navigation-config';

export function getActiveModule(pathname: string): ModuleType | null {
  if (pathname.startsWith('/discovery')) return 'discovery';
  if (pathname.startsWith('/solution')) return 'solution';
  if (pathname.startsWith('/delivery')) return 'delivery';
  return null;
}
