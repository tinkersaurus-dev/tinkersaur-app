import React, { useState, useEffect } from 'react';
import { getDebugState } from './routingDebugState';

/**
 * Debug overlay to visualize the routing graph
 * Shows nodes and edges for debugging obstacle avoidance
 */

export function RoutingDebugOverlay() {
  const [, forceUpdate] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handler = () => forceUpdate(prev => prev + 1);
    window.addEventListener('routing-debug-update', handler);
    return () => window.removeEventListener('routing-debug-update', handler);
  }, []);

  // Toggle with 'D' key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setEnabled(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Track mouse position
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: MouseEvent) => {
      setMousePos({ x: Math.round(e.clientX), y: Math.round(e.clientY) });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [enabled]);

  const { debugGraph, debugStart, debugEnd, debugPath, debugVisitedNodes } = getDebugState();

  if (!enabled || !debugGraph) {
    return enabled ? (
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '8px', borderRadius: '4px', fontSize: '12px', zIndex: 10000 }}>
        Press 'D' to toggle debug view. No graph data available.
      </div>
    ) : null;
  }

  const nodes = Array.from(debugGraph.nodes.values());
  const allEdges: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }> = [];

  for (const [nodeId, edges] of debugGraph.edges.entries()) {
    const fromNode = debugGraph.nodes.get(nodeId);
    if (!fromNode) continue;

    for (const edge of edges) {
      const toNode = debugGraph.nodes.get(edge.to);
      if (!toNode) continue;

      allEdges.push({
        from: { x: fromNode.x, y: fromNode.y },
        to: { x: toNode.x, y: toNode.y }
      });
    }
  }

  return (
    <>
      {/* Info panel */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 10000
      }}>
        <div>Press 'D' to toggle debug view</div>
        <div>Nodes: {nodes.length}</div>
        <div>Edges: {allEdges.length}</div>
        {debugPath && <div>Path points: {debugPath.length}</div>}
        {debugVisitedNodes.length > 0 && <div>A* visited: {debugVisitedNodes.length}</div>}
        {mousePos && <div style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '4px' }}>Mouse: ({mousePos.x}, {mousePos.y})</div>}
      </div>

      {/* Edges */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
        {allEdges.map((edge, i) => (
          <line
            key={i}
            x1={edge.from.x}
            y1={edge.from.y}
            x2={edge.to.x}
            y2={edge.to.y}
            stroke="rgba(0, 255, 0, 0.3)"
            strokeWidth="1"
          />
        ))}

        {/* Debug path */}
        {debugPath && debugPath.length > 1 && (
          <polyline
            points={debugPath.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(255, 0, 255, 0.8)"
            strokeWidth="3"
          />
        )}

        {/* Nodes */}
        {nodes.map((node) => (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r="3"
            fill="rgba(0, 255, 0, 0.6)"
          />
        ))}

        {/* Start node */}
        {debugStart && (
          <circle
            cx={debugStart.x}
            cy={debugStart.y}
            r="5"
            fill="rgba(0, 0, 255, 0.8)"
          />
        )}

        {/* End node */}
        {debugEnd && (
          <circle
            cx={debugEnd.x}
            cy={debugEnd.y}
            r="5"
            fill="rgba(255, 0, 0, 0.8)"
          />
        )}

        {/* Visited nodes during A* search - color gradient from yellow (early) to orange (late) */}
        {debugVisitedNodes.map((node, i) => {
          const maxOrder = Math.max(1, debugVisitedNodes.length - 1);
          const ratio = node.order / maxOrder;
          // Yellow (255, 255, 0) -> Orange (255, 165, 0) -> Red-Orange (255, 100, 0)
          const green = Math.round(255 - ratio * 155);
          const color = `rgba(255, ${green}, 0, 0.7)`;
          return (
            <circle
              key={`visited-${i}`}
              cx={node.x}
              cy={node.y}
              r="4"
              fill={color}
              stroke="rgba(0, 0, 0, 0.3)"
              strokeWidth="0.5"
            />
          );
        })}
      </svg>
    </>
  );
}
