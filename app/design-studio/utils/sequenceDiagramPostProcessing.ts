/**
 * Sequence Diagram Post-Processing
 *
 * Handles post-processing steps for sequence diagrams after they are generated or updated.
 * This includes:
 * - Updating lifeline heights based on connection point usage
 * - Refreshing activation boxes based on message flow
 */

import { canvasInstanceRegistry } from '~/design-studio/store/content/canvasInstanceRegistry';
import { commandManager } from '~/core/commands/CommandManager';
import type { CommandFactory } from '~/core/commands/CommandFactory';

/**
 * Apply sequence diagram post-processing steps
 *
 * @param diagramId - The ID of the diagram to process
 * @param commandFactory - The command factory for creating update commands
 */
export async function applySequenceDiagramPostProcessing(
  diagramId: string,
  commandFactory: CommandFactory
): Promise<void> {
  // Get shapes and connectors from canvas instance's local state (updated immediately)
  const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
  const localShapes = canvasInstance.getState().localShapes;
  const localConnectors = canvasInstance.getState().localConnectors;

  // Check if this is a sequence diagram by looking for sequence lifelines
  const hasSequenceLifelines = localShapes.some(s => s.type === 'sequence-lifeline');

  if (!hasSequenceLifelines) {
    // Not a sequence diagram, nothing to do
    return;
  }

  // Calculate required lifeline height based on connection point usage
  const { calculateRequiredLifelineHeight } = await import('~/design-studio/utils/lifelineHeightCalculator');
  const requiredHeight = calculateRequiredLifelineHeight(localShapes, localConnectors);

  // Update lifeline heights if needed
  const heightCommand = commandFactory.createUpdateLifelineHeights(diagramId, requiredHeight);
  await commandManager.execute(heightCommand, diagramId);

  // Refresh activation boxes based on message flow
  const refreshCommand = commandFactory.createRefreshSequenceActivations(diagramId);
  await commandManager.execute(refreshCommand, diagramId);
}
