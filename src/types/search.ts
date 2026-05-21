export type StatusFilter = "all" | "active" | "inactive";

export type SearchFilters = {
  query: string;
  categories: string[];
  hasPromoOnly: boolean;
  minPrice: string;
  maxPrice: string;
  /** Admin only — filter by product is_active status */
  status: StatusFilter;
};

export const defaultFilters: SearchFilters = {
  query: "",
  categories: [],
  hasPromoOnly: false,
  minPrice: "",
  maxPrice: "",
  status: "all",
};
