# Bidirectional Content Synchronization Improvement

**Priority**: Major
**Gap Severity**: Major
**Estimated New Code**: ~200 lines

---

## Overview

The VS Code extension has automatic bidirectional synchronization between the canvas and Mermaid content with circular update prevention, while tinkersaur-app requires manual import/export operations.

### Current State

**Tinkersaur-App:**
- Manual import via commands
- Manual export on save
- No automatic synchronization
- No prevention of circular updates

**VS Code Extension:**
- Auto-import when content changes externally
- Auto-export (debounced) when diagram changes
- Circular update prevention
- Transient state filtering

---

## Implementation Guide

### 5.1 Content Sync Hook

**Create: `app/design-studio/hooks/useContentSync.ts`**

```typescript
import { useEffect, useRef, useState } from 'react';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type { Group } from '~/core/entities/design-studio/types/Group';
import type { DiagramConfig } from '~/core/entities/design-studio/types/DiagramConfig';

interface UseContentSyncProps {
  content: string;
  onContentChange: (content: string) => void;
  config: DiagramConfig;
  shapes: Shape[];
  connectors: Connector[];
  groups: Group[];
  setShapes: (shapes: Shape[]) => void;
  setConnectors: (connectors: Connector[]) => void;
  setGroups: (groups: Group[]) => void;
}

interface UseContentSyncReturn {
  metadata: {
    title: string;
    diagramType: string;
  };
  setMetadata: React.Dispatch<React.SetStateAction<{
    title: string;
    diagramType: string;
  }>>;
}

/**
 * Hook for managing bidirectional content synchronization
 *
 * Key Features:
 * - Imports content from Mermaid when content prop changes
 * - Exports to Mermaid (debounced 150ms) when shapes/connectors/groups change
 * - Prevents circular updates using loading ref
 * - Filters transient state (isSelected, isHovered) before comparison
 * - Manages metadata (title, diagram type)
 */
export function useContentSync({
  content,
  onContentChange,
  config,
  shapes,
  connectors,
  groups,
  setShapes,
  setConnectors,
  setGroups,
}: UseContentSyncProps): UseContentSyncReturn {
  const [metadata, setMetadata] = useState({ title: 'Untitled', diagramType: 'bpmn' });

  // Track if we're loading to prevent circular updates
  const isLoadingRef = useRef(false);
  const lastContentRef = useRef(content);
  const lastPersistentStateRef = useRef<string>('');

  // Store importer/exporter refs
  const importerRef = useRef(config.mermaid.importer);
  const exporterRef = useRef(config.mermaid.exporter);

  // Update importer/exporter when config changes
  useEffect(() => {
    importerRef.current = config.mermaid.importer;
    exporterRef.current = config.mermaid.exporter;
  }, [config]);

  /**
   * Parse content when it changes from external source
   *
   * This effect runs when:
   * - File is first loaded
   * - User switches between files
   * - External changes to the file (e.g., git pull)
   */
  useEffect(() => {
    if (content !== lastContentRef.current) {
      // Set loading flag to prevent export during import
      isLoadingRef.current = true;

      // Import content
      const result = importerRef.current.import(content);

      setMetadata({
        title: result.metadata?.title || 'Untitled',
        diagramType: result.metadata?.diagramType || 'bpmn'
      });
      setShapes(result.shapes);
      setConnectors(result.connectors);
      setGroups(result.groups || []);

      lastContentRef.current = content;

      // Initialize persistent state ref to match imported content
      // This prevents the first interaction from triggering an export
      const persistentShapes = result.shapes.map(
        ({ isSelected: _isSelected, isHovered: _isHovered, ...persistent }) => persistent
      );
      const persistentConnectors = result.connectors.map(
        ({ isSelected: _isSelected, isHovered: _isHovered, ...persistent }) => persistent
      );
      const persistentGroups = (result.groups || []).map(
        ({ isSelected: _isSelected, isHovered: _isHovered, ...persistent }) => persistent
      );

      lastPersistentStateRef.current = JSON.stringify({
        shapes: persistentShapes,
        connectors: persistentConnectors,
        groups: persistentGroups,
        metadata: {
          title: result.metadata?.title || 'Untitled',
          diagramType: result.metadata?.diagramType || 'bpmn'
        }
      });

      // Allow exports again after a short delay
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }
  }, [content, setShapes, setConnectors, setGroups]);

  /**
   * Export shapes/connectors/groups to content (debounced)
   *
   * This effect runs when:
   * - User adds/removes/modifies shapes
   * - User adds/removes/modifies connectors
   * - User adds/removes/modifies groups
   * - Metadata changes
   *
   * Key Features:
   * - 150ms debounce to avoid excessive exports
   * - Filters transient state (isSelected, isHovered) before comparison
   * - Only exports if persistent state actually changed
   */
  useEffect(() => {
    // Don't export while loading
    if (isLoadingRef.current) return;

    const timeout = setTimeout(() => {
      // Create versions without transient state for comparison
      const persistentShapes = shapes.map(
        ({ isSelected: _isSelected, isHovered: _isHovered, ...persistent }) => persistent
      );
      const persistentConnectors = connectors.map(
        ({ isSelected: _isSelected, isHovered: _isHovered, ...persistent }) => persistent
      );
      const persistentGroups = groups.map(
        ({ isSelected: _isSelected, isHovered: _isHovered, ...persistent }) => persistent
      );

      // Create stable comparison key from persistent state only
      const persistentStateKey = JSON.stringify({
        shapes: persistentShapes,
        connectors: persistentConnectors,
        groups: persistentGroups,
        metadata
      });

      // Only export if persistent state changed
      if (persistentStateKey === lastPersistentStateRef.current) {
        return;
      }

      lastPersistentStateRef.current = persistentStateKey;

      // Export to Mermaid
      const result = exporterRef.current.export(shapes, connectors, metadata, groups);

      if (result.content !== lastContentRef.current) {
        lastContentRef.current = result.content;
        onContentChange(result.content);
      }
    }, 150); // 150ms debounce

    return () => clearTimeout(timeout);
  }, [shapes, connectors, groups, metadata, onContentChange]);

  return {
    metadata,
    setMetadata,
  };
}
```

