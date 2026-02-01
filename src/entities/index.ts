/**
 * Entities Layer - Public API
 * @module entities
 *
 * This barrel export provides access to all entity types, schemas, and API clients.
 * Import from '@/entities' or '@/entities/[entity-name]' for specific entities.
 *
 * Note: Zustand stores remain in app/core/entities/ until Phase 3 migration.
 */

// Foundational entities (no dependencies)
export * from './quote';
export * from './source-type';
export * from './solution';
export * from './organization';
export * from './team';
export * from './user';
export * from './requirement';
export * from './solution-factor';
export * from './shape';
export * from './connector';
export * from './reference';
export * from './requirement-ref';
export * from './document';
export * from './interface';

// Single-dependency entities
export * from './intake-source';
export * from './intake-result';
export * from './planning';
export * from './use-case-version';

// Cross-domain entities (depend on quote)
export * from './feedback';
export * from './outcome';
export * from './persona';
export * from './use-case';

// Design studio composite entities
export * from './diagram';
export * from './design-work';
