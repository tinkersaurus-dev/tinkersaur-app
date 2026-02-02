/**
 * SessionControls - Facilitator actions (Apply, Revote, Cancel)
 */
import { useState } from 'react';
import { Button, HStack } from '@/shared/ui';
import { FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';
import { toast } from '@/shared/lib/utils';
import type { VoteResults } from '../model/types';
import * as pointingHub from '../api/pointingHub';

interface SessionControlsProps {
  storyId: string;
  results: VoteResults | null;
  isFacilitator: boolean;
  onComplete: (finalPoints: number) => void;
  onCancel: () => void;
}

export function SessionControls({
  storyId,
  results,
  isFacilitator,
  onComplete,
  onCancel,
}: SessionControlsProps) {
  const [applyingMajority, setApplyingMajority] = useState(false);
  const [requestingRevote, setRequestingRevote] = useState(false);
  const [cancellingSession, setCancellingSession] = useState(false);

  if (!isFacilitator) return null;

  const handleApplyMajority = async () => {
    if (!results || results.majorityValue === null) return;
    setApplyingMajority(true);
    try {
      await pointingHub.completeSession(storyId, results.majorityValue);
      toast.success(`Applied ${results.majorityValue} points`);
      onComplete(results.majorityValue);
    } catch (error) {
      const err = error as Error;
      console.error('Failed to complete session:', error);
      toast.error(err.message || 'Failed to apply points');
    } finally {
      setApplyingMajority(false);
    }
  };

  const handleRevote = async () => {
    setRequestingRevote(true);
    try {
      await pointingHub.requestRevote(storyId);
      toast.success('Revote requested');
    } catch (error) {
      const err = error as Error;
      console.error('Failed to request revote:', error);
      toast.error(err.message || 'Failed to request revote');
    } finally {
      setRequestingRevote(false);
    }
  };

  const handleCancel = async () => {
    setCancellingSession(true);
    try {
      await pointingHub.cancelSession(storyId);
      toast.info('Pointing session cancelled');
      onCancel();
    } catch (error) {
      const err = error as Error;
      console.error('Failed to cancel session:', error);
      toast.error(err.message || 'Failed to cancel session');
    } finally {
      setCancellingSession(false);
    }
  };

  return (
    <HStack gap="sm" className="pt-4 border-t border-[var(--border)]">
      {results && results.majorityValue !== null && (
        <Button
          variant="primary"
          size="medium"
          onClick={handleApplyMajority}
          loading={applyingMajority}
          disabled={requestingRevote || cancellingSession}
        >
          <FiCheck className="mr-1" />
          Apply ({results.majorityValue} pts)
        </Button>
      )}
      <Button
        variant="default"
        size="medium"
        onClick={handleRevote}
        loading={requestingRevote}
        disabled={applyingMajority || cancellingSession}
      >
        <FiRefreshCw className="mr-1" />
        Revote
      </Button>
      <Button
        variant="danger"
        size="medium"
        onClick={handleCancel}
        loading={cancellingSession}
        disabled={applyingMajority || requestingRevote}
      >
        <FiX className="mr-1" />
        Cancel
      </Button>
    </HStack>
  );
}
