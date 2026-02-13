import { useIntakeStore } from '../../model/useIntakeStore';
import { SOURCE_TYPES, type SourceTypeKey } from '@/entities/source-type';
import { useSolutionsQuery } from '@/entities/solution';
import { useAuthStore } from '@/features/auth';
import { Select, Input, DatePicker } from '@/shared/ui';

const sourceTypeOptions = Object.values(SOURCE_TYPES).map((st) => ({
  value: st.key,
  label: st.label,
}));

export function IntakeSourcePanel() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const { data: solutions = [], isLoading: isSolutionsLoading } = useSolutionsQuery(selectedTeam?.teamId);

  const selectedSourceType = useIntakeStore((state) => state.selectedSourceType);
  const selectedSolutionId = useIntakeStore((state) => state.selectedSolutionId);
  const sourceMetadata = useIntakeStore((state) => state.sourceMetadata);
  const setSelectedSourceType = useIntakeStore((state) => state.setSelectedSourceType);
  const setSelectedSolutionId = useIntakeStore((state) => state.setSelectedSolutionId);
  const updateSourceMetadataField = useIntakeStore((state) => state.updateSourceMetadataField);

  if (!selectedSourceType) return null;

  const sourceTypeConfig = SOURCE_TYPES[selectedSourceType];

  const solutionOptions = [
    { value: '', label: 'No solution' },
    ...solutions.map((s) => ({ value: s.id, label: s.name })),
  ];

  const handleSourceTypeChange = (value: string) => {
    setSelectedSourceType(value as SourceTypeKey);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
        Source Details
      </h3>

      {/* Source Type */}
      <div>
        <label className="block text-xs font-medium text-[var(--primary)] mb-1">
          Source Type
        </label>
        <Select
          value={selectedSourceType}
          onChange={handleSourceTypeChange}
          options={sourceTypeOptions}
        />
      </div>

      {/* Solution */}
      <div>
        <label className="block text-xs font-medium text-[var(--primary)] mb-1">
          Solution <span className="text-[var(--primary)] italic font-normal">(optional)</span>
        </label>
        <Select
          value={selectedSolutionId ?? ''}
          onChange={(value) => setSelectedSolutionId(value || null)}
          options={solutionOptions}
          disabled={isSolutionsLoading}
        />
      </div>

      {/* Dynamic metadata fields */}
      {sourceTypeConfig.metadataFields.length > 0 && (
        <div className="space-y-3">
          {sourceTypeConfig.metadataFields.map((field) => (
            <div key={field.name}>
              <label className="block text-xs font-medium text-[var(--primary)] mb-1">
                {field.label}
                {field.required && <span className="text-[var(--danger)] ml-1">*</span>}
              </label>
              {field.type === 'datetime' ? (
                <DatePicker
                  showTime
                  value={sourceMetadata[field.name] || ''}
                  onChange={(value) => updateSourceMetadataField(field.name, value)}
                  size="medium"
                />
              ) : field.type === 'date' ? (
                <DatePicker
                  value={sourceMetadata[field.name] || ''}
                  onChange={(value) => updateSourceMetadataField(field.name, value)}
                  size="medium"
                />
              ) : (
                <Input
                  type="text"
                  placeholder={field.placeholder}
                  value={sourceMetadata[field.name] || ''}
                  onChange={(e) => updateSourceMetadataField(field.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
