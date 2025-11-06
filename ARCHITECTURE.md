# Tinkersaur Product Context Development Platform - Architectural Plan

## Executive Summary

A full-stack TypeScript application built on React Router v7 with two main modules:
1. **Product Management Module** - CRUD-based entity management for products, features, changes, and requirements
2. **Design Studio Module** - Real-time collaborative workspace for diagrams, interfaces, user flows, and documents

## System Architecture Overview

### High-Level Architecture

```
Frontend (React Router v7 + TypeScript + Ant Design)
├── Product Management Module (CRUD + LLM assistance)
├── Design Studio Module (Real-time collaboration)
└── Shared Infrastructure (Auth, Routing, State - Zustand)

Backend Services (Separate Repos - Future)
├── Entity Management Service (PostgreSQL + REST/GraphQL)
├── Real-time Collaboration Service (WebSocket/CRDT + PostgreSQL)
├── LLM Integration Service (AWS Bedrock + Async Queue)
└── Authentication Service (Multi-tenant support)
```

---

## Frontend Architecture

### 1. Module Structure

```
app/
├── core/                          # Shared infrastructure
│   ├── auth/                      # Authentication & authorization
│   ├── api/                       # API client abstraction
│   ├── components/                # Shared UI components (Ant Design wrappers)
│   ├── hooks/                     # Shared React hooks
│   ├── store/                     # Zustand stores
│   ├── types/                     # Shared TypeScript types
│   └── utils/                     # Utility functions
│
├── product-management/            # Module 1: Product Management
│   ├── routes/                    # React Router routes
│   ├── components/                # Module-specific components
│   ├── hooks/                     # Module-specific hooks
│   ├── services/                  # API integration layer
│   ├── store/                     # Zustand stores
│   └── types/                     # Domain models
│       ├── Product.ts
│       ├── Feature.ts
│       ├── Change.ts
│       └── Requirement.ts
│
├── design-studio/                 # Module 2: Design Studio
│   ├── routes/                    # React Router routes
│   ├── components/
│   │   ├── canvas/                # Custom React-based canvas
│   │   ├── tabs/                  # Tab management
│   │   ├── diagram/               # Diagram rendering
│   │   ├── interface/             # Interface editor
│   │   ├── document/              # Markdown editor
│   │   └── toolbar/               # Studio toolbars
│   ├── collaboration/             # Real-time collaboration layer
│   ├── models/                    # Domain models
│   │   ├── diagram/
│   │   │   ├── Shape.ts           # Base shape model
│   │   │   ├── Connector.ts       # Base connector model
│   │   │   ├── DiagramTypes.ts    # BPMN, DataFlow, Class, Sequence
│   │   │   └── Canvas.ts          # Canvas/viewport model
│   │   ├── interface/
│   │   └── document/
│   ├── rendering/                 # Separation of data from rendering
│   │   ├── shapes/                # Shape renderers
│   │   ├── connectors/            # Connector renderers
│   │   └── diagram-renderers/     # Diagram-specific rendering logic
│   ├── store/                     # Zustand stores for studio state
│   └── services/
│
├── routes/                        # Top-level routes
└── root.tsx                       # Root layout
```

### 2. Core Domain Models

#### Product Management Domain

```typescript
// Hierarchical relationship: Product → Feature → Change → Requirement

interface Organization {
  id: string;
  name: string;
  users: User[];
}

interface Product {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  features: Feature[];
  createdAt: Date;
  updatedAt: Date;
}

interface Feature {
  id: string;
  productId: string;
  name: string;
  description: string;
  changes: Change[];          // Version history
  implementedChangeId?: string; // Current "production" state
  createdAt: Date;
  updatedAt: Date;
}

interface Change {
  id: string;
  featureId: string;
  name: string;
  description: string;
  status: 'draft' | 'locked' | 'in-design' | 'implemented';
  requirements: Requirement[];
  designWork?: DesignWork;     // Link to design studio
  version: string;             // Git-like versioning
  parentChangeId?: string;     // For version lineage
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Requirement {
  id: string;
  changeId: string;
  text: string;               // LLM-assisted generation
  type: 'functional' | 'non-functional' | 'constraint';
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Design Studio Domain

```typescript
// Design Work Container
interface DesignWork {
  id: string;
  changeId: string;
  name: string;
  version: string;            // Git-like versioning
  tabs: DesignTab[];          // Open tabs in studio
  createdAt: Date;
  updatedAt: Date;
}

