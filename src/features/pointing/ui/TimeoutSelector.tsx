/**
 * TimeoutSelector - Select voting timeout duration
 */
import { Button, HStack } from '@/shared/ui';
import { TIMEOUT_OPTIONS, type TimeoutOption } from '../model/types';
import { usePointingStore } from '../model/usePointingStore';

export function TimeoutSelector() {
  const selectedTimeout = usePointingStore((state) => state.selectedTimeout);
  const setSelectedTimeout = usePointingStore((state) => state.setSelectedTimeout);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-[var(--text-muted)]">Voting Timeout</label>
      <HStack gap="sm">
        {TIMEOUT_OPTIONS.map((minutes) => (
          <Button
            key={minutes}
            variant={selectedTimeout === minutes ? 'primary' : 'default'}
            size="small"
            onClick={() => setSelectedTimeout(minutes as TimeoutOption)}
          >
            {minutes} min
          </Button>
        ))}
      </HStack>
    </div>
  );
}
