# Design Studio State Architecture Plan

## Problem Statement
Currently, the `designStudioStore` incorrectly stores ALL diagram/interface/document content globally, creating risks of cross-contamination when multiple tabs are open. We need **per-instance isolation** where each open tab (diagram/interface/document) has its own independent state.

## Architectural Solution: Multi-Layer State Management

### Layer 1: Entity Metadata Store (Global - NEW)
**Location**: `app/design-studio/store/designStudioEntityStore.ts`

**Purpose**: Store metadata ONLY about what exists (like Product Management store)

**Contains**:
- `designWorks[]` - List of design work containers
- `folders[]` - Folder hierarchy
- `diagrams[]` - Diagram metadata (id, name, type, folderId) - NO shapes/connectors
- `interfaces[]` - Interface metadata (id, name, fidelity, folderId) - NO UI components
- `documents[]` - Document metadata (id, name, folderId) - NO markdown content

**Actions**: CRUD for folders and metadata only

---

### Layer 2: Design Studio UI Store (Global - REFACTORED)
**Location**: `app/design-studio/store/designStudioStore.ts`

**Purpose**: Manage Design Studio UI state ONLY

**Contains**:
- `activeTabs[]` - Which tabs are open
- `activeTabId` - Currently selected tab
- `activeTool` - Selected tool (select, pan, shape, connector)
- `clipboard` - GLOBAL clipboard (can copy from one diagram, paste to another)
- `sidebarCollapsed` - UI state
- Tab management actions (open, close, setActive)

**Does NOT contain**: Any diagram/interface/document content or state

---

### Layer 3: Per-Instance Content Stores (Dynamic - NEW)
**Location**: `app/design-studio/store/content/`

Each opened content instance gets its own isolated store created dynamically.

#### 3A: Diagram Instance Store
**File**: `app/design-studio/store/content/createDiagramStore.ts`

**Factory Function**: `createDiagramStore(diagramId: string)`

**Each instance contains**:
- `diagramId` - Which diagram this is
- `shapes[]` - Shapes on THIS diagram only
- `connectors[]` - Connectors on THIS diagram only
- `canvas` - Canvas state (zoom, pan, grid)
- `selectedShapeIds[]` - Selected shapes in THIS diagram
- `selectedConnectorIds[]` - Selected connectors
- `history` - Undo/redo stack for THIS diagram
- Actions: addShape, updateShape, deleteShape, setSelection, etc.

**Usage**:
```typescript
// Component opens diagram
const diagramStore = useDiagramStore(diagramId);
const shapes = diagramStore((state) => state.shapes);
```

#### 3B: Interface Instance Store
**File**: `app/design-studio/store/content/createInterfaceStore.ts`

**Factory Function**: `createInterfaceStore(interfaceId: string)`

**Each instance contains**:
- `interfaceId` - Which interface this is
- `components[]` - UI components on THIS interface only
- `canvas` - Canvas state (zoom, pan, grid)
- `selectedComponentIds[]` - Selected components
- `history` - Undo/redo stack
- `html/css/js` - Code content if code-based
- Actions: addComponent, updateComponent, deleteComponent, setSelection, etc.

**Architecturally similar to diagrams** - same patterns, different content

#### 3C: Document Instance Store
**File**: `app/design-studio/store/content/createDocumentStore.ts`

**Factory Function**: `createDocumentStore(documentId: string)`

**Each instance contains**:
- `documentId` - Which document this is
- `content` - Markdown content for THIS document
- `cursorPosition` - Editor cursor position
- `selection` - Selected text
- `history` - Undo/redo stack
- Actions: updateContent, undo, redo, etc.

**Architecturally similar to diagrams/interfaces** - same patterns, different content type

---

### Store Registry Pattern (NEW)
**File**: `app/design-studio/store/content/storeRegistry.ts`

**Purpose**: Manage lifecycle of dynamic stores