**Key Implementation Details:**

1. **Loading Flag**: `isLoadingRef` prevents circular updates during import
2. **Debouncing**: 150ms timeout prevents excessive exports during rapid changes
3. **Transient State Filtering**: Removes `isSelected`/`isHovered` before comparison
4. **Persistent State Tracking**: Only exports when actual diagram data changes
5. **Metadata Management**: Syncs title and diagram type
6. **Initial State Prevention**: Initializes `lastPersistentStateRef` to prevent export on first render

---

### 5.2 Integration Example

**Usage in Canvas Component:**

```typescript
import { useContentSync } from '../../hooks/useContentSync';

export function Canvas({ diagramId, content, onContentChange }: CanvasProps) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  const { config } = useDiagramConfig(diagramType);

  // Set up bidirectional sync
  const { metadata, setMetadata } = useContentSync({
    content,
    onContentChange,
    config,
    shapes,
    connectors,
    groups,
    setShapes,
    setConnectors,
    setGroups,
  });

  // ... rest of component
}
```

---

## Circular Update Prevention Pattern

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

---

## Files Summary

### Files to Create
1. `app/design-studio/hooks/useContentSync.ts` (~160 lines)

### Files to Update
1. Canvas component - integrate the sync hook (~40 lines)

---

## Testing Strategy

### Integration Tests

1. **Content Sync**
   - Modify diagram and verify export triggers
   - Change content externally and verify import
   - Verify no circular updates occur
   - Verify transient state (selection/hover) doesn't trigger export
   - Verify debounce timing (no export within 150ms of changes)

### Performance Targets

- **Export Debounce**: 150ms maximum frequency
- **Import Delay**: <100ms before allowing exports

---

## Benefits

1. **Seamless UX**: Users don't need to manually sync content
2. **Data Safety**: Content is automatically saved as users work
3. **External Edit Support**: Changes made outside the app are reflected
4. **Performance**: Debouncing prevents excessive file writes
5. **Accuracy**: Transient state filtering ensures only meaningful changes trigger sync
