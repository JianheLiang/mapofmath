"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import type { DataItem, Timeline, TimelineOptions } from "vis-timeline";

import {
  barDurationMs,
  createYearTimeMapping,
  escapeHtmlText,
  truncateToWords,
  type YearTimeMapping,
} from "@/lib/timeline-scale";
import { TimelineItem } from "@/lib/types";

interface HorizontalTimelineProps {
  items: TimelineItem[];
  focusedSlug?: string | null;
  /** When true, the detail card stays visible for `focusedSlug` without hover (e.g. timeline page list selection). */
  selectionPreview?: boolean;
  previewHref?: string;
  className?: string;
  emptyMessage?: string;
}

interface RangeLabel {
  start: Date;
  end: Date;
}

function toEpochMs(value: unknown): number {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      return asNumber;
    }
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  if (value && typeof value === "object") {
    if ("valueOf" in value && typeof (value as { valueOf: () => unknown }).valueOf === "function") {
      const primitive = (value as { valueOf: () => unknown }).valueOf();
      if (primitive !== value) {
        return toEpochMs(primitive);
      }
    }
    if ("toDate" in value && typeof (value as { toDate: () => unknown }).toDate === "function") {
      return toEpochMs((value as { toDate: () => unknown }).toDate());
    }
  }
  return Date.now();
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/'/g, "&#39;");
}

function initialLetter(title: string): string {
  const t = title.trim();
  if (!t) {
    return "?";
  }
  const cp = t.codePointAt(0);
  if (cp === undefined) {
    return "?";
  }
  return String.fromCodePoint(cp).toUpperCase();
}

function formatRangeLabel(range: RangeLabel | null, mapping: YearTimeMapping): string {
  if (!range) {
    return "";
  }

  const y0 = mapping.toYear(range.start.getTime());
  const y1 = mapping.toYear(range.end.getTime());
  const lo = Math.min(y0, y1);
  const hi = Math.max(y0, y1);
  if (lo === hi) {
    return `${lo}`;
  }
  return `${lo}–${hi}`;
}

type MomTimelineDataItem = DataItem & { momTooltipHtml: string };

