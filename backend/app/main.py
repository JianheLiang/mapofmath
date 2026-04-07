from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import PROJECT_ROOT, Settings, get_settings
from backend.app.repositories.in_memory import InMemoryWikiRepository
from backend.app.services.content_service import ContentService
from backend.app.services.ingestion import ContentValidationError


def create_repository(settings: Settings):
    if settings.data_backend == "neo4j":
        from backend.app.repositories.neo4j_repository import Neo4jWikiRepository

        return Neo4jWikiRepository(
            uri=settings.neo4j_uri,
            username=settings.neo4j_username,
            password=settings.neo4j_password,
        )
    return InMemoryWikiRepository()


def create_app(settings: Optional[Settings] = None) -> FastAPI:
    settings = settings or get_settings()
    repository = create_repository(settings)
    content_service = ContentService(repository)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.settings = settings
        app.state.content_service = content_service
        try:
            content_service.ingest(settings.content_dir)
        except Exception as exc:
            content_service.close()
            raise exc
        yield
        content_service.close()

    app = FastAPI(
        title=settings.api_title,
        version=settings.api_version,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def healthcheck():
        return {"status": "ok", "backend": settings.data_backend}

    @app.get("/api/search")
    def search(
        request: Request,
        q: str = "",
        entry_type: Optional[str] = Query(None, alias="type"),
        area: Optional[str] = None,
        subarea: Optional[str] = None,
        year_from: Optional[int] = Query(None, alias="from"),
        year_to: Optional[int] = Query(None, alias="to"),
    ):
        service: ContentService = request.app.state.content_service
        return service.search(
            query=q,
            entry_type=entry_type,
            area=area,
            subarea=subarea,
            year_from=year_from,
            year_to=year_to,
        )

    @app.get("/api/wiki/{slug}")
    def get_wiki(request: Request, slug: str):
        service: ContentService = request.app.state.content_service
        wiki = service.get_wiki(slug)
        if not wiki:
            raise HTTPException(status_code=404, detail="Wiki entry not found")
        return wiki

    @app.get("/api/graph")
    def get_graph(
        request: Request,
        center: Optional[str] = None,
        depth: int = Query(1, ge=1, le=4),
        area: Optional[str] = None,
    ):
        service: ContentService = request.app.state.content_service
        return service.get_graph(center_id=center, depth=depth, area=area)

    @app.get("/api/timeline")
    def get_timeline(
        request: Request,
        area: Optional[str] = None,
        entry_type: Optional[str] = Query(None, alias="type"),
        year_from: Optional[int] = Query(None, alias="from"),
        year_to: Optional[int] = Query(None, alias="to"),
    ):
        service: ContentService = request.app.state.content_service
        return service.get_timeline(
            area=area,
            entry_type=entry_type,
            year_from=year_from,
            year_to=year_to,
        )

    @app.post("/api/ingest")
    def ingest(request: Request):
        service: ContentService = request.app.state.content_service
        current_settings: Settings = request.app.state.settings
        try:
            return service.ingest(current_settings.content_dir)
        except ContentValidationError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/ingest/wikipedia")
    def ingest_wikipedia(
        request: Request,
        limit: int = Query(100, ge=1, le=100),
    ):
        service: ContentService = request.app.state.content_service
        output_dir = PROJECT_ROOT / "content" / "generated" / "wikipedia"
        try:
            return service.import_wikipedia_seed(output_dir=output_dir, limit=limit)
        except ContentValidationError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    return app


app = create_app()
