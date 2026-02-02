/**
 * ResultsPanel - Vote results display with statistics
 */
import { VStack, HStack, Tag } from '@/shared/ui';
import { FiCheck } from 'react-icons/fi';
import type { VoteResults } from '../model/types';

interface ResultsPanelProps {
  results: VoteResults;
}

export function ResultsPanel({ results }: ResultsPanelProps) {
  // Group votes by point value and sort
  const voteGroups = Object.entries(results.voteCounts)
    .filter(([points]) => points !== 'null')
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  // Count pass votes
  const passCount = results.votes.filter((v) => v.points === null).length;
  const totalVotes = results.votes.length;

  // Calculate average (excluding passes)
  const validVotes = results.votes.filter((v) => v.points !== null);
  const average =
    validVotes.length > 0
      ? validVotes.reduce((sum, v) => sum + (v.points ?? 0), 0) / validVotes.length
      : 0;

  return (
    <VStack gap="md">
      {/* Consensus Indicator */}
      {results.isUnanimous && results.unanimousValue !== null && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
          <FiCheck className="text-green-600" />
          <span className="text-sm font-medium text-green-700">
            Consensus reached: {results.unanimousValue} points
          </span>
        </div>
      )}

      {/* Statistics */}
      <HStack gap="lg" className="justify-around py-3 bg-[var(--bg)] rounded">
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--text)]">{average.toFixed(1)}</div>
          <div className="text-xs text-[var(--text-muted)]">Average</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--text)]">
            {results.majorityValue ?? '-'}
          </div>
          <div className="text-xs text-[var(--text-muted)]">Majority</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--text)]">{totalVotes}</div>
          <div className="text-xs text-[var(--text-muted)]">Votes</div>
        </div>
      </HStack>

      {/* Vote Distribution */}
      <div className="border-t border-[var(--border-muted)] pt-4">
        <div className="text-xs font-medium text-[var(--text-muted)] mb-3">Vote Distribution</div>
        <VStack gap="sm">
          {voteGroups.map(([points, count]) => {
            const percent = (count / totalVotes) * 100;
            return (
              <div key={points} className="flex items-center gap-3">
                <Tag color="blue" className="min-w-[3rem] justify-center">
                  {points} pts
                </Tag>
                <div className="flex-1 h-2 bg-[var(--bg-dark)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-xs text-[var(--text-muted)] w-8 text-right">{count}</span>
              </div>
            );
          })}
          {passCount > 0 && (
            <div className="flex items-center gap-3">
              <Tag color="orange" className="min-w-[3rem] justify-center">
                Pass
              </Tag>
              <div className="flex-1 h-2 bg-[var(--bg-dark)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400 rounded-full transition-all"
                  style={{ width: `${(passCount / totalVotes) * 100}%` }}
                />
              </div>
              <span className="text-xs text-[var(--text-muted)] w-8 text-right">{passCount}</span>
            </div>
          )}
        </VStack>
      </div>

      {/* Individual Votes */}
      <div className="border-t border-[var(--border-muted)] pt-4">
        <div className="text-xs font-medium text-[var(--text-muted)] mb-2">All Votes</div>
        <div className="grid grid-cols-2 gap-2">
          {results.votes.map((vote) => (
            <div
              key={vote.userId}
              className="flex items-center justify-between px-3 py-2 bg-[var(--bg)] rounded text-sm"
            >
              <span className="text-[var(--text)] truncate">{vote.userName}</span>
              <Tag color={vote.points === null ? 'orange' : 'blue'}>
                {vote.points === null ? 'Pass' : vote.points}
              </Tag>
            </div>
          ))}
        </div>
      </div>
    </VStack>
  );
}
