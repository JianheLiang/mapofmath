from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from backend.app.repositories.in_memory import InMemoryWikiRepository
from backend.app.services.ingestion import ContentValidationError, MarkdownIngestionService


PROJECT_ROOT = Path(__file__).resolve().parents[2]
CONTENT_ROOT = PROJECT_ROOT / "content"


class MarkdownIngestionServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repository = InMemoryWikiRepository()
        self.service = MarkdownIngestionService(self.repository)

    def test_ingest_directory_loads_seed_content(self) -> None:
        report = self.service.ingest_directory(CONTENT_ROOT)

        self.assertEqual(report.entry_count, 6)
        self.assertEqual(report.area_count, 1)
        self.assertGreaterEqual(report.relation_count, 10)

    def test_duplicate_slugs_raise_validation_error(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            temp_root = Path(tmpdir)
            shutil.copytree(CONTENT_ROOT / "calculus", temp_root / "calculus")
            duplicate = temp_root / "duplicate.md"
            duplicate.write_text(
                """---
slug: derivative
title: Duplicate Derivative
type: concept
summary: Duplicate slug.
area: calculus
subarea: differential calculus
historical_start_year: 1700
period_label: Early modern
mathematicians: []
references:
  - title: Valid
    url: https://example.com
relations: []
---
Duplicate body.
""",
                encoding="utf-8",
            )

            with self.assertRaises(ContentValidationError):
                self.service.ingest_directory(temp_root)

    def test_invalid_reference_url_raises_validation_error(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            invalid_file = Path(tmpdir) / "bad.md"
            invalid_file.write_text(
                """---
slug: bad-entry
title: Bad Entry
type: concept
summary: Bad reference URL.
area: calculus
subarea: differential calculus
historical_start_year: 1700
period_label: Early modern
mathematicians: []
references:
  - title: Invalid
    url: ftp://example.com
relations: []
---
Bad body.
""",
                encoding="utf-8",
            )

            with self.assertRaises(ContentValidationError):
                self.service.ingest_directory(Path(tmpdir))


if __name__ == "__main__":
    unittest.main()

