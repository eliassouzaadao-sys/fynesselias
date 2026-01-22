/**
 * Array Helper Utilities
 * Safe array operations to prevent runtime errors
 */

/**
 * Ensures a value is an array
 * @param value - Value to check
 * @returns Array or empty array
 */
export function ensureArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  return [];
}

/**
 * Safe map operation
 * @param data - Data to map
 * @param fn - Mapping function
 * @returns Mapped array
 */
export function safeMap<T, R>(data: unknown, fn: (item: T) => R): R[] {
  const arr = ensureArray<T>(data);
  return arr.map(fn);
}

/**
 * Safe filter operation
 * @param data - Data to filter
 * @param predicate - Filter predicate
 * @returns Filtered array
 */
export function safeFilter<T>(data: unknown, predicate: (item: T) => boolean): T[] {
  const arr = ensureArray<T>(data);
  return arr.filter(predicate);
}

/**
 * Safe reduce operation
 * @param data - Data to reduce
 * @param fn - Reducer function
 * @param initial - Initial value
 * @returns Reduced value
 */
export function safeReduce<T, R>(
  data: unknown,
  fn: (acc: R, item: T) => R,
  initial: R
): R {
  const arr = ensureArray<T>(data);
  return arr.reduce(fn, initial);
}

/**
 * Check if value is a non-empty array
 * @param value - Value to check
 * @returns True if non-empty array
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Get array length safely
 * @param value - Value to check
 * @returns Array length or 0
 */
export function safeLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

/**
 * Chunk array into smaller arrays
 * @param array - Array to chunk
 * @param size - Chunk size
 * @returns Array of chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Remove duplicates from array
 * @param array - Array with possible duplicates
 * @param key - Optional key function for object comparison
 * @returns Array without duplicates
 */
export function unique<T>(array: T[], key?: (item: T) => any): T[] {
  if (!key) {
    return [...new Set(array)];
  }

  const seen = new Set();
  return array.filter((item) => {
    const k = key(item);
    if (seen.has(k)) {
      return false;
    }
    seen.add(k);
    return true;
  });
}

/**
 * Sort array by key
 * @param array - Array to sort
 * @param key - Key function
 * @param direction - Sort direction
 * @returns Sorted array
 */
export function sortBy<T>(
  array: T[],
  key: (item: T) => any,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  const sorted = [...array].sort((a, b) => {
    const aVal = key(a);
    const bVal = key(b);

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Group array by key
 * @param array - Array to group
 * @param key - Grouping key function
 * @returns Grouped object
 */
export function groupBy<T>(array: T[], key: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = key(item);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}
