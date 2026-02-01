/**
 * Architecture Service Icon Mapping
 *
 * Maps architecture service subtypes to their corresponding icon components.
 * The subtype is the source of truth for categorization, while the icon
 * is used for display purposes.
 */

import type { ComponentType } from 'react';
import {
  LuCloud,
  LuDatabase,
  LuServer,
  LuHardDrive,
  LuGlobe,
  LuMonitor,
  LuSmartphone,
  LuCode,
  LuTvMinimal,
  LuTablet,
} from 'react-icons/lu';

/**
 * Maps architecture service subtypes to their icon components
 */
export const ARCHITECTURE_SUBTYPE_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  cloud: LuCloud,
  database: LuDatabase,
  server: LuServer,
  disk: LuHardDrive,
  internet: LuGlobe,
  web: LuMonitor,
  mobile: LuSmartphone,
  react: LuCode,
  frontend: LuTvMinimal,
  tablet: LuTablet,
};

/**
 * Gets the icon component for an architecture service subtype
 *
 * @param subtype - The architecture service subtype
 * @returns The icon component, or LuCloud as a fallback
 */
export function getArchitectureIcon(subtype: string | undefined): ComponentType<{ size?: number }> {
  if (!subtype) {
    return LuCloud;
  }
  return ARCHITECTURE_SUBTYPE_ICONS[subtype] || LuCloud;
}
