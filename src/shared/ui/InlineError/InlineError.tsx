import { FiAlertCircle, FiX } from 'react-icons/fi';

export interface InlineErrorProps {
  message: string;
  onDismiss?: () => void;
}

export function InlineError({ message, onDismiss }: InlineErrorProps) {
  return (
    <div className="flex items-center gap-2 text-xs bg-[var(--danger)] text-white border rounded-4xl px-3 py-1.5">
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-0.5 border border-white hover:bg-white rounded-2xl transition-colors text-white hover:text-[var(--danger)]"
          aria-label="Dismiss error"
        >
          <FiX className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
