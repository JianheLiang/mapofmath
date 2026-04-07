import Link from "next/link";

import { QueryFilters, SearchResult } from "@/lib/types";

interface SearchPanelProps {
  filters: QueryFilters;
  results: SearchResult[];
  onFilterChange: (key: keyof QueryFilters, value: string) => void;
  onResetFilters: () => void;
}

export function SearchPanel({
  filters,
  results,
  onFilterChange,
  onResetFilters,
}: SearchPanelProps) {
  return (
    <section id="section-search" className="panel section-panel home-panel">
      <div className="section-heading home-section-heading">
        <p className="eyebrow">01 Search & filters</p>
        <div>
          <h2>Refine and open entries</h2>
          <p>
            Use the search bar above to query the wiki. Filters narrow type, area, and
            time range. Each result opens the full article.
          </p>
        </div>
      </div>

      <div className="search-toolbar home-search-toolbar">
        <label>
          <span>Type</span>
          <select
            value={filters.type}
            onChange={(event) => onFilterChange("type", event.target.value)}
          >
            <option value="">All types</option>
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

      <div className="search-helper-row">
        <p>
          The imported Wikipedia dataset uses broad areas like <strong>analysis</strong>,
          but the backend also maps <strong>calculus</strong> filters to calculus-related
          analysis entries.
        </p>
        <button type="button" className="secondary-button" onClick={onResetFilters}>
          Clear filters
        </button>
      </div>

      <div className="search-results">
        {results.length === 0 ? (
          <div className="empty-state">
            <p>No entries match the current filters.</p>
          </div>
        ) : (
          results.map((result) => (
            <Link
              key={result.slug}
              href={`/wiki/${result.slug}`}
              className="search-result search-result-link"
            >
              <div>
                <p className="result-meta">
                  <span className={`type-pill type-${result.type}`}>{result.type}</span>
                  <span>{result.area}</span>
                  <span>{result.historical_start_year}</span>
                </p>
                <h3>{result.title}</h3>
                <p>{result.summary}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
