/**
 * ErrorBoundary
 * Component-level error boundary to catch and handle React errors gracefully
 */

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, errorInfo: string, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: string) => void;
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const errorInfoString = errorInfo.componentStack || '';

    this.setState({
      errorInfo: errorInfoString,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfoString);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfoString);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  private reset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.state.errorInfo || '', this.reset);
        }
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-[var(--bg-light)] border border-[var(--border-error)] rounded-sm">
          <div className="max-w-2xl w-full">
            <h2 className="text-xl font-semibold text-[var(--text-error)] mb-4">
              Something went wrong
            </h2>
            <p className="text-[var(--text-muted)] mb-4">
              An error occurred while rendering this component. Please try refreshing the page.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 p-4 bg-[var(--bg-darker)] rounded border border-[var(--border-muted)]">
                <summary className="cursor-pointer font-medium text-[var(--text)] mb-2">
                  Error details
                </summary>
                <pre className="text-xs text-[var(--text-error)] overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo && `\n\n${this.state.errorInfo}`}
                </pre>
              </details>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={this.reset}
                className="px-4 py-2 border border-[var(--border)] text-[var(--text)] rounded hover:bg-[var(--bg-darker)] transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-dark)] transition-colors"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
