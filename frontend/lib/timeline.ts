import { TimelineGroup, TimelineItem } from "@/lib/types";

/** Parse a finite calendar year, or null if unusable. */
function parseYearValue(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Prefer the item's year; fall back to the group's bucket year.
 * If both are missing/invalid, returns null (caller should drop the row).
 */
function coerceYear(raw: unknown, fallback: unknown): number | null {
  return parseYearValue(raw) ?? parseYearValue(fallback);
}

/** Flatten API groups; each item gets a finite `historical_start_year` or is omitted. */
export function flattenTimelineGroups(groups: TimelineGroup[]): TimelineItem[] {
  return groups.flatMap((group) =>
    group.items
      .map((item) => {
        const y = coerceYear(item.historical_start_year, group.year);
        if (y === null) {
          return null;
        }
        return { ...item, historical_start_year: y };
      })
      .filter((row): row is TimelineItem => row !== null),
  );
}

export function buildLocalTimelineWindow(
  groups: TimelineGroup[],
  targetSlug: string,
  radius = 6,
): TimelineItem[] {
  const items = flattenTimelineGroups(groups);
  const index = items.findIndex((item) => item.slug === targetSlug);
  if (index === -1) {
    return items.slice(0, Math.min(items.length, radius * 2 + 1));
  }
  return items.slice(Math.max(0, index - radius), index + radius + 1);
}
