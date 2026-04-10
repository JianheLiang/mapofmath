import type { Route } from "next";
import Link from "next/link";

import { TimelineGroup } from "@/lib/types";

interface TimelinePanelProps {
  timeline: TimelineGroup[];
}

export function TimelinePanel({ timeline }: TimelinePanelProps) {
  return (
    <section id="section-timeline" className="panel section-panel home-panel">
      <div className="section-heading home-section-heading">
        <p className="eyebrow">03 Historical trend</p>
        <div>
          <h2>Follow the chronology of the ideas</h2>
          <p>
            The timeline is derived from wiki metadata so concept history, theorem
            emergence, and biography can be explored through the same data model.
          </p>
        </div>
      </div>

      <div className="timeline">
        {timeline.length === 0 ? (
          <div className="empty-state">
            <p>No timeline items match the current filters.</p>
          </div>
        ) : (
          timeline.map((group) => (
            <div key={group.year} className="timeline-group">
              <div className="timeline-year">{group.year}</div>
              <div className="timeline-items">
                {group.items.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/wiki/${item.slug}` as Route}
                    className="timeline-item timeline-item-link"
                  >
                    <span className={`type-pill type-${item.type}`}>{item.type}</span>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <small>{item.period_label || item.area}</small>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
