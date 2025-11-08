# Command System - Undo/Redo Implementation

This directory contains the complete undo/redo command system for tinkersaur-app, based on the Command Pattern architecture from contextstudio.

## Architecture Overview

The command system uses the classic **Command Pattern** with scoped history management:

```
┌─────────────────────────────────────────────────────────────┐
│                     Command Manager                          │
│  - Manages multiple CommandHistory instances                │
│  - Scoped by diagram ID (isolated undo/redo per diagram)    │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
          ┌─────────▼────────┐  ┌──────▼──────────┐
          │ CommandHistory   │  │ CommandHistory  │
          │ (diagram-1)      │  │ (diagram-2)     │
          │ - undoStack      │  │ - undoStack     │
          │ - redoStack      │  │ - redoStack     │
          └──────────────────┘  └─────────────────┘
```

## Core Components

### 1. Command Interface (`command.types.ts`)
Defines the contract for all commands:
```typescript
interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
  description?: string;
}
```

### 2. CommandHistory (`CommandHistory.ts`)
Manages undo/redo stacks for a single scope:
- Maintains `undoStack` (executed commands)
- Maintains `redoStack` (undone commands)
- Enforces max history size (default: 50)
- Provides `execute()`, `undo()`, `redo()`, `canUndo()`, `canRedo()`

### 3. CommandManager (`CommandManager.ts`)
Manages multiple CommandHistory instances with scope isolation:
- Each diagram gets its own command history
- Scopes are identified by diagram ID
- Global singleton instance: `commandManager`

### 4. CompositeCommand (`CompositeCommand.ts`)
Groups multiple commands into a single undoable operation:
- Execute: runs all commands forward
- Undo: runs all commands backward (reverse order)

## Canvas Commands

### AddShapeCommand
- **Execute**: Adds a shape to the canvas
- **Undo**: Removes the shape by ID
- **Stores**: Shape data, generated shape ID

### DeleteShapeCommand
- **Execute**: Deletes a shape from the canvas
- **Undo**: Restores the complete shape with original ID
- **Stores**: Complete shape data

### MoveShapeCommand
- **Execute**: Updates shape position
- **Undo**: Restores previous position
- **Stores**: From/to positions only
- **Description**: "Move shape"

## Integration with Entity Store

The system uses a **dual-method pattern** to prevent infinite command loops:

### Public Methods (Create Commands)
```typescript
addShape: async (diagramId, shape) => {
  const command = new AddShapeCommand(...);
  await commandManager.execute(command, diagramId);
}
```

### Internal Methods (Called by Commands)
```typescript
_internalAddShape: async (diagramId, shape) => {
  const content = canvasApi.addShape(diagramId, shape);
  set({ canvasContents: { ...canvasContents, [diagramId]: content } });
  return content;
}
```

### Why This Pattern Works
- User actions → Public methods → Create commands → Execute
- Commands → Internal methods → Direct state changes
- Undo/Redo → Call command.undo()/execute() → Internal methods
- **No recursive command creation**

## Keyboard Shortcuts

### Platform-Aware Shortcuts
- **Mac**: Cmd+Z (undo), Cmd+Shift+Z (redo)
- **Windows/Linux**: Ctrl+Z (undo), Ctrl+Shift+Z or Ctrl+Y (redo)

### Implementation
```typescript
useKeyboardShortcuts({ scope: diagramId })
```

### Features
- Disabled when typing in input fields
- Scoped to active diagram
- Checks `canUndo()` / `canRedo()` before executing

## Usage Examples

### Basic Shape Operations
```typescript
// Add a shape (automatically wrapped in command)
await addShape(diagramId, {
  type: 'rectangle',
  x: 100,
  y: 100,
  width: 120,
  height: 80,
  properties: {},
});

// Update a shape (automatically wrapped in command)
await updateShape(diagramId, shapeId, {
  x: 150,
  y: 150,
});

// Delete a shape (automatically wrapped in command)
await deleteShape(diagramId, shapeId);

// Undo/Redo
await commandManager.undo(diagramId);
await commandManager.redo(diagramId);
```

### Using the Command Store
```typescript
import { useCommandStore } from '~/design-studio/store/commandStore';

function MyComponent() {
  const { undo, redo, canUndo, canRedo, getUndoDescription } = useCommandStore();

  return (
    <div>
      <button disabled={!canUndo()} onClick={() => undo()}>
        Undo {getUndoDescription()}
      </button>
      <button disabled={!canRedo()} onClick={() => redo()}>
        Redo {getRedoDescription()}
      </button>
    </div>
  );
}
```

### Composite Commands (Future)
```typescript
// Group multiple operations into one undoable action
const commands = [
  new MoveShapeCommand(...),
  new MoveShapeCommand(...),
  new MoveShapeCommand(...),
];

const compositeCommand = new CompositeCommand(
  commands,
  'Move 3 shapes'
);

await commandManager.execute(compositeCommand, diagramId);
```

