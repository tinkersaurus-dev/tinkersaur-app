/**
 * GenerateDiagramRenderer Styles
 *
 * Style definitions for the LLM diagram generator renderer component.
 * Uses factory functions to support dynamic values like zoom.
 */

import type { CSSProperties } from 'react';

export const styles = {
  container: (padding: number): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    padding: `${padding}px`,
    gap: `${padding}px`,
  }),

  header: (): CSSProperties => ({
    fontSize: '10px',
    fontWeight: 'semibold',
    color: 'var(--text)',
    textAlign: 'left',
  }),

  promptTextarea: (zoom: number, isLoading: boolean): CSSProperties => ({
    width: '100%',
    minHeight: '100px',
    padding: '6px',
    fontSize: '10px',
    fontFamily: 'inherit',
    color: 'var(--text)',
    backgroundColor: 'var(--bg-light)',
    border: `${1 / zoom}px solid var(--border)`,
    borderRadius: '2px',
    resize: 'none',
    outline: 'none',
    opacity: isLoading ? 0.6 : 1,
  }),

  errorDisplay: (zoom: number): CSSProperties => ({
    fontSize: '8px',
    color: 'var(--error)',
    backgroundColor: 'var(--error-bg)',
    padding: '6px',
    borderRadius: '2px',
    border: `${1 / zoom}px solid var(--error)`,
    textAlign: 'left',
  }),

  generateButton: (isDisabled: boolean): CSSProperties => ({
    width: '100%',
    height: '16px',
    padding: '8px',
    fontSize: '10px',
    fontWeight: 'semibold',
    color: isDisabled ? 'var(--text-muted)' : 'var(--bg)',
    backgroundColor: isDisabled ? 'var(--bg-muted)' : 'var(--primary)',
    border: 'none',
    borderRadius: '2px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'opacity 0.2s',
    opacity: isDisabled ? 0.6 : 1,
  }),

  spinner: (): CSSProperties => ({
    width: '12px',
    height: '12px',
    border: '2px solid var(--text-muted)',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  }),
};

export const spinKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
