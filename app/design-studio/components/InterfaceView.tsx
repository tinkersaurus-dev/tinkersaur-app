/**
 * InterfaceView Component
 * Placeholder for interface/wireframe content
 */

import { Card, Tag, Empty } from '~/core/components/ui';
import { useInterface } from '../hooks';

interface InterfaceViewProps {
  interfaceId: string;
}

export function InterfaceView({ interfaceId }: InterfaceViewProps) {
  const { interfaceItem, loading } = useInterface(interfaceId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        Loading interface...
      </div>
    );
  }

  if (!interfaceItem) {
    return <Empty description="Interface not found" className='bg-[var(--bg)]'/>;
  }

  return (
    <div className='bg-[var(--bg)]' style={{ padding: '24px' }}>
      <Card
        title={
          <div>
            {interfaceItem.name} <Tag color="purple">{interfaceItem.fidelity} fidelity</Tag>
          </div>
        }
      >
        <Empty
          description={
            <div>
              <p>Interface Editor Coming Soon</p>
              <p style={{ color: '#999', fontSize: '12px' }}>
                This is where the interface/wireframe editor will be displayed
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
