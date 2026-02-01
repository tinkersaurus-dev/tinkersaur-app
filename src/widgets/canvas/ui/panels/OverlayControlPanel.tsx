import { useMemo } from 'react';
import { LuLayers } from 'react-icons/lu';
import type { Shape } from '@/entities/shape';
import type { Connector } from '@/entities/connector';
import { useOverlayVisibilityStore } from '@/app/model/stores/overlay';
import { Checkbox } from '@/shared/ui';

interface OverlayControlPanelProps {
  shapes: Shape[];
  connectors: Connector[];
}

/**
 * OverlayControlPanel - Upper-left panel for toggling overlay visibility
 *
 * Displays a list of unique overlay tags found in the diagram with checkboxes
 * to toggle visibility of each overlay group. Only renders if there are
 * shapes or connectors with overlayTags.
 */
export function OverlayControlPanel({ shapes, connectors }: OverlayControlPanelProps) {
  const { visibleOverlays, toggleOverlay } = useOverlayVisibilityStore();

  // Extract unique overlay tags from shapes and connectors
  const overlayTags = useMemo(() => {
    const tags = new Set<string>();

    for (const shape of shapes) {
      if (shape.overlayTag) {
        tags.add(shape.overlayTag);
      }
    }

    for (const connector of connectors) {
      if (connector.overlayTag) {
        tags.add(connector.overlayTag);
      }
    }

    return Array.from(tags).sort();
  }, [shapes, connectors]);

  // Don't render if there are no overlay tags
  if (overlayTags.length === 0) {
    return null;
  }

  // Format tag for display (capitalize first letter)
  const formatTagLabel = (tag: string): string => {
    return tag.charAt(0).toUpperCase() + tag.slice(1) + 's';
  };

  return (
    <div
      className="
        absolute z-10
        top-4 left-4
        bg-[var(--bg-light)]
        border border-[var(--border)]
        rounded-md
        shadow-md
        p-2
        min-w-[140px]
      "
    >
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[var(--border)]">
        <LuLayers size={14} className="text-[var(--text-muted)]" />
        <span className="text-xs font-medium text-[var(--text)]">Overlays</span>
      </div>

      {/* Overlay tag checkboxes */}
      <div className="flex flex-col gap-1">
        {overlayTags.map((tag) => {
          const isVisible = visibleOverlays[tag] ?? false;

          return (
            <div
              key={tag}
              className="
                px-1 py-1
                rounded
                hover:bg-[var(--highlight)]
                transition-colors duration-100
              "
            >
              <Checkbox
                id={`overlay-${tag}`}
                size="small"
                checked={isVisible}
                onChange={() => toggleOverlay(tag)}
                label={formatTagLabel(tag)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
