/**
 * Design Work Entity
 * @module entities/design-work
 */

export {
  DiagramRefSchema,
  InterfaceRefSchema,
  DocumentRefSchema,
  DesignWorkSchema,
  CreateDesignWorkSchema,
  UpdateDesignWorkSchema,
} from './model/types';

export type {
  DiagramRef,
  InterfaceRef,
  DocumentRef,
  DesignWork,
  CreateDesignWorkDto,
  UpdateDesignWorkDto,
} from './model/types';

export { designWorkApi } from './api/designWorkApi';
export type { DesignWorksWithReferences, ReorderItemDto } from './api/designWorkApi';

// Store
export { useDesignWorkStore } from './store/useDesignWorkStore';
