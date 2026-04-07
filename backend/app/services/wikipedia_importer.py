from __future__ import annotations

import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import yaml

from backend.app.models.entities import Reference, Relation, SourceMetadata, WikiEntry
from backend.app.services.source_adapters import WIKIPEDIA_LICENSE, WikipediaSourceAdapter
from backend.app.services.wikipedia_seed_manifest import WIKIPEDIA_SEED_MANIFEST


class WikipediaSeedImportService:
    def __init__(
        self,
        adapter: Optional[WikipediaSourceAdapter] = None,
        manifest: Optional[List[Dict]] = None,
    ) -> None:
        self._adapter = adapter or WikipediaSourceAdapter()
        self._manifest = manifest or WIKIPEDIA_SEED_MANIFEST

    def import_seed_dataset(self, output_dir: Path, limit: int = 100) -> List[WikiEntry]:
        selected_manifest = self._manifest[:limit]
        imported_pages: Dict[str, Dict] = {}
        title_lookup: Dict[str, str] = {}

        for item in selected_manifest:
            page = self._adapter.fetch_page(item["title"])
            enriched = dict(item)
            enriched["canonical_title"] = page.title
            enriched["canonical_url"] = page.canonical_url
            enriched["page_id"] = page.page_id
            enriched["extract"] = page.extract
            enriched["links"] = page.links
            imported_pages[item["slug"]] = enriched
            title_lookup[item["title"].lower()] = item["slug"]
            title_lookup[page.title.lower()] = item["slug"]

        entries = self._build_entries(imported_pages, title_lookup)
        self._write_entries(output_dir, entries)
        return entries

    def close(self) -> None:
        self._adapter.close()

    def _build_entries(
        self,
        imported_pages: Dict[str, Dict],
        title_lookup: Dict[str, str],
    ) -> List[WikiEntry]:
        retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
        entries_by_slug: Dict[str, WikiEntry] = {}

        for slug, item in imported_pages.items():
            included_mathematicians = [
                mathematician_slug
                for mathematician_slug in item["mathematicians"]
                if mathematician_slug in imported_pages
            ]
            body = self._normalize_body(item["extract"], item["canonical_title"], item["canonical_url"])
            summary = self._build_summary(item["extract"], item["canonical_title"])

            entries_by_slug[slug] = WikiEntry(
                id="wiki:{0}".format(slug),
                slug=slug,
                title=item["canonical_title"],
                type=item["type"],
                summary=summary,
                body=body,
                area=item["area"],
                subarea=item["subarea"],
                references=[Reference(title="Wikipedia - {0}".format(item["canonical_title"]), url=item["canonical_url"])],
                historical_start_year=item["historical_start_year"],
                historical_end_year=None,
                period_label=item["period_label"],
                mathematicians=included_mathematicians,
                relations=[],
                source=SourceMetadata(
                    name="Wikipedia",
                    url=item["canonical_url"],
                    license=WIKIPEDIA_LICENSE,
                    retrieved_at=retrieved_at,
                    external_id=item["page_id"],
                    external_title=item["canonical_title"],
                ),
            )

        for slug, item in imported_pages.items():
            source_entry = entries_by_slug[slug]
            relations: List[Relation] = []
            seen_targets = set()

            for mathematician_slug in source_entry.mathematicians:
                if mathematician_slug in entries_by_slug and mathematician_slug not in seen_targets:
                    relations.append(
                        Relation(
                            target_slug=mathematician_slug,
                            relation_type="worked_on",
                            evidence="Curated mathematician association from the import manifest.",
                        )
                    )
                    seen_targets.add(mathematician_slug)

            for link_title in item["links"]:
                target_slug = title_lookup.get(link_title.lower())
                if not target_slug or target_slug == slug or target_slug in seen_targets:
                    continue
                target_entry = entries_by_slug[target_slug]
                relations.append(
                    Relation(
                        target_slug=target_slug,
                        relation_type=self._infer_relation_type(source_entry.type, target_entry.type, target_slug in source_entry.mathematicians),
                        evidence="Derived from a direct Wikipedia article link between imported pages.",
                    )
                )
                seen_targets.add(target_slug)
                if len(relations) >= 12:
                    break

            source_entry.relations = relations

        for entry in list(entries_by_slug.values()):
            if entry.type == "mathematician":
                continue
            for mathematician_slug in entry.mathematicians:
                target_entry = entries_by_slug.get(mathematician_slug)
                if not target_entry or target_entry.type != "mathematician":
                    continue
                if any(relation.target_slug == entry.slug for relation in target_entry.relations):
                    continue
                target_entry.relations.append(
                    Relation(
                        target_slug=entry.slug,
                        relation_type="worked_on",
                        evidence="Backlinked from curated mathematician attribution in the imported dataset.",
                    )
                )

        return sorted(entries_by_slug.values(), key=lambda entry: (entry.type, entry.title))

    def _normalize_body(self, extract: str, title: str, canonical_url: str) -> str:
        text = (extract or "").strip()
        if not text:
            text = "{0} was imported automatically from Wikipedia as part of the Map of Math seed dataset.".format(title)
        return "{0}\n\nSource: Wikipedia article at {1}".format(text, canonical_url)

    def _build_summary(self, extract: str, fallback_title: str) -> str:
        text = " ".join((extract or "").split())
        if not text:
            return "{0} imported from Wikipedia.".format(fallback_title)
        sentence_break = text.find(". ")
        if 0 < sentence_break <= 260:
            return text[: sentence_break + 1]
        return text[:257] + "..." if len(text) > 260 else text

    def _infer_relation_type(self, source_type: str, target_type: str, target_is_curated_mathematician: bool) -> str:
        if source_type == "mathematician" and target_type == "mathematician":
            return "influenced_by"
        if source_type == "mathematician" and target_type != "mathematician":
            return "worked_on"
        if target_type == "mathematician" and target_is_curated_mathematician:
            return "worked_on"
        if source_type == "theorem" and target_type in {"concept", "theorem"}:
            return "used_in_proof"
        return "related_to"

    def _write_entries(self, output_dir: Path, entries: List[WikiEntry]) -> None:
        output_dir = output_dir.resolve()
        if output_dir.exists():
            shutil.rmtree(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        readme = output_dir / "README.md"
        readme.write_text(
            "# Generated Wikipedia Seed Dataset\n\nThis directory is autogenerated by the Wikipedia import service.\n",
            encoding="utf-8",
        )

        for entry in entries:
            area_dir = output_dir / self._slugify_fragment(entry.area)
            area_dir.mkdir(parents=True, exist_ok=True)
            file_path = area_dir / "{0}.md".format(entry.slug)
            frontmatter = {
                "slug": entry.slug,
                "title": entry.title,
                "type": entry.type,
                "summary": entry.summary,
                "area": entry.area,
                "subarea": entry.subarea,
                "historical_start_year": entry.historical_start_year,
                "historical_end_year": entry.historical_end_year,
                "period_label": entry.period_label,
                "mathematicians": entry.mathematicians,
                "references": [reference.model_dump() for reference in entry.references],
                "relations": [relation.model_dump() for relation in entry.relations],
                "source": entry.source.model_dump() if entry.source else None,
            }
            yaml_body = yaml.safe_dump(frontmatter, sort_keys=False, allow_unicode=False).strip()
            markdown = "---\n{0}\n---\n\n{1}\n".format(yaml_body, entry.body.strip())
            file_path.write_text(markdown, encoding="utf-8")

    def _slugify_fragment(self, value: str) -> str:
        return value.lower().replace(" ", "-")
