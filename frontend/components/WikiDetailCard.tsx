import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { WikiDetail } from "@/lib/types";

interface WikiDetailCardProps {
  entry: WikiDetail | null;
}

function labelForType(type: WikiDetail["type"]) {
  return type.replace("_", " ");
}

export function WikiDetailCard({ entry }: WikiDetailCardProps) {
  if (!entry) {
    return (
      <aside className="detail-card empty-state">
        <p className="eyebrow">Wiki Detail</p>
        <h3>Select a node or search result</h3>
        <p>
          The selected wiki entry will appear here with its article body, references,
          metadata, and connected concepts.
        </p>
      </aside>
    );
  }

  return (
    <aside className="detail-card">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Wiki Detail</p>
          <h2>{entry.title}</h2>
        </div>
        <span className={`type-pill type-${entry.type}`}>{labelForType(entry.type)}</span>
      </div>

      <div className="metadata-grid">
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

      <p className="detail-summary">{entry.summary}</p>

      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.body}</ReactMarkdown>
      </div>

      <section>
        <h3>References</h3>
        <ul className="plain-list">
          {entry.references.map((reference) => (
            <li key={reference.url}>
              <a href={reference.url} target="_blank" rel="noreferrer">
                {reference.title}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Connections</h3>
        <ul className="connection-list">
          {entry.connections.map((connection) => (
            <li key={`${connection.direction}-${connection.slug}-${connection.relation_type}`}>
              <span className={`type-dot dot-${connection.type}`} />
              <strong>{connection.title}</strong>
              <span>{connection.relation_type.replaceAll("_", " ")}</span>
              <em>{connection.direction}</em>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

