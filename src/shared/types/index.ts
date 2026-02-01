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

// Note: User, Team, and Organization types are now defined in
// @/entities/user, @/entities/team, @/entities/organization with Zod schemas
