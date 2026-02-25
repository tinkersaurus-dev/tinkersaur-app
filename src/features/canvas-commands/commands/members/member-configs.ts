import type { ClassShapeData, EnumerationShapeData } from '@/entities/shape';
import type { MemberCommandConfig } from './member-command.types';
import { calculateClassHeight, calculateEnumerationHeight } from '@/shared/lib/utils/shapeHeightUtils';

/**
 * Pre-configured member command configs for common shape types
 */
export const CLASS_ATTRIBUTE_CONFIG: MemberCommandConfig<ClassShapeData> = {
  shapeType: 'class',
  arrayProperty: 'attributes',
  memberTypeName: 'class attribute',
  calculateHeight: calculateClassHeight,
};

export const CLASS_METHOD_CONFIG: MemberCommandConfig<ClassShapeData> = {
  shapeType: 'class',
  arrayProperty: 'methods',
  memberTypeName: 'class method',
  calculateHeight: calculateClassHeight,
};

export const ENUMERATION_LITERAL_CONFIG: MemberCommandConfig<EnumerationShapeData> = {
  shapeType: 'enumeration',
  arrayProperty: 'literals',
  memberTypeName: 'enumeration literal',
  calculateHeight: calculateEnumerationHeight,
};
