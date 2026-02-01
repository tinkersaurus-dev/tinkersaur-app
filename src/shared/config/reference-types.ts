/**
 * Re-export reference types configuration
 * This configuration is defined in the app layer but re-exported here for convenience
 */

export {
  canShapeBeReferenceSource,
  canShapeBeFolderReferenceSource,
  getReferenceConfigForShape,
  getFolderReferenceConfigForShape,
  canReferenceBeDroppedInContent,
  getAllReferenceConfigs,
  getAllFolderReferenceConfigs,
  type ReferenceTypeConfig,
  type FolderReferenceTypeConfig,
} from '~/design-studio/config/reference-types';
