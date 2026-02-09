# Diagram Features System Improvement

**Priority**: Major
**Gap Severity**: Major
**Estimated New Code**: ~280 lines

---

## Overview

The VS Code extension has an extensible architecture for diagram-specific behaviors with lifecycle hooks, while tinkersaur-app has diagram logic scattered across components with no extensible framework.

### Current State

**Tinkersaur-App:**
- No extensible architecture for diagram-specific behaviors
- Diagram logic scattered across components
- Hard to add new diagram types
- No lifecycle hooks

**VS Code Extension:**
- Clean `DiagramFeatures` interface
- Pluggable per-diagram behaviors
- Lifecycle hooks for shape/connector changes
- Custom control rendering

---

## Implementation Guide

### 4.1 DiagramFeatures Interface

**Update: `app/core/entities/design-studio/types/DiagramConfig.ts`**

```typescript
import type { Shape } from './Shape';
import type { Connector } from './Connector';
import type { Group } from './Group';

/**
 * Diagram-specific features and behaviors
 *
 * Allows each diagram type to define custom logic that runs
 * at specific lifecycle points.
 */
export interface DiagramFeatures {
  /**
   * Called whenever connectors change
   *
   * Use case: Sequence diagrams recalculate activation boxes
   *
   * @param shapes - Current shapes
   * @param connectors - Current connectors
   * @param updateShape - Function to update a shape
   */
  onConnectorsChanged?: (
    shapes: Shape[],
    connectors: Connector[],
    updateShape: (id: string, updates: Partial<Shape>) => void
  ) => void;

  /**
   * Called whenever shapes change
   *
   * Use case: Update derived state based on shape modifications
   */
  onShapesChanged?: (
    shapes: Shape[],
    updateShape: (id: string, updates: Partial<Shape>) => void
  ) => void;

  /**
   * Called whenever groups change
   */
  onGroupsChanged?: (
    groups: Group[],
    updateGroup: (id: string, updates: Partial<Group>) => void
  ) => void;

  /**
   * Get diagram-specific control handlers
   *
   * Use case: Sequence diagrams provide extend/shrink lifeline handlers
   *
   * @param context - Current diagram state and update functions
   * @returns Object with handler functions
   */
  getControlHandlers?: (context: {
    shapes: Shape[];
    connectors: Connector[];
    groups: Group[];
    updateShape: (id: string, updates: Partial<Shape>) => void;
    updateConnector: (id: string, updates: Partial<Connector>) => void;
    updateGroup: (id: string, updates: Partial<Group>) => void;
  }) => Record<string, Function>;

  /**
   * Render diagram-specific UI controls
   *
   * Use case: Sequence diagrams render lifeline extend/shrink buttons
   *
   * @param props - Context and handlers
   * @returns React element or null
   */
  renderDiagramControls?: (props: DiagramControlsProps) => React.ReactNode;
}

/**
 * Props passed to renderDiagramControls
 */
export interface DiagramControlsProps {
  shapes: Shape[];
  connectors: Connector[];
  groups: Group[];
  handlers?: Record<string, Function>;
}

/**
 * Diagram configuration
 */
export interface DiagramConfig {
  type: string;
  shapes: {
    definitions: ShapeDefinition[];
    categories: ShapeCategory[];
    renderer: (shape: Shape, props: ShapeRenderProps) => JSX.Element;
  };
  connectors: {
    definitions: ConnectorDefinition[];
    defaultType: string;
    renderer: (connector: Connector, props: ConnectorRenderProps) => JSX.Element;
  };
  mermaid: {
    exporter: DiagramExporter;
    importer: DiagramImporter;
    detector: (content: string) => boolean;
  };
  ui: {
    gridDefaults: {
      type: 'dot' | 'line';
      size: number;
    };
    zoomDefaults: {
      min: number;
      max: number;
      default: number;
    };
  };
  features: {
    supportsGroups: boolean;
    diagramFeatures?: DiagramFeatures; // NEW
  };
}
```

---

### 4.2 Diagram Features Execution Hook

**Create: `app/design-studio/hooks/useDiagramFeatures.ts`**

```typescript
import { useEffect, useRef } from 'react';
import type { DiagramFeatures } from '~/core/entities/design-studio/types/DiagramConfig';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type { Group } from '~/core/entities/design-studio/types/Group';

interface UseDiagramFeaturesProps {
  diagramFeatures?: DiagramFeatures;
  shapes: Shape[];
  connectors: Connector[];
  groups: Group[];
  updateShape: (id: string, updates: Partial<Shape>) => void;
  updateConnector: (id: string, updates: Partial<Connector>) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
}

/**
 * Hook to execute diagram-specific features at appropriate lifecycle points
 *
 * Tracks changes to shapes, connectors, and groups and calls the appropriate
 * feature hooks when they change.
 */
export function useDiagramFeatures({
  diagramFeatures,
  shapes,
  connectors,
  groups,
  updateShape,
  updateConnector,
  updateGroup,
}: UseDiagramFeaturesProps) {
  // Track previous values to detect changes
  const prevConnectorsRef = useRef<Connector[]>(connectors);
  const prevShapesRef = useRef<Shape[]>(shapes);
  const prevGroupsRef = useRef<Group[]>(groups);

  // Execute onConnectorsChanged when connectors change
  useEffect(() => {
    if (!diagramFeatures?.onConnectorsChanged) return;

    // Check if connectors actually changed (deep comparison of persistent state)
    const connectorsChanged = JSON.stringify(connectors) !== JSON.stringify(prevConnectorsRef.current);

    if (connectorsChanged) {
      diagramFeatures.onConnectorsChanged(shapes, connectors, updateShape);
      prevConnectorsRef.current = connectors;
    }
  }, [connectors, shapes, updateShape, diagramFeatures]);

  // Execute onShapesChanged when shapes change
  useEffect(() => {
    if (!diagramFeatures?.onShapesChanged) return;

    const shapesChanged = JSON.stringify(shapes) !== JSON.stringify(prevShapesRef.current);

    if (shapesChanged) {
      diagramFeatures.onShapesChanged(shapes, updateShape);
      prevShapesRef.current = shapes;
    }
  }, [shapes, updateShape, diagramFeatures]);

  // Execute onGroupsChanged when groups change
  useEffect(() => {
    if (!diagramFeatures?.onGroupsChanged) return;

    const groupsChanged = JSON.stringify(groups) !== JSON.stringify(prevGroupsRef.current);

    if (groupsChanged) {
      diagramFeatures.onGroupsChanged(groups, updateGroup);
      prevGroupsRef.current = groups;
    }
  }, [groups, updateGroup, diagramFeatures]);
}
```

