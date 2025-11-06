import type { DesignWork, Diagram, Interface, Document } from '../types';
import { getFromStorage, saveToStorage } from './storage';

/**
 * Initialize localStorage with mock data if empty
 */
export function initializeMockData(): void {
  // Skip if not in browser
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  // Only initialize if storage is empty
  if (getFromStorage('designWorks').length > 0) {
    return;
  }

  // Mock DesignWorks - represent folders in the tree
  const mockDesignWorks: DesignWork[] = [
    // Top-level folder: User Flows
    {
      id: 'dw-1',
      solutionId: 'sol-1', // Customer Portal
      changeId: 'change-2', // Associated with Password Reset change
      name: 'User Flows',
      version: '1.0.0',
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
      createdAt: new Date('2024-02-11'),
      updatedAt: new Date('2024-02-11'),
    },
    {
      id: 'diagram-2',
      designWorkId: 'dw-2', // In "Technical Design" folder
      name: 'Email Service Integration',
      type: 'sequence',
      createdAt: new Date('2024-02-12'),
      updatedAt: new Date('2024-02-12'),
    },
    {
      id: 'diagram-3',
      designWorkId: 'dw-2', // In "Technical Design" folder
      name: 'Reset Token Data Model',
      type: 'class',
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
}
