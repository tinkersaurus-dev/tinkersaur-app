import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { scaleBand } from 'd3-scale';
import { Empty } from '@/shared/ui';
import { FEEDBACK_TYPE_CONFIG, ALL_FEEDBACK_TYPES, TYPE_COLORS, type FeedbackType } from '@/entities/feedback';
import type { TimelineBucket } from '../lib/useTimelineBuckets';

const MARGIN = { top: 16, right: 16, bottom: 48, left: 80 };
const CELL_GAP = 2;
const MAX_COUNT = 5;

interface TooltipData {
  type: FeedbackType;
  count: number;
  label: string;
  x: number;
  y: number;
}

interface FeedbackHeatmapProps {
  buckets: TimelineBucket[];
  selectedTypes: FeedbackType[];
}

export function FeedbackHeatmap({
  buckets,
  selectedTypes,
}: FeedbackHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Observe container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Determine which types to show (all if none selected)
  const visibleTypes = useMemo(
    () => (selectedTypes.length > 0 ? selectedTypes : ALL_FEEDBACK_TYPES),
    [selectedTypes],
  );

  const innerWidth = width - MARGIN.left - MARGIN.right;
  const rowHeight = 32;
  const innerHeight = visibleTypes.length * rowHeight;
  const height = innerHeight + MARGIN.top + MARGIN.bottom;

  // Scales
  const xScale = useMemo(() => {
    return scaleBand<string>()
      .domain(buckets.map((b) => b.key))
      .range([0, innerWidth])
      .padding(0.1);
  }, [buckets, innerWidth]);

  const yScale = useMemo(() => {
    return scaleBand<string>()
      .domain(visibleTypes)
      .range([0, innerHeight])
      .padding(0.15);
  }, [visibleTypes, innerHeight]);

  // Label map for x-axis
  const labelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of buckets) {
      map.set(b.key, b.label);
    }
    return map;
  }, [buckets]);

  const handleCellMouseEnter = useCallback(
    (type: FeedbackType, count: number, label: string, event: React.MouseEvent) => {
      const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
      setTooltip({
        type,
        count,
        label,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    },
    [],
  );

  const handleCellMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (buckets.length === 0) {
    return (
      <div ref={containerRef} className="w-full">
        <Empty description="No feedback data to display on the heatmap." />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full relative">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          className="overflow-visible"
        >
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {/* Y-axis labels (feedback types) */}
            {visibleTypes.map((type) => (
              <text
                key={type}
                x={-8}
                y={(yScale(type) ?? 0) + yScale.bandwidth() / 2}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-[11px] fill-[var(--text-muted)]"
              >
                {FEEDBACK_TYPE_CONFIG[type].label}
              </text>
            ))}

            {/* Heatmap cells */}
            {visibleTypes.map((type) =>
              buckets.map((bucket) => {
                const count = bucket[type];
                const x = xScale(bucket.key) ?? 0;
                const y = yScale(type) ?? 0;
                const cellWidth = xScale.bandwidth();
                const cellHeight = yScale.bandwidth();
                const opacity = count === 0 ? 0.05 : Math.min(count / MAX_COUNT, 1);

                return (
                  <rect
                    key={`${type}-${bucket.key}`}
                    x={x}
                    y={y}
                    width={Math.max(0, cellWidth - CELL_GAP)}
                    height={Math.max(0, cellHeight - CELL_GAP)}
                    fill={TYPE_COLORS[type]}
                    opacity={opacity}
                    rx={0}
                    className="cursor-default"
                    onMouseEnter={(e) =>
                      handleCellMouseEnter(type, count, bucket.label, e)
                    }
                    onMouseLeave={handleCellMouseLeave}
                  />
                );
              }),
            )}

            {/* X-axis labels */}
            {buckets.map((bucket) => {
              const x = (xScale(bucket.key) ?? 0) + xScale.bandwidth() / 2;
              const shouldRotate = buckets.length > 12;
              return (
                <text
                  key={bucket.key}
                  x={x}
                  y={innerHeight + (shouldRotate ? 16 : 20)}
                  textAnchor={shouldRotate ? 'end' : 'middle'}
                  dominantBaseline="hanging"
                  transform={
                    shouldRotate
                      ? `rotate(-45,${x},${innerHeight + 16})`
                      : undefined
                  }
                  className="text-[10px] fill-[var(--text-muted)]"
                >
                  {labelMap.get(bucket.key) ?? ''}
                </text>
              );
            })}
          </g>
        </svg>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed pointer-events-none bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow-lg px-3 py-2 text-xs z-50"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-medium text-[var(--text)] mb-1">
            {tooltip.label}
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: TYPE_COLORS[tooltip.type] }}
            />
            <span className="text-[var(--text-muted)]">
              {FEEDBACK_TYPE_CONFIG[tooltip.type].label}:
            </span>
            <span className="text-[var(--text)] font-medium">
              {tooltip.count}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
