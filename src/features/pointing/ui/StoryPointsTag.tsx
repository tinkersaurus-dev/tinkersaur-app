/**
 * StoryPointsTag - Clickable story points badge
 * Shows blue when idle, orange with pulse animation when active session
 */
import { Tag } from '@/shared/ui';
import { usePointingStore } from '../model/usePointingStore';

interface StoryPointsTagProps {
  storyId: string;
  currentPoints: number | null;
  onClick?: () => void;
}

export function StoryPointsTag({ storyId, currentPoints, onClick }: StoryPointsTagProps) {
  const session = usePointingStore((state) => state.activeSessions[storyId]);
  const isActive = session?.status === 'Voting';

  return (
    <Tag
      color={isActive ? 'orange' : 'blue'}
      className={`cursor-pointer hover:opacity-80 transition-opacity ${isActive ? 'animate-pulse' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {currentPoints ?? 0} pts
    </Tag>
  );
}
