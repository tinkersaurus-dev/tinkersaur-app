/**
 * Interface Entity
 * @module entities/interface
 */

export {
  InterfaceFidelitySchema,
  InterfaceSchema,
  CreateInterfaceSchema,
  UpdateInterfaceSchema,
} from './model/types';

export type {
  InterfaceFidelity,
  Interface,
  CreateInterfaceDto,
  UpdateInterfaceDto,
} from './model/types';

export { interfaceApi } from './api/interfaceApi';

// Store
export { useInterfaceStore } from './store/useInterfaceStore';
