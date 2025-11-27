/**
 * OverviewTab Component
 * Displays solution information and lists all use cases
 */

import { useEffect, useState } from 'react';
import { Card, Descriptions, VStack } from '~/core/components/ui';
import { useSolutionStore, type Solution } from '~/core/entities/product-management';
import { useUseCaseStore } from '~/core/entities/product-management/store/useCase/useUseCaseStore';

interface OverviewTabProps {
  solutionId: string;
}

export function OverviewTab({ solutionId }: OverviewTabProps) {
  const fetchSolution = useSolutionStore((state) => state.fetchSolution);
  const getUseCasesBySolutionId = useUseCaseStore((state) => state.getUseCasesBySolutionId);
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
        <h3 style={{ marginBottom: '16px' }}>Use Cases</h3>
        <VStack gap="lg">
          {useCases.map((useCase) => (
            <div key={useCase.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>{useCase.name}</div>
              <div style={{ color: 'var(--text-secondary)' }}>
                {useCase.description}
              </div>
            </div>
          ))}
        </VStack>
      </Card>
    </div>
  );
}
