from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List, Optional

from backend.app.models.entities import GraphPayload, SearchResult, TimelineGroup, WikiDetail, WikiEntry


class WikiRepository(ABC):
    @abstractmethod
    def replace_all(self, entries: List[WikiEntry]) -> None:
        raise NotImplementedError

    @abstractmethod
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
        raise NotImplementedError

    @abstractmethod
    def get_by_slug(self, slug: str) -> Optional[WikiDetail]:
        raise NotImplementedError

    @abstractmethod
    def get_graph(
        self,
        center_id: Optional[str] = None,
        depth: int = 1,
        area: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> GraphPayload:
        raise NotImplementedError

    @abstractmethod
    def get_timeline(
        self,
        area: Optional[str] = None,
        entry_type: Optional[str] = None,
        year_from: Optional[int] = None,
        year_to: Optional[int] = None,
    ) -> List[TimelineGroup]:
        raise NotImplementedError

    @abstractmethod
    def close(self) -> None:
        raise NotImplementedError
