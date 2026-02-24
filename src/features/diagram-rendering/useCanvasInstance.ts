import { canvasInstanceRegistry } from '@/shared/model/stores/canvas/canvasInstanceRegistry';
import type { CanvasInstanceStore } from '@/shared/model/stores/canvas/createCanvasInstanceStore';
import { defaultBpmnConnectorType } from './bpmn/connectors';
import { defaultClassConnectorType } from './class/connectors';
import { defaultSequenceConnectorType } from './sequence/connectors';
import type { DiagramType } from '@/entities/diagram';

/**
 * Resolves a diagram type to its default connector type string.
 */
function getDefaultConnectorType(diagramType?: DiagramType): string {
  if (!diagramType) return 'line';
  switch (diagramType) {
    case 'bpmn':
      return defaultBpmnConnectorType;
    case 'class':
      return defaultClassConnectorType;
    case 'sequence':
      return defaultSequenceConnectorType;
    default:
      return 'line';
  }
}

/**
 * Use Canvas Instance Hook
 *
 * Returns the isolated Zustand store for a specific diagram instance.
 *
 * CRITICAL: Each diagram ID gets its own store instance from the registry.
 * This ensures complete isolation between multiple open canvases.
 *
 * @param diagramId - The ID of the diagram
 * @param diagramType - The type of diagram (for initializing default connector type)
 * @returns The Zustand store instance for this diagram
 *
 * @example
 * ```tsx
 * function Canvas({ diagramId, diagramType }: { diagramId: string, diagramType: DiagramType }) {
 *   const canvasInstance = useCanvasInstance(diagramId, diagramType);
 *
 *   const zoom = canvasInstance((state) => state.viewportZoom);
 *   const setViewport = canvasInstance((state) => state.setViewport);
 *
 *   const handleZoom = () => {
 *     setViewport(zoom * 1.2, 0, 0);
 *   };
 *
 *   return <div>Zoom: {zoom}</div>;
 * }
 * ```
 */
export function useCanvasInstance(diagramId: string, diagramType?: DiagramType): CanvasInstanceStore {
  const initialConnectorType = getDefaultConnectorType(diagramType);
  return canvasInstanceRegistry.getStore(diagramId, initialConnectorType);
}
