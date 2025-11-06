/**
 * DiagramView Component
 * Placeholder for diagram content (canvas will be built later)
 */

import { Card, Tag, Empty } from '~/core/components/ui';
import { useDiagram } from '../hooks';

interface DiagramViewProps {
  diagramId: string;
}

export function DiagramView({ diagramId }: DiagramViewProps) {
  const diagram = useDiagram(diagramId);

  if (!diagram) {
    return <Empty description="Diagram not found" className='bg-[var(--bg)]'/>;
  }

  return (
    <div className='bg-[var(--bg)]' style={{ padding: '24px' }}>
      <Card
        title={
          <div>
            {diagram.name} <Tag color="blue">{diagram.type}</Tag>
          </div>
        }
      >
        <Empty
          description={
            <div>
              <p>Canvas Component Coming Soon</p>
              <p style={{ color: '#999', fontSize: '12px' }}>
                This is where the interactive diagram canvas will be displayed
              </p>
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '60px 0' }}
        />
      </Card>
    </div>
  );
}
