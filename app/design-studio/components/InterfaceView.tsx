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
  const iface = useInterface(interfaceId);

  if (!iface) {
    return <Empty description="Interface not found" className='bg-[var(--bg)]'/>;
  }

  return (
    <div className='bg-[var(--bg)]' style={{ padding: '24px' }}>
      <Card
        title={
          <div>
            {iface.name} <Tag color="purple">{iface.fidelity} fidelity</Tag>
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
