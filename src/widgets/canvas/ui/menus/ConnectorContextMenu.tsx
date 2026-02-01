/**
 * Connector Context Menu Component
 *
 * Displays a context menu when the user right-clicks on an existing connector.
 * For class and ER diagrams, shows cardinality options for source and target ends.
 * Also allows changing the connector type.
 */

import type { ComponentType } from 'react';
import type { ConnectorTool } from '@/features/diagram-rendering/bpmn/connectors';
import type { ArrowType, Connector } from '@/entities/connector';
import { ContextMenuWrapper } from './ContextMenuWrapper';

/**
 * Cardinality option for display in the menu
 */
interface CardinalityOption {
  id: string;
  label: string;
  arrowType: ArrowType;
  icon: ComponentType<{ size?: number }>;
}

interface ConnectorContextMenuProps {
  /** X position in screen coordinates */
  x: number;
  /** Y position in screen coordinates */
  y: number;
  /** Whether the menu is visible */
  isOpen: boolean;
  /** Callback when menu should close */
  onClose: () => void;
  /** Callback when a connector type is selected */
  onConnectorTypeChange: (connectorTool: ConnectorTool) => void;
  /** Callback when source marker is changed */
  onSourceMarkerChange?: (arrowType: ArrowType) => void;
  /** Callback when target marker is changed */
  onTargetMarkerChange?: (arrowType: ArrowType) => void;
  /** Available connector tools for the current diagram type */
  connectorTools: ConnectorTool[];
  /** Current connector (for getting current markers) */
  currentConnector?: Connector;
  /** Currently selected connector's type (for highlighting) */
  currentConnectorType?: string;
  /** Diagram type to determine which cardinality options to show */
  diagramType?: string;
}

// Crow's foot cardinality options for ER diagrams
const crowFootOptions: CardinalityOption[] = [
  {
    id: 'crow-one',
    label: 'Exactly One (||)',
    arrowType: 'crow-one',
    icon: CrowOneIcon,
  },
  {
    id: 'crow-zero-one',
    label: 'Zero or One (o|)',
    arrowType: 'crow-zero-one',
    icon: CrowZeroOneIcon,
  },
  {
    id: 'crow-many',
    label: 'One or More (}|)',
    arrowType: 'crow-many',
    icon: CrowManyIcon,
  },
  {
    id: 'crow-zero-many',
    label: 'Zero or More (}o)',
    arrowType: 'crow-zero-many',
    icon: CrowZeroManyIcon,
  },
];

// UML multiplicity options for class diagrams
const umlMultiplicityOptions: CardinalityOption[] = [
  {
    id: 'none',
    label: 'None',
    arrowType: 'none',
    icon: NoneIcon,
  },
  {
    id: 'arrow',
    label: 'Arrow',
    arrowType: 'arrow',
    icon: ArrowIcon,
  },
  {
    id: 'diamond',
    label: 'Diamond (◇)',
    arrowType: 'diamond',
    icon: DiamondIcon,
  },
  {
    id: 'filled-diamond',
    label: 'Filled Diamond (◆)',
    arrowType: 'filled-diamond',
    icon: FilledDiamondIcon,
  },
  {
    id: 'triangle',
    label: 'Triangle (△)',
    arrowType: 'triangle',
    icon: TriangleIcon,
  },
];

// Simple SVG icons for cardinality markers
function CrowOneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="4" y2="18" />
      <line x1="8" y1="6" x2="8" y2="18" />
      <line x1="8" y1="12" x2="20" y2="12" />
    </svg>
  );
}

function CrowZeroOneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="12" r="4" />
      <line x1="12" y1="6" x2="12" y2="18" />
      <line x1="12" y1="12" x2="20" y2="12" />
    </svg>
  );
}

function CrowManyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="4" y2="18" />
      <line x1="4" y1="12" x2="12" y2="6" />
      <line x1="4" y1="12" x2="12" y2="18" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}

function CrowZeroManyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="12" r="4" />
      <line x1="10" y1="12" x2="12" y2="6" />
      <line x1="10" y1="12" x2="12" y2="18" />
      <line x1="10" y1="12" x2="20" y2="12" />
    </svg>
  );
}

function NoneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}

function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="14,6 20,12 14,18" />
    </svg>
  );
}

function DiamondIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="6,12 12,6 18,12 12,18" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function FilledDiamondIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
      <polygon points="6,12 12,6 18,12 12,18" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function TriangleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="6,12 14,6 14,18" />
      <line x1="14" y1="12" x2="22" y2="12" />
    </svg>
  );
}

export function ConnectorContextMenu({
  x,
  y,
  isOpen,
  onClose,
  onConnectorTypeChange,
  onSourceMarkerChange,
  onTargetMarkerChange,
  connectorTools,
  currentConnector,
  currentConnectorType,
  diagramType,
}: ConnectorContextMenuProps) {
  // Determine which cardinality options to show based on diagram type
  const showCardinality = diagramType === 'class' || diagramType === 'entity-relationship';
  const cardinalityOptions = diagramType === 'entity-relationship' ? crowFootOptions : umlMultiplicityOptions;

  // Don't render if no tools available
  if (connectorTools.length === 0) {
    return null;
  }

  return (
    <ContextMenuWrapper
      menuId="connector-context-menu"
      isOpen={isOpen}
      x={x}
      y={y}
      onClose={onClose}
      className="bg-[var(--bg-light)] border border-[var(--border)] rounded-sm [box-shadow:var(--shadow)] p-2 min-w-[180px]"
    >
      {/* Connector Type Row */}
      <div className="text-xs text-[var(--text-muted)] px-2 py-1">
        Connector type:
      </div>
      <div className="flex gap-1 py-1 px-1">
        {connectorTools.map((tool) => {
          const Icon = tool.icon;
          const isCurrent = currentConnectorType === tool.connectorType;

          return (
            <button
              key={tool.id}
              onClick={() => {
                onConnectorTypeChange(tool);
                onClose();
              }}
              className={`w-6 h-6 min-w-[24px] min-h-[24px] p-0 flex items-center justify-center text-[var(--text)] hover:bg-[var(--highlight)] rounded-sm transition-colors duration-[var(--transition-fast)] cursor-pointer border-0 ${
                isCurrent ? 'bg-[var(--highlight)]' : 'bg-transparent'
              }`}
              title={tool.name}
              aria-label={tool.name}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>

      {/* Cardinality Rows - only for class and ER diagrams */}
      {showCardinality && onSourceMarkerChange && onTargetMarkerChange && (
        <>
          {/* Divider */}
          <div className="border-t border-[var(--border)] my-2" />

          {/* Source End Row */}
          <div className="text-xs text-[var(--text-muted)] px-2 py-1">
            Source end:
          </div>
          <div className="flex gap-1 py-1 px-1">
            {cardinalityOptions.map((option) => {
              const Icon = option.icon;
              const isCurrent = currentConnector?.markerStart === option.arrowType;

              return (
                <button
                  key={`source-${option.id}`}
                  onClick={() => {
                    onSourceMarkerChange(option.arrowType);
                  }}
                  className={`w-6 h-6 min-w-[24px] min-h-[24px] p-0 flex items-center justify-center text-[var(--text)] hover:bg-[var(--highlight)] rounded-sm transition-colors duration-[var(--transition-fast)] cursor-pointer border-0 ${
                    isCurrent ? 'bg-[var(--highlight)]' : 'bg-transparent'
                  }`}
                  title={option.label}
                  aria-label={option.label}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>

          {/* Target End Row */}
          <div className="text-xs text-[var(--text-muted)] px-2 py-1 mt-1">
            Target end:
          </div>
          <div className="flex gap-1 py-1 px-1">
            {cardinalityOptions.map((option) => {
              const Icon = option.icon;
              const isCurrent = currentConnector?.markerEnd === option.arrowType;

              return (
                <button
                  key={`target-${option.id}`}
                  onClick={() => {
                    onTargetMarkerChange(option.arrowType);
                  }}
                  className={`w-6 h-6 min-w-[24px] min-h-[24px] p-0 flex items-center justify-center text-[var(--text)] hover:bg-[var(--highlight)] rounded-sm transition-colors duration-[var(--transition-fast)] cursor-pointer border-0 ${
                    isCurrent ? 'bg-[var(--highlight)]' : 'bg-transparent'
                  }`}
                  title={option.label}
                  aria-label={option.label}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>
        </>
      )}
    </ContextMenuWrapper>
  );
}
