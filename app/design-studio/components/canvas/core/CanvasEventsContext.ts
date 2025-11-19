import type { RefObject } from 'react';
import { createContext, useContext } from 'react';
import type { UseContextMenuManagerReturn } from '../../../hooks/useContextMenuManager';
import type { Tool as BpmnTool } from '../../../config/bpmn-tools';
import type { Tool as ClassTool } from '../../../config/class-tools';
import type { Tool as SequenceTool } from '../../../config/sequence-tools';
import type { ToolbarButton } from '../../toolbar/CanvasToolbar';
import type { JSX } from 'react';
import type { ConnectorTool } from '../../../config/bpmn-connectors';

/**
 * Canvas Events Context
 *
 * Provides all event handlers and user interactions for the Canvas component.
 * This context handles mouse events, keyboard events, and tool interactions.
 */
export interface CanvasEventsContext {
  // Event Handlers - Canvas
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleContextMenu: (e: React.MouseEvent) => void;

  // Event Handlers - Shapes
  handleShapeMouseDown: (e: React.MouseEvent, shapeId: string) => void;
  handleShapeMouseEnter: (e: React.MouseEvent, shapeId: string) => void;
  handleShapeMouseLeave: (e: React.MouseEvent, shapeId: string) => void;
  handleShapeDoubleClick: (shapeId: string) => void;
  handleStartDrawingConnector: (connectionPointId: string, e: React.MouseEvent) => void;
  handleFinishDrawingConnector: (connectionPointId: string, e: React.MouseEvent) => Promise<void>;

  // Event Handlers - Connectors
  handleConnectorMouseDown: (e: React.MouseEvent, connectorId: string) => void;
  handleConnectorMouseEnter: (e: React.MouseEvent, connectorId: string) => void;
  handleConnectorMouseLeave: (e: React.MouseEvent, connectorId: string) => void;
  handleConnectorDoubleClick: (connectorId: string) => void;

  // Event Handlers - Editing
  handleLabelChange: (id: string, type: 'shape' | 'connector', label: string) => void;
  handleFinishEditing: () => void;

  // Event Handlers - Class Shapes
  updateStereotype: (shapeId: string, stereotype: string | undefined) => void;
  addAttribute: (shapeId: string, attribute?: string) => void;
  deleteAttribute: (shapeId: string, attributeIndex: number) => void;
  updateAttribute: (shapeId: string, attributeIndex: number, newValue: string) => void;
  updateAttributeLocal: (shapeId: string, attributeIndex: number, newValue: string) => void;
  addMethod: (shapeId: string, method?: string) => void;
  deleteMethod: (shapeId: string, methodIndex: number) => void;
  updateMethod: (shapeId: string, methodIndex: number, newValue: string) => void;
  updateMethodLocal: (shapeId: string, methodIndex: number, newValue: string) => void;

  // Menu Management
  menuManager: UseContextMenuManagerReturn;
  handleAddRectangle: () => Promise<void>;
  handleBpmnToolSelect: (tool: BpmnTool, canvasX: number, canvasY: number) => Promise<void>;
  handleClassToolSelect: (tool: ClassTool, canvasX: number, canvasY: number) => Promise<void>;
  handleSequenceToolSelect: (tool: SequenceTool, canvasX: number, canvasY: number) => Promise<void>;
  handleConnectorToolbarClick: () => void;

  // Connector Type Management
  connectorTypeManager: {
    handleConnectorSelect: (connectorTool: ConnectorTool) => void;
    handleConnectorTypeChange: (connectorTool: ConnectorTool, connectorId: string) => Promise<void>;
    availableConnectorTools: ConnectorTool[];
    activeConnectorIcon: JSX.Element;
    getConnectorConfig: (connectorType: string) => ConnectorTool | undefined;
  };

  // Toolbar Configuration
  toolbarButtons: ToolbarButton[];

  // Refs (needed by view for DOM operations)
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * React Context for Canvas Events
 */
export const EventsContext = createContext<CanvasEventsContext | null>(null);

/**
 * Hook to consume Canvas Events context
 *
 * @throws Error if used outside of CanvasEventsContext provider
 * @returns Canvas events context with all event handlers
 */
export function useCanvasEvents(): CanvasEventsContext {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useCanvasEvents must be used within a CanvasEventsContext provider');
  }
  return context;
}
