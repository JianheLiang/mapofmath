import { ReadonlyURLSearchParams } from "next/navigation";

import { EntryType, QueryFilters } from "@/lib/types";

type SearchParamsLike =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | { get: (key: string) => string | null };

const validEntryTypes = new Set<EntryType>(["concept", "theorem", "mathematician"]);

export interface ExplorerQueryState {
  query: string;
  filters: QueryFilters;
  center: string | null;
  target: string | null;
}

export function readExplorerQueryState(searchParams: SearchParamsLike): ExplorerQueryState {
  const typeParam = searchParams.get("type");
  return {
    query: searchParams.get("q") ?? "",
    filters: {
      type: validEntryTypes.has(typeParam as EntryType) ? (typeParam as EntryType) : "",
      area: searchParams.get("area") ?? "",
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
    },
    center: searchParams.get("center"),
    target: searchParams.get("target") ?? searchParams.get("focus"),
  };
}

export function buildExplorerQueryString({
  query,
  filters,
  center,
  target,
}: {
  query: string;
  filters: QueryFilters;
  center?: string | null;
  target?: string | null;
}): string {
  const searchParams = new URLSearchParams();

  if (query.trim()) {
    searchParams.set("q", query.trim());
  }
  if (filters.type) {
    searchParams.set("type", filters.type);
  }
  if (filters.area.trim()) {
    searchParams.set("area", filters.area.trim());
  }
  if (filters.from.trim()) {
    searchParams.set("from", filters.from.trim());
  }
  if (filters.to.trim()) {
    searchParams.set("to", filters.to.trim());
  }
  if (center) {
    searchParams.set("center", center);
  }
  if (target) {
    searchParams.set("target", target);
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}
