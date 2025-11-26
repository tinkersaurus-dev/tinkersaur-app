/**
 * OverviewTab Component
 * Displays solution information and lists all use cases/changes
 */

import { useEffect, useState } from 'react';
import { Card, Tag, Descriptions, VStack, type TagColor } from '~/core/components/ui';
import { useSolutionStore, type Change, type Solution } from '~/core/entities/product-management';
import { useUseCaseStore } from '~/core/entities/product-management/store/useCase/useUseCaseStore';
import { useChangeStore } from '~/core/entities/product-management/store/change/useChangeStore';

interface OverviewTabProps {
  solutionId: string;
}

export function OverviewTab({ solutionId }: OverviewTabProps) {
  const fetchSolution = useSolutionStore((state) => state.fetchSolution);
  const getUseCasesBySolutionId = useUseCaseStore((state) => state.getUseCasesBySolutionId);
  const getChangesByUseCaseId = useChangeStore((state) => state.getChangesByUseCaseId);
  const [solution, setSolution] = useState<Solution | null>(null);
  const useCases = solution ? getUseCasesBySolutionId(solutionId) : [];

  useEffect(() => {
    fetchSolution(solutionId).then((s) => {
      setSolution(s);
    });
  }, [solutionId, fetchSolution]);

  if (!solution) {
    return <div style={{ padding: '24px' }}>Solution not found</div>;
  }

  const getStatusColor = (status: Change['status']): TagColor => {
    const colors: Record<Change['status'], TagColor> = {
      draft: 'default',
      locked: 'blue',
      'in-design': 'orange',
      implemented: 'green',
    };
    return colors[status];
  };

  return (
    <div className='bg-[var(--bg)]' style={{ padding: '24px' }}>
      <Card style={{ marginBottom: '16px' }}>
        <Descriptions title="Solution" bordered column={1}>
          <Descriptions.Item label="Name">{solution.name}</Descriptions.Item>
          <Descriptions.Item label="Type">{solution.type.charAt(0).toUpperCase() + solution.type.slice(1)}</Descriptions.Item>
          <Descriptions.Item label="Description">{solution.description}</Descriptions.Item>
          <Descriptions.Item label="Created">
            {new Date(solution.createdAt).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Last Updated">
            {new Date(solution.updatedAt).toLocaleDateString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <h3 style={{ marginBottom: '16px' }}>Use Cases & Changes</h3>
        <VStack gap="lg">
          {useCases.map((useCase) => {
            const changes = getChangesByUseCaseId(useCase.id);
            return (
              <div key={useCase.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>{useCase.name}</div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {useCase.description}
                </div>
                {changes.length > 0 && (
                  <div style={{ paddingLeft: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      Changes:
                    </div>
                    {changes.map((change) => (
                      <div key={change.id} style={{ marginBottom: '4px', fontSize: '14px' }}>
                        <Tag color={getStatusColor(change.status)}>{change.status}</Tag>
                        <span style={{ marginLeft: '8px' }}>{change.name}</span>
                        <span style={{ marginLeft: '8px', color: 'var(--text-secondary)' }}>
                          v{change.version}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </VStack>
      </Card>
    </div>
  );
}
