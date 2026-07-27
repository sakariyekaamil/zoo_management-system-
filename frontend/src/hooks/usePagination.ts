import { useState, useCallback } from 'react';
import { PaginationParams } from '../types';

export const usePagination = (initialLimit = 10) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const params: PaginationParams = {
    page,
    limit,
    ...(search && { search }),
    ...filters,
  };

  const resetPage = useCallback(() => setPage(1), []);

  return {
    page,
    setPage,
    limit,
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    filters,
    setFilter: (key: string, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    clearFilters: () => {
      setFilters({});
      setSearch('');
      setPage(1);
    },
    params,
    resetPage,
  };
};
