from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse

import yaml

from backend.app.models.entities import (
    IngestionReport,
    Reference,
    Relation,
    SourceMetadata,
    VALID_ENTRY_TYPES,
    VALID_RELATION_TYPES,
    WikiEntry,
)
from backend.app.repositories.base import WikiRepository


class ContentValidationError(Exception):
    pass


class MarkdownIngestionService:
    def __init__(self, repository: WikiRepository) -> None:
        self._repository = repository

    def ingest_directory(self, content_dir: Path) -> IngestionReport:
        if not content_dir.exists():
            raise ContentValidationError("Content directory does not exist: {0}".format(content_dir))

        entries: List[WikiEntry] = []
        for file_path in sorted(content_dir.rglob("*.md")):
            if file_path.name.lower() == "readme.md":
                continue
            relative_parts = file_path.relative_to(content_dir).parts
            if relative_parts and relative_parts[0] == "generated":
                continue
            entries.append(self._parse_markdown_file(file_path))

        self._validate_entries(entries)
        self._repository.replace_all(entries)

        area_count = len({entry.area for entry in entries})
        relation_count = sum(len(entry.relations) for entry in entries)
        return IngestionReport(
            entry_count=len(entries),
            area_count=area_count,
            relation_count=relation_count,
            source_path=str(content_dir),
        )

    def _parse_markdown_file(self, file_path: Path) -> WikiEntry:
        text = file_path.read_text(encoding="utf-8").strip()
        metadata, body = self._split_frontmatter(text, file_path)

        required_fields = [
            "slug",
            "title",
            "type",
            "summary",
            "area",
            "subarea",
            "historical_start_year",
            "period_label",
            "references",
            "relations",
        ]
        for field_name in required_fields:
            if field_name not in metadata:
                raise ContentValidationError(
                    "Missing required field '{0}' in {1}".format(field_name, file_path)
                )

        if metadata["type"] not in VALID_ENTRY_TYPES:
            raise ContentValidationError(
                "Unsupported entry type '{0}' in {1}".format(metadata["type"], file_path)
            )

        for relation in metadata.get("relations", []):
            relation_type = relation.get("relation_type")
            if relation_type not in VALID_RELATION_TYPES:
                raise ContentValidationError(
                    "Unsupported relation type '{0}' in {1}".format(relation_type, file_path)
                )

        try:
            references = [Reference(**reference) for reference in metadata.get("references", [])]
            relations = [Relation(**relation) for relation in metadata.get("relations", [])]
            source = (
                SourceMetadata(**metadata["source"])
                if metadata.get("source") is not None
                else None
            )
        except Exception as exc:
            raise ContentValidationError(
                "Invalid reference or relation schema in {0}: {1}".format(file_path, exc)
            )

        return WikiEntry(
            id="wiki:{0}".format(metadata["slug"]),
            slug=metadata["slug"],
            title=metadata["title"],
            type=metadata["type"],
            summary=metadata["summary"],
            body=body.strip(),
            area=metadata["area"],
            subarea=metadata["subarea"],
            references=references,
            historical_start_year=int(metadata["historical_start_year"]),
            historical_end_year=metadata.get("historical_end_year"),
            period_label=metadata.get("period_label"),
            mathematicians=metadata.get("mathematicians", []),
            relations=relations,
            source=source,
        )

    def _split_frontmatter(self, text: str, file_path: Path) -> Tuple[Dict, str]:
        lines = text.splitlines()
        if not lines or lines[0].strip() != "---":
            raise ContentValidationError(
                "Markdown file must start with YAML frontmatter: {0}".format(file_path)
            )

        closing_index: Optional[int] = None
        for index in range(1, len(lines)):
            if lines[index].strip() == "---":
                closing_index = index
                break

        if closing_index is None:
            raise ContentValidationError(
                "Markdown frontmatter is not closed in {0}".format(file_path)
            )

        metadata = yaml.safe_load("\n".join(lines[1:closing_index])) or {}
        body = "\n".join(lines[closing_index + 1 :]).strip()
        return metadata, body

    def _validate_entries(self, entries: List[WikiEntry]) -> None:
        slugs = {}
        for entry in entries:
            if entry.slug in slugs:
                raise ContentValidationError(
                    "Duplicate slug '{0}' found in content set".format(entry.slug)
                )
            slugs[entry.slug] = entry

            if entry.type not in VALID_ENTRY_TYPES:
                raise ContentValidationError(
                    "Unsupported entry type '{0}' on {1}".format(entry.type, entry.slug)
                )

            for reference in entry.references:
                parsed = urlparse(reference.url)
                if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                    raise ContentValidationError(
                        "Invalid reference URL '{0}' on {1}".format(reference.url, entry.slug)
                    )

            for relation in entry.relations:
                if relation.relation_type not in VALID_RELATION_TYPES:
                    raise ContentValidationError(
                        "Unsupported relation type '{0}' on {1}".format(
                            relation.relation_type, entry.slug
                        )
                    )

        for entry in entries:
            for relation in entry.relations:
                if relation.target_slug not in slugs:
                    raise ContentValidationError(
                        "Broken relation from '{0}' to missing slug '{1}'".format(
                            entry.slug, relation.target_slug
                        )
                    )

            for mathematician_slug in entry.mathematicians:
                if mathematician_slug not in slugs:
                    raise ContentValidationError(
                        "Entry '{0}' references missing mathematician slug '{1}'".format(
                            entry.slug, mathematician_slug
                        )
                    )
