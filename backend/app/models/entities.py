from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


EntryType = Literal["concept", "theorem", "mathematician"]
GraphNodeType = Literal["concept", "theorem", "mathematician", "area"]
RelationType = Literal[
    "defines_with",
    "used_in_proof",
    "related_to",
    "worked_on",
    "belongs_to_area",
    "influenced_by",
]

VALID_ENTRY_TYPES = {"concept", "theorem", "mathematician"}
VALID_RELATION_TYPES = {
    "defines_with",
    "used_in_proof",
    "related_to",
    "worked_on",
    "belongs_to_area",
    "influenced_by",
}


class Reference(BaseModel):
    title: str
    url: str


class SourceMetadata(BaseModel):
    name: str
    url: str
    license: Optional[str] = None
    retrieved_at: Optional[str] = None
    external_id: Optional[str] = None
    external_title: Optional[str] = None


class Relation(BaseModel):
    target_slug: str
    relation_type: RelationType
    evidence: Optional[str] = None
    weight: Optional[float] = None


class WikiEntry(BaseModel):
    id: str
    slug: str
    title: str
    type: EntryType
    summary: str
    body: str
    area: str
    subarea: str
    references: List[Reference]
    historical_start_year: int
    historical_end_year: Optional[int] = None
    period_label: Optional[str] = None
    mathematicians: List[str] = Field(default_factory=list)
    relations: List[Relation] = Field(default_factory=list)
    source: Optional[SourceMetadata] = None


class Connection(BaseModel):
    slug: str
    title: str
    type: EntryType
    relation_type: RelationType
    direction: Literal["incoming", "outgoing"]
    area: str


class WikiDetail(WikiEntry):
    connections: List[Connection] = Field(default_factory=list)


class SearchResult(BaseModel):
    id: str
    slug: str
    title: str
    type: EntryType
    summary: str
    area: str
    subarea: str
    historical_start_year: int
    historical_end_year: Optional[int] = None
    period_label: Optional[str] = None


class GraphNode(BaseModel):
    id: str
    slug: str
    title: str
    type: GraphNodeType
    area: str
    subarea: Optional[str] = None
    cluster: str
    historical_start_year: Optional[int] = None


class GraphEdge(BaseModel):
    source: str
    target: str
    relation_type: RelationType
    evidence: Optional[str] = None
    weight: Optional[float] = None


class GraphPayload(BaseModel):
    center_id: Optional[str] = None
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class TimelineItem(BaseModel):
    id: str
    slug: str
    title: str
    type: EntryType
    area: str
    historical_start_year: int
    period_label: Optional[str] = None
    summary: str


class TimelineGroup(BaseModel):
    year: int
    items: List[TimelineItem]


class IngestionReport(BaseModel):
    entry_count: int
    area_count: int
    relation_count: int
    source_path: str