## State Capture Strategy

### Add Operations
- Store the entity being added
- Undo removes by generated ID

### Delete Operations
- Store the complete entity + affected connectors
- Undo restores with original ID preserved

### Update Operations
- Store only properties that changed (before/after)
- More efficient than full snapshots

### Move Operations
- Store only position (x, y)
- Optimized for frequent drag operations

## Scope Management

### Diagram-Scoped History
```typescript
// Each diagram gets isolated history
commandManager.execute(command, 'diagram-1');
commandManager.execute(command, 'diagram-2');

// Undo only affects the specific diagram
commandManager.undo('diagram-1');
```

### Scope Cleanup
```typescript
// Clear history when closing a diagram tab
commandManager.clearScope(diagramId);
```

## Best Practices

### 1. Always Use Public Methods
❌ **Don't** call `canvasApi` directly:
```typescript
canvasApi.addShape(diagramId, shape); // NO!
```

✅ **Do** call store methods:
```typescript
await addShape(diagramId, shape); // YES!
```

### 2. Capture Minimal State
Only store what's needed to reverse the operation:
```typescript
// Good - only changed properties
const beforeState = { x: shape.x, y: shape.y };
const afterState = { x: newX, y: newY };

// Bad - unnecessary full snapshot
const beforeState = { ...shape };
```

### 3. Use Specific Commands
Create specialized commands for specific operations:
```typescript
// MoveShapeCommand is optimized for position updates
new MoveShapeCommand(diagramId, shapeId, from, to, updateFn);

// When implementing other operations (resize, property updates),
// create specific commands like ResizeShapeCommand, UpdateTextCommand, etc.
```

### 4. Validate Before Execution
Commands should validate and handle missing entities gracefully:
```typescript
async execute() {
  const shape = await this.getShapeFn(this.diagramId, this.shapeId);
  if (!shape) {
    console.warn('Shape not found');
    return;
  }
  // ... proceed with operation
}
```

## Future Enhancements

### Phase 4: Content & Structural Commands
- `CreateDiagramCommand`
- `UpdateDiagramCommand`
- `DeleteDiagramCommand`
- `CreateDesignWorkCommand` (with cascade handling)

### Phase 5: Advanced Features
- Command batching/grouping for multi-select operations
- History persistence to localStorage
- Visual history panel UI
- Undo/redo toolbar buttons with state indicators
- Toast notifications with command descriptions

## Testing

### Manual Testing Checklist
- [ ] Add shape → Undo → shape removed
- [ ] Add shape → Undo → Redo → shape restored
- [ ] Update shape → Undo → previous values restored
- [ ] Delete shape → Undo → shape restored with correct ID
- [ ] Move shape → Undo → previous position restored
- [ ] Multiple operations → Undo all → Redo all
- [ ] Cmd+Z / Ctrl+Z shortcuts work
- [ ] Cmd+Shift+Z / Ctrl+Y shortcuts work
- [ ] Shortcuts disabled in input fields
- [ ] Multiple diagrams have isolated histories
- [ ] Max history size enforced (50 commands)

## Files Reference

```
app/core/commands/
├── README.md                       # This file
├── index.ts                        # Barrel export
├── command.types.ts                # Core interfaces
├── CommandHistory.ts               # Undo/redo stack manager
├── CommandManager.ts               # Scoped history manager
├── CompositeCommand.ts             # Command grouping
└── canvas/
    ├── AddShapeCommand.ts          # Add shape operation
    ├── DeleteShapeCommand.ts       # Delete shape operation
    └── MoveShapeCommand.ts         # Move shape position

app/design-studio/
├── store/
│   └── commandStore.ts             # Zustand store for UI state
└── hooks/
    └── useKeyboardShortcuts.ts     # Keyboard shortcut handler
```

## Architecture Decisions

### Why Scoped Histories?
- **Isolation**: Each diagram gets independent undo/redo
- **Performance**: Smaller history stacks per scope
- **UX**: Undo only affects active diagram

### Why Async Commands?
- **Consistency**: All store operations are async
- **Future-proof**: Enables remote persistence
- **Error handling**: Better error propagation

### Why Dual-Method Pattern?
- **Loop prevention**: Avoids infinite command creation
- **Clear separation**: Public = commands, Internal = mutations
- **Testability**: Internal methods can be tested independently

### Why Function Injection?
- **Decoupling**: Commands don't depend on store implementation
- **Testing**: Easy to mock dependencies
- **Flexibility**: Commands can work with any store

## Contributing

When adding new commands:

1. Implement the `Command` interface
2. Store minimal state required for undo
3. Add validation in `execute()` and `undo()`
4. Provide descriptive `description` property
5. Export from `index.ts`
6. Update this README

## License

Part of tinkersaur-app. See project LICENSE file.
