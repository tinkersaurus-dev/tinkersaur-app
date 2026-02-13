import { useState, useCallback, useEffect, useMemo } from 'react';
import { FiCheck, FiX, FiChevronDown, FiChevronRight, FiMove } from 'react-icons/fi';
import { Modal, Button, Card, Tag, Spinner, Empty } from '@/shared/ui';
import { FEEDBACK_TYPE_CONFIG } from '@/entities/feedback';
import type { Feedback } from '@/entities/feedback';
import { useGenerateClusters, useApplyClusters } from '../api/hooks/useFeedbackClustering';
import type { EditableCluster } from '../model/types';

interface GroupingPreviewModalProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
  solutionId?: string;
}

export function GroupingPreviewModal({
  open,
  onClose,
  teamId,
  solutionId,
}: GroupingPreviewModalProps) {
  const generateMutation = useGenerateClusters();
  const applyMutation = useApplyClusters();

  // Local state for editable clusters
  const [clusters, setClusters] = useState<EditableCluster[]>([]);
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<{
    feedbackId: string;
    fromClusterId: string;
  } | null>(null);

  // Generate clusters when modal opens
  useEffect(() => {
    if (open) {
      setClusters([]);
      setExpandedClusters(new Set());
      generateMutation.mutate(
        { teamId, solutionId },
        {
          onSuccess: (data) => {
            if (data.success && data.clusters.length > 0) {
              // Convert to editable clusters with local IDs
              const editableClusters = data.clusters.map((cluster, idx) => ({
                id: `cluster-${idx}`,
                suggestedName: cluster.suggestedName,
                items: cluster.items,
                selectedParentId: cluster.items[0]?.id || null, // Default to first item
              }));
              setClusters(editableClusters);
              // Expand first few clusters
              setExpandedClusters(new Set(editableClusters.slice(0, 3).map((c) => c.id)));
            }
          },
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teamId, solutionId]);

  const toggleClusterExpand = useCallback((clusterId: string) => {
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(clusterId)) {
        next.delete(clusterId);
      } else {
        next.add(clusterId);
      }
      return next;
    });
  }, []);

  const handleSelectParent = useCallback((clusterId: string, feedbackId: string) => {
    setClusters((prev) =>
      prev.map((c) => (c.id === clusterId ? { ...c, selectedParentId: feedbackId } : c))
    );
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((feedbackId: string, fromClusterId: string) => {
    setDraggedItem({ feedbackId, fromClusterId });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (toClusterId: string) => {
      if (!draggedItem || draggedItem.fromClusterId === toClusterId) {
        setDraggedItem(null);
        return;
      }

      setClusters((prev) => {
        const fromCluster = prev.find((c) => c.id === draggedItem.fromClusterId);
        const item = fromCluster?.items.find((f) => f.id === draggedItem.feedbackId);
        if (!item) return prev;

        return prev
          .map((cluster) => {
            if (cluster.id === draggedItem.fromClusterId) {
              const newItems = cluster.items.filter((f) => f.id !== draggedItem.feedbackId);
              return {
                ...cluster,
                items: newItems,
                selectedParentId:
                  cluster.selectedParentId === draggedItem.feedbackId
                    ? newItems[0]?.id || null
                    : cluster.selectedParentId,
              };
            }
            if (cluster.id === toClusterId) {
              return { ...cluster, items: [...cluster.items, item] };
            }
            return cluster;
          })
          .filter((c) => c.items.length > 0); // Remove empty clusters
      });

      setDraggedItem(null);
    },
    [draggedItem]
  );

  const handleRemoveItem = useCallback((clusterId: string, feedbackId: string) => {
    setClusters((prev) =>
      prev
        .map((cluster) => {
          if (cluster.id !== clusterId) return cluster;
          const newItems = cluster.items.filter((f) => f.id !== feedbackId);
          return {
            ...cluster,
            items: newItems,
            selectedParentId:
              cluster.selectedParentId === feedbackId
                ? newItems[0]?.id || null
                : cluster.selectedParentId,
          };
        })
        .filter((c) => c.items.length >= 2) // Need at least 2 for a cluster
    );
  }, []);

  const handleApply = useCallback(() => {
    const clustersToApply = clusters
      .filter((c) => c.selectedParentId && c.items.length >= 2)
      .map((c) => ({
        parentFeedbackId: c.selectedParentId!,
        childFeedbackIds: c.items.filter((f) => f.id !== c.selectedParentId).map((f) => f.id),
      }));

    if (clustersToApply.length === 0) {
      return;
    }

    applyMutation.mutate({ teamId, clusters: clustersToApply }, { onSuccess: () => onClose() });
  }, [clusters, teamId, applyMutation, onClose]);

  const canApply = useMemo(
    () => clusters.some((c) => c.selectedParentId && c.items.length >= 2),
    [clusters]
  );

  const footer = (
    <div className="flex justify-between items-center w-full">
      <div className="text-sm text-[var(--text-muted)]">{clusters.length} clusters ready to apply</div>
      <div className="flex gap-3">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleApply}
          disabled={!canApply || applyMutation.isPending}
        >
          {applyMutation.isPending ? 'Applying...' : 'Apply Grouping'}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal open={open} onCancel={onClose} title="Group Similar Feedback" width={900} footer={footer}>
      <div className="space-y-4">
        {generateMutation.isPending && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
            <span className="ml-3 text-[var(--text-muted)]">Analyzing feedback...</span>
          </div>
        )}

        {!generateMutation.isPending && clusters.length === 0 && (
          <Empty description="No similar feedback found to group. Try adding more feedback or adjusting similarity threshold." />
        )}

        {!generateMutation.isPending && clusters.length > 0 && (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {clusters.map((cluster) => (
              <ClusterCard
                key={cluster.id}
                cluster={cluster}
                expanded={expandedClusters.has(cluster.id)}
                onToggleExpand={() => toggleClusterExpand(cluster.id)}
                onSelectParent={(feedbackId) => handleSelectParent(cluster.id, feedbackId)}
                onRemoveItem={(feedbackId) => handleRemoveItem(cluster.id, feedbackId)}
                onDragStart={(feedbackId) => handleDragStart(feedbackId, cluster.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(cluster.id)}
              />
            ))}
          </div>
        )}

        <div className="p-3 bg-[var(--info)]/10 border border-[var(--info)] rounded text-sm">
          <strong>Tip:</strong> Select a parent for each cluster. Drag items between clusters to
          reorganize. Remove items to exclude them from grouping.
        </div>
      </div>
    </Modal>
  );
}

// Sub-component for individual cluster
interface ClusterCardProps {
  cluster: EditableCluster;
  expanded: boolean;
  onToggleExpand: () => void;
  onSelectParent: (feedbackId: string) => void;
  onRemoveItem: (feedbackId: string) => void;
  onDragStart: (feedbackId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}

function ClusterCard({
  cluster,
  expanded,
  onToggleExpand,
  onSelectParent,
  onRemoveItem,
  onDragStart,
  onDragOver,
  onDrop,
}: ClusterCardProps) {
  const getTypeColor = (type: string) => {
    const config = FEEDBACK_TYPE_CONFIG[type as keyof typeof FEEDBACK_TYPE_CONFIG];
    return config?.color || 'default';
  };

  return (
    <Card className="border border-[var(--border)]" onDragOver={onDragOver} onDrop={onDrop}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-[var(--bg-secondary)]"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          {expanded ? <FiChevronDown /> : <FiChevronRight />}
          <span className="font-medium">{cluster.suggestedName}</span>
          <Tag color="default">{cluster.items.length} items</Tag>
        </div>
      </div>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t border-[var(--border)] p-2 space-y-2">
          {cluster.items.map((feedback) => (
            <FeedbackItem
              key={feedback.id}
              feedback={feedback}
              isParent={cluster.selectedParentId === feedback.id}
              typeColor={getTypeColor(feedback.type)}
              onSelectParent={() => onSelectParent(feedback.id)}
              onRemove={() => onRemoveItem(feedback.id)}
              onDragStart={() => onDragStart(feedback.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

interface FeedbackItemProps {
  feedback: Feedback;
  isParent: boolean;
  typeColor: string;
  onSelectParent: () => void;
  onRemove: () => void;
  onDragStart: () => void;
}

function FeedbackItem({
  feedback,
  isParent,
  typeColor,
  onSelectParent,
  onRemove,
  onDragStart,
}: FeedbackItemProps) {
  const config = FEEDBACK_TYPE_CONFIG[feedback.type as keyof typeof FEEDBACK_TYPE_CONFIG];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`flex items-start gap-2 p-2 rounded cursor-grab active:cursor-grabbing
        ${
          isParent
            ? 'bg-[var(--primary)]/10 border border-[var(--primary)]'
            : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
        }`}
    >
      <FiMove className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 mt-1" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Tag color={typeColor as 'default' | 'blue' | 'green' | 'red' | 'orange' | 'purple'}>
            {config?.label || feedback.type}
          </Tag>
          {isParent && <Tag color="green">Parent</Tag>}
        </div>
        <p className="text-sm text-[var(--text)] line-clamp-2">{feedback.content}</p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectParent();
          }}
          className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
          title="Select as parent"
        >
          <FiCheck className={isParent ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
          title="Remove from cluster"
        >
          <FiX className="text-[var(--text-muted)]" />
        </button>
      </div>
    </div>
  );
}
