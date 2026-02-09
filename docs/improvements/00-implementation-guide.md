# Canvas Improvements Implementation Guide

**Date**: February 3, 2026
**Status**: VS Code Extension has significantly exceeded tinkersaur-app capabilities

---

## Executive Summary

The VS Code extension canvas implementation has evolved beyond its tinkersaur-app origins and now offers superior functionality in key areas. Despite having **43% fewer lines of code** (20,700 vs 36,753), the VS Code extension delivers:

- Complete group/swimlane system with advanced snapping
- Full sequence diagram support with automatic activation calculation
- Intelligent parent-child containment system
- Bidirectional Mermaid synchronization
- Extensible diagram features architecture
- Advanced lifeline controls and auto-layout

---

## Feature Comparison Matrix

| Feature Category | VS Code Extension | Tinkersaur-App | Gap Severity |
|-----------------|-------------------|----------------|--------------|
| **Group/Swimlane System** | Full implementation | Basic groups only | Critical |
| **Sequence Diagrams** | Complete | Incomplete stub | Critical |
| **Containment Logic** | Auto-detection | Manual only | Critical |
| **Diagram Features System** | Extensible architecture | Not present | Major |
| **Content Sync** | Bidirectional auto-sync | Manual import/export | Major |
| **Connector Routing** | Orthogonal + Visibility | Orthogonal + Visibility | Parity |
| **BPMN Support** | Full + Swimlanes | Full, no swimlanes | Major |
| **Architecture Diagrams** | Full | Full | Parity |
| **Class Diagrams** | Full | Full | Parity |
| **ER Diagrams** | Full | Full | Parity |

---

## Improvement Documents

The gap analysis has been split into focused improvement documents:

1. **[01-swimlane-system.md](./01-swimlane-system.md)** - Group/Swimlane System
2. **[02-sequence-diagrams.md](./02-sequence-diagrams.md)** - Sequence Diagram Support
3. **[03-parent-child-containment.md](./03-parent-child-containment.md)** - Intelligent Containment
4. **[04-diagram-features-system.md](./04-diagram-features-system.md)** - Diagram Features Architecture
5. **[05-content-sync.md](./05-content-sync.md)** - Bidirectional Content Synchronization

---

## Summary of Development Work

### Files to Create

#### Group/Swimlane System
1. `app/design-studio/utils/swimlaneSnapping.ts` (~280 lines)
2. `app/design-studio/hooks/useGroupDragging.ts` (~195 lines)
3. `app/design-studio/hooks/useGroupResizing.ts` (~150 lines)
4. `app/design-studio/diagrams/bpmn/components/BpmnSwimlane.tsx` (~200 lines)
5. `app/design-studio/hooks/useGroupInteraction.ts` (~100 lines)

#### Sequence Diagrams
6. `app/design-studio/diagrams/sequence/activationCalculator.ts` (~150 lines)
7. `app/design-studio/diagrams/sequence/heightCalculator.ts` (~80 lines)
8. `app/design-studio/diagrams/sequence/components/SequenceLifeline.tsx` (~180 lines)
9. `app/design-studio/diagrams/sequence/components/MessageConnector.tsx` (~150 lines)
10. `app/design-studio/components/canvas/ui/LifelineControls.tsx` (~70 lines)
11. `app/design-studio/diagrams/sequence/features.ts` (~100 lines)
12. `app/design-studio/diagrams/sequence/config.tsx` (~170 lines)

#### Containment System
13. `app/design-studio/utils/containment-utils.ts` (~150 lines)
14. `app/design-studio/utils/throttle.ts` (~40 lines)

#### Diagram Features
15. `app/design-studio/hooks/useDiagramFeatures.ts` (~80 lines)

#### Content Sync
16. `app/design-studio/hooks/useContentSync.ts` (~160 lines)

### Files to Update

1. `app/design-studio/hooks/useCanvasEventOrchestrator.ts` - Add group modes and handlers
2. `app/design-studio/hooks/useInteractionState.ts` - Add dragging-group and resizing-group modes
3. `app/design-studio/hooks/useShapeDragging.ts` - Add containment detection
4. `app/design-studio/components/canvas/core/CanvasController.tsx` - Add diagram features execution
5. `app/design-studio/components/canvas/core/CanvasView.tsx` - Render group layer and controls
6. `app/core/entities/design-studio/types/DiagramConfig.ts` - Add DiagramFeatures interface

### Total Estimated Code

- **New Code**: ~1,900 lines
- **Modified Code**: ~500 lines
- **Total Impact**: ~2,400 lines

---

## Architecture Patterns to Follow

### 1. Hook Composition Pattern

```typescript
// Each interaction type gets its own focused hook
const dragging = useShapeDragging({ /* ... */ });
const groupDragging = useGroupDragging({ /* ... */ });
const resizing = useGroupResizing({ /* ... */ });

// Orchestrator composes them
const orchestrator = useCanvasEventOrchestrator({
  dragging,
  groupDragging,
  resizing,
  // ...
});
```

