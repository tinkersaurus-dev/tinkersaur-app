/**
 * Diagram Entity
 * @module entities/diagram
 */

export {
  DiagramTypeSchema,
  DiagramSchema,
  CreateDiagramSchema,
  UpdateDiagramSchema,
} from './model/types';

export type {
  DiagramType,
  Diagram,
  CreateDiagramDto,
  UpdateDiagramDto,
} from './model/types';

export { diagramApi } from './api/diagramApi';

// Query hooks
export {
  useDiagramsQuery,
  useDiagramQuery,
  prefetchDiagrams,
  prefetchDiagram,
} from './api/queries';

// Store
export { useDiagramStore } from './store/useDiagramStore';
export type { DiagramStoreState } from './store/types';
