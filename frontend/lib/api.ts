import {
  GraphPayload,
  QueryFilters,
  SearchResult,
  TimelineGroup,
  WikiDetail,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });
  return query.toString();
}

export async function searchEntries(
  query: string,
  filters: QueryFilters,
): Promise<SearchResult[]> {
  const qs = buildQuery({
    q: query,
    type: filters.type || undefined,
    area: filters.area || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  });
  const response = await fetch(`${API_BASE_URL}/api/search?${qs}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to search entries");
  }
  return response.json();
}

export async function getWiki(slug: string): Promise<WikiDetail> {
  const response = await fetch(`${API_BASE_URL}/api/wiki/${slug}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load wiki entry");
  }
  return response.json();
}

export async function getGraph(
  centerId: string | null,
  depth: number,
  area: string,
): Promise<GraphPayload> {
  const qs = buildQuery({
    center: centerId || undefined,
    depth: String(depth),
    area: area || undefined,
  });
  const response = await fetch(`${API_BASE_URL}/api/graph?${qs}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load graph");
  }
  return response.json();
}

export async function getTimeline(filters: QueryFilters): Promise<TimelineGroup[]> {
  const qs = buildQuery({
    type: filters.type || undefined,
    area: filters.area || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  });
  const response = await fetch(`${API_BASE_URL}/api/timeline?${qs}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load timeline");
  }
  return response.json();
}
