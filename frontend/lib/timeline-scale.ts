/** Synthetic span (ms) used as the vis-timeline x-axis; labels are rewritten to calendar years. */
const LOG_RANGE_MS = 1_000_000_000_000;
const YEAR_MS = 86_400_000 * 365.2425;

export type YearTimeMapping = {
  /** Map a calendar year to milliseconds on the synthetic axis. */
  toTime: (year: number) => number;
  /** Inverse: synthetic ms → approximate calendar year (for axis + range readout). */
  toYear: (ms: number) => number;
  rangeStartMs: number;
  rangeEndMs: number;
  /** True when years use logarithmic compression on the axis. */
  isLog: boolean;
};

/**
 * Logarithmic spacing in the year domain keeps distant centuries from crowding recent ones.
 * Falls back to linear when there is only one distinct year.
 */
export function createYearTimeMapping(minYear: number, maxYear: number): YearTimeMapping {
  if (!Number.isFinite(minYear) || !Number.isFinite(maxYear)) {
    return {
      toTime: () => 0,
      toYear: () => minYear,
      rangeStartMs: 0,
      rangeEndMs: LOG_RANGE_MS,
      isLog: false,
    };
  }

  if (maxYear <= minYear) {
    return {
      toTime: (y: number) => (y - minYear) * YEAR_MS,
      toYear: (ms: number) => minYear + Math.round(ms / YEAR_MS),
      rangeStartMs: -YEAR_MS * 2,
      rangeEndMs: YEAR_MS * 4,
      isLog: false,
    };
  }

  const lmin = Math.log10(1.1);
  const lmax = Math.log10(maxYear - minYear + 1.1);

  return {
    toTime: (y: number) => {
      const lo = Math.log10(y - minYear + 1.1);
      return ((lo - lmin) / (lmax - lmin)) * LOG_RANGE_MS;
    },
    toYear: (ms: number) => {
      const t = ms / LOG_RANGE_MS;
      const lo = lmin + t * (lmax - lmin);
      return Math.round(minYear + 10 ** lo - 1.1);
    },
    rangeStartMs: -LOG_RANGE_MS * 0.03,
    rangeEndMs: LOG_RANGE_MS * 1.03,
    isLog: true,
  };
}

export function barDurationMs(mapping: YearTimeMapping): number {
  const span = mapping.rangeEndMs - mapping.rangeStartMs;
  return Math.max(span * 0.02, 86_400_000 * 40);
}

export function truncateToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "";
  }
  if (words.length <= maxWords) {
    return words.join(" ");
  }
  return `${words.slice(0, maxWords).join(" ")}…`;
}

/** Minimal escape for tooltip HTML (vis applies XSS filter as well). */
export function escapeHtmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
