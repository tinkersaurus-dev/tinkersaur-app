import type { RefObject } from 'react';
import { createContext, useContext } from 'react';
import type { ViewportTransform } from '../../../utils/viewport';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type { Diagram } from '~/core/entities/design-studio/types/Diagram';
import type { InteractionMode, SelectionBox, DrawingConnector } from '../../../hooks/useInteractionState';
import type { UseContextMenuManagerReturn } from '../../../hooks/useContextMenuManager';
import type { Tool as BpmnTool } from '~/design-studio/diagrams/bpmn/tools';
import type { Tool as ClassTool } from '~/design-studio/diagrams/class/tools';
import type { Tool as SequenceTool } from '~/design-studio/diagrams/sequence/tools';
import type { ToolbarButton } from '../../toolbar/CanvasToolbar';
import type { JSX } from 'react';
import type { ConnectorTool } from '~/design-studio/diagrams/bpmn/connectors';

/**
 * Canvas Controller Context
 *
 * Provides all business logic, state, and event handlers for the Canvas component.
 * This enables clean separation between controller logic and view presentation.
 */
export interface CanvasControllerContext {
  // Diagram Data
  diagramId: string;
  diagram: Diagram | undefined;
  loading: boolean;

  // Viewport
  viewportTransform: ViewportTransform;

  // Content (Rendering State)
  shapes: Shape[];
  connectors: Connector[];

  // Selection & Interaction
  selectedShapeIds: string[];
  hoveredShapeId: string | null;
  selectedConnectorIds: string[];
  hoveredConnectorId: string | null;
  mode: InteractionMode;
  selectionBox: SelectionBox | null;
  drawingConnector: DrawingConnector | null;

  // Editing State
  editingEntityId: string | null;
  editingEntityType: 'shape' | 'connector' | null;
  gridSnappingEnabled: boolean;
  activeConnectorType: string;

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
  updateAttribute: (shapeId: string, attributeIndex: number, oldValue: string, newValue: string) => void;
  updateAttributeLocal: (shapeId: string, attributeIndex: number, newValue: string) => void;
  addMethod: (shapeId: string, method?: string) => void;
  deleteMethod: (shapeId: string, methodIndex: number) => void;
  updateMethod: (shapeId: string, methodIndex: number, oldValue: string, newValue: string) => void;
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
 * React Context for Canvas Controller
 */
export const CanvasContext = createContext<CanvasControllerContext | null>(null);

/**
 * Hook to consume Canvas Controller context
 *
 * @throws Error if used outside of CanvasController provider
 * @returns Canvas controller context with all state and handlers
 */
export function useCanvasController(): CanvasControllerContext {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasController must be used within a CanvasController provider');
  }
  return context;
}
