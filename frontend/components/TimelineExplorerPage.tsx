"use client";

import type { Route } from "next";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getTimeline, searchEntries } from "@/lib/api";
import { buildExplorerQueryString, readExplorerQueryState } from "@/lib/query-state";
import { writeSessionSelection } from "@/lib/session-selection";
import { flattenTimelineGroups } from "@/lib/timeline";
import { QueryFilters, SearchResult, TimelineGroup } from "@/lib/types";
import { HorizontalTimeline } from "@/components/HorizontalTimeline";
import { SearchControls } from "@/components/SearchControls";
import { SearchResultsList } from "@/components/SearchResultsList";
import { TopNavigation } from "@/components/TopNavigation";

export function TimelineExplorerPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialState = useMemo(() => readExplorerQueryState(searchParams), [searchParams]);
  const [query, setQuery] = useState(initialState.query);
  const [filters, setFilters] = useState<QueryFilters>(initialState.filters);
  const [focusedSlug, setFocusedSlug] = useState<string | null>(initialState.target);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [timeline, setTimeline] = useState<TimelineGroup[]>([]);
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
    setFocusedSlug(nextState.target);
  }, [searchParams]);

  useEffect(() => {
    const queryString = buildExplorerQueryString({
      query,
      filters,
      target: focusedSlug,
    });
    const current = searchParams.toString();
    const next = queryString.startsWith("?") ? queryString.slice(1) : queryString;
    if (current !== next) {
      router.replace(`${pathname}${queryString}` as Route, { scroll: false });
    }
  }, [filters, focusedSlug, pathname, query, router, searchParams]);

  useEffect(() => {
    let active = true;
    getTimeline(filters)
      .then((payload) => {
        if (active) {
          setTimeline(payload);
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
  }, [filters]);

  useEffect(() => {
    let active = true;
    if (!hasActiveSearch) {
      setResults([]);
      return () => {
        active = false;
      };
    }

    searchEntries(deferredQuery, filters, { limit: 8 })
      .then((payload) => {
        if (active) {
          setResults(payload);
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
    setFocusedSlug(null);
  };

  return (
    <div className="site-shell">
      <TopNavigation />

      <main className="page-shell timeline-page-shell">
        <section className="page-intro">
          <p className="eyebrow">Page C</p>
          <h1>Timeline for Math.</h1>
          <p>
            See how math concepts evolving over time. Search works like a fast locator. The horizontal timeline stays in view as the
            main browsing surface.
          </p>
        </section>

        {error ? (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        ) : null}

        <section className="wireframe-panel timeline-search-panel">
          <SearchControls
            query={query}
            filters={filters}
            onQueryChange={setQuery}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            compact
            dropdownMode
          />

          {hasActiveSearch ? (
            <SearchResultsList
              results={results}
              emptyMessage="No entries match the current timeline filters."
              mode="select"
              compact
              selectedId={results.find((result) => result.slug === focusedSlug)?.id ?? null}
              onSelect={(result) => {
                setFocusedSlug(result.slug);
                writeSessionSelection({
                  id: result.id,
                  slug: result.slug,
                  title: result.title,
                });
              }}
            />
          ) : null}
        </section>

        <section className="wireframe-panel timeline-stage-panel">
          <HorizontalTimeline
            items={flattenTimelineGroups(timeline)}
            focusedSlug={focusedSlug}
            selectionPreview
            emptyMessage="No timeline entries match the current filters."
          />
        </section>
      </main>
    </div>
  );
}
