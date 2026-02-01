import React from 'react';
import { TbGridDots, TbLayoutGrid, TbMagnet, TbMagnetOff } from 'react-icons/tb';
import type { ToolbarButton } from '../../ui/toolbar/CanvasToolbar';

export interface ToolbarConfigParams {
  diagramType: string | undefined;
  gridSnappingEnabled: boolean;
  gridDisplayMode: 'dots' | 'lines';
  activeConnectorIcon: React.ReactNode;
  zoom: number;
  setGridSnappingEnabled: (enabled: boolean) => void;
  setGridDisplayMode: (mode: 'dots' | 'lines') => void;
  handleConnectorToolbarClick: (buttonElement?: HTMLButtonElement) => void;
  handleZoomReset: () => void;
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
    gridDisplayMode,
    activeConnectorIcon,
    zoom,
    setGridSnappingEnabled,
    setGridDisplayMode,
    handleConnectorToolbarClick,
    handleZoomReset,
  } = params;

  const buttons: ToolbarButton[] = [];

  // Only show connector button for BPMN, Class, Sequence, and Entity Relationship diagrams
  if (diagramType === 'bpmn' || diagramType === 'class' || diagramType === 'sequence' || diagramType === 'entity-relationship') {
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
    icon: gridSnappingEnabled ? <TbMagnetOff size={16} /> : <TbMagnet size={16} />,
    onClick: () => setGridSnappingEnabled(!gridSnappingEnabled),
    tooltip: gridSnappingEnabled ? 'Disable grid snapping' : 'Enable grid snapping (10px)',
    active: gridSnappingEnabled,
  });

  buttons.push({
    id: 'grid-display',
    icon: gridDisplayMode === 'dots' ? <TbLayoutGrid size={16} /> : <TbGridDots size={16} />,
    onClick: () => setGridDisplayMode(gridDisplayMode === 'dots' ? 'lines' : 'dots'),
    tooltip: gridDisplayMode === 'dots' ? 'Switch to line grid' : 'Switch to dot grid',
    active: gridDisplayMode === 'lines',
  });

  buttons.push({
    id: 'zoom-reset',
    label: `${Math.round(zoom * 100)}%`,
    onClick: handleZoomReset,
    tooltip: 'Reset zoom and pan to default',
    active: false,
    className: 'w-[48px] text-xs font-mono',
  });

  return buttons;
}
