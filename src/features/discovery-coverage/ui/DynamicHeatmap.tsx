import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { scaleBand, scaleLinear } from 'd3-scale';
import { Empty } from '@/shared/ui';
import type { CrossTabResult, DimensionKey } from '../lib/useCrossTabulation';

const MARGIN = { top: 16, right: 16, bottom: 56, left: 120 };
const TOP_BAR_HEIGHT = 40;
const RIGHT_BAR_WIDTH = 60;
const BAR_GAP = 8;
const CELL_GAP = 2;
const ROW_HEIGHT = 28;
const MAX_LABEL_CHARS = 16;

interface TooltipData {
  xLabel: string;
  yLabel: string;
  count: number;
  x: number;
  y: number;
}

const LINKABLE_DIMENSIONS: DimensionKey[] = ['personas', 'userGoals', 'tags'];

interface DynamicHeatmapProps {
  data: CrossTabResult;
  xDimension: DimensionKey;
  yDimension: DimensionKey;
  xLabel: string;
  yLabel: string;
  onLabelClick?: (dimension: DimensionKey, key: string) => void;
}

function truncateLabel(label: string, maxChars: number): string {
  if (label.length <= maxChars) return label;
  return label.slice(0, maxChars - 1) + '\u2026';
}

export function DynamicHeatmap({ data, xDimension, yDimension, xLabel: _xLabel, yLabel: _yLabel, onLabelClick }: DynamicHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

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

  const innerWidth =
    width - MARGIN.left - MARGIN.right - RIGHT_BAR_WIDTH - BAR_GAP;
  const innerHeight = data.yValues.length * ROW_HEIGHT;
  const totalHeight =
    MARGIN.top + TOP_BAR_HEIGHT + BAR_GAP + innerHeight + MARGIN.bottom;

  // Heatmap area origin (top-left of the cell grid)
  const gridX = MARGIN.left;
  const gridY = MARGIN.top + TOP_BAR_HEIGHT + BAR_GAP;

  // Scales
  const xScale = useMemo(() => {
    return scaleBand<string>()
      .domain(data.xValues.map((v) => v.key))
      .range([0, Math.max(0, innerWidth)])
      .padding(0.1);
  }, [data.xValues, innerWidth]);

  const yScale = useMemo(() => {
    return scaleBand<string>()
      .domain(data.yValues.map((v) => v.key))
      .range([0, innerHeight])
      .padding(0.15);
  }, [data.yValues, innerHeight]);

  const maxColumnTotal = useMemo(
    () => Math.max(...data.columnTotals, 1),
    [data.columnTotals],
  );

  const maxRowTotal = useMemo(
    () => Math.max(...data.rowTotals, 1),
    [data.rowTotals],
  );

  const columnBarScale = useMemo(() => {
    return scaleLinear()
      .domain([0, maxColumnTotal])
      .range([0, TOP_BAR_HEIGHT]);
  }, [maxColumnTotal]);

  const rowBarScale = useMemo(() => {
    return scaleLinear()
      .domain([0, maxRowTotal])
      .range([0, RIGHT_BAR_WIDTH]);
  }, [maxRowTotal]);

  // Lookup maps for tooltip labels
  const xLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const v of data.xValues) m.set(v.key, v.label);
    return m;
  }, [data.xValues]);

  const yLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const v of data.yValues) m.set(v.key, v.label);
    return m;
  }, [data.yValues]);

  const handleCellMouseEnter = useCallback(
    (
      xKey: string,
      yKey: string,
      count: number,
      event: React.MouseEvent,
    ) => {
      const rect = (
        event.currentTarget as SVGElement
      ).getBoundingClientRect();
      setTooltip({
        xLabel: xLabelMap.get(xKey) ?? xKey,
        yLabel: yLabelMap.get(yKey) ?? yKey,
        count,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    },
    [xLabelMap, yLabelMap],
  );

  const handleCellMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (data.xValues.length === 0 || data.yValues.length === 0) {
    return (
      <div ref={containerRef} className="w-full">
        <Empty description="No data available for the selected dimensions." />
      </div>
    );
  }

  const shouldRotateXLabels = data.xValues.length > 12;

  return (
    <div ref={containerRef} className="w-full relative">
      {width > 0 && (
        <svg
          width={width}
          height={totalHeight}
          className="overflow-visible"
        >
          {/* Top marginal bars (column totals) */}
          <g transform={`translate(${gridX},${MARGIN.top})`}>
            {data.xValues.map((xVal, xi) => {
              const barHeight = columnBarScale(data.columnTotals[xi]);
              const x = xScale(xVal.key) ?? 0;
              const barWidth = xScale.bandwidth();
              return (
                <g key={xVal.key}>
                  <rect
                    x={x}
                    y={TOP_BAR_HEIGHT - barHeight}
                    width={Math.max(0, barWidth - CELL_GAP)}
                    height={barHeight}
                    fill="var(--primary)"
                    opacity={0.4}
                    rx={1}
                  />
                  {data.columnTotals[xi] > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={TOP_BAR_HEIGHT - barHeight - 3}
                      textAnchor="middle"
                      dominantBaseline="auto"
                      className="text-[9px] fill-[var(--text-muted)]"
                    >
                      {data.columnTotals[xi]}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Main heatmap area */}
          <g transform={`translate(${gridX},${gridY})`}>
            {/* Y-axis labels */}
            {data.yValues.map((yVal) => {
              const isLinkable = LINKABLE_DIMENSIONS.includes(yDimension) && onLabelClick;
              return (
                <text
                  key={yVal.key}
                  x={-8}
                  y={(yScale(yVal.key) ?? 0) + yScale.bandwidth() / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className={`text-[11px] ${
                    isLinkable
                      ? 'fill-[var(--text-muted)] cursor-pointer hover:fill-[var(--primary)] hover:underline'
                      : 'fill-[var(--text-muted)]'
                  }`}
                  onClick={isLinkable ? () => onLabelClick(yDimension, yVal.key) : undefined}
                >
                  {truncateLabel(yVal.label, MAX_LABEL_CHARS)}
                </text>
              );
            })}

            {/* Heatmap cells */}
            {data.yValues.map((yVal, yi) =>
              data.xValues.map((xVal, xi) => {
                const count = data.matrix[yi][xi];
                const x = xScale(xVal.key) ?? 0;
                const y = yScale(yVal.key) ?? 0;
                const cellWidth = xScale.bandwidth();
                const cellHeight = yScale.bandwidth();
                const opacity =
                  count === 0
                    ? 0.05
                    : Math.min(count / data.maxCount, 1);

                return (
                  <rect
                    key={`${yVal.key}-${xVal.key}`}
                    x={x}
                    y={y}
                    width={Math.max(0, cellWidth - CELL_GAP)}
                    height={Math.max(0, cellHeight - CELL_GAP)}
                    fill="var(--primary)"
                    opacity={opacity}
                    rx={0}
                    className="cursor-default"
                    onMouseEnter={(e) =>
                      handleCellMouseEnter(xVal.key, yVal.key, count, e)
                    }
                    onMouseLeave={handleCellMouseLeave}
                  />
                );
              }),
            )}

            {/* X-axis labels */}
            {data.xValues.map((xVal, i) => {
              // Show every 3rd label for day granularity to avoid crowding
              if (xDimension === 'days' && i % 3 !== 0) return null;
              const x =
                (xScale(xVal.key) ?? 0) + xScale.bandwidth() / 2;
              const isLinkable = LINKABLE_DIMENSIONS.includes(xDimension) && onLabelClick;
              return (
                <text
                  key={xVal.key}
                  x={x}
                  y={
                    innerHeight + (shouldRotateXLabels ? 16 : 20)
                  }
                  textAnchor={
                    shouldRotateXLabels ? 'end' : 'middle'
                  }
                  dominantBaseline="hanging"
                  transform={
                    shouldRotateXLabels
                      ? `rotate(-45,${x},${innerHeight + 16})`
                      : undefined
                  }
                  className={`text-[10px] ${
                    isLinkable
                      ? 'fill-[var(--text-muted)] cursor-pointer hover:fill-[var(--primary)] hover:underline'
                      : 'fill-[var(--text-muted)]'
                  }`}
                  onClick={isLinkable ? () => onLabelClick(xDimension, xVal.key) : undefined}
                >
                  {truncateLabel(xVal.label, MAX_LABEL_CHARS)}
                </text>
              );
            })}
          </g>

          {/* Right marginal bars (row totals) */}
          <g
            transform={`translate(${gridX + Math.max(0, innerWidth) + BAR_GAP},${gridY})`}
          >
            {data.yValues.map((yVal, yi) => {
              const barWidth = rowBarScale(data.rowTotals[yi]);
              const y = yScale(yVal.key) ?? 0;
              const barHeight = yScale.bandwidth();
              return (
                <g key={yVal.key}>
                  <rect
                    x={0}
                    y={y}
                    width={barWidth}
                    height={Math.max(0, barHeight - CELL_GAP)}
                    fill="var(--primary)"
                    opacity={0.4}
                    rx={1}
                  />
                  {data.rowTotals[yi] > 0 && (
                    <text
                      x={barWidth + 4}
                      y={y + barHeight / 2}
                      textAnchor="start"
                      dominantBaseline="middle"
                      className="text-[9px] fill-[var(--text-muted)]"
                    >
                      {data.rowTotals[yi]}
                    </text>
                  )}
                </g>
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
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-sm shrink-0 bg-[var(--primary)]" />
            <span className="text-[var(--text-muted)]">
              {tooltip.yLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">
              {tooltip.xLabel}:
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
