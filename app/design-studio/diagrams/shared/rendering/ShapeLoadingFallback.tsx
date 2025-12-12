/**
 * Minimal fallback for lazy-loaded shape renderers.
 * Returns null to avoid rendering SVG elements outside of SVG context.
 */
export function ShapeLoadingFallback() {
  return null;
}
