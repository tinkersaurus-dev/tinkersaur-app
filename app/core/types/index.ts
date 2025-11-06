/**
 * Shared type definitions for the entire application
 */

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  users: User[];
  createdAt: Date;
  updatedAt: Date;
}