interface DesignTab {
  id: string;
  type: 'diagram' | 'interface' | 'document' | 'userflow';
  contentId: string;          // References specific content
  order: number;
}

// Diagram Models (Data separated from rendering)
interface Diagram {
  id: string;
  designWorkId: string;
  name: string;
  type: 'bpmn' | 'dataflow' | 'class' | 'sequence';
  canvas: Canvas;
  shapes: Shape[];
  connectors: Connector[];
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Canvas {
  id: string;
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
  gridSize?: number;
}

// Extensible shape model supporting simple → complex
interface Shape {
  id: string;
  diagramId: string;
  type: string;              // e.g., 'rect', 'circle', 'class', 'swimlane'
  position: Point;
  size: Size;

  // Core data (not styling)
  data: Record<string, any>; // Flexible data model

  // Hierarchy support for complex diagrams
  parentId?: string;
  children?: string[];

  // Metadata
  zIndex: number;
  locked: boolean;
}

interface Connector {
  id: string;
  diagramId: string;
  type: string;              // e.g., 'line', 'arrow', 'association', 'message'
  sourceShapeId: string;
  targetShapeId: string;

  // Routing data
  points?: Point[];          // For custom routing
  style: 'straight' | 'orthogonal' | 'curved';

  // Core data
  data: Record<string, any>;

