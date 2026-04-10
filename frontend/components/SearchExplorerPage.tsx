"use client";

import type { Route } from "next";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { searchEntries } from "@/lib/api";
import { buildExplorerQueryString, readExplorerQueryState } from "@/lib/query-state";
import { writeSessionSelection } from "@/lib/session-selection";
import { QueryFilters, SearchResult } from "@/lib/types";
import { SearchControls } from "@/components/SearchControls";
import { SearchResultsList } from "@/components/SearchResultsList";
import { TopNavigation } from "@/components/TopNavigation";

export function SearchExplorerPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialState = useMemo(() => readExplorerQueryState(searchParams), [searchParams]);
  const [query, setQuery] = useState(initialState.query);
  const [filters, setFilters] = useState<QueryFilters>(initialState.filters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const hasActiveSearch =
    deferredQuery.trim().length > 0 ||
    filters.type !== "" ||
    filters.area.trim().length > 0 ||
    filters.from.trim().length > 0 ||
    filters.to.trim().length > 0;

  useEffect(() => {
    const nextState = readExplorerQueryState(searchParams);
    setQuery(nextState.query);
    setFilters(nextState.filters);
  }, [searchParams]);

  useEffect(() => {
    const queryString = buildExplorerQueryString({ query, filters });
    const current = searchParams.toString();
    const next = queryString.startsWith("?") ? queryString.slice(1) : queryString;
    if (current !== next) {
      router.replace(`${pathname}${queryString}` as Route, { scroll: false });
    }
  }, [filters, pathname, query, router, searchParams]);

  useEffect(() => {
    let active = true;
    if (!hasActiveSearch) {
      setResults([]);
      setError(null);
      return () => {
        active = false;
      };
    }

    searchEntries(deferredQuery, filters, { limit: 18 })
      .then((payload) => {
        if (active) {
          setResults(payload);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
        }
      });

    return () => {
      active = false;
    };
  }, [deferredQuery, filters, hasActiveSearch]);

  const handleFilterChange = (key: keyof QueryFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleReset = () => {
    setQuery("");
    setFilters({
      type: "",
      area: "",
      from: "",
      to: "",
    });
  };

  return (
    <div className="site-shell">
      <TopNavigation />

      <main className="page-shell search-page-shell">
        <section className="page-intro">
          <p className="eyebrow">Page A</p>
          <h1>Search any math concepts, theorems, or mathematicians.</h1>
          <p>
            This page is the fast locator for the wiki. You can access terms you're looking for directly throught this page.
          </p>
        </section>

        <section className="wireframe-panel">
          <SearchControls
            query={query}
            filters={filters}
            onQueryChange={setQuery}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            compact
          />

          {error ? (
            <div className="error-banner">
              <p>{error}</p>
            </div>
          ) : null}

          <SearchResultsList
            results={results}
            emptyMessage={
              hasActiveSearch
                ? "No entries match the current filters."
                : "Type a keyword or apply a filter to begin."
            }
            onSelect={(result) =>
              writeSessionSelection({
                id: result.id,
                slug: result.slug,
                title: result.title,
              })
            }
          />
        </section>
      </main>
    </div>
  );
}
