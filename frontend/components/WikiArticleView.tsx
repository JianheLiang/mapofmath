import type { Route } from "next";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { isValidElement, type ReactNode } from "react";

import { GraphCanvas } from "@/components/GraphCanvas";
import { HorizontalTimeline } from "@/components/HorizontalTimeline";
import { TopNavigation } from "@/components/TopNavigation";
import { normalizeMarkdownMath } from "@/lib/markdown-math";
import { extractMarkdownToc } from "@/lib/markdown-toc";
import { slugifyHeading } from "@/lib/slugify";
import { GraphPayload, TimelineItem, WikiDetail } from "@/lib/types";

function childrenToPlainText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(childrenToPlainText).join("");
  }
  if (isValidElement(children)) {
    const props = children.props as { children?: ReactNode };
    if (props.children !== undefined) {
      return childrenToPlainText(props.children);
    }
  }
  return "";
}

function labelForType(type: WikiDetail["type"]) {
  return type.replace("_", " ");
}

function markdownComponents(): Components {
  return {
    h2: ({ children }) => {
      const id = slugifyHeading(childrenToPlainText(children));
      return <h2 id={id}>{children}</h2>;
    },
    h3: ({ children }) => {
      const id = slugifyHeading(childrenToPlainText(children));
      return <h3 id={id}>{children}</h3>;
    },
  };
}

function buildDirectGraph(entry: WikiDetail): GraphPayload {
  const neighborIds = new Map<string, string>();
  const nodes: GraphPayload["nodes"] = [
    {
      id: entry.id,
      slug: entry.slug,
      title: entry.title,
      type: entry.type,
      area: entry.area,
      subarea: entry.subarea,
      cluster: entry.area,
      historical_start_year: entry.historical_start_year,
    },
  ];

  const edges: GraphPayload["edges"] = [];

  entry.connections.forEach((connection, index) => {
    const nodeId =
      neighborIds.get(connection.slug) ?? `connection:${connection.slug}:${index}`;
    if (!neighborIds.has(connection.slug)) {
      nodes.push({
        id: nodeId,
        slug: connection.slug,
        title: connection.title,
        type: connection.type,
        area: connection.area,
        subarea: null,
        cluster: connection.area,
      });
      neighborIds.set(connection.slug, nodeId);
    }

    edges.push({
      source: connection.direction === "incoming" ? nodeId : entry.id,
      target: connection.direction === "incoming" ? entry.id : nodeId,
      relation_type: connection.relation_type,
    });
  });

  return {
    center_id: entry.id,
    nodes,
    edges,
  };
}

interface WikiArticleViewProps {
  entry: WikiDetail;
  timelineItems: TimelineItem[];
}

export function WikiArticleView({ entry, timelineItems }: WikiArticleViewProps) {
  const renderedBody = normalizeMarkdownMath(entry.body);
  const tocFromMarkdown = extractMarkdownToc(renderedBody);
  const seen = new Set(tocFromMarkdown.map((item) => item.id));
  const toc: { id: string; text: string; level: number }[] = [...tocFromMarkdown];
  if (!seen.has("references")) {
    toc.push({ id: "references", text: "References", level: 2 });
  }
  toc.push({ id: "historical-timeline", text: "Historical timeline", level: 2 });
  toc.push({ id: "direct-connections", text: "Direct connections", level: 2 });

  return (
    <div className="wiki-layout">
      <TopNavigation />

      <main className="wiki-page">
        <article className="wiki-article">
          <p className="wiki-article-status">Curated entry · mathematics knowledge graph</p>

          <div className="wiki-article-title-row">
            <div>
              <h1 className="wiki-article-title">{entry.title}</h1>
              <p className="wiki-lead">{entry.summary}</p>
            </div>
            <span className={`type-pill type-${entry.type}`}>{labelForType(entry.type)}</span>
          </div>

          <div className="wiki-article-grid">
            <aside className="wiki-toc" aria-label="Table of contents">
              <p className="wiki-toc-label">On this page</p>
              <nav>
                <ul className="wiki-toc-list">
                  {toc.map((item) => (
                    <li key={item.id} className={`wiki-toc-item wiki-toc-level-${item.level}`}>
                      <a href={`#${item.id}`}>{item.text}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            <div className="wiki-article-main">
              <div className="wiki-metadata-grid">
                <div>
                  <span className="metadata-label">Area</span>
                  <strong>{entry.area}</strong>
                </div>
                <div>
                  <span className="metadata-label">Subarea</span>
                  <strong>{entry.subarea}</strong>
                </div>
                <div>
                  <span className="metadata-label">Period</span>
                  <strong>{entry.period_label || "Unknown period"}</strong>
                </div>
                <div>
                  <span className="metadata-label">Start year</span>
                  <strong>{entry.historical_start_year}</strong>
                </div>
              </div>

              <div className="wiki-markdown markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents()}
                >
                  {renderedBody}
                </ReactMarkdown>
              </div>

              <section className="wiki-section" id="references">
                <h2>References</h2>
                <ul className="plain-list wiki-ref-list">
                  {entry.references.map((reference) => (
                    <li key={reference.url}>
                      <a href={reference.url} target="_blank" rel="noreferrer">
                        {reference.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="wiki-section" id="historical-timeline">
                <div className="wiki-section-heading">
                  <h2>Historical timeline</h2>
                  <Link
                    href={
                      `/timeline?area=${encodeURIComponent(entry.area)}&target=${entry.slug}` as Route
                    }
                  >
                    Open full timeline
                  </Link>
                </div>
                <HorizontalTimeline
                  items={timelineItems}
                  focusedSlug={entry.slug}
                  className="wiki-timeline"
                  emptyMessage="No nearby timeline entries are available for this article."
                />
              </section>

              <section className="wiki-section" id="direct-connections">
                <div className="wiki-section-heading">
                  <h2>Direct connections</h2>
                  <Link href={`/graph?center=${encodeURIComponent(entry.id)}` as Route}>
                    Open full graph
                  </Link>
                </div>
                <GraphCanvas
                  graph={buildDirectGraph(entry)}
                  selectedCenterId={entry.id}
                  showControls={false}
                  showRelationFilters={false}
                  className="wiki-connection-graph"
                  emptyMessage="No direct connections are available for this article."
                />
                <ul className="connection-list wiki-connection-list">
                  {entry.connections.map((connection) => (
                    <li key={`${connection.direction}-${connection.slug}-${connection.relation_type}`}>
                      <span className={`type-dot dot-${connection.type}`} />
                      <Link href={`/wiki/${connection.slug}` as Route}>{connection.title}</Link>
                      <span className="wiki-connection-meta">
                        {connection.relation_type.replaceAll("_", " ")} · {connection.direction}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
