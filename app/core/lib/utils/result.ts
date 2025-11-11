/**
 * Result type for error handling
 * Provides a type-safe way to handle success and error cases
 */
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * Create a successful result
 */
export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

/**
 * Create an error result
 */
export function err<T = never>(error: string): Result<T> {
  return { ok: false, error };
}
