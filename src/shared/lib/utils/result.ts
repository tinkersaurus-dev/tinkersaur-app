/**
 * Result type for error handling
 * Provides a type-safe way to handle success and error cases
 */
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };
