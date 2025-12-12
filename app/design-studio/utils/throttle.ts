/**
 * Creates a throttled function that only invokes the provided function
 * at most once per specified time limit.
 *
 * Uses trailing edge execution to ensure the last call is always executed.
 *
 * @param func - The function to throttle
 * @param limit - Minimum time between invocations in milliseconds
 * @returns Throttled function with a cancel method
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => ReturnType<T> | undefined) & { cancel: () => void } {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>): ReturnType<T> | undefined => {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    lastArgs = args;

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      lastArgs = null;
      return func(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, remaining);
    }
    return undefined;
  };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  return throttled;
}