---

### 4.3 Integration into Canvas Controller

**Update: `app/design-studio/components/canvas/core/CanvasController.tsx`**

```typescript
import { useDiagramFeatures } from '../../../hooks/useDiagramFeatures';

export function CanvasController({ diagramId }: CanvasControllerProps) {
  // ... existing code

  const {
    shapes,
    connectors,
    groups,
    updateShape,
    updateConnector,
    updateGroup,
  } = useCanvasState({ diagramId });

  const { diagramConfig } = useDiagramConfig(diagramType);

  // Execute diagram features
  useDiagramFeatures({
    diagramFeatures: diagramConfig.features.diagramFeatures,
    shapes,
    connectors,
    groups,
    updateShape,
    updateConnector,
    updateGroup,
  });

  // Get control handlers from diagram features
  const diagramHandlers = diagramConfig.features.diagramFeatures?.getControlHandlers?.({
    shapes,
    connectors,
    groups,
    updateShape,
    updateConnector,
    updateGroup,
  });

  // ... rest of component

  return (
    <DiagramContext.Provider value={{ /* ... */ }}>
      <ViewportContext.Provider value={{ /* ... */ }}>
        <SelectionContext.Provider value={{ /* ... */ }}>
          <EventsContext.Provider value={{ /* ... */ }}>

            {/* Render diagram-specific controls */}
            {diagramConfig.features.diagramFeatures?.renderDiagramControls?.({
              shapes,
              connectors,
              groups,
              handlers: diagramHandlers,
            })}

            {children}
          </EventsContext.Provider>
        </SelectionContext.Provider>
      </ViewportContext.Provider>
    </DiagramContext.Provider>
  );
}
```

---

### 4.4 Example: BPMN Diagram Features

**Create: `app/design-studio/diagrams/bpmn/features.ts`**

```typescript
import type { DiagramFeatures, DiagramControlsProps } from '~/core/entities/design-studio/types/DiagramConfig';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import React from 'react';

/**
 * BPMN Diagram Features
 *
 * BPMN diagrams have specific behaviors:
 * - Swimlane management
 * - Process validation (optional)
 */
export const bpmnDiagramFeatures: DiagramFeatures = {
  /**
   * Handle connector changes in BPMN
   * Could validate sequence flows, check gateway connections, etc.
   */
  onConnectorsChanged: (
    shapes: Shape[],
    connectors: Connector[],
    updateShape: (id: string, updates: Partial<Shape>) => void
  ) => {
    // BPMN-specific validation could go here
    // For example, checking that gateways have proper connections
  },

  /**
   * Get BPMN-specific control handlers
   */
  getControlHandlers: (context) => {
    return {
      onValidateProcess: () => {
        // Validate BPMN process rules
        console.log('Validating BPMN process...');
      },
    };
  },

  /**
   * Render BPMN-specific controls
   */
  renderDiagramControls: (props: DiagramControlsProps) => {
    // Could render process validation button, swimlane controls, etc.
    return null; // No additional controls for now
  },
};
```

---

### 4.5 Example: Sequence Diagram Features

**Already covered in `02-sequence-diagrams.md`**

```typescript
export const sequenceDiagramFeatures: DiagramFeatures = {
  onConnectorsChanged: (shapes, connectors, updateShape) => {
    // Recalculate activation boxes
    const activationsMap = calculateAllLifelineActivations(shapes, connectors);
    // ... update shapes with new activations
  },

  getControlHandlers: (context) => ({
    onExtendLifelines: () => { /* ... */ },
    onShrinkLifelines: () => { /* ... */ },
    canShrink: () => canShrinkLifelines(context.shapes, context.connectors),
  }),

  renderDiagramControls: (props) => {
    const { canShrink } = props.handlers?.canShrink?.() || { canShrink: true };
    return React.createElement(LifelineControls, {
      onExtend: props.handlers?.onExtendLifelines,
      onShrink: props.handlers?.onShrinkLifelines,
      canShrink,
    });
  },
};
```

---

## Architecture Pattern

### Diagram Features Pattern

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
    supportsGroups: true,
    diagramFeatures: bpmnFeatures
  }
};
```

---

## Files Summary

### Files to Create
1. `app/design-studio/hooks/useDiagramFeatures.ts` (~80 lines)

### Files to Update
1. `app/core/entities/design-studio/types/DiagramConfig.ts` - Add DiagramFeatures interface (~100 lines)
2. `app/design-studio/components/canvas/core/CanvasController.tsx` - Add diagram features execution (~50 lines)

---

## Benefits of This Architecture

1. **Separation of Concerns**: Each diagram type owns its specific behaviors
2. **Easy Extension**: Adding a new diagram type means implementing one interface
3. **Testability**: Features can be unit tested in isolation
4. **Maintainability**: Changes to one diagram don't affect others
5. **Type Safety**: Full TypeScript support for all feature hooks
