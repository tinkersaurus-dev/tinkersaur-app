import { FiMessageCircle } from 'react-icons/fi';

interface QuoteHighlightProps {
  quote: string;
  className?: string;
}

export function QuoteHighlight({ quote, className = '' }: QuoteHighlightProps) {
  return (
    <div
      className={`relative pl-4 py-2 border-l-2 border-[var(--primary)] bg-[var(--bg-light)] rounded-r ${className}`}
    >
      <FiMessageCircle className="absolute -left-2.5 top-2 w-4 h-4 text-[var(--primary)] bg-[var(--bg)] rounded-full" />
      <p className="text-sm text-[var(--text-muted)] italic">
        &ldquo;{quote}&rdquo;
      </p>
    </div>
  );
}

interface QuotesListProps {
  quotes: string[];
  maxVisible?: number;
  className?: string;
}

export function QuotesList({
  quotes,
  maxVisible = 2,
  className = '',
}: QuotesListProps) {
  if (quotes.length === 0) {
    return null;
  }

  const visibleQuotes = quotes.slice(0, maxVisible);
  const remainingCount = quotes.length - maxVisible;

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
        Supporting Quotes
      </h4>
      {visibleQuotes.map((quote, index) => (
        <QuoteHighlight key={index} quote={quote} />
      ))}
      {remainingCount > 0 && (
        <p className="text-xs text-[var(--text-muted)] pl-4">
          +{remainingCount} more quote{remainingCount > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
