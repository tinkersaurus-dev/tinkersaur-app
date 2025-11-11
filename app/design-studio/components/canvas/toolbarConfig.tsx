import React from 'react';
import { TbGridDots } from 'react-icons/tb';
import type { ToolbarButton } from '../toolbar/CanvasToolbar';

export interface ToolbarConfigParams {
  diagramType: string | undefined;
  gridSnappingEnabled: boolean;
  activeConnectorIcon: React.ReactNode;
  setGridSnappingEnabled: (enabled: boolean) => void;
  handleConnectorToolbarClick: () => void;
}

/**
 * Creates the toolbar button configuration for the canvas
 * @param params - Configuration parameters including diagram type, state, and handlers
 * @returns Array of toolbar button configurations
 */
export function createToolbarButtons(params: ToolbarConfigParams): ToolbarButton[] {
  const {
    diagramType,
    gridSnappingEnabled,
    activeConnectorIcon,
    setGridSnappingEnabled,
    handleConnectorToolbarClick,
  } = params;

  const buttons: ToolbarButton[] = [];

  // Only show connector button for BPMN and Class diagrams
  if (diagramType === 'bpmn' || diagramType === 'class') {
    buttons.push({
      id: 'connector-type',
      icon: activeConnectorIcon,
      onClick: handleConnectorToolbarClick,
      tooltip: 'Select connector type',
      active: false,
    });
  }

  buttons.push({
    id: 'grid-snap',
    icon: <TbGridDots size={16} />,
    onClick: () => setGridSnappingEnabled(!gridSnappingEnabled),
    tooltip: gridSnappingEnabled ? 'Disable grid snapping' : 'Enable grid snapping (10px)',
    active: gridSnappingEnabled,
  });

  return buttons;
}
