import { useState } from 'react';
import { FiLoader, FiZap } from 'react-icons/fi';
import { Button } from '~/core/components/ui/Button';
import { Input } from '~/core/components/ui/Input';
import { Select } from '~/core/components/ui/Select';
import { Card } from '~/core/components/ui/Card';
import {
  SOURCE_TYPES,
  type SourceTypeKey,
} from '~/core/entities/discovery';

interface IntakeFormProps {
  isLoading: boolean;
  onSubmit: (
    sourceType: SourceTypeKey,
    content: string,
    metadata: Record<string, string>
  ) => void;
  sourceType: SourceTypeKey;
}

const MIN_CONTENT_LENGTH = 50;

// Build options for the source type dropdown
const sourceTypeOptions = Object.values(SOURCE_TYPES).map((sourceType) => ({
  value: sourceType.key,
  label: sourceType.label,
}));

export function IntakeForm({ isLoading, onSubmit, sourceType: initialSourceType }: IntakeFormProps) {
  const [selectedSourceType, setSelectedSourceType] = useState<SourceTypeKey>(initialSourceType);
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState<Record<string, string>>({});

  const sourceTypeConfig = SOURCE_TYPES[selectedSourceType];

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
      onSubmit(selectedSourceType, content.trim(), metadata);
    }
  };

  const isContentValid = content.trim().length >= MIN_CONTENT_LENGTH;
  const characterCount = content.length;

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Source Type Selector */}
        <div>
          <label
            htmlFor="source-type"
            className="block text-xs font-medium text-[var(--text)] mb-1"
          >
            Source Type
          </label>
          <Select
            value={selectedSourceType}
            onChange={handleSourceTypeChange}
            options={sourceTypeOptions}
            disabled={isLoading}
            className='text-xs'
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {sourceTypeConfig.description}
          </p>
        </div>

        {/* Dynamic metadata fields based on source type */}
        {sourceTypeConfig.metadataFields.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sourceTypeConfig.metadataFields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="block text-xs font-medium text-[var(--text)] mb-1"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-[var(--danger)] ml-1">*</span>
                  )}
                </label>
                {field.type === 'datetime' ? (
                  <Input
                    id={field.name}
                    type="datetime-local"
                    value={metadata[field.name] || ''}
                    onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                    disabled={isLoading}
                    className='text-xs'
                  />
                ) : (
                  <Input
                    id={field.name}
                    type="text"
                    placeholder={field.placeholder}
                    value={metadata[field.name] || ''}
                    onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                    disabled={isLoading}
                    className='text-xs'
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
              className="block text-xs font-medium text-[var(--text)]"
            >
              Content
              <span className="text-[var(--danger)] ml-1">*</span>
            </label>
            <span
              className={`text-xs ${
                isContentValid ? 'text-[var(--text-muted)]' : 'text-[var(--danger)]'
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
            className='text-xs'
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
            icon={isLoading ? <FiLoader className="animate-spin" /> : <FiZap />}
          >
            {isLoading ? 'Parsing...' : 'Parse'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
