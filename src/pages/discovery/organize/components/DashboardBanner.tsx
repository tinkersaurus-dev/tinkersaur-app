import { Link } from 'react-router';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

interface DashboardBannerProps {
  template: string;
  count: number;
  actionLink: string;
  onDismiss: () => void;
}

export function DashboardBanner({
  template,
  count,
  actionLink,
  onDismiss,
}: DashboardBannerProps) {
  // Split template on {count} to render the count portion bold
  const parts = template.split('{count}');
  const before = parts[0] ?? '';
  const after = parts[1] ?? '';

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-sm border border-amber-500/20 bg-amber-500/5 border-l-4 border-l-amber-500">
      <FiAlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
      <span className="flex-1 text-xs text-[var(--text)] leading-snug">
        {before}
        <strong>{count}</strong>
        {after}
      </span>
      <Link
        to={actionLink}
        className="text-xs font-medium text-amber-500 hover:text-amber-400 whitespace-nowrap flex-shrink-0 transition-colors"
      >
        Review now &rarr;
      </Link>
      <button
        type="button"
        onClick={onDismiss}
        className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-sm hover:bg-[var(--bg-secondary)] transition-colors flex-shrink-0"
        title="Dismiss"
      >
        <FiX className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
