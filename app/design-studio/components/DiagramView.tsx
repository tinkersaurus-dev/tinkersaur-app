/**
 * DiagramView Component
 *
 * Renders the canvas for editing a diagram.
 * Each diagram gets its own isolated canvas instance.
 */

import { Empty } from '@/shared/ui';
import { ErrorBoundary } from '~/core/components';
import { useDiagram } from '../hooks';
import { Canvas } from '@/widgets/canvas';

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
      <ErrorBoundary
        resetKey={diagramId}
        fallback={(error, _errorInfo, reset) => (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="max-w-md w-full bg-[var(--bg-light)] border border-[var(--border-error)] rounded-sm p-6">
              <h3 className="text-lg font-semibold text-[var(--text-error)] mb-2">
                Canvas Error
              </h3>
              <p className="text-[var(--text-muted)] mb-4">
                The diagram canvas encountered an error and could not render.
              </p>
              {import.meta.env.DEV && (
                <details className="mb-4 p-3 bg-[var(--bg-darker)] rounded border border-[var(--border-muted)]">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--text)]">
                    Error details
                  </summary>
                  <pre className="text-xs text-[var(--text-error)] mt-2 overflow-auto">
                    {error.toString()}
                  </pre>
                </details>
              )}
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--text)] rounded hover:bg-[var(--bg-darker)] transition-colors"
                >
                  Try again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-2 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-dark)] transition-colors"
                >
                  Reload page
                </button>
              </div>
            </div>
          </div>
        )}
      >
        <Canvas diagramId={diagramId} />
      </ErrorBoundary>
    </div>
  );
}
