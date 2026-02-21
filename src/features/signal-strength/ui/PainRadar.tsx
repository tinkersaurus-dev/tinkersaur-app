import { Card, Empty } from '@/shared/ui';
import { TYPE_COLORS } from '@/entities/feedback';
import type { FeedbackType } from '@/entities/feedback';
import { FEEDBACK_TYPE_CONFIG } from '@/entities/feedback';
import type { PainRadarRow } from '../lib/types';
import { PAIN_TYPES, OPPORTUNITY_TYPES } from '../lib/types';

interface PainRadarProps {
  title: string;
  badge?: string;
  data: PainRadarRow[];
  maxCount: number;
}

const LABEL_WIDTH = 160;

export function PainRadar({ title, badge, data, maxCount }: PainRadarProps) {
  return (
    <Card shadow={false} className="border-[var(--border-muted)]">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-[13px] font-semibold text-[var(--text)]">{title}</h3>
        {badge && (
          <span className="text-[10px] font-medium bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>

      {data.length === 0 ? (
        <Empty description="No data to display." />
      ) : (
        <div className="relative">
          {/* Axis labels */}
          <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] opacity-70 mb-1.5"
               style={{ paddingLeft: LABEL_WIDTH }}>
            <span className="pl-1">Pain</span>
            <span className="pr-1">Opportunity</span>
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-1">
            {data.map((row) => (
              <RadarRow key={row.id} row={row} maxCount={maxCount} />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-[var(--border-muted)]">
            <span className="text-[10px] font-semibold text-[var(--text)] uppercase tracking-wider mr-1">Pain</span>
            {PAIN_TYPES.map((type) => (
              <LegendItem key={type} type={type} />
            ))}
            <span className="w-3" />
            <span className="text-[10px] font-semibold text-[var(--text)] uppercase tracking-wider mr-1">Opportunity</span>
            {OPPORTUNITY_TYPES.map((type) => (
              <LegendItem key={type} type={type} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function RadarRow({ row, maxCount }: { row: PainRadarRow; maxCount: number }) {
  return (
    <div className="flex items-center h-7 group">
      {/* Label */}
      <div className="shrink-0 pr-3 text-right overflow-hidden" style={{ width: LABEL_WIDTH }}>
        <div className="text-[12px] font-medium text-[var(--text)] truncate leading-tight">
          {row.name}
        </div>
        {row.subtitle && (
          <div className="text-[10px] text-[var(--text-muted)] truncate leading-tight">
            {row.subtitle}
          </div>
        )}
      </div>

      {/* Bar area */}
      <div className="flex-1 flex items-center relative h-full">
        {/* Center axis */}
        <div className="absolute left-1/2 top-[-2px] bottom-[-2px] w-px bg-[var(--border-muted)] z-[2]" />

        {/* Pain half (right-to-left from center) */}
        <div className="w-1/2 flex items-center justify-end h-full">
          {PAIN_TYPES.map((type) => {
            const count = row.typeCounts[type];
            if (count === 0) return null;
            const widthPct = (count / maxCount) * 100;
            return (
              <BarSegment
                key={type}
                type={type}
                count={count}
                widthPct={widthPct}
              />
            );
          })}
        </div>

        {/* Opportunity half (left-to-right from center) */}
        <div className="w-1/2 flex items-center justify-start h-full">
          {OPPORTUNITY_TYPES.map((type) => {
            const count = row.typeCounts[type];
            if (count === 0) return null;
            const widthPct = (count / maxCount) * 100;
            return (
              <BarSegment
                key={type}
                type={type}
                count={count}
                widthPct={widthPct}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BarSegment({
  type,
  count,
  widthPct,
}: {
  type: FeedbackType;
  count: number;
  widthPct: number;
}) {
  const color = TYPE_COLORS[type];
  const showLabel = widthPct > 8;

  return (
    <div
      className="h-full flex items-center justify-center text-[10px] font-medium transition-opacity duration-150 group-hover:opacity-40 hover:!opacity-100 hover:!brightness-110"
      style={{
        width: `${widthPct}%`,
        backgroundColor: color,
        color: type === 'concern' ? '#1a1d27' : '#fff',
        minWidth: 0,
      }}
      title={`${count} ${FEEDBACK_TYPE_CONFIG[type].label}`}
    >
      {showLabel && <span className="pointer-events-none select-none">{count}</span>}
    </div>
  );
}

function LegendItem({ type }: { type: FeedbackType }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
      <span
        className="w-2.5 h-2.5 rounded-sm shrink-0"
        style={{ backgroundColor: TYPE_COLORS[type] }}
      />
      {FEEDBACK_TYPE_CONFIG[type].label}
    </span>
  );
}
