import { FiLayers } from 'react-icons/fi';
import { Button } from '@/shared/ui';

interface GroupFeedbackButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function GroupFeedbackButton({ onClick, disabled }: GroupFeedbackButtonProps) {
  return (
    <Button variant="default" icon={<FiLayers />} onClick={onClick} disabled={disabled}>
      Group Similar
    </Button>
  );
}
