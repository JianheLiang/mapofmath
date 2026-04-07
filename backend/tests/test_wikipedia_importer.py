from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from backend.app.services.source_adapters import ImportedPage
from backend.app.services.wikipedia_importer import WikipediaSeedImportService
from backend.app.services.wikipedia_seed_manifest import WIKIPEDIA_SEED_MANIFEST


class FakeWikipediaAdapter:
    def __init__(self) -> None:
        self._pages = {
            "Derivative": ImportedPage(
                page_id="1",
                title="Derivative",
                canonical_url="https://example.test/Derivative",
                extract="Derivative is the rate of change of a function.",
                links=["Limit (mathematics)", "Isaac Newton"],
            ),
            "Limit (mathematics)": ImportedPage(
                page_id="2",
                title="Limit (mathematics)",
                canonical_url="https://example.test/Limit",
                extract="A limit describes approach toward a value.",
                links=["Derivative"],
            ),
            "Isaac Newton": ImportedPage(
                page_id="3",
                title="Isaac Newton",
                canonical_url="https://example.test/Newton",
                extract="Isaac Newton developed calculus.",
                links=["Derivative"],
            ),
        }

    def fetch_page(self, title: str) -> ImportedPage:
        return self._pages[title]

    def close(self) -> None:
        return None


class WikipediaSeedImportServiceTests(unittest.TestCase):
    def test_manifest_contains_100_unique_entries(self) -> None:
        self.assertEqual(len(WIKIPEDIA_SEED_MANIFEST), 100)
        slugs = [item["slug"] for item in WIKIPEDIA_SEED_MANIFEST]
        self.assertEqual(len(slugs), len(set(slugs)))

    def test_import_service_builds_markdown_and_relations(self) -> None:
        manifest = [
            {
                "title": "Derivative",
                "slug": "derivative",
                "type": "concept",
                "area": "analysis",
                "subarea": "differential calculus",
                "historical_start_year": 1675,
                "period_label": "Early Modern Mathematics",
                "mathematicians": ["isaac-newton"],
            },
            {
                "title": "Limit (mathematics)",
                "slug": "limit",
                "type": "concept",
                "area": "analysis",
                "subarea": "calculus foundations",
                "historical_start_year": 1817,
                "period_label": "19th Century Mathematics",
                "mathematicians": [],
            },
            {
                "title": "Isaac Newton",
                "slug": "isaac-newton",
                "type": "mathematician",
                "area": "analysis",
                "subarea": "calculus",
                "historical_start_year": 1643,
                "period_label": "Early Modern Mathematics",
                "mathematicians": [],
            },
        ]
        service = WikipediaSeedImportService(adapter=FakeWikipediaAdapter(), manifest=manifest)
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                entries = service.import_seed_dataset(Path(tmpdir), limit=3)
                self.assertEqual(len(entries), 3)
                derivative = next(entry for entry in entries if entry.slug == "derivative")
                newton = next(entry for entry in entries if entry.slug == "isaac-newton")

                self.assertTrue(any(relation.target_slug == "limit" for relation in derivative.relations))
                self.assertTrue(any(relation.target_slug == "isaac-newton" for relation in derivative.relations))
                self.assertTrue(any(relation.target_slug == "derivative" for relation in newton.relations))
                self.assertTrue((Path(tmpdir) / "analysis" / "derivative.md").exists())
        finally:
            service.close()


if __name__ == "__main__":
    unittest.main()
