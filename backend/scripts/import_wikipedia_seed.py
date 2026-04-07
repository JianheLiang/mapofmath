from __future__ import annotations

import argparse
from pathlib import Path

from backend.app.repositories.in_memory import InMemoryWikiRepository
from backend.app.services.content_service import ContentService


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate and ingest the Wikipedia seed dataset.")
    parser.add_argument("--limit", type=int, default=100, help="Number of manifest entries to import.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("content/generated/wikipedia"),
        help="Directory where generated Markdown files will be written.",
    )
    args = parser.parse_args()

    service = ContentService(InMemoryWikiRepository())
    report = service.import_wikipedia_seed(output_dir=args.output_dir, limit=args.limit)
    print(report)


if __name__ == "__main__":
    main()
