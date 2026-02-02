/**
 * VotingPanel - Point selection grid with vote status
 */
import { Button, HStack, VStack } from '@/shared/ui';
import { FiCheck, FiX } from 'react-icons/fi';
import { POINT_VALUES, type PointValue } from '../model/types';
import { usePointingStore } from '../model/usePointingStore';
import * as pointingHub from '../api/pointingHub';
import type { Story } from '@/entities/planning';
import { toast } from '@/shared/lib/utils';

interface VotingPanelProps {
  story: Story;
}

export function VotingPanel({ story }: VotingPanelProps) {
  const session = usePointingStore((state) => state.activeSessions[story.id]);
  const myVote = usePointingStore((state) => state.myVotes[story.id]);
  const submittingVote = usePointingStore((state) => state.submittingVote);
  const setSubmittingVote = usePointingStore((state) => state.setSubmittingVote);
  const setMyVote = usePointingStore((state) => state.setMyVote);

  const handleVote = async (points: PointValue | null) => {
    setSubmittingVote(true);
    try {
      await pointingHub.submitVote(story.id, points);
      setMyVote(story.id, points);
    } catch (error) {
      const err = error as Error;
      console.error('Failed to submit vote:', error);
      toast.error(err.message || 'Failed to submit vote');
    } finally {
      setSubmittingVote(false);
    }
  };

  const hasVoted = myVote !== undefined;
  const votes = session?.votes ?? [];

  return (
    <VStack gap="md">
      {/* Story Title */}
      <div className="text-sm font-medium text-[var(--text)]">{story.title}</div>

      {/* Acceptance Criteria */}
      {story.acceptanceCriteria.length > 0 && (
        <div className="border border-[var(--border-muted)] rounded p-3 bg-[var(--bg)]">
          <div className="text-xs font-medium text-[var(--text-muted)] mb-2">
            Acceptance Criteria
          </div>
          <ul className="text-xs text-[var(--text)] space-y-1">
            {story.acceptanceCriteria.map((ac) => (
              <li key={ac.id} className="flex gap-2">
                <span className="text-[var(--text-muted)]">•</span>
                <span>{ac.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Point Selection Grid */}
      <div className="grid grid-cols-4 gap-2">
        {POINT_VALUES.map((points) => (
          <Button
            key={points}
            variant={myVote === points ? 'primary' : 'default'}
            size="medium"
            onClick={() => handleVote(points)}
            disabled={submittingVote}
            className="h-12 text-lg font-bold"
          >
            {points}
          </Button>
        ))}
        {/* Pass button */}
        <Button
          variant={myVote === null ? 'danger' : 'default'}
          size="medium"
          onClick={() => handleVote(null)}
          disabled={submittingVote}
          className="h-12"
        >
          <FiX className="mr-1" />
          Pass
        </Button>
      </div>

      {/* Who has voted indicator */}
      <div className="border-t border-[var(--border-muted)] pt-4">
        <div className="text-xs font-medium text-[var(--text-muted)] mb-2">
          Votes Received ({votes.length})
        </div>
        <HStack gap="xs" className="flex-wrap">
          {votes.map((vote) => (
            <div
              key={vote.userId}
              className="flex items-center gap-1 px-2 py-1 bg-[var(--bg)] rounded text-xs"
            >
              <FiCheck className="text-green-500" size={12} />
              <span>{vote.userName}</span>
            </div>
          ))}
        </HStack>
        {votes.length === 0 && (
          <div className="text-xs text-[var(--text-muted)]">Waiting for votes...</div>
        )}
      </div>

      {hasVoted && (
        <div className="text-center text-sm text-[var(--text-muted)] py-2 bg-[var(--bg)] rounded">
          Your vote: {myVote === null ? 'Passed' : `${myVote} points`}
        </div>
      )}
    </VStack>
  );
}
