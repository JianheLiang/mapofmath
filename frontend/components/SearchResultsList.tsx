"use client";

import type { Route } from "next";
import Link from "next/link";

import { SearchResult } from "@/lib/types";

interface SearchResultsListProps {
  results: SearchResult[];
  emptyMessage: string;
  mode?: "link" | "select";
  selectedId?: string | null;
  onSelect?: (result: SearchResult) => void;
  compact?: boolean;
}

export function SearchResultsList({
  results,
  emptyMessage,
  mode = "link",
  selectedId = null,
  onSelect,
  compact = false,
}: SearchResultsListProps) {
  if (results.length === 0) {
    return (
      <div className={`empty-state ${compact ? "is-compact" : ""}`}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`search-results-list ${compact ? "is-compact" : ""}`}>
      {results.map((result) => {
        const content = (
          <>
            <p className="result-meta">
              <span className={`type-pill type-${result.type}`}>{result.type}</span>
              <span>{result.area}</span>
              <span>{result.historical_start_year}</span>
            </p>
            <h3>{result.title}</h3>
            <p>{result.summary}</p>
          </>
        );

        if (mode === "select") {
          return (
            <button
              key={result.id}
              type="button"
              className={`search-result-card ${selectedId === result.id ? "is-selected" : ""}`}
              onClick={() => onSelect?.(result)}
            >
              {content}
            </button>
          );
        }

        return (
          <Link
            key={result.id}
            href={`/wiki/${result.slug}` as Route}
            className="search-result-card"
            onClick={() => onSelect?.(result)}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}
