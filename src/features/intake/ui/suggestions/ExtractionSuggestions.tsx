import { FiUsers, FiClipboard, FiMessageSquare, FiTarget, FiFileText } from 'react-icons/fi';
import { useIntakeStore } from '../../model/useIntakeStore';
import { useAgentLoop } from '../../lib/useAgentLoop';
import type { ExtractionType } from '../../model/types';
import { Button, HStack } from '@/shared/ui';

const EXTRACTION_TYPES: Array<{
  key: ExtractionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'personas', label: 'Personas', icon: FiUsers },
  { key: 'useCases', label: 'Use Cases', icon: FiClipboard },
  { key: 'feedback', label: 'Feedback', icon: FiMessageSquare },
  { key: 'outcomes', label: 'Outcomes', icon: FiTarget },
  { key: 'requirements', label: 'Requirements', icon: FiFileText },
];

export function ExtractionSuggestions() {
  const documentType = useIntakeStore((state) => state.documentType);
  const suggestedExtractions = useIntakeStore((state) => state.suggestedExtractions);
  const selectedExtractions = useIntakeStore((state) => state.selectedExtractions);
  const toggleExtractionType = useIntakeStore((state) => state.toggleExtractionType);
  const { startExtraction } = useAgentLoop();

  const handleStartExtraction = () => {
    startExtraction();
  };

  // Format document type for display
  const formatDocumentType = (type: string | null): string => {
    if (!type) return 'Unknown Document';
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <HStack gap="md" align="center" wrap className="extraction-suggestions">
      {/* Document type badge */}
      <span className="text-sm font-medium text-[var(--text)]">
        Detected: <span className="text-[var(--primary)]">{formatDocumentType(documentType)}</span>
      </span>

      {/* Separator */}
      <div className="h-4 w-px bg-[var(--border)]" />

      {/* Extraction type toggles */}
      <HStack gap="xs" align="center" wrap>
        <span className="text-sm text-[var(--text-muted)]">Extract:</span>
        {EXTRACTION_TYPES.map(({ key, label, icon: Icon }) => {
          const isSelected = selectedExtractions.includes(key);
          const isSuggested = suggestedExtractions.includes(key);

          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleExtractionType(key)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-sm rounded-full transition-colors ${
                isSelected
                  ? 'bg-[var(--primary)] text-white'
                  : isSuggested
                    ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]'
                    : 'bg-[var(--bg)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--primary-light)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </HStack>

      {/* Start button */}
      <Button
        variant="primary"
        size="small"
        onClick={handleStartExtraction}
        disabled={selectedExtractions.length === 0}
        className="ml-auto"
      >
        Start Extraction
      </Button>
    </HStack>
  );
}
