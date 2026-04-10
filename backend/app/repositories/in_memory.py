from __future__ import annotations

from collections import deque
from typing import Dict, List, Optional, Set

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
from backend.app.services.filtering import matches_area_filter


class InMemoryWikiRepository(WikiRepository):
    def __init__(self) -> None:
        self._entries_by_slug: Dict[str, WikiEntry] = {}
        self._entries_by_id: Dict[str, WikiEntry] = {}

    def replace_all(self, entries: List[WikiEntry]) -> None:
        self._entries_by_slug = {entry.slug: entry for entry in entries}
        self._entries_by_id = {entry.id: entry for entry in entries}

    def search(
        self,
        query: str = "",
        entry_type: Optional[str] = None,
        area: Optional[str] = None,
        subarea: Optional[str] = None,
        year_from: Optional[int] = None,
        year_to: Optional[int] = None,
        limit: Optional[int] = None,
    ) -> List[SearchResult]:
        matches: List[SearchResult] = []
        needle = query.strip().lower()

        for entry in self._entries_by_slug.values():
            if entry_type and entry.type != entry_type:
                continue
            if area and not matches_area_filter(entry.area, entry.subarea, area):
                continue
            if subarea and entry.subarea != subarea:
                continue
            if year_from and entry.historical_start_year < year_from:
                continue
            if year_to and entry.historical_start_year > year_to:
                continue

            haystack = " ".join([entry.title, entry.summary, entry.body]).lower()
            if needle and needle not in haystack:
                continue

            matches.append(
                SearchResult(
                    id=entry.id,
                    slug=entry.slug,
                    title=entry.title,
                    type=entry.type,
                    summary=entry.summary,
                    area=entry.area,
                    subarea=entry.subarea,
                    historical_start_year=entry.historical_start_year,
                    historical_end_year=entry.historical_end_year,
                    period_label=entry.period_label,
                )
            )

        ordered = sorted(matches, key=lambda item: (item.historical_start_year, item.title))
        return ordered[:limit] if limit else ordered

    def get_by_slug(self, slug: str) -> Optional[WikiDetail]:
        entry = self._entries_by_slug.get(slug)
        if not entry:
            return None

        connections: List[Connection] = []
        for relation in entry.relations:
            target = self._entries_by_slug.get(relation.target_slug)
            if not target:
                continue
            connections.append(
                Connection(
                    slug=target.slug,
                    title=target.title,
                    type=target.type,
                    relation_type=relation.relation_type,
                    direction="outgoing",
                    area=target.area,
                )
            )

        for candidate in self._entries_by_slug.values():
            for relation in candidate.relations:
                if relation.target_slug != slug:
                    continue
                connections.append(
                    Connection(
                        slug=candidate.slug,
                        title=candidate.title,
                        type=candidate.type,
                        relation_type=relation.relation_type,
                        direction="incoming",
                        area=candidate.area,
                    )
                )

        return WikiDetail(**entry.model_dump(), connections=connections)

    def get_graph(
        self,
        center_id: Optional[str] = None,
        depth: int = 1,
        area: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> GraphPayload:
        selected_slugs = self._select_graph_slugs(
            center_id=center_id,
            depth=depth,
            area=area,
            limit=limit,
        )
        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []
        selected_entries = [self._entries_by_slug[slug] for slug in selected_slugs]
        selected_lookup = {entry.slug: entry for entry in selected_entries}

        areas = sorted({entry.area for entry in selected_entries})
        for area_name in areas:
            nodes.append(
                GraphNode(
                    id="area:{0}".format(area_name),
                    slug=area_name,
                    title=area_name.title(),
                    type="area",
                    area=area_name,
                    cluster=area_name,
                )
            )

        for entry in selected_entries:
            nodes.append(
                GraphNode(
                    id=entry.id,
                    slug=entry.slug,
                    title=entry.title,
                    type=entry.type,
                    area=entry.area,
                    subarea=entry.subarea,
                    cluster=entry.area,
                    historical_start_year=entry.historical_start_year,
                )
            )
            edges.append(
                GraphEdge(
                    source=entry.id,
                    target="area:{0}".format(entry.area),
                    relation_type="belongs_to_area",
                )
            )

        for entry in selected_entries:
            for relation in entry.relations:
                if relation.target_slug not in selected_lookup:
                    continue
                target = selected_lookup[relation.target_slug]
                edges.append(
                    GraphEdge(
                        source=entry.id,
                        target=target.id,
                        relation_type=relation.relation_type,
                        evidence=relation.evidence,
                        weight=relation.weight,
                    )
                )

        return GraphPayload(center_id=center_id, nodes=nodes, edges=edges)

    def get_timeline(
        self,
        area: Optional[str] = None,
        entry_type: Optional[str] = None,
        year_from: Optional[int] = None,
        year_to: Optional[int] = None,
    ) -> List[TimelineGroup]:
        buckets: Dict[int, List[TimelineItem]] = {}

        for entry in self._entries_by_slug.values():
            if area and entry.area != area:
                if not matches_area_filter(entry.area, entry.subarea, area):
                    continue
            if entry_type and entry.type != entry_type:
                continue
            if year_from and entry.historical_start_year < year_from:
                continue
            if year_to and entry.historical_start_year > year_to:
                continue

            buckets.setdefault(entry.historical_start_year, []).append(
                TimelineItem(
                    id=entry.id,
                    slug=entry.slug,
                    title=entry.title,
                    type=entry.type,
                    area=entry.area,
                    historical_start_year=entry.historical_start_year,
                    period_label=entry.period_label,
                    summary=entry.summary,
                )
            )

        groups: List[TimelineGroup] = []
        for year in sorted(buckets.keys()):
            items = sorted(buckets[year], key=lambda item: item.title)
            groups.append(TimelineGroup(year=year, items=items))
        return groups

    def close(self) -> None:
        return None

    def _select_graph_slugs(
        self,
        center_id: Optional[str],
        depth: int,
        area: Optional[str],
        limit: Optional[int],
    ) -> List[str]:
        if not self._entries_by_slug:
            return []

        if not center_id:
            entries = [
                entry
                for entry in self._entries_by_slug.values()
                if not area or matches_area_filter(entry.area, entry.subarea, area)
            ]
            entries.sort(key=lambda item: (item.historical_start_year, item.title))
            if limit:
                entries = entries[:limit]
            return [entry.slug for entry in entries]

        center = self._entries_by_id.get(center_id)
        if not center:
            return []

        discovered: Set[str] = set()
        ordered: List[str] = []
        queue = deque([(center.slug, 0)])

        while queue:
            slug, level = queue.popleft()
            if slug in discovered:
                continue
            discovered.add(slug)
            ordered.append(slug)
            if level >= depth:
                continue

            entry = self._entries_by_slug[slug]
            neighbors = {relation.target_slug for relation in entry.relations}
            for candidate in self._entries_by_slug.values():
                if any(relation.target_slug == slug for relation in candidate.relations):
                    neighbors.add(candidate.slug)
            for neighbor_slug in sorted(neighbors):
                if neighbor_slug in self._entries_by_slug:
                    queue.append((neighbor_slug, level + 1))

        if area:
            ordered = [
                slug
                for slug in ordered
                if matches_area_filter(
                    self._entries_by_slug[slug].area,
                    self._entries_by_slug[slug].subarea,
                    area,
                )
            ]
        if limit:
            ordered = ordered[:limit]
        return ordered
