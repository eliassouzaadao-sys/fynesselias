/**
 * Custom hook for managing filter state
 */

import { useState, useCallback, useMemo } from 'react';

export interface FilterConfig<T = any> {
  [key: string]: T;
}

export function useFilters<T extends FilterConfig>(initialFilters: T = {} as T) {
  const [filters, setFilters] = useState<T>(initialFilters);

  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const clearFilter = useCallback(<K extends keyof T>(key: K) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const hasFilters = useMemo(() => {
    return Object.keys(filters).length > 0;
  }, [filters]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter((value) => {
      if (value === undefined || value === null || value === '') return false;
      if (value === 'all') return false;
      return true;
    }).length;
  }, [filters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    clearFilter,
    hasFilters,
    activeFiltersCount,
  };
}
