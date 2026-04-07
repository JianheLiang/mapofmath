from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]


@dataclass
class Settings:
    content_dir: Path
    neo4j_uri: str
    neo4j_username: str
    neo4j_password: str
    data_backend: str
    api_title: str = "Map of Math API"
    api_version: str = "0.1.0"


def get_settings() -> Settings:
    content_dir = Path(
        os.getenv("MAPOFMATH_CONTENT_DIR", str(PROJECT_ROOT / "content"))
    ).resolve()
    neo4j_uri = os.getenv("MAPOFMATH_NEO4J_URI", "")
    data_backend = os.getenv("MAPOFMATH_DATA_BACKEND", "neo4j" if neo4j_uri else "memory")

    return Settings(
        content_dir=content_dir,
        neo4j_uri=neo4j_uri,
        neo4j_username=os.getenv("MAPOFMATH_NEO4J_USERNAME", "neo4j"),
        neo4j_password=os.getenv("MAPOFMATH_NEO4J_PASSWORD", "mapofmath"),
        data_backend=data_backend,
    )

