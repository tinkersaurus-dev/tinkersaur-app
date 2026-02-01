import { useCallback, useMemo } from 'react';
import type { JSX } from 'react';
import { TbArrowRight } from 'react-icons/tb';
import { commandManager } from '@/features/canvas-commands/model/CommandManager';
import type { CommandFactory } from '@/features/canvas-commands/model/CommandFactory';
import type { ArrowType, Connector } from '@/entities/connector';
import {
  allBpmnConnectorTools,
  getBpmnConnectorToolByType,
  type ConnectorTool,
} from '@/features/diagram-rendering/bpmn/connectors';
import {
  allClassConnectorTools,
  getClassConnectorToolByType,
} from '@/features/diagram-rendering/class/connectors';
import {
  allSequenceConnectorTools,
  getSequenceConnectorToolByType,
} from '@/features/diagram-rendering/sequence/connectors';
import {
  allArchitectureConnectorTools,
  getArchitectureConnectorToolByType,
} from '@/features/diagram-rendering/architecture/connectors';
import {
  allEntityRelationshipConnectorTools,
  getERConnectorToolByType,
} from '@/features/diagram-rendering/entity-relationship/connectors';

interface UseConnectorTypeManagerProps {
  diagramId: string;
  diagramType: 'bpmn' | 'dataflow' | 'class' | 'sequence' | 'architecture' | 'entity-relationship' | undefined;
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
  handleSourceMarkerChange: (arrowType: ArrowType, connectorId: string) => Promise<void>;
  handleTargetMarkerChange: (arrowType: ArrowType, connectorId: string) => Promise<void>;

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
    } else if (diagramType === 'architecture') {
      return getArchitectureConnectorToolByType(connectorType);
    } else if (diagramType === 'entity-relationship') {
      return getERConnectorToolByType(connectorType);
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
    } else if (diagramType === 'architecture') {
      return allArchitectureConnectorTools;
    } else if (diagramType === 'entity-relationship') {
      return allEntityRelationshipConnectorTools;
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

  // Handle source marker change from context menu
  const handleSourceMarkerChange = useCallback(async (arrowType: ArrowType, connectorId: string) => {
    if (!connectorId) return;

    const updateData = {
      id: connectorId,
      markerStart: arrowType,
    };

    const command = commandFactory.createChangeConnectorType(
      diagramId,
      connectorId,
      updateData
    );

    await commandManager.execute(command, diagramId);
  }, [diagramId, commandFactory]);

  // Handle target marker change from context menu
  const handleTargetMarkerChange = useCallback(async (arrowType: ArrowType, connectorId: string) => {
    if (!connectorId) return;

    const updateData = {
      id: connectorId,
      markerEnd: arrowType,
    };

    const command = commandFactory.createChangeConnectorType(
      diagramId,
      connectorId,
      updateData
    );

    await commandManager.execute(command, diagramId);
  }, [diagramId, commandFactory]);

  return {
    // Handlers (menu state managed by useContextMenuManager)
    handleConnectorSelect,
    handleConnectorTypeChange,
    handleSourceMarkerChange,
    handleTargetMarkerChange,

    // Computed values
    availableConnectorTools,
    activeConnectorIcon,
    getConnectorConfig,
  };
}
