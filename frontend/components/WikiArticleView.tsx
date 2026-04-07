import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { isValidElement, type ReactNode } from "react";

import { extractMarkdownToc } from "@/lib/markdown-toc";
import { slugifyHeading } from "@/lib/slugify";
import { WikiDetail } from "@/lib/types";

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

interface WikiArticleViewProps {
  entry: WikiDetail;
}

export function WikiArticleView({ entry }: WikiArticleViewProps) {
  const tocFromMarkdown = extractMarkdownToc(entry.body);
  const seen = new Set(tocFromMarkdown.map((item) => item.id));
  const toc: { id: string; text: string; level: number }[] = [...tocFromMarkdown];
  if (!seen.has("references")) {
    toc.push({ id: "references", text: "References", level: 2 });
  }
  if (!seen.has("connections")) {
    toc.push({ id: "connections", text: "Connections", level: 2 });
  }

  return (
    <article className="wiki-article">
      <p className="wiki-article-status">Curated entry · mathematics knowledge graph</p>

      <div className="wiki-article-title-row">
        <h1 className="wiki-article-title">{entry.title}</h1>
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

          <p className="wiki-lead">{entry.summary}</p>

          <div className="wiki-markdown markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents()}>
              {entry.body}
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

          <section className="wiki-section" id="connections">
            <h2>Connections</h2>
            <ul className="connection-list wiki-connection-list">
              {entry.connections.map((connection) => (
                <li key={`${connection.direction}-${connection.slug}-${connection.relation_type}`}>
                  <span className={`type-dot dot-${connection.type}`} />
                  <Link href={`/wiki/${connection.slug}`}>{connection.title}</Link>
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
  );
}
