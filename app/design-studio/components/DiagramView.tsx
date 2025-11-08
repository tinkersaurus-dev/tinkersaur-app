/**
 * DiagramView Component
 *
 * Renders the canvas for editing a diagram.
 * Each diagram gets its own isolated canvas instance.
 */

import { Empty } from '~/core/components/ui';
import { useDiagram } from '../hooks';
import { Canvas } from './canvas/Canvas';

interface DiagramViewProps {
  diagramId: string;
}

export function DiagramView({ diagramId }: DiagramViewProps) {
  const { diagram, loading } = useDiagram(diagramId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        Loading diagram...
      </div>
    );
  }

  if (!diagram) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description="Diagram not found" className="bg-[var(--bg)]" />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[var(--bg)]">
      <Canvas diagramId={diagramId} />
    </div>
  );
}
