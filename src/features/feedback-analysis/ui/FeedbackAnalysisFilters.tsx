import { FiX } from 'react-icons/fi';
import { Button, Select, MultiSelect } from '@/shared/ui';
import type { SelectOption, MultiSelectOption } from '@/shared/ui';
import { FEEDBACK_TYPE_CONFIG, type FeedbackType } from '@/entities/feedback';
import type { TimeGranularity } from '../lib/useAnalyzeFilterState';

const TYPE_OPTIONS: MultiSelectOption[] = (
  Object.entries(FEEDBACK_TYPE_CONFIG) as [FeedbackType, { label: string; color: string }][]
).map(([value, config]) => ({
  value,
  label: config.label,
}));

const GRANULARITY_OPTIONS: { value: TimeGranularity; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

interface FeedbackAnalysisFiltersProps {
  selectedTypes: FeedbackType[];
  onTypesChange: (types: FeedbackType[]) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  tagOptions: MultiSelectOption[];
  selectedSolutionId: string | null;
  onSolutionChange: (solutionId: string | null) => void;
  granularity: TimeGranularity;
  onGranularityChange: (granularity: TimeGranularity) => void;
  solutionOptions: SelectOption[];
  hasActiveFilters: boolean;
  onClearAll: () => void;
  selectedFeedbackContent?: string | null;
  onClearFeedbackSelection?: () => void;
  direction?: 'vertical' | 'horizontal';
}

export function FeedbackAnalysisFilters({
  selectedTypes,
  onTypesChange,
  selectedTags,
  onTagsChange,
  tagOptions,
  selectedSolutionId,
  onSolutionChange,
  granularity,
  onGranularityChange,
  solutionOptions,
  hasActiveFilters,
  onClearAll,
  selectedFeedbackContent,
  onClearFeedbackSelection,
  direction = 'vertical',
}: FeedbackAnalysisFiltersProps) {
  const isHorizontal = direction === 'horizontal';

  return (
    <div className={isHorizontal ? 'flex items-end gap-4 flex-wrap' : 'flex flex-col gap-4'}>
      <div className={isHorizontal ? 'flex flex-col gap-1 min-w-[160px]' : 'flex flex-col gap-3'}>
        <label className="text-xs font-medium text-[var(--text-muted)]">Type</label>
        <MultiSelect
          value={selectedTypes}
          onChange={(values) => onTypesChange(values as FeedbackType[])}
          options={TYPE_OPTIONS}
          placeholder="All types"
          size="small"
        />
      </div>

      <div className={isHorizontal ? 'flex flex-col gap-1 min-w-[160px]' : 'flex flex-col gap-3'}>
        <label className="text-xs font-medium text-[var(--text-muted)]">Tags</label>
        <MultiSelect
          value={selectedTags}
          onChange={onTagsChange}
          options={tagOptions}
          placeholder="All tags"
          size="small"
          showSearch
        />
      </div>

      <div className={isHorizontal ? 'flex flex-col gap-1 min-w-[160px]' : 'flex flex-col gap-3'}>
        <label className="text-xs font-medium text-[var(--text-muted)]">Solution</label>
        <Select
          value={selectedSolutionId ?? ''}
          onChange={(value) => onSolutionChange(value || null)}
          options={[{ value: '', label: 'All solutions' }, ...solutionOptions]}
          size="small"
        />
      </div>

      <div className={isHorizontal ? 'flex flex-col gap-1' : 'flex flex-col gap-3'}>
        <label className="text-xs font-medium text-[var(--text-muted)]">Granularity</label>
        <div className="flex items-center rounded-md border border-[var(--border)] overflow-hidden">
          {GRANULARITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onGranularityChange(option.value)}
              className={`flex-1 px-3 py-1 text-xs font-medium transition-colors ${
                granularity === option.value
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {selectedFeedbackContent && (
        <div className={isHorizontal ? 'flex flex-col gap-1 max-w-[200px]' : 'flex flex-col gap-1.5'}>
          <label className="text-xs font-medium text-[var(--text-muted)]">Selected</label>
          <span className="bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded text-xs flex items-center gap-1.5">
            <span className="line-clamp-1">{selectedFeedbackContent}</span>
            <button
              onClick={onClearFeedbackSelection}
              className="hover:text-[var(--text)] shrink-0"
            >
              <FiX className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {hasActiveFilters && (
        <Button variant="text" size="small" onClick={onClearAll}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
