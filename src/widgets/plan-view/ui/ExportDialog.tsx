/**
 * ExportDialog - Dialog for configuring and triggering planning data export
 */

import { useState } from 'react';
import { Modal, Button, Checkbox } from '@/shared/ui';
import { FiDownload, FiFileText, FiDatabase } from 'react-icons/fi';
import { SiJirasoftware } from 'react-icons/si';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: 'json' | 'csv' | 'jira', includeAC: boolean, includePoints: boolean) => void;
  isLoading: boolean;
}

type ExportFormat = 'json' | 'csv' | 'jira';

export function ExportDialog({ open, onClose, onExport, isLoading }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [includeAcceptanceCriteria, setIncludeAcceptanceCriteria] = useState(true);
  const [includeStoryPoints, setIncludeStoryPoints] = useState(true);

  const formats = [
    {
      value: 'json' as ExportFormat,
      label: 'JSON',
      description: 'Structured data format for integrations',
      icon: <FiDatabase className="text-[var(--primary)]" size={20} />,
    },
    {
      value: 'csv' as ExportFormat,
      label: 'CSV',
      description: 'Spreadsheet-compatible format',
      icon: <FiFileText className="text-green-500" size={20} />,
    },
    {
      value: 'jira' as ExportFormat,
      label: 'Jira',
      description: 'Import-ready format for Jira',
      icon: <SiJirasoftware className="text-blue-500" size={20} />,
    },
  ];

  const handleExport = () => {
    onExport(format, includeAcceptanceCriteria, includeStoryPoints);
  };

  return (
    <Modal open={open} onCancel={onClose} title="Export Planning Data" width={400} footer={null}>
      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-2">
            Export Format
          </label>
          <div className="space-y-2">
            {formats.map((f) => (
              <label
                key={f.value}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${format === f.value
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                    : 'border-[var(--border-muted)] hover:border-[var(--border)]'}
                `}
              >
                <input
                  type="radio"
                  name="format"
                  value={f.value}
                  checked={format === f.value}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="sr-only"
                />
                {f.icon}
                <div className="flex-1">
                  <div className="font-medium text-[var(--text)]">{f.label}</div>
                  <div className="text-xs text-[var(--text-muted)]">{f.description}</div>
                </div>
                {format === f.value && (
                  <div className="w-4 h-4 rounded-full bg-[var(--primary)] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-2">
            Include in Export
          </label>
          <div className="space-y-2">
            <Checkbox
              label="Acceptance Criteria"
              checked={includeAcceptanceCriteria}
              onChange={(e) => setIncludeAcceptanceCriteria(e.target.checked)}
            />
            <Checkbox
              label="Story Points"
              checked={includeStoryPoints}
              onChange={(e) => setIncludeStoryPoints(e.target.checked)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          icon={<FiDownload />}
          onClick={handleExport}
          loading={isLoading}
        >
          Export
        </Button>
      </div>
    </Modal>
  );
}
