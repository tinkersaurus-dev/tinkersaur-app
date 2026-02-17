import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

const TAG_PARAM = 'tag';

/**
 * Manages tag selection state for the Signal Strength page.
 * Reads/writes the ?tag= URL search param so tags can be deep-linked.
 * Clicking the same tag deselects it; clicking a different tag selects it.
 */
export function useSignalStrengthFilterState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedTag = searchParams.get(TAG_PARAM);

  const toggleTag = useCallback(
    (tagName: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (next.get(TAG_PARAM) === tagName) {
            next.delete(TAG_PARAM);
          } else {
            next.set(TAG_PARAM, tagName);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearTag = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(TAG_PARAM);
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  return { selectedTag, toggleTag, clearTag };
}
