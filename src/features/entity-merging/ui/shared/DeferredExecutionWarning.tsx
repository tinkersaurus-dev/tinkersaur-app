/**
 * Default preview warning component for deferred execution modals
 */

export function DeferredExecutionWarning({ message }: { message?: string }) {
  return (
    <div className="p-3 bg-[var(--warning)]/10 border border-[var(--warning)] rounded">
      <p className="text-sm text-[var(--text)]">
        <strong>Note:</strong>{' '}
        {message || 'The merge will be executed when you save the intake results.'}
      </p>
    </div>
  );
}
