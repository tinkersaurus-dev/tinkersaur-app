/**
 * Caching layer for visibility graphs
 */

import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { OrthogonalVisibilityGraph } from './types';
import { DESIGN_STUDIO_CONFIG } from './constants';

interface CacheEntry {
  graph: OrthogonalVisibilityGraph;
  timestamp: number;
}

/**
 * LRU cache for visibility graphs
 */
export class RouteCache {
  private cache: Map<string, CacheEntry> = new Map();
  private ttl: number;
  private maxSize: number;

  constructor() {
    this.ttl = DESIGN_STUDIO_CONFIG.cache.visibilityGraphTTL;
    this.maxSize = DESIGN_STUDIO_CONFIG.cache.maxCacheSize;
  }

  /**
   * Get a cached visibility graph for the given shapes
   */
  get(shapes: Shape[]): OrthogonalVisibilityGraph | null {
    const key = this.generateKey(shapes);
    const now = Date.now();

    const cached = this.cache.get(key);
    if (cached && now - cached.timestamp < this.ttl) {
      return cached.graph;
    }

    // Expired or not found
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Store a visibility graph in the cache
   */
  set(shapes: Shape[], graph: OrthogonalVisibilityGraph): void {
    const key = this.generateKey(shapes);

    this.cache.set(key, {
      graph,
      timestamp: Date.now(),
    });

    // Evict old entries if cache is too large
    if (this.cache.size > this.maxSize) {
      this.evictOldest();
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Generate a cache key from shapes
   */
  private generateKey(shapes: Shape[]): string {
    // Create a string representation of all shape positions and sizes
    // Sort by ID to ensure consistent key regardless of array order
    const sorted = [...shapes].sort((a, b) => a.id.localeCompare(b.id));
    return sorted.map((s) => `${s.id}:${s.x},${s.y},${s.width},${s.height}`).join('|');
  }

  /**
   * Evict the oldest entry from the cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [k, v] of this.cache.entries()) {
      if (v.timestamp < oldestTime) {
        oldestTime = v.timestamp;
        oldestKey = k;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}
