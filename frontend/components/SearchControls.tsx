"use client";

import { FormEvent } from "react";

import { QueryFilters } from "@/lib/types";

interface SearchControlsProps {
  query: string;
  filters: QueryFilters;
  onQueryChange: (value: string) => void;
  onFilterChange: (key: keyof QueryFilters, value: string) => void;
  onReset?: () => void;
  onSubmit?: () => void;
  compact?: boolean;
  dropdownMode?: boolean;
}

export function SearchControls({
  query,
  filters,
  onQueryChange,
  onFilterChange,
  onReset,
  onSubmit,
  compact = false,
  dropdownMode = false,
}: SearchControlsProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.();
  };

  return (
    <form
      className={`search-controls ${compact ? "is-compact" : ""} ${
        dropdownMode ? "is-dropdown-mode" : ""
      }`}
      onSubmit={handleSubmit}
    >
      <label className="search-input-shell">
        <span className="sr-only">Search</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search concepts, theorems, mathematicians"
          autoComplete="off"
        />
      </label>

      <div className="search-filter-row">
        <label>
          <span>Type</span>
          <select
            value={filters.type}
            onChange={(event) => onFilterChange("type", event.target.value)}
          >
            <option value="">All</option>
            <option value="concept">Concept</option>
            <option value="theorem">Theorem</option>
            <option value="mathematician">Mathematician</option>
          </select>
        </label>

        <label>
          <span>Area</span>
          <input
            value={filters.area}
            onChange={(event) => onFilterChange("area", event.target.value)}
            placeholder="calculus"
          />
        </label>

        <label>
          <span>From</span>
          <input
            value={filters.from}
            onChange={(event) => onFilterChange("from", event.target.value)}
            placeholder="1650"
          />
        </label>

        <label>
          <span>To</span>
          <input
            value={filters.to}
            onChange={(event) => onFilterChange("to", event.target.value)}
            placeholder="1700"
          />
        </label>
      </div>

      <div className="search-controls-actions">
        <button type="submit" className="primary-button">
          Search
        </button>
        {onReset ? (
          <button type="button" className="secondary-button" onClick={onReset}>
            Clear
          </button>
        ) : null}
      </div>
    </form>
  );
}