### 2. State Machine Pattern

```typescript
type Mode = 'idle' | 'dragging-shapes' | 'dragging-group' | 'resizing-group';

// Only one mode active at a time
const { mode, setMode } = useInteractionState();

// Hooks check if they're active
const isActive = mode === 'dragging-group';
```

### 3. Performance Optimization Pattern

```typescript
// Throttle expensive operations (visual feedback)
const throttled = useMemo(() => throttle(expensiveFunc, 33), []); // 30fps

// RAF batch frequent operations (position updates)
rafId = requestAnimationFrame(() => {
  applyUpdates();
}); // 60fps

// Cleanup
useEffect(() => () => {
  cancelAnimationFrame(rafId);
  throttled.cancel();
}, []);
```

### 4. Circular Update Prevention Pattern

```typescript
const isLoadingRef = useRef(false);
const lastStateRef = useRef('');

// When importing
isLoadingRef.current = true;
importData();
setTimeout(() => { isLoadingRef.current = false; }, 100);

// When exporting
if (isLoadingRef.current) return;
if (newState === lastStateRef.current) return;
exportData();
```

### 5. Diagram Features Pattern

```typescript
// Each diagram defines its features
export const bpmnFeatures: DiagramFeatures = {
  onConnectorsChanged: (shapes, connectors, updateShape) => {
    // BPMN-specific logic
  },
  getControlHandlers: (context) => ({
    onSomeBpmnAction: () => { /* ... */ }
  }),
  renderDiagramControls: (props) => <BpmnControls {...props} />
};

// Config includes features
export const bpmnConfig: DiagramConfig = {
  // ...
  features: {
    diagramFeatures: bpmnFeatures
  }
};
```

---

## Testing Strategy

### Unit Tests

1. **Swimlane Snapping**
   - Test adjacency detection with various positions
   - Test snap threshold behavior
   - Test dimension matching
   - Test border hiding logic

2. **Containment Utils**
   - Test descendant calculation
   - Test container detection with nested groups
   - Test circular relationship prevention

3. **Activation Calculator**
   - Test with various message patterns
   - Test nesting level calculation
   - Test return message matching

### Integration Tests

1. **Group Dragging**
   - Drag group and verify children move together
   - Test swimlane snapping behavior
   - Test grid snapping fallback

2. **Sequence Diagrams**
   - Add messages and verify activation boxes update
   - Extend/shrink lifelines and verify validation
   - Test height constraints

3. **Content Sync**
   - Modify diagram and verify export
   - Change content and verify import
   - Verify no circular updates
   - Verify transient state doesn't trigger export

### Performance Tests

1. Verify containment detection runs at 30fps during drag
2. Verify position updates run at 60fps
3. Verify export debouncing works (no more than 1 export per 150ms)
4. Test with large diagrams (100+ shapes)

---

## Migration Notes

### Backward Compatibility

All new features should be backward compatible:

1. **Groups**: Existing `parentGroupId` still works, just enhanced
2. **Sequence Diagrams**: Completely new, no migration needed
3. **Content Sync**: Opt-in via hook usage
4. **Diagram Features**: Opt-in per diagram type

### Feature Flags (Recommended)

```typescript
const FEATURE_FLAGS = {
  SWIMLANE_SNAPPING: true,
  SEQUENCE_DIAGRAMS: true,
  AUTO_CONTENT_SYNC: true,
  CONTAINMENT_DETECTION: true,
};

// Use in code
if (FEATURE_FLAGS.SWIMLANE_SNAPPING) {
  // New behavior
} else {
  // Old behavior
}
```

### Gradual Rollout

1. Implement features behind flags
2. Test thoroughly in development
3. Enable for internal users
4. Gather feedback
5. Enable for all users
6. Remove flags and old code

---

## Performance Targets

- **Containment Detection**: 30fps (33ms) during drag
- **Position Updates**: 60fps (16ms) during drag
- **Export Debounce**: 150ms maximum frequency
- **Activation Calculation**: <10ms for diagrams with <50 shapes
- **Swimlane Snapping**: <5ms per snap calculation

---

## Implementation Priority

### Phase 1: Critical Features
1. Parent-Child Containment (foundation for other features)
2. Group/Swimlane System (high user value)

### Phase 2: Major Features
3. Diagram Features System (enables extensibility)
4. Content Sync (improved UX)

### Phase 3: Complete Feature Set
5. Sequence Diagrams (new capability)

---

## Conclusion

This implementation guide provides detailed code examples, architecture patterns, and integration points for bringing tinkersaur-app to feature parity with the VS Code extension. The focus is on:

1. **Maintainability**: Clear separation of concerns, focused hooks
2. **Performance**: RAF batching, throttling, debouncing
3. **Extensibility**: Diagram features system for easy diagram type additions
4. **Robustness**: Circular update prevention, containment validation
5. **User Experience**: Real-time visual feedback, automatic synchronization

All implementations follow the established patterns in both codebases while adapting for the web application context (command pattern for undo/redo, etc.).
