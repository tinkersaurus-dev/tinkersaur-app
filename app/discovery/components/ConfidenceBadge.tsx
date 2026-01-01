interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export function ConfidenceBadge({ confidence, className = '' }: ConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100);

  let colorClass: string;
  let label: string;

  if (confidence >= 0.8) {
    colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    label = 'High';
  } else if (confidence >= 0.6) {
    colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    label = 'Medium';
  } else {
    colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    label = 'Low';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${colorClass} ${className}`}
      title={`${percentage}% confidence`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {label} ({percentage}%)
    </span>
  );
}