```typescript
class ContentStoreRegistry {
  private diagramStores = new Map<string, DiagramStore>();
  private interfaceStores = new Map<string, InterfaceStore>();
  private documentStores = new Map<string, DocumentStore>();

  // Get or create store for a diagram
  getDiagramStore(diagramId: string): DiagramStore;

  // Get or create store for an interface
  getInterfaceStore(interfaceId: string): InterfaceStore;

  // Get or create store for a document
  getDocumentStore(documentId: string): DocumentStore;

  // Clean up when tab closes
  releaseDiagramStore(diagramId: string): void;
  releaseInterfaceStore(interfaceId: string): void;
  releaseDocumentStore(documentId: string): void;
}
```

**Hooks**:
```typescript
// Custom hooks that use the registry
export const useDiagramStore = (diagramId: string) => {
  return registry.getDiagramStore(diagramId);
};

export const useInterfaceStore = (interfaceId: string) => {
  return registry.getInterfaceStore(interfaceId);
};

export const useDocumentStore = (documentId: string) => {
  return registry.getDocumentStore(documentId);
};
```

---

## Data Flow Example

**User opens "Password Reset Flow" diagram in a tab:**

1. **Tab Creation** → `designStudioStore.openTab()` creates tab metadata
2. **Component Mount** → `DiagramView` component mounts with `diagramId="diagram-1"`
3. **Store Creation** → `useDiagramStore("diagram-1")` gets/creates isolated store
4. **Load Content** → Fetch shapes/connectors from backend → store in THIS diagram's store
5. **User Edits** → All updates go to `diagram-1` store only
6. **Tab Close** → `registry.releaseDiagramStore("diagram-1")` cleans up

**User opens SECOND diagram "Email Service Integration":**

1. New tab created with `diagramId="diagram-2"`
2. NEW isolated store created for `diagram-2`
3. Completely separate shapes[], connectors[], canvas state
4. **No cross-contamination** with `diagram-1`

**User copies shape from diagram-1 and pastes to diagram-2:**

1. Copy action → Updates GLOBAL `clipboard` in `designStudioStore`
2. Switch to diagram-2 tab
3. Paste action → Reads from global clipboard, creates new shapes in diagram-2's isolated store

---

## File Structure

```
app/design-studio/store/
├── designStudioStore.ts          # UI state only (tabs, active tool, clipboard)
├── designStudioEntityStore.ts    # Entity metadata only (NEW)
├── content/                       # Per-instance stores (NEW)
│   ├── createDiagramStore.ts     # Diagram factory
│   ├── createInterfaceStore.ts   # Interface factory
│   ├── createDocumentStore.ts    # Document factory
│   ├── storeRegistry.ts          # Registry + hooks
│   └── types.ts                  # Shared types
└── index.ts                       # Public exports
```

---

## Implementation Steps

1. **Create Entity Store** - Move metadata arrays from designStudioStore to new entity store
2. **Refactor Design Studio Store** - Remove content arrays, keep only UI state (tabs, tool, clipboard)
3. **Create Diagram Store Factory** - Implement `createDiagramStore()` with shapes/connectors (no clipboard)
4. **Create Interface Store Factory** - Implement `createInterfaceStore()` with components (same pattern, no clipboard)
5. **Create Document Store Factory** - Implement `createDocumentStore()` with markdown content (same pattern)
6. **Create Store Registry** - Implement registry with lifecycle management
7. **Create Custom Hooks** - Expose `useDiagramStore`, `useInterfaceStore`, `useDocumentStore`
8. **Update Components** - Refactor DiagramView, InterfaceView, DocumentView to use instance stores
9. **Add Cleanup Logic** - Ensure stores are released when tabs close

---

## Key Benefits

✅ **Complete Isolation**: Each tab instance has its own state
✅ **Architectural Consistency**: All three content types use the same pattern
✅ **No Cross-Contamination**: Impossible for one diagram to access another's shapes
✅ **Global Clipboard**: Can copy/paste across different diagrams/interfaces
✅ **Memory Efficient**: Stores cleaned up when tabs close
✅ **Scalable**: Can have unlimited tabs open
✅ **Type-Safe**: Each store strongly typed for its content
✅ **Testable**: Each store factory can be tested independently
