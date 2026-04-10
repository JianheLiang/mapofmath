"use client";

import Link from "next/link";
import type { Route } from "next";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getGraph, searchEntries } from "@/lib/api";
import { buildExplorerQueryString, readExplorerQueryState } from "@/lib/query-state";
import { writeSessionSelection } from "@/lib/session-selection";
import { GraphPayload, QueryFilters, SearchResult } from "@/lib/types";
import { GraphCanvas } from "@/components/GraphCanvas";
import { SearchControls } from "@/components/SearchControls";
import { SearchResultsList } from "@/components/SearchResultsList";
import { TopNavigation } from "@/components/TopNavigation";

export function GraphExplorerPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialState = useMemo(() => readExplorerQueryState(searchParams), [searchParams]);
  const [query, setQuery] = useState(initialState.query);
  const [filters, setFilters] = useState<QueryFilters>(initialState.filters);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(initialState.center);
  const [graphDepth, setGraphDepth] = useState(1);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const nextState = readExplorerQueryState(searchParams);
    setQuery(nextState.query);
    setFilters(nextState.filters);
    setSelectedCenterId(nextState.center);
  }, [searchParams]);

  useEffect(() => {
    const queryString = buildExplorerQueryString({
      query,
      filters,
      center: selectedCenterId,
    });
    const current = searchParams.toString();
    const next = queryString.startsWith("?") ? queryString.slice(1) : queryString;
    if (current !== next) {
      router.replace(`${pathname}${queryString}` as Route, { scroll: false });
    }
  }, [filters, pathname, query, router, searchParams, selectedCenterId]);

  useEffect(() => {
    let active = true;
    searchEntries(deferredQuery, filters, { limit: 10 })
      .then((payload) => {
        if (active) {
          setResults(payload);
          if (!selectedCenterId && payload.length > 0) {
            setSelectedCenterId(payload[0].id);
          }
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
  }, [deferredQuery, filters, selectedCenterId]);

  useEffect(() => {
    let active = true;
    getGraph(selectedCenterId, graphDepth, filters.area, { limit: 30 })
      .then((payload) => {
        if (active) {
          setGraph(payload);
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
  }, [filters.area, graphDepth, selectedCenterId]);

  const selectedResult = results.find((result) => result.id === selectedCenterId) ?? null;

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
    setSelectedCenterId(null);
  };

  return (
    <div className="site-shell">
      <TopNavigation />

      <main className="page-shell graph-page-shell">
        <section className="page-intro">
          <p className="eyebrow">Page B</p>
          <h1>Explore Links</h1>
          <p>
            Use this graphic view to explore how definitions, theorems, and mathematicians are connected together
          </p>
        </section>

        {error ? (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        ) : null}

        <div className="graph-page-layout">
          <aside className="wireframe-panel graph-sidebar">
            <SearchControls
              query={query}
              filters={filters}
              onQueryChange={setQuery}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
              compact
            />

            <SearchResultsList
              results={results}
              emptyMessage="Search to choose a graph center."
              mode="select"
              selectedId={selectedCenterId}
              compact
              onSelect={(result) => {
                setSelectedCenterId(result.id);
                writeSessionSelection({
                  id: result.id,
                  slug: result.slug,
                  title: result.title,
                });
              }}
            />

            <div className="graph-context-card">
              <p className="eyebrow">Selected node</p>
              {selectedResult ? (
                <>
                  <h2>{selectedResult.title}</h2>
                  <p>{selectedResult.summary}</p>
                  <div className="graph-context-meta">
                    <span className={`type-pill type-${selectedResult.type}`}>
                      {selectedResult.type}
                    </span>
                    <span>{selectedResult.area}</span>
                    <span>{selectedResult.historical_start_year}</span>
                  </div>
                  <Link href={`/wiki/${selectedResult.slug}` as Route} className="inline-link">
                    Open wiki page
                  </Link>
                </>
              ) : (
                <p>Choose a result to center the graph and see its context.</p>
              )}
            </div>
          </aside>

          <section className="wireframe-panel graph-stage-panel">
            <GraphCanvas
              graph={graph}
              selectedCenterId={selectedCenterId}
              depth={graphDepth}
              onDepthChange={setGraphDepth}
              className="graph-stage-canvas"
              emptyMessage="Choose a result or relax the filters to load the graph."
            />
          </section>
        </div>
      </main>
    </div>
  );
}
