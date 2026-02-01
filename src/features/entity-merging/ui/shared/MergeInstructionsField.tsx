/**
 * Standard instructions textarea for merge modals
 */

import { Input } from '@/shared/ui';

export function MergeInstructionsField({
  value,
  onChange,
  placeholder = 'E.g., Prioritize specific aspects...',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text)] mb-2">
        Additional Instructions (optional)
      </label>
      <Input.TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        size="small"
      />
    </div>
  );
}
