import { useState } from "react";

import { defaultFilters } from "@/types/search";
import type { SearchFilters, StatusFilter } from "@/types/search";

export function useSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);

  function setQuery(query: string) {
    setFilters((f) => ({ ...f, query }));
  }

  function toggleCategory(cat: string) {
    setFilters((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));
  }

  function setHasPromoOnly(hasPromoOnly: boolean) {
    setFilters((f) => ({ ...f, hasPromoOnly }));
  }

  function setMinPrice(minPrice: string) {
    setFilters((f) => ({ ...f, minPrice }));
  }

  function setMaxPrice(maxPrice: string) {
    setFilters((f) => ({ ...f, maxPrice }));
  }

  function setStatus(status: StatusFilter) {
    setFilters((f) => ({ ...f, status }));
  }

  function reset() {
    setFilters(defaultFilters);
  }

  const isActive =
    filters.query !== "" ||
    filters.categories.length > 0 ||
    filters.hasPromoOnly ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    filters.status !== "all";

  return {
    filters,
    setFilters,
    setQuery,
    toggleCategory,
    setHasPromoOnly,
    setMinPrice,
    setMaxPrice,
    setStatus,
    reset,
    isActive,
  };
}
