from __future__ import annotations

from typing import Dict, List, Optional, Sequence

from neo4j import GraphDatabase

from backend.app.models.entities import (
    Connection,
    GraphEdge,
    GraphNode,
    GraphPayload,
    SearchResult,
    TimelineGroup,
    TimelineItem,
    WikiDetail,
    WikiEntry,
)
from backend.app.repositories.base import WikiRepository


class Neo4jWikiRepository(WikiRepository):
    def __init__(self, uri: str, username: str, password: str) -> None:
        self._driver = GraphDatabase.driver(uri, auth=(username, password))

    def replace_all(self, entries: List[WikiEntry]) -> None:
        with self._driver.session() as session:
            session.run("MATCH (n:WikiEntry) DETACH DELETE n")
            session.run("MATCH (n:Area) DETACH DELETE n")

            for entry in entries:
                session.run(
                    """
                    MERGE (e:WikiEntry {id: $id})
                    SET e.slug = $slug,
                        e.title = $title,
                        e.type = $type,
                        e.summary = $summary,
                        e.body = $body,
                        e.area = $area,
                        e.subarea = $subarea,
                        e.references = $references,
                        e.source = $source,
                        e.historical_start_year = $historical_start_year,
                        e.historical_end_year = $historical_end_year,
                        e.period_label = $period_label,
                        e.mathematicians = $mathematicians
                    MERGE (a:Area {slug: $area})
                    SET a.title = $area_title
                    MERGE (e)-[:BELONGS_TO_AREA {relation_type: 'belongs_to_area'}]->(a)
                    """,
                    {
                        "id": entry.id,
                        "slug": entry.slug,
                        "title": entry.title,
                        "type": entry.type,
                        "summary": entry.summary,
                        "body": entry.body,
                        "area": entry.area,
                        "subarea": entry.subarea,
                        "references": [reference.model_dump() for reference in entry.references],
                        "source": entry.source.model_dump() if entry.source else None,
                        "historical_start_year": entry.historical_start_year,
                        "historical_end_year": entry.historical_end_year,
                        "period_label": entry.period_label,
                        "mathematicians": entry.mathematicians,
                        "area_title": entry.area.title(),
                    },
                )

            for entry in entries:
                for relation in entry.relations:
                    session.run(
                        """
                        MATCH (source:WikiEntry {slug: $source_slug})
                        MATCH (target:WikiEntry {slug: $target_slug})
                        MERGE (source)-[r:RELATES_TO {relation_type: $relation_type, target_slug: $target_slug}]->(target)
                        SET r.evidence = $evidence,
                            r.weight = $weight
                        """,
                        {
                            "source_slug": entry.slug,
                            "target_slug": relation.target_slug,
                            "relation_type": relation.relation_type,
                            "evidence": relation.evidence,
                            "weight": relation.weight,
                        },
                    )

    def search(
        self,
        query: str = "",
        entry_type: Optional[str] = None,
        area: Optional[str] = None,
        subarea: Optional[str] = None,
        year_from: Optional[int] = None,
        year_to: Optional[int] = None,
    ) -> List[SearchResult]:
        cypher = """
        MATCH (e:WikiEntry)
        WHERE ($entry_type IS NULL OR e.type = $entry_type)
          AND ($area IS NULL OR e.area = $area OR toLower(e.subarea) CONTAINS toLower($area))
          AND ($subarea IS NULL OR e.subarea = $subarea)
          AND ($year_from IS NULL OR e.historical_start_year >= $year_from)
          AND ($year_to IS NULL OR e.historical_start_year <= $year_to)
          AND (
              $query = '' OR
              toLower(e.title) CONTAINS toLower($query) OR
              toLower(e.summary) CONTAINS toLower($query) OR
              toLower(e.body) CONTAINS toLower($query)
          )
        RETURN e
        ORDER BY e.historical_start_year ASC, e.title ASC
        """
        with self._driver.session() as session:
            records = session.run(
                cypher,
                {
                    "query": query,
                    "entry_type": entry_type,
                    "area": area,
                    "subarea": subarea,
                    "year_from": year_from,
                    "year_to": year_to,
                },
            )
            return [self._search_result_from_node(record["e"]) for record in records]

    def get_by_slug(self, slug: str) -> Optional[WikiDetail]:
        with self._driver.session() as session:
            record = session.run(
                "MATCH (e:WikiEntry {slug: $slug}) RETURN e",
                {"slug": slug},
            ).single()
            if not record:
                return None

            node = record["e"]
            detail = WikiDetail(
                id=node["id"],
                slug=node["slug"],
                title=node["title"],
                type=node["type"],
                summary=node["summary"],
                body=node["body"],
                area=node["area"],
                subarea=node["subarea"],
                references=node["references"],
                historical_start_year=node["historical_start_year"],
                historical_end_year=node.get("historical_end_year"),
                period_label=node.get("period_label"),
                mathematicians=node.get("mathematicians", []),
                relations=[],
                connections=[],
                source=node.get("source"),
            )

            outgoing = session.run(
                """
                MATCH (e:WikiEntry {slug: $slug})-[r:RELATES_TO]->(target:WikiEntry)
                RETURN target, r
                ORDER BY target.title ASC
                """,
                {"slug": slug},
            )
            incoming = session.run(
                """
                MATCH (source:WikiEntry)-[r:RELATES_TO]->(e:WikiEntry {slug: $slug})
                RETURN source, r
                ORDER BY source.title ASC
                """,
                {"slug": slug},
            )

            connections: List[Connection] = []
            for outgoing_record in outgoing:
                target = outgoing_record["target"]
                relation = outgoing_record["r"]
                connections.append(
                    Connection(
                        slug=target["slug"],
                        title=target["title"],
                        type=target["type"],
                        relation_type=relation["relation_type"],
                        direction="outgoing",
                        area=target["area"],
                    )
                )

            for incoming_record in incoming:
                source = incoming_record["source"]
                relation = incoming_record["r"]
                connections.append(
                    Connection(
                        slug=source["slug"],
                        title=source["title"],
                        type=source["type"],
                        relation_type=relation["relation_type"],
                        direction="incoming",
                        area=source["area"],
                    )
                )

            detail.connections = connections
            return detail

    def get_graph(
        self,
        center_id: Optional[str] = None,
        depth: int = 1,
        area: Optional[str] = None,
    ) -> GraphPayload:
        entry_ids = self._select_entry_ids(center_id=center_id, depth=depth, area=area)
        if not entry_ids:
            return GraphPayload(center_id=center_id, nodes=[], edges=[])

        with self._driver.session() as session:
            node_records = session.run(
                """
                MATCH (e:WikiEntry)
                WHERE e.id IN $ids
                RETURN e
                ORDER BY e.title ASC
                """,
                {"ids": entry_ids},
            )
            relation_records = session.run(
                """
                MATCH (source:WikiEntry)-[r:RELATES_TO]->(target:WikiEntry)
                WHERE source.id IN $ids AND target.id IN $ids
                RETURN source, target, r
                """,
                {"ids": entry_ids},
            )

            nodes: List[GraphNode] = []
            edges: List[GraphEdge] = []
            areas: Dict[str, GraphNode] = {}

            for record in node_records:
                node = record["e"]
                area_name = node["area"]
                if area_name not in areas:
                    areas[area_name] = GraphNode(
                        id="area:{0}".format(area_name),
                        slug=area_name,
                        title=area_name.title(),
                        type="area",
                        area=area_name,
                        cluster=area_name,
                    )
                nodes.append(
                    GraphNode(
                        id=node["id"],
                        slug=node["slug"],
                        title=node["title"],
                        type=node["type"],
                        area=node["area"],
                        subarea=node["subarea"],
                        cluster=node["area"],
                        historical_start_year=node["historical_start_year"],
                    )
                )
                edges.append(
                    GraphEdge(
                        source=node["id"],
                        target="area:{0}".format(area_name),
                        relation_type="belongs_to_area",
                    )
                )

            for relation_record in relation_records:
                source = relation_record["source"]
                target = relation_record["target"]
                relation = relation_record["r"]
                edges.append(
                    GraphEdge(
                        source=source["id"],
                        target=target["id"],
                        relation_type=relation["relation_type"],
                        evidence=relation.get("evidence"),
                        weight=relation.get("weight"),
                    )
                )

            return GraphPayload(
                center_id=center_id,
                nodes=list(areas.values()) + nodes,
                edges=edges,
            )

    def get_timeline(
        self,
        area: Optional[str] = None,
        entry_type: Optional[str] = None,
        year_from: Optional[int] = None,
        year_to: Optional[int] = None,
    ) -> List[TimelineGroup]:
        with self._driver.session() as session:
            records = session.run(
                """
                MATCH (e:WikiEntry)
                WHERE ($area IS NULL OR e.area = $area OR toLower(e.subarea) CONTAINS toLower($area))
                  AND ($entry_type IS NULL OR e.type = $entry_type)
                  AND ($year_from IS NULL OR e.historical_start_year >= $year_from)
                  AND ($year_to IS NULL OR e.historical_start_year <= $year_to)
                RETURN e
                ORDER BY e.historical_start_year ASC, e.title ASC
                """,
                {
                    "area": area,
                    "entry_type": entry_type,
                    "year_from": year_from,
                    "year_to": year_to,
                },
            )

            buckets: Dict[int, List[TimelineItem]] = {}
            for record in records:
                node = record["e"]
                buckets.setdefault(node["historical_start_year"], []).append(
                    TimelineItem(
                        id=node["id"],
                        slug=node["slug"],
                        title=node["title"],
                        type=node["type"],
                        area=node["area"],
                        period_label=node.get("period_label"),
                        summary=node["summary"],
                    )
                )

            return [
                TimelineGroup(year=year, items=items)
                for year, items in sorted(buckets.items(), key=lambda item: item[0])
            ]

    def close(self) -> None:
        self._driver.close()

    def _search_result_from_node(self, node) -> SearchResult:
        return SearchResult(
            id=node["id"],
            slug=node["slug"],
            title=node["title"],
            type=node["type"],
            summary=node["summary"],
            area=node["area"],
            subarea=node["subarea"],
            historical_start_year=node["historical_start_year"],
            historical_end_year=node.get("historical_end_year"),
            period_label=node.get("period_label"),
        )

    def _select_entry_ids(
        self,
        center_id: Optional[str],
        depth: int,
        area: Optional[str],
    ) -> Sequence[str]:
        with self._driver.session() as session:
            if center_id:
                center_exists = session.run(
                    "MATCH (center:WikiEntry {id: $center_id}) RETURN center.id AS id",
                    {"center_id": center_id},
                ).single()
                if not center_exists:
                    return []

                traversal_query = """
                MATCH p=(center:WikiEntry {id: $center_id})-[:RELATES_TO*0..{depth}]-(node:WikiEntry)
                RETURN DISTINCT node.id AS id
                """.format(depth=max(1, depth))
                records = session.run(traversal_query, {"center_id": center_id})
                entry_ids = [record["id"] for record in records]
            else:
                records = session.run(
                    """
                    MATCH (e:WikiEntry)
                    WHERE ($area IS NULL OR e.area = $area OR toLower(e.subarea) CONTAINS toLower($area))
                    RETURN e.id AS id
                    ORDER BY e.title ASC
                    """,
                    {"area": area},
                )
                entry_ids = [record["id"] for record in records]

            if not area:
                return entry_ids

            filtered = session.run(
                """
                MATCH (e:WikiEntry)
                WHERE e.id IN $ids AND (e.area = $area OR toLower(e.subarea) CONTAINS toLower($area))
                RETURN e.id AS id
                """,
                {"ids": entry_ids, "area": area},
            )
            return [record["id"] for record in filtered]
