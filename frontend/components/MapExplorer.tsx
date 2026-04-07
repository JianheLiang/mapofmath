"use client";

import { useDeferredValue, useEffect, useState } from "react";

import { getGraph, getTimeline, searchEntries } from "@/lib/api";
import { GraphPayload, QueryFilters, SearchResult, TimelineGroup } from "@/lib/types";
import { HomeHero } from "@/components/HomeHero";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { SearchPanel } from "@/components/SearchPanel";
import { TimelinePanel } from "@/components/TimelinePanel";

const defaultFilters: QueryFilters = {
  type: "",
  area: "",
  from: "",
  to: "",
};

export function MapExplorer() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<QueryFilters>(defaultFilters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [graphDepth, setGraphDepth] = useState(2);
  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const [timeline, setTimeline] = useState<TimelineGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let active = true;
    setError(null);
    searchEntries(deferredQuery, filters)
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
  }, [deferredQuery, filters]);

  useEffect(() => {
    let active = true;
    setError(null);
    getGraph(selectedCenterId, graphDepth, filters.area)
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
  }, [selectedCenterId, graphDepth, filters.area]);

  useEffect(() => {
    let active = true;
    setError(null);
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
    if (results.length > 0 && selectedCenterId === null) {
      setSelectedCenterId(results[0].id);
    }
  }, [results, selectedCenterId]);

  const handleFilterChange = (key: keyof QueryFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value } as QueryFilters));
  };

  const handleResetFilters = () => {
    setQuery("");
    setFilters(defaultFilters);
    setError(null);
  };

  return (
    <div className="app-shell home-root">
      <HomeHero query={query} onQueryChange={setQuery} />

      {error ? (
        <div className="panel error-banner home-error-banner">
          <p>{error}</p>
        </div>
      ) : null}

      <div className="content-grid home-content">
        <div className="main-column">
          <SearchPanel
            filters={filters}
            results={results}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />
          <KnowledgeGraph
            graph={graph}
            selectedCenterId={selectedCenterId}
            depth={graphDepth}
            onDepthChange={setGraphDepth}
          />
          <TimelinePanel timeline={timeline} />
        </div>
      </div>

      <footer className="home-footer">
        <p className="home-footer-count">
          <span className="home-footer-count-label">Results in view</span>
          <span className="home-footer-count-value">{results.length}</span>
        </p>
        <p className="home-footer-legal">
          <a href="#">Terms</a>
          <span aria-hidden> · </span>
          <a href="#">Privacy</a>
          <span aria-hidden> · </span>
          <a href="#">Acceptable use</a>
        </p>
      </footer>
    </div>
  );
}
