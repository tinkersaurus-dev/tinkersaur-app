import { useState } from 'react';
import { GiComb } from "react-icons/gi";
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { DatePicker } from '@/shared/ui/DatePicker';
import { SOURCE_TYPES, type SourceTypeKey } from '@/entities/source-type';
import { useAuthStore } from '@/features/auth';
import { useSolutionsQuery } from '~/product-management/queries';

export interface IntakeFormValues {
  sourceType: SourceTypeKey;
  content: string;
  metadata: Record<string, string>;
  solutionId: string | null;
}

interface IntakeFormProps {
  isLoading: boolean;
  onSubmit: (
    sourceType: SourceTypeKey,
    content: string,
    metadata: Record<string, string>,
    solutionId: string | null
  ) => void;
  sourceType: SourceTypeKey;
  initialValues?: IntakeFormValues;
}

const MIN_CONTENT_LENGTH = 50;

// Build options for the source type dropdown
const sourceTypeOptions = Object.values(SOURCE_TYPES).map((sourceType) => ({
  value: sourceType.key,
  label: sourceType.label,
}));

export function IntakeForm({ isLoading, onSubmit, sourceType: initialSourceType, initialValues }: IntakeFormProps) {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const { data: solutions = [], isLoading: isSolutionsLoading } = useSolutionsQuery(selectedTeam?.teamId);

  const [selectedSourceType, setSelectedSourceType] = useState<SourceTypeKey>(
    initialValues?.sourceType ?? initialSourceType
  );
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(
    initialValues?.solutionId ?? null
  );
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [metadata, setMetadata] = useState<Record<string, string>>(initialValues?.metadata ?? {});

  const sourceTypeConfig = SOURCE_TYPES[selectedSourceType];

  const solutionOptions = [
    { value: '', label: 'No solution' },
    ...solutions.map((s) => ({ value: s.id, label: s.name })),
  ];

  const handleSourceTypeChange = (value: string) => {
    setSelectedSourceType(value as SourceTypeKey);
    setMetadata({});
  };

  const handleMetadataChange = (name: string, value: string) => {
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length >= MIN_CONTENT_LENGTH && !isLoading) {
      onSubmit(selectedSourceType, content.trim(), metadata, selectedSolutionId);
    }
  };

  const isContentValid = content.trim().length >= MIN_CONTENT_LENGTH;
  const characterCount = content.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {/* Source Type Selector */}
        <div>
          <label
            htmlFor="source-type"
            className="block text-xs font-medium text-[var(--primary)] mb-1"
          >
            Source Type
          </label>
          <Select
            value={selectedSourceType}
            onChange={handleSourceTypeChange}
            options={sourceTypeOptions}
            disabled={isLoading}
          />
          <p className="text-xs text-[var(--text-muted)] italic mt-1">
            {sourceTypeConfig.description}
          </p>
        </div>

        {/* Solution Selector (Optional) */}
        <div>
          <label
            htmlFor="solution"
            className="block text-xs font-medium text-[var(--primary)] mb-1"
          >
            Solution <span className="text-[var(--primary)] italic font-normal">(optional)</span>
          </label>
          <Select
            value={selectedSolutionId ?? ''}
            onChange={(value) => setSelectedSolutionId(value || null)}
            options={solutionOptions}
            disabled={isLoading || isSolutionsLoading}
          />
          <p className="text-xs text-[var(--text-muted)] italic mt-1">
            Associate extracted items with a solution. You can change this per-item after parsing.
          </p>
        </div>

        {/* Dynamic metadata fields based on source type */}
        {sourceTypeConfig.metadataFields.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sourceTypeConfig.metadataFields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="block text-xs font-medium text-[var(--primary)] mb-1"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-[var(--danger)] ml-1">*</span>
                  )}
                </label>
                {field.type === 'datetime' ? (
                  <DatePicker
                    id={field.name}
                    showTime
                    value={metadata[field.name] || ''}
                    onChange={(value) => handleMetadataChange(field.name, value)}
                    disabled={isLoading}
                    size="medium"
                  />
                ) : field.type === 'date' ? (
                  <DatePicker
                    id={field.name}
                    value={metadata[field.name] || ''}
                    onChange={(value) => handleMetadataChange(field.name, value)}
                    disabled={isLoading}
                    size="medium"
                  />
                ) : (
                  <Input
                    id={field.name}
                    type="text"
                    placeholder={field.placeholder}
                    value={metadata[field.name] || ''}
                    onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                    disabled={isLoading}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content input - shown for all source types */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="source-content"
              className="block text-xs font-medium text-[var(--primary)]"
            >
              Content
              <span className="text-[var(--primary)] ml-1">*</span>
            </label>
            <span
              className={`text-xs ${
                isContentValid ? 'text-[var(--primary)]' : 'text-[var(--danger)]'
              }`}
            >
              {characterCount} characters
              {!isContentValid && ` (min ${MIN_CONTENT_LENGTH})`}
            </span>
          </div>
          <Input.TextArea
            id="source-content"
            rows={12}
            placeholder={`Paste your ${sourceTypeConfig.label.toLowerCase()} content here...`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
            error={content.length > 0 && !isContentValid}
          />
          {content.length > 0 && !isContentValid && (
            <p className="text-xs text-[var(--danger)] mt-1">
              Content must be at least {MIN_CONTENT_LENGTH} characters
            </p>
          )}
        </div>

        {/* Submit button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={!isContentValid || isLoading}
            icon={isLoading ? <GiComb className="animate-spin" /> : <GiComb />}
          >
            {isLoading ? 'Combing through the details...' : ''}
          </Button>
        </div>
    </form>
  );
}
