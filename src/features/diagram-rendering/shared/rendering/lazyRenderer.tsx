import { lazy, type ComponentType } from 'react';
import type { ShapeRendererProps, ShapeRendererComponent } from './types';

/**
 * Creates a lazy-loaded shape renderer component from a named export.
 *
 * Wraps a dynamic import with React.lazy() to enable code splitting
 * for diagram-specific renderers. The component will suspend during loading,
 * which should be caught by a parent Suspense boundary (in CanvasContentLayer).
 *
 * Note: No Suspense wrapper here - we let the suspension bubble up so that
 * shapes and connectors can be rendered together after all lazy components load.
 *
 * @param importFn - Function that returns a promise resolving to an object with the named export
 * @param exportName - The name of the export to use from the module
 * @returns A lazy-loaded component that can be used in the shape renderer registry
 *
 * @example
 * const LazyClassRenderer = createLazyRenderer(
 *   () => import('../../class/rendering/ClassRenderer'),
 *   'ClassRenderer'
 * );
 */
export function createLazyRenderer(
  importFn: () => Promise<Record<string, ComponentType<ShapeRendererProps>>>,
  exportName: string
): ShapeRendererComponent {
  const LazyComponent = lazy(() =>
    importFn().then((module) => ({
      default: module[exportName] as ComponentType<ShapeRendererProps>,
    }))
  );

  return function LazyRenderer(props: ShapeRendererProps) {
    return <LazyComponent {...props} />;
  };
}
