import { useCallback, useMemo } from 'react';
import type { JSX } from 'react';
import { TbArrowRight } from 'react-icons/tb';
import { commandManager } from '~/core/commands/CommandManager';
import type { CommandFactory } from '~/core/commands/CommandFactory';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import {
  allBpmnConnectorTools,
  getBpmnConnectorToolByType,
  type ConnectorTool,
} from '../config/bpmn-connectors';
import {
  allClassConnectorTools,
  getClassConnectorToolByType,
} from '../config/class-connectors';
import {
  allSequenceConnectorTools,
  getSequenceConnectorToolByType,
} from '../config/sequence-connectors';

interface UseConnectorTypeManagerProps {
  diagramId: string;
  diagramType: 'bpmn' | 'dataflow' | 'class' | 'sequence' | undefined;
  activeConnectorType: string;
  setActiveConnectorType: (type: string) => void;
  commandFactory: CommandFactory;
  connectors: Connector[];
}

interface UseConnectorTypeManagerReturn {
  // Toolbar handlers (menu state now managed by useContextMenuManager)
  handleConnectorSelect: (connectorTool: ConnectorTool) => void;

  // Context menu handlers (menu state now managed by useContextMenuManager)
  handleConnectorTypeChange: (connectorTool: ConnectorTool, connectorId: string) => Promise<void>;

  // Computed values
  availableConnectorTools: ConnectorTool[];
  activeConnectorIcon: JSX.Element;
  getConnectorConfig: (connectorType: string) => ConnectorTool | undefined;
}

export function useConnectorTypeManager({
  diagramId,
  diagramType,
  activeConnectorType,
  setActiveConnectorType,
  commandFactory,
  connectors: _connectors,
}: UseConnectorTypeManagerProps): UseConnectorTypeManagerReturn {
  // Note: Menu state now managed by useContextMenuManager in Canvas.tsx

  // Helper function to get connector config based on diagram type
  const getConnectorConfig = useCallback((connectorType: string) => {
    if (diagramType === 'bpmn') {
      return getBpmnConnectorToolByType(connectorType);
    } else if (diagramType === 'class') {
      return getClassConnectorToolByType(connectorType);
    } else if (diagramType === 'sequence') {
      return getSequenceConnectorToolByType(connectorType);
    }
    return undefined;
  }, [diagramType]);

  // Get available connector tools based on diagram type
  const availableConnectorTools = useMemo(() => {
    if (diagramType === 'bpmn') {
      return allBpmnConnectorTools;
    } else if (diagramType === 'class') {
      return allClassConnectorTools;
    } else if (diagramType === 'sequence') {
      return allSequenceConnectorTools;
    }
    return [];
  }, [diagramType]);

  // Get active connector tool icon
  const activeConnectorIcon = useMemo(() => {
    const activeConnector = getConnectorConfig(activeConnectorType);
    if (activeConnector) {
      const Icon = activeConnector.icon;
      return <Icon size={16} />;
    }
    return <TbArrowRight size={16} />;
  }, [activeConnectorType, getConnectorConfig]);

  // Handle connector selection from popover (for toolbar)
  const handleConnectorSelect = useCallback((connectorTool: ConnectorTool) => {
    setActiveConnectorType(connectorTool.connectorType);
  }, [setActiveConnectorType]);

  // Handle connector type change from context menu (for existing connectors)
  const handleConnectorTypeChange = useCallback(async (connectorTool: ConnectorTool, connectorId: string) => {
    if (!connectorId) return;

    // Create the update data based on the connector tool config
    const updateData = {
      id: connectorId,
      type: connectorTool.connectorType,
      style: connectorTool.style,
      markerStart: connectorTool.markerStart,
      markerEnd: connectorTool.markerEnd,
      lineType: connectorTool.lineType,
      arrowType: connectorTool.markerEnd, // For backwards compatibility
    };

    // Create and execute the command
    const command = commandFactory.createChangeConnectorType(
      diagramId,
      connectorId,
      updateData
    );

    await commandManager.execute(command, diagramId);

    // Refresh activation boxes for sequence diagrams
    // (changing connector type can affect activation box placement, e.g., synchronous <-> return)
    if (diagramType === 'sequence') {
      const refreshCommand = commandFactory.createRefreshSequenceActivations(diagramId);
      await commandManager.execute(refreshCommand, diagramId);
    }
  }, [diagramId, diagramType, commandFactory]);

  return {
    // Handlers (menu state managed by useContextMenuManager)
    handleConnectorSelect,
    handleConnectorTypeChange,

    // Computed values
    availableConnectorTools,
    activeConnectorIcon,
    getConnectorConfig,
  };
}