  // Metadata
  zIndex: number;
}

// Interface (Wireframes/UI mockups)
interface Interface {
  id: string;
  designWorkId: string;
  name: string;
  fidelity: 'low' | 'medium' | 'high';
  content: {
    html?: string;
    css?: string;
    js?: string;
  };
  components: UIComponent[]; // For drag-drop approach
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UIComponent {
  id: string;
  type: string;
  position: Point;
  size: Size;
  properties: Record<string, any>;
  children?: UIComponent[];
}

// Document (Markdown)
interface Document {
  id: string;
  designWorkId: string;
  name: string;
  content: string;           // Markdown text
  version: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. State Management Strategy

**Zustand for All Client State** - Use from the beginning to avoid retrofitting

```typescript
// Core App Store
interface AppStore {
  user: User | null;
  organization: Organization | null;
  setUser: (user: User) => void;
  setOrganization: (org: Organization) => void;
}

// Product Management Store
interface ProductManagementStore {
  products: Product[];
  selectedProduct: Product | null;
  selectedFeature: Feature | null;
  selectedChange: Change | null;

  // Actions
  setProducts: (products: Product[]) => void;
  selectProduct: (productId: string) => void;
  addFeature: (feature: Feature) => void;
  updateChange: (changeId: string, updates: Partial<Change>) => void;
}

// Design Studio Store
interface DesignStudioStore {
  // Active tab management
  activeTabs: DesignTab[];
  activeTabId: string;

  // Canvas state
  selectedShapes: string[];
  selectedConnectors: string[];
  tool: 'select' | 'pan' | 'shape' | 'connector';
  clipboard: (Shape | Connector)[];

  // Collaboration state
  activeUsers: CollaborationUser[];
  cursors: Map<string, Point>;

  // Actions
  addTab: (tab: DesignTab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  setActiveTool: (tool: string) => void;
  selectShapes: (shapeIds: string[]) => void;
  updateShape: (shapeId: string, updates: Partial<Shape>) => void;
  deleteShapes: (shapeIds: string[]) => void;
}

// Collaboration Store (separate for real-time updates)
interface CollaborationStore {
  session: CollaborationSession | null;
  users: CollaborationUser[];
  cursors: Map<string, Point>;

  // Real-time operations
  broadcastOperation: (op: CollaborationOperation) => void;
  applyRemoteOperation: (op: CollaborationOperation) => void;
}
```

**Integration with React Router:**
- Use React Router loaders for initial data fetching
- Use Zustand for client-side state management
- Sync Zustand with server via actions/loaders

### 4. Real-time Collaboration Architecture

**Technology Stack:**
- **WebSocket** for real-time communication
- **Yjs** - Battle-tested CRDT library
- **y-websocket** - WebSocket provider for Yjs

**Collaboration Features:**
- Live cursors and selections
- Presence indicators
- Concurrent editing with automatic conflict resolution
- Change broadcasting

```typescript
// Collaboration Layer
interface CollaborationSession {
  designWorkId: string;
  users: CollaborationUser[];
  ydoc: Y.Doc;               // Yjs document
}

interface CollaborationUser {
  userId: string;
  name: string;
  color: string;
  cursor: Point;
  selectedShapes: string[];
}

// Yjs Integration
class CollaborationService {
  private ydoc: Y.Doc;
  private wsProvider: WebsocketProvider;
  private awareness: Awareness;

  connect(designWorkId: string, user: User): void;
  disconnect(): void;

  // Bind Yjs to Zustand
  syncWithStore(store: DesignStudioStore): void;

  // Awareness (cursors, presence)
  updateCursor(position: Point): void;
  updateSelection(shapeIds: string[]): void;
}
```

### 5. Rendering Architecture (Data/Style Separation)

**Separation Strategy:**

```typescript
// Data Models (in models/)
interface ShapeData {
  id: string;
  type: string;
  position: Point;
  size: Size;
  data: Record<string, any>;
}

// Rendering Components (in rendering/)
interface ShapeRenderer {
  canRender(type: string): boolean;
  render(shape: ShapeData, context: RenderContext): React.ReactNode;
}

// Registry pattern for extensibility
class ShapeRendererRegistry {
  private renderers: Map<string, ShapeRenderer>;

  register(type: string, renderer: ShapeRenderer): void;
  getRenderer(type: string): ShapeRenderer;
}

// Usage in Canvas component
function Canvas({ diagram }: { diagram: Diagram }) {
  const registry = useShapeRendererRegistry();

  return (
    <div className="canvas">
      {diagram.shapes.map(shape => {
        const Renderer = registry.getRenderer(shape.type);
        return <Renderer key={shape.id} shape={shape} />;
      })}
    </div>
  );
}
```

**Diagram-Specific Rendering:**

```
rendering/
├── shapes/
│   ├── BasicShapeRenderer.tsx      # Rectangle, Circle, etc.
│   ├── BPMNShapeRenderer.tsx       # BPMN-specific shapes
│   ├── ClassShapeRenderer.tsx      # UML Class boxes
│   └── SequenceShapeRenderer.tsx   # Sequence diagram participants
├── connectors/
│   ├── BasicConnectorRenderer.tsx
│   ├── BPMNConnectorRenderer.tsx
│   └── SequenceConnectorRenderer.tsx
└── diagram-renderers/
    ├── BPMNDiagramRenderer.tsx     # Orchestrates BPMN rendering
    ├── DataFlowRenderer.tsx
    ├── ClassDiagramRenderer.tsx
    └── SequenceDiagramRenderer.tsx
```

### 6. Routing Structure

```typescript
// routes.ts
const routes: RouteConfig[] = [
  {
    path: '/',
    file: 'routes/home.tsx'
  },

  // Product Management Module
  {
    path: '/products',
    children: [
      { index: true, file: 'product-management/routes/products-list.tsx' },
      { path: ':productId', file: 'product-management/routes/product-detail.tsx' },
      { path: ':productId/features/:featureId', file: 'product-management/routes/feature-detail.tsx' },
      { path: ':productId/features/:featureId/changes/:changeId', file: 'product-management/routes/change-detail.tsx' },
    ]
  },

  // Design Studio Module
  {
    path: '/studio',
    children: [
      { path: ':designWorkId', file: 'design-studio/routes/studio.tsx' },
    ]
  },

  // Settings, Profile, etc.
  {
    path: '/settings',
    file: 'routes/settings.tsx'
  }
];
```

### 7. LLM Integration

**Development Setup (Frontend calls):**
```typescript
// Temporary dev-only service
async function generateRequirements(change: Change): Promise<Requirement[]> {
  // Direct AWS Bedrock call from frontend (DEV ONLY)
  const response = await fetch('/api/llm/requirements', {
    method: 'POST',
    body: JSON.stringify({ change })
  });
  return response.json();
}
```

**Production Architecture (Future backend service):**
- **Synchronous**: User waits for LLM response (e.g., requirement suggestions)
- **Asynchronous**: Background job with notification (e.g., generating full Jira initiatives)

```typescript
// Future production interface
interface LLMService {
  // Sync
  generateRequirementSuggestions(change: Change): Promise<string[]>;
  improveRequirementText(text: string): Promise<string>;

  // Async
  generateJiraInitiatives(product: Product): Promise<JobId>;
  generateUserStories(change: Change, diff: VersionDiff): Promise<JobId>;

  // Job status
  getJobStatus(jobId: string): Promise<JobStatus>;
}
```

### 8. Versioning & Diff Strategy

**Git-like Version Model:**

```typescript
interface Version {
  id: string;
  entityId: string;          // Change, DesignWork, etc.
  entityType: string;
  version: string;           // e.g., "1.0.0", "1.1.0"
  parentVersionId?: string;  // Version lineage
  snapshot: any;             // Full entity state
  diff?: VersionDiff;        // Computed from parent
  createdAt: Date;
  createdBy: string;
}

interface VersionDiff {
  added: any[];
  modified: any[];
  removed: any[];

  // For LLM context
  textSummary: string;       // Human-readable diff
}

// Versioning Service
class VersioningService {
  createVersion(entity: any, message: string): Version;
  computeDiff(fromVersion: Version, toVersion: Version): VersionDiff;
  restoreVersion(versionId: string): any;
  listVersions(entityId: string): Version[];
}
```

---

## Backend Architecture (Future - Separate Repos)

### Service Breakdown

**1. Entity Management Service**
- **Tech**: Node.js/TypeScript + PostgreSQL
- **API**: REST or GraphQL
- **Responsibilities**:
  - CRUD for Products, Features, Changes, Requirements
  - Organization/user management
  - Data validation & business logic
  - Version storage

**2. Real-time Collaboration Service**
- **Tech**: Node.js/TypeScript + WebSocket + PostgreSQL
- **Responsibilities**:
  - WebSocket connection management
  - Yjs synchronization server
  - Presence & cursor broadcasting
  - Session management

**3. LLM Integration Service**
- **Tech**: Node.js/TypeScript + AWS Bedrock + Queue (SQS/Bull)
- **Responsibilities**:
  - Sync/async LLM calls
  - Prompt engineering & management
  - Response parsing & validation
  - Job queue management

**4. Authentication Service**
- **Tech**: Node.js/TypeScript + PostgreSQL
- **Responsibilities**:
  - User authentication (JWT/session)
  - Multi-tenant organization management
  - Role-based access (future)

### Database Schema (PostgreSQL)

**Key Tables:**
```sql
-- Multi-tenancy
organizations
users
organization_users

-- Product Management
products
features
changes
requirements

-- Design Studio
design_work
diagrams
shapes
connectors
interfaces
documents

-- Versioning
versions
version_diffs

-- Collaboration
collaboration_sessions
collaboration_events
```

**Recommendation**: Use PostgreSQL for:
- Relational data (products, features, changes)
- JSONB columns for flexible data (shape.data, connector.data)
- Built-in versioning support
- Strong consistency for multi-tenant data

---

## Technology Recommendations

### Frontend Libraries

**UI Framework:**
- **Ant Design 5.x** - Comprehensive React UI library
- Use Ant Design components for: Tables, Forms, Modals, Buttons, Menus, Layouts, etc.
- Custom canvas rendering (NOT Ant Design components)

**State Management:**
- **Zustand** - Use from the beginning for all client state

**Diagram Canvas:**
- **Custom React solution** - Full control, no HTML canvas
- **react-use-gesture** - For pan/zoom/drag interactions
- **use-measure** - For responsive sizing

**Markdown Editor:**
- **@uiw/react-md-editor** - Feature-rich markdown editor
- **react-markdown** - For rendering

**Code Editor (for Interface HTML/CSS/JS):**
- **@monaco-editor/react** - VS Code editor in browser
- **CodeMirror** - Lightweight alternative

**Real-time Collaboration:**
- **Yjs** - CRDT library with excellent React bindings
- **y-websocket** - WebSocket provider for Yjs

**Form Handling:**
- **Ant Design Form** - Built-in form components
- **Zod** - Schema validation

**Utilities:**
- **date-fns** - Date manipulation
- **uuid** - ID generation
- **immer** - Immutable state updates (built into Zustand)

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Set up module structure
- Install Ant Design and configure theme
- Set up Zustand stores (app, product management, design studio)
- Implement routing for both modules
- Create shared component library
- Set up auth scaffolding (mock for now)
- Basic product management CRUD (in-memory)

### Phase 2: Product Management Module (Week 3-4)
- Complete CRUD for Products, Features, Changes, Requirements using Ant Design components
- Implement version creation/locking
- Add LLM integration (dev-only frontend calls)
- Build navigation and entity detail views with Ant Design layouts

### Phase 3: Design Studio - Canvas Foundation (Week 5-6)
- Build custom React canvas component
- Implement pan/zoom/selection with react-use-gesture
- Create shape data model
- Build basic shape renderer (rectangles, circles)
- Implement tab management with Ant Design Tabs
- Set up Zustand store for canvas state

### Phase 4: Design Studio - Diagram Types (Week 7-9)
- Implement connector data model & rendering
- Add BPMN diagram support
- Add Data Flow diagram support
- Add Class diagram support
- Add Sequence diagram support

### Phase 5: Design Studio - Other Content Types (Week 10-11)
- Interface editor (low/medium/high fidelity)
- Markdown document editor with @uiw/react-md-editor
- User flow support (if separate from diagrams)

### Phase 6: Real-time Collaboration (Week 12-14)
- Integrate Yjs CRDT
- Implement WebSocket communication (mock server)
- Add presence/cursors
- Handle concurrent editing
- Update Zustand collaboration store

### Phase 7: Versioning & Diff (Week 15-16)
- Implement version creation for all entities
- Build diff computation
- Create version comparison UI with Ant Design
- Link versions across modules

### Phase 8: Polish & Integration (Week 17-18)
- LLM-assisted Jira initiative generation
- Export functionality
- Performance optimization
- Bug fixes & UX improvements

---

## Key Architectural Decisions

### ✅ Decisions Made

1. **Ant Design for UI** - Comprehensive component library (except canvas shapes)
2. **Zustand from start** - Avoid retrofitting state management later
3. **Custom React Canvas** - Full control, no HTML canvas limitations
4. **Data/Rendering Separation** - Extensible, testable, flexible styling
5. **PostgreSQL** - Better for relational data, multi-tenancy, versioning
6. **Yjs for Collaboration** - Industry-proven CRDT implementation
7. **Modular Architecture** - Clear separation of concerns
8. **Git-like Versioning** - Supports diff-based LLM story generation
9. **Separate Backend Services** - Scalability, independent deployment

### 🔄 Flexible Areas

1. **Shape Data Model** - Can evolve as diagram types are implemented
2. **LLM Integration** - Start simple, enhance with queue/async later
3. **Collaboration Transport** - WebSocket works, can upgrade to dedicated service

### ⚠️ Risks & Mitigations

**Risk**: Custom canvas complexity
**Mitigation**: Start simple, iterate, use react-use-gesture for interactions

**Risk**: Real-time collaboration conflicts
**Mitigation**: Use battle-tested Yjs library, not custom CRDT

**Risk**: Diagram rendering performance
**Mitigation**: React virtualization, memoization, web workers for complex calculations

**Risk**: Version storage size
**Mitigation**: Store diffs not full snapshots, compress old versions

---

## Success Metrics

- Product Manager can define product → feature → change → requirements in <5 minutes
- Designer can create basic diagram with 10 shapes in <2 minutes
- Real-time collaboration has <100ms latency for operations
- LLM generates relevant Jira initiatives 80%+ of the time
- System supports 10+ concurrent collaborators per design session

---

## Next Steps

1. Set up folder structure according to module architecture
2. Install dependencies (Ant Design, Zustand, Yjs, etc.)
3. Configure Ant Design theme
4. Create initial Zustand stores
5. Build routing structure
6. Implement Phase 1: Foundation and Product Management CRUD
