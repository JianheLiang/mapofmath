"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getGraph, getTimeline } from "@/lib/api";
import { buildExplorerQueryString } from "@/lib/query-state";
import { readSessionSelection } from "@/lib/session-selection";
import { flattenTimelineGroups } from "@/lib/timeline";
import { GraphPayload, QueryFilters, TimelineGroup } from "@/lib/types";
import { GraphCanvas } from "@/components/GraphCanvas";
import { HorizontalTimeline } from "@/components/HorizontalTimeline";
import { SearchControls } from "@/components/SearchControls";
import { TopNavigation } from "@/components/TopNavigation";

const defaultFilters: QueryFilters = {
  type: "",
  area: "",
  from: "",
  to: "",
};

export function MapExplorer() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<QueryFilters>(defaultFilters);
  const [previewGraph, setPreviewGraph] = useState<GraphPayload | null>(null);
  const [timeline, setTimeline] = useState<TimelineGroup[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    const selection = readSessionSelection();
    if (selection) {
      setSelectedCenterId(selection.id);
      setSelectedSlug(selection.slug);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getGraph(selectedCenterId, 1, "", { limit: 10 })
      .then((payload) => {
        if (active) {
          setPreviewGraph(payload);
        }
      })
      .catch(() => {
        if (active) {
          setPreviewGraph(null);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedCenterId]);

  useEffect(() => {
    let active = true;
    getTimeline(defaultFilters)
      .then((payload) => {
        if (active) {
          setTimeline(payload);
        }
      })
      .catch(() => {
        if (active) {
          setTimeline([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const previewTimelineItems = useMemo(() => {
    const items = flattenTimelineGroups(timeline);
    if (items.length === 0) {
      return [];
    }
    if (!selectedSlug) {
      return items.slice(0, 12);
    }

    const index = items.findIndex((item) => item.slug === selectedSlug);
    if (index === -1) {
      return items.slice(0, 12);
    }

    return items.slice(Math.max(0, index - 5), index + 7);
  }, [selectedSlug, timeline]);

  const handleFilterChange = (key: keyof QueryFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleReset = () => {
    setQuery("");
    setFilters(defaultFilters);
  };

  const searchHref = `/search${buildExplorerQueryString({ query, filters })}`;
  const graphHref = `/graph${buildExplorerQueryString({
    query: "",
    filters: defaultFilters,
    center: selectedCenterId,
  })}`;
  const timelineHref = `/timeline${buildExplorerQueryString({
    query: "",
    filters: defaultFilters,
    target: selectedSlug,
  })}`;

  return (
    <div className="site-shell">
      <TopNavigation />

      <main className="home-page">
        <section className="home-section home-search-section">
          <div className="home-section-copy">
            <p className="eyebrow">Search-first navigation</p>
            <h1>Navigate the map through a single search tab.</h1>
            <p>
              Start with a concept, theorem, or mathematician. The homepage stays quiet
              until you search, then hands off to the dedicated search page.
            </p>
          </div>

          <div className="home-search-form">
            <SearchControls
              query={query}
              filters={filters}
              onQueryChange={setQuery}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
              onSubmit={() => router.push(searchHref as Route)}
            />
            <p className="home-search-note">
              No wiki cards are shown here before search. Use the controls above to move
              into the search page.
            </p>
          </div>
        </section>

        <section className="home-section home-preview-section">
          <div className="home-section-copy">
            <p className="eyebrow">Graph preview</p>
            <h2>See the connection field before opening the full graph.</h2>
            <p>
              This preview stays compact and draggable. Tap the graph to move into the
              full graph-centered page.
            </p>
          </div>

          <div className="home-preview-stage">
            <GraphCanvas
              graph={previewGraph}
              selectedCenterId={selectedCenterId}
              showControls={false}
              showRelationFilters={false}
              previewHref={graphHref}
              className="preview-graph-canvas"
              emptyMessage="Graph preview will appear here."
            />
          </div>
        </section>

        <section className="home-section home-preview-section" id="section-timeline">
          <div className="home-section-copy">
            <p className="eyebrow">Timeline preview</p>
            <h2>Browse the chronology as a horizontal line of linked entries.</h2>
            <p>
              Pan and zoom freely here (see hints under the chart). Open the full timeline
              anytime — no search required.
            </p>
            <p className="home-timeline-actions">
              <Link href={timelineHref as Route} className="home-timeline-open-link">
                Open full timeline
              </Link>
              <Link href="/timeline" className="home-timeline-open-link home-timeline-open-link-secondary">
                Timeline home
              </Link>
            </p>
          </div>

          <div className="home-preview-stage">
            <HorizontalTimeline
              items={previewTimelineItems}
              focusedSlug={selectedSlug}
              previewHref={timelineHref}
              className="preview-timeline"
              emptyMessage="Timeline preview will appear here."
            />
          </div>
        </section>
      </main>
    </div>
  );
}