export function HorizontalTimeline({
  items,
  focusedSlug = null,
  selectionPreview = false,
  previewHref,
  className,
  emptyMessage = "No timeline items match the current filters.",
}: HorizontalTimelineProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHoverSlugRef = useRef<string | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [viewRange, setViewRange] = useState<RangeLabel | null>(null);

  const sortedItems = useMemo(() => {
    const withYear = items
      .map((item) => {
        const raw = item.historical_start_year;
        if (raw == null) {
          return null;
        }
        const y =
          typeof raw === "number" && Number.isFinite(raw) ? raw : Number(raw);
        return Number.isFinite(y) ? { ...item, historical_start_year: y } : null;
      })
      .filter((row): row is TimelineItem => row !== null);

    return [...withYear].sort(
      (left, right) =>
        left.historical_start_year - right.historical_start_year ||
        left.title.localeCompare(right.title),
    );
  }, [items]);

  const yearExtent = useMemo(() => {
    if (sortedItems.length === 0) {
      return null;
    }
    const ys = sortedItems.map((item) => item.historical_start_year);
    return { min: Math.min(...ys), max: Math.max(...ys) };
  }, [sortedItems]);

  const mapping = useMemo(
    () => (yearExtent ? createYearTimeMapping(yearExtent.min, yearExtent.max) : null),
    [yearExtent],
  );

  const timelineItems = useMemo<MomTimelineDataItem[]>(() => {
    if (!mapping || sortedItems.length === 0) {
      return [];
    }
    const barMs = barDurationMs(mapping);
    return sortedItems.map((item) => {
      const startMs = mapping.toTime(item.historical_start_year);
      const endMs = startMs + barMs;
      const initial = initialLetter(item.title);
      const excerpt = truncateToWords(item.summary, 30);
      const momTooltipHtml = excerpt
        ? `<span class="mom-vis-tooltip">${escapeHtmlText(excerpt)}</span>`
        : `<span class="mom-vis-tooltip">${escapeHtmlText(
            `Entry “${item.title}” (${item.historical_start_year}). Open wiki for details.`,
          )}</span>`;

      return {
        id: item.slug,
        type: "box",
        start: new Date(startMs),
        end: new Date(endMs),
        title: excerpt || item.title,
        momTooltipHtml,
        content: `
          <div class="mom-timeline-pill" role="presentation">
            <span class="mom-timeline-pill-avatar type-${item.type}" aria-hidden="true">${escapeAttr(initial)}</span>
            <span class="mom-timeline-pill-title">${escapeAttr(item.title)}</span>
          </div>
        `,
        className: `mom-timeline-pill-item mom-timeline-item type-${item.type} ${item.slug === focusedSlug ? "is-focused" : ""}`,
      };
    });
  }, [focusedSlug, sortedItems, mapping]);

  const previewSlug =
    hoveredSlug ?? (selectionPreview && focusedSlug ? focusedSlug : null);

  const previewItem = useMemo(
    () => (previewSlug ? sortedItems.find((item) => item.slug === previewSlug) ?? null : null),
    [previewSlug, sortedItems],
  );

  useEffect(() => {
    if (!containerRef.current || sortedItems.length === 0 || !mapping) {
      return;
    }

    let timelineDestroyed = false;
    let instance: Timeline | null = null;

    const clearLeaveTimer = () => {
      if (leaveTimerRef.current !== null) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
    };

    const buildTimeline = async () => {
      const vis = await import("vis-timeline/standalone");
      if (timelineDestroyed || !containerRef.current) {
        return;
      }

      const yearsRaw = sortedItems.map((item) => item.historical_start_year);
      const minYear = Math.min(...yearsRaw);
      const maxYear = Math.max(...yearsRaw);

      if (!Number.isFinite(minYear) || !Number.isFinite(maxYear)) {
        return;
      }

      const windowStart = new Date(mapping.rangeStartMs);
      const windowEnd = new Date(mapping.rangeEndMs);

      const options: TimelineOptions = {
        start: windowStart,
        end: windowEnd,
        min: new Date(mapping.rangeStartMs - (mapping.rangeEndMs - mapping.rangeStartMs) * 0.15),
        max: new Date(mapping.rangeEndMs + (mapping.rangeEndMs - mapping.rangeStartMs) * 0.15),
        zoomMin: 1000 * 60 * 60 * 24 * 14,
        zoomMax: 1000 * 60 * 60 * 24 * 365 * 800,
        moveable: true,
        zoomable: true,
        preferZoom: true,
        zoomKey: "altKey",
        horizontalScroll: true,
        stack: true,
        cluster: {
          maxItems: previewHref ? 3 : 4,
          fitOnDoubleClick: true,
        },
        showCurrentTime: false,
        showMajorLabels: true,
        showMinorLabels: false,
        format: {
          minorLabels: () => "",
          majorLabels: (date: Date | string | number) => String(mapping.toYear(toEpochMs(date))),
        },
        orientation: {
          axis: "bottom",
          item: "top",
        },
        height: previewHref ? "200px" : "300px",
        margin: {
          item: {
            horizontal: 10,
            vertical: previewHref ? 10 : 14,
          },
          axis: 16,
        },
        showTooltips: true,
        tooltip: {
          followMouse: true,
          overflowMethod: "cap",
          template(item: { momTooltipHtml?: string; title?: string }) {
            return item.momTooltipHtml ?? `<span class="mom-vis-tooltip">${escapeHtmlText(item.title ?? "")}</span>`;
          },
        },
        clickToUse: false,
      };

      instance = new vis.Timeline(containerRef.current, timelineItems as DataItem[], options);
      timelineRef.current = instance;

      const syncWindow = () => {
        if (!instance) {
          return;
        }
        const windowRange = instance.getWindow();
        setViewRange({
          start: windowRange.start,
          end: windowRange.end,
        });
      };

      syncWindow();

      instance.on("rangechanged", syncWindow);
      instance.on("rangechange", syncWindow);

      instance.on("itemover", (properties: { item?: string | number | null }) => {
        clearLeaveTimer();
        if (typeof properties.item === "string") {
          lastHoverSlugRef.current = properties.item;
          setHoveredSlug(properties.item);
        }
      });

      instance.on("itemout", () => {
        clearLeaveTimer();
        leaveTimerRef.current = setTimeout(() => {
          setHoveredSlug(null);
          leaveTimerRef.current = null;
        }, 220);
      });

      instance.on("select", (properties: { items?: Array<string | number> }) => {
        const itemId = properties.items?.[0];
        if (typeof itemId === "string") {
          setHoveredSlug(itemId);
        }
      });

      instance.on(
        "click",
        (properties: { item?: string | number | null; what?: string; isCluster?: boolean }) => {
          if (properties.isCluster) {
            return;
          }

          if (typeof properties.item === "string") {
            if (previewHref) {
              router.push(previewHref as Route);
              return;
            }
            router.push(`/wiki/${properties.item}` as Route);
            return;
          }

          /* Background / axis clicks: do not navigate (allows free pan on homepage). */
        },
      );

      if (focusedSlug) {
        instance.setSelection([focusedSlug], {
          focus: true,
          animation: {
            animation: {
              duration: 300,
              easingFunction: "easeInOutQuad",
            },
          },
        });
      }
    };

    void buildTimeline();

    return () => {
      timelineDestroyed = true;
      clearLeaveTimer();
      if (instance) {
        instance.destroy();
      }
      timelineRef.current = null;
    };
  }, [focusedSlug, mapping, previewHref, router, sortedItems, timelineItems]);

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline || !focusedSlug) {
      return;
    }

    timeline.setSelection([focusedSlug], {
      focus: true,
      animation: {
        animation: {
          duration: 260,
          easingFunction: "easeInOutQuad",
        },
      },
    });
  }, [focusedSlug]);

  if (sortedItems.length === 0) {
    return (
      <div className={`empty-state ${className ?? ""}`.trim()}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const previewSummary =
    previewItem ? truncateToWords(previewItem.summary, 30) : "";

  return (
    <div className={`timeline-surface ${className ?? ""}`.trim()}>
      <div className="timeline-top-row">
        <div className="timeline-view-window">
          <span className="timeline-view-window-label">Visible range (years)</span>
          <strong>{mapping ? formatRangeLabel(viewRange, mapping) : ""}</strong>
          {mapping?.isLog ? (
            <span className="timeline-scale-badge" title="Axis uses logarithmic spacing in the year domain">
              Log scale
            </span>
          ) : null}
        </div>

        {previewItem ? (
          <div
            className="timeline-preview-card"
            onMouseEnter={() => {
              if (leaveTimerRef.current !== null) {
                clearTimeout(leaveTimerRef.current);
                leaveTimerRef.current = null;
              }
              if (lastHoverSlugRef.current) {
                setHoveredSlug(lastHoverSlugRef.current);
              }
            }}
            onMouseLeave={() => {
              setHoveredSlug(null);
            }}
          >
            <p className="timeline-preview-year">{previewItem.historical_start_year}</p>
            <h3>{previewItem.title}</h3>
            <p>{previewSummary}</p>
          </div>
        ) : null}
      </div>

      <p className="timeline-interaction-hint" role="note">
        Wheel pans along time; hold <kbd>Alt</kbd> (<kbd>Option</kbd> on Mac) and scroll to zoom. Hover a pill for a
        short summary; click to open the wiki article.
      </p>

      <div className="timeline-scroll-shell">
        <div ref={containerRef} className="vis-timeline-shell" />
      </div>
    </div>
  );
}
