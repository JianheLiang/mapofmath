from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional

from backend.app.models.entities import GraphPayload, IngestionReport, SearchResult, TimelineGroup, WikiDetail
from backend.app.repositories.base import WikiRepository
from backend.app.services.ingestion import MarkdownIngestionService
from backend.app.services.wikipedia_importer import WikipediaSeedImportService


class ContentService:
    def __init__(self, repository: WikiRepository) -> None:
        self._repository = repository
        self._ingestion_service = MarkdownIngestionService(repository)

    def ingest(self, content_dir: Path) -> IngestionReport:
        return self._ingestion_service.ingest_directory(content_dir)

    def search(
        self,
        query: str = "",
        entry_type: Optional[str] = None,
        area: Optional[str] = None,
        subarea: Optional[str] = None,
        year_from: Optional[int] = None,
        year_to: Optional[int] = None,
    ) -> List[SearchResult]:
        return self._repository.search(query, entry_type, area, subarea, year_from, year_to)

    def get_wiki(self, slug: str) -> Optional[WikiDetail]:
        return self._repository.get_by_slug(slug)

    def get_graph(
        self,
        center_id: Optional[str] = None,
        depth: int = 1,
        area: Optional[str] = None,
    ) -> GraphPayload:
        return self._repository.get_graph(center_id=center_id, depth=depth, area=area)

    def get_timeline(
        self,
        area: Optional[str] = None,
        entry_type: Optional[str] = None,
        year_from: Optional[int] = None,
        year_to: Optional[int] = None,
    ) -> List[TimelineGroup]:
        return self._repository.get_timeline(
            area=area,
            entry_type=entry_type,
            year_from=year_from,
            year_to=year_to,
        )

    def close(self) -> None:
        self._repository.close()

    def import_wikipedia_seed(self, output_dir: Path, limit: int = 100) -> Dict:
        importer = WikipediaSeedImportService()
        try:
            entries = importer.import_seed_dataset(output_dir=output_dir, limit=limit)
        finally:
            importer.close()

        ingestion_report = self.ingest(output_dir)
        return {
            "generated_entry_count": len(entries),
            "output_dir": str(output_dir),
            "ingestion_report": ingestion_report.model_dump(),
        }
