import { createCanvasInstanceStore, type CanvasInstanceStore } from './createCanvasInstanceStore';
import { defaultBpmnConnectorType } from '~/design-studio/diagrams/bpmn/connectors';
import { defaultClassConnectorType } from '~/design-studio/diagrams/class/connectors';
import { defaultSequenceConnectorType } from '~/design-studio/diagrams/sequence/connectors';
import type { DiagramType } from '~/core/entities/design-studio/types/Diagram';

/**
 * Canvas Instance Registry
 *
 * Manages the lifecycle of canvas instance stores.
 * - Creates new stores when diagrams are opened
 * - Caches stores for reuse when switching tabs
 * - Cleans up stores when tabs are closed
 *
 * This registry ensures that:
 * 1. Each diagram ID gets its own isolated store instance
 * 2. Multiple tabs with the same diagram share the same store
 * 3. Stores are cleaned up to prevent memory leaks
 */
class CanvasInstanceRegistry {
  private stores = new Map<string, CanvasInstanceStore>();

  /**
   * Get or create a store for a diagram
   *
   * If a store already exists for this diagramId, return the existing one.
   * Otherwise, create a new store instance.
   */
  getStore(diagramId: string, diagramType?: DiagramType): CanvasInstanceStore {
    if (!this.stores.has(diagramId)) {
      // Determine default connector type based on diagram type
      let initialConnectorType = 'line'; // fallback default
      if (diagramType === 'bpmn') {
        initialConnectorType = defaultBpmnConnectorType;
      } else if (diagramType === 'class') {
        initialConnectorType = defaultClassConnectorType;
      } else if (diagramType === 'sequence') {
        initialConnectorType = defaultSequenceConnectorType;
      }

      const store = createCanvasInstanceStore(diagramId, initialConnectorType);
      this.stores.set(diagramId, store);
    }

    return this.stores.get(diagramId)!;
  }

  /**
   * Release a store when its tab is closed
   *
   * This removes the store from the registry, allowing it to be garbage collected.
   */
  releaseStore(diagramId: string): void {
    if (this.stores.has(diagramId)) {
      this.stores.delete(diagramId);
    }
  }

  /**
   * Check if a store exists for a diagram
   */
  hasStore(diagramId: string): boolean {
    return this.stores.has(diagramId);
  }

  /**
   * Get all active store IDs (for debugging)
   */
  getActiveStoreIds(): string[] {
    return Array.from(this.stores.keys());
  }

  /**
   * Clear all stores (useful for testing or logout)
   */
  clearAll(): void {
    console.warn('[CanvasRegistry] Clearing all stores');
    this.stores.clear();
  }
}

// Singleton instance
export const canvasInstanceRegistry = new CanvasInstanceRegistry();
