export type EntryType = "concept" | "theorem" | "mathematician";
export type GraphNodeType = EntryType | "area";
export type RelationType =
  | "defines_with"
  | "used_in_proof"
  | "related_to"
  | "worked_on"
  | "belongs_to_area"
  | "influenced_by";

export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  type: EntryType;
  summary: string;
  area: string;
  subarea: string;
  historical_start_year: number;
  historical_end_year?: number | null;
  period_label?: string | null;
}

export interface ReferenceLink {
  title: string;
  url: string;
}

export interface Connection {
  slug: string;
  title: string;
  type: EntryType;
  relation_type: RelationType;
  direction: "incoming" | "outgoing";
  area: string;
}

export interface WikiDetail extends SearchResult {
  body: string;
  references: ReferenceLink[];
  mathematicians: string[];
  connections: Connection[];
}

export interface GraphNode {
  id: string;
  slug: string;
  title: string;
  type: GraphNodeType;
  area: string;
  subarea?: string | null;
  cluster: string;
  historical_start_year?: number | null;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation_type: RelationType;
  evidence?: string | null;
  weight?: number | null;
}

export interface GraphPayload {
  center_id?: string | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface TimelineItem {
  id: string;
  slug: string;
  title: string;
  type: EntryType;
  area: string;
  period_label?: string | null;
  summary: string;
}

export interface TimelineGroup {
  year: number;
  items: TimelineItem[];
}

export interface QueryFilters {
  type: "" | EntryType;
  area: string;
  from: string;
  to: string;
}

