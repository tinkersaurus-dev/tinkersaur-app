/**
 * PointingDrawer - Main container for story pointing session
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Drawer, Button, HStack } from '@/shared/ui';
import { FiPlay, FiClock } from 'react-icons/fi';
import { usePointingStore } from '../model/usePointingStore';
import { useAuthStore } from '@/features/auth';
import * as pointingHub from '../api/pointingHub';
import { TimeoutSelector } from './TimeoutSelector';
import { VotingPanel } from './VotingPanel';
import { ResultsPanel } from './ResultsPanel';
import { SessionControls } from './SessionControls';
import type { Story } from '@/entities/planning';

interface PointingDrawerProps {
  story: Story | null;
  open: boolean;
  onClose: () => void;
  onPointsUpdated: (storyId: string, points: number) => void;
}

export function PointingDrawer({ story, open, onClose, onPointsUpdated }: PointingDrawerProps) {
  const userId = useAuthStore((state) => state.userInfo?.userId);
  const session = usePointingStore((state) => (story ? state.activeSessions[story.id] : undefined));
  const results = usePointingStore((state) => (story ? state.results[story.id] : undefined));
  const selectedTimeout = usePointingStore((state) => state.selectedTimeout);
  const startingSession = usePointingStore((state) => state.startingSession);
  const setStartingSession = usePointingStore((state) => state.setStartingSession);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Ref for session to avoid stale closures in interval callback
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  });

  // Countdown timer
  useEffect(() => {
    if (!session || session.status !== 'Voting') {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const currentSession = sessionRef.current;
      if (!currentSession || currentSession.status !== 'Voting') {
        return;
      }
      const now = new Date();
      const started = new Date(currentSession.startedAt);
      const expiresAt = new Date(started.getTime() + currentSession.timeoutSeconds * 1000);
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSession = async () => {
    if (!story) return;
    setStartingSession(true);
    try {
      await pointingHub.startPointingSession(story.id, story.title, selectedTimeout);
    } catch (error) {
      console.error('Failed to start pointing session:', error);
    } finally {
      setStartingSession(false);
    }
  };

  const handleComplete = useCallback(
    (finalPoints: number) => {
      if (story) {
        onPointsUpdated(story.id, finalPoints);
      }
      onClose();
    },
    [story, onPointsUpdated, onClose]
  );

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const isFacilitator = session?.facilitatorId === userId;
  const isVoting = session?.status === 'Voting';
  const hasResults = !!results;

  // Header content with timer
  const headerContent = (
    <HStack gap="md" className="justify-between w-full">
      <span className="font-medium">Story Points</span>
      {isVoting && timeRemaining !== null && (
        <HStack gap="xs" className="text-[var(--text-muted)]">
          <FiClock size={14} />
          <span className={`text-sm font-mono ${timeRemaining < 30 ? 'text-orange-500' : ''}`}>
            {formatTime(timeRemaining)}
          </span>
        </HStack>
      )}
    </HStack>
  );

  // Footer with session controls (only for facilitator and when results are in)
  const footerContent =
    isFacilitator && hasResults ? (
      <SessionControls
        storyId={story?.id ?? ''}
        results={results ?? null}
        isFacilitator={isFacilitator}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    ) : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={headerContent}
      footer={footerContent}
      width={630}
      placement="right"
    >
      {!session ? (
        // No active session - show start controls
        <div className="space-y-4">
          <div className="text-sm text-[var(--text-muted)]">
            Start a pointing session for this story. Team members in this context will be able to
            vote.
          </div>

          <TimeoutSelector />

          <Button
            variant="primary"
            size="medium"
            onClick={handleStartSession}
            loading={startingSession}
            className="w-full"
          >
            <FiPlay className="mr-2" />
            Start Pointing Session
          </Button>

          <div className="text-xs text-[var(--text-muted)] text-center">
            Current points: {story?.storyPoints ?? 'Not set'}
          </div>
        </div>
      ) : isVoting && !hasResults ? (
        // Active voting - no results yet
        <VotingPanel story={story!} />
      ) : hasResults ? (
        // Results available
        <ResultsPanel results={results} />
      ) : null}
    </Drawer>
  );
}
