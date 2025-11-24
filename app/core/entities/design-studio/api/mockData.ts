import type { DesignWork, Diagram, Interface, Document } from '../types';
import { getFromStorage, saveToStorage } from './storage';

// Schema version to detect when we need to re-initialize
const SCHEMA_VERSION = '3.1.0'; // Updated: removed deprecated viewport property from diagrams

/**
 * Initialize localStorage with mock data if empty or schema version changed
 */
export function initializeMockData(): void {
  // Skip if not in browser
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  // Check schema version - if it doesn't match, clear and reinitialize
  const currentVersion = localStorage.getItem('design-studio-schema-version');
  if (currentVersion !== SCHEMA_VERSION) {
    console.warn('Schema version mismatch, reinitializing mock data...');
    // Clear old data
    localStorage.removeItem('designWorks');
    localStorage.removeItem('diagrams');
    localStorage.removeItem('interfaces');
    localStorage.removeItem('documents');
    // Clear any canvas content
    Object.keys(localStorage)
      .filter(key => key.startsWith('canvas-content-'))
      .forEach(key => localStorage.removeItem(key));
  }

  // Only initialize if storage is empty
  if (getFromStorage('designWorks').length > 0) {
    return;
  }

  // Mock DesignWorks - represent folders in the tree with embedded content metadata
  const mockDesignWorks: DesignWork[] = [
    // Top-level folder: User Flows
    {
      id: 'dw-1',
      solutionId: 'sol-1', // Customer Portal
      changeId: 'change-2', // Associated with Password Reset change
      name: 'User Flows',
      version: '1.0.0',
      // Content metadata embedded for tree building
      diagrams: [
        {
          id: 'diagram-1',
          name: 'Password Reset Flow',
          type: 'bpmn',
          order: 0,
        },
      ],
      interfaces: [
        {
          id: 'interface-1',
          name: 'Reset Request Form',
          fidelity: 'high',
          order: 0,
        },
        {
          id: 'interface-2',
          name: 'Reset Confirmation Page',
          fidelity: 'medium',
          order: 1,
        },
      ],
      documents: [],
      references: [],
      createdAt: new Date('2024-02-11'),
      updatedAt: new Date('2024-02-11'),
    },
    // Top-level folder: Technical Design
    {
      id: 'dw-2',
      solutionId: 'sol-1',
      changeId: 'change-2',
      name: 'Technical Design',
      version: '1.0.0',
      diagrams: [
        {
          id: 'diagram-2',
          name: 'Email Service Integration',
          type: 'sequence',
          order: 0,
        },
        {
          id: 'diagram-3',
          name: 'Reset Token Data Model',
          type: 'class',
          order: 1,
        },
      ],
      interfaces: [],
      documents: [],
      references: [],
      createdAt: new Date('2024-02-11'),
      updatedAt: new Date('2024-02-11'),
    },
    // Nested folder: Documentation (child of Technical Design)
    {
      id: 'dw-3',
      solutionId: 'sol-1',
      parentDesignWorkId: 'dw-2', // Nested under Technical Design
      name: 'Documentation',
      version: '1.0.0',
      diagrams: [],
      interfaces: [],
      documents: [
        {
          id: 'document-1',
          name: 'Security Requirements',
          order: 0,
        },
        {
          id: 'document-2',
          name: 'Email Templates',
          order: 1,
        },
      ],
      references: [],
      createdAt: new Date('2024-02-12'),
      updatedAt: new Date('2024-02-12'),
    },
  ];

  const mockDiagrams: Diagram[] = [
    {
      id: 'diagram-1',
      designWorkId: 'dw-1', // In "User Flows" folder
      name: 'Password Reset Flow',
      type: 'bpmn',
      // Diagrams now contain their shapes and connectors directly
      shapes: [],
      connectors: [],
      createdAt: new Date('2024-02-11'),
      updatedAt: new Date('2024-02-11'),
    },
    {
      id: 'diagram-2',
      designWorkId: 'dw-2', // In "Technical Design" folder
      name: 'Email Service Integration',
      type: 'sequence',
      shapes: [],
      connectors: [],
      createdAt: new Date('2024-02-12'),
      updatedAt: new Date('2024-02-12'),
    },
    {
      id: 'diagram-3',
      designWorkId: 'dw-2', // In "Technical Design" folder
      name: 'Reset Token Data Model',
      type: 'class',
      shapes: [
        {
          id: 'shape-class-1',
          type: 'class',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          label: 'User',
          zIndex: 0,
          locked: false,
          isPreview: false,
          data: {
            stereotype: undefined,
            attributes: ['id: string', 'email: string', 'name: string'],
            methods: ['requestPasswordReset()', 'resetPassword(token: string)'],
          },
        },
        {
          id: 'shape-class-2',
          type: 'class',
          x: 450,
          y: 100,
          width: 200,
          height: 150,
          label: 'ResetToken',
          zIndex: 0,
          locked: false,
          isPreview: false,
          data: {
            stereotype: undefined,
            attributes: ['id: string', 'token: string', 'userId: string', 'expiresAt: Date'],
            methods: ['isValid(): boolean', 'expire()'],
          },
        },
      ],
      connectors: [
        {
          id: 'connector-class-1',
          type: 'association',
          sourceShapeId: 'shape-class-1',
          targetShapeId: 'shape-class-2',
          style: 'orthogonal',
          markerStart: 'none',
          markerEnd: 'none',
          lineType: 'solid',
          label: 'has',
          sourceCardinality: '1',
          targetCardinality: '*',
          zIndex: 0,
        },
      ],
      createdAt: new Date('2024-02-12'),
      updatedAt: new Date('2024-02-12'),
    },
  ];

  const mockInterfaces: Interface[] = [
    {
      id: 'interface-1',
      designWorkId: 'dw-1', // In "User Flows" folder
      name: 'Reset Request Form',
      fidelity: 'high',
      createdAt: new Date('2024-02-13'),
      updatedAt: new Date('2024-02-13'),
    },
    {
      id: 'interface-2',
      designWorkId: 'dw-1', // In "User Flows" folder
      name: 'Reset Confirmation Page',
      fidelity: 'medium',
      createdAt: new Date('2024-02-13'),
      updatedAt: new Date('2024-02-13'),
    },
  ];

  const mockDocuments: Document[] = [
    {
      id: 'document-1',
      designWorkId: 'dw-3', // In nested "Documentation" folder
      name: 'Security Requirements',
      content:
        '# Security Requirements\n\n## Token Generation\n- Use cryptographically secure random tokens\n- Minimum 32 bytes\n\n## Expiration\n- Tokens expire after 24 hours',
      createdAt: new Date('2024-02-11'),
      updatedAt: new Date('2024-02-11'),
    },
    {
      id: 'document-2',
      designWorkId: 'dw-3', // In nested "Documentation" folder
      name: 'Email Templates',
      content:
        '# Email Templates\n\n## Reset Request Email\nSubject: Password Reset Request\n\nBody: Click the link below to reset your password...',
      createdAt: new Date('2024-02-12'),
      updatedAt: new Date('2024-02-12'),
    },
  ];

  // Save all mock data
  saveToStorage('designWorks', mockDesignWorks);
  saveToStorage('diagrams', mockDiagrams);
  saveToStorage('interfaces', mockInterfaces);
  saveToStorage('documents', mockDocuments);

  // Update schema version
  localStorage.setItem('design-studio-schema-version', SCHEMA_VERSION);
}
