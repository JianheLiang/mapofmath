# PR Change Log

This file records what changed for each project modification or PR-sized update.

## How to use

For every new modification:

1. Add a new entry at the top of the `Entries` section.
2. Use a stable identifier such as `PR-0002`, `PR-0003`, and so on.
3. Keep the summary short and practical.
4. List the main files touched and what changed in each one.

## Entry Template

```md
## PR-000X - Short title
Date: YYYY-MM-DD
Status: Draft | Merged | Local

Summary:
- One or two lines describing the purpose of the change.

Files changed:
- `path/to/file`: what changed in this file.
- `path/to/file`: what changed in this file.

Notes:
- Optional follow-up, migration note, or verification detail.
```

## Entries

## PR-0001 - Initial MVP scaffold, Wikipedia import, and graph explorer upgrade
Date: 2026-04-07
Status: Local

Summary:
- Built the first full-stack MVP for the Map of Math project.
- Added automated Wikipedia-backed seed import for 100 sample entries.
- Reworked the connections view into a richer interactive graph explorer.

Files changed:
- `.gitignore`: added common local/build ignores for Python and Next.js.
- `.env.example`: documented the main runtime environment variables.
- `README.md`: added setup, API, and automated import documentation.
- `docker-compose.yml`: added a Neo4j service definition for future graph-db usage.
- `backend/requirements.txt`: added backend runtime dependencies.
- `backend/app/config.py`: added central backend settings and project root handling.
- `backend/app/main.py`: added FastAPI app wiring, API endpoints, Wikipedia import endpoint, and CORS support.
- `backend/app/models/entities.py`: defined shared backend models and source metadata support.
- `backend/app/repositories/base.py`: defined the repository interface.
- `backend/app/repositories/in_memory.py`: implemented in-memory search, graph, timeline, and area-alias filtering.
- `backend/app/repositories/neo4j_repository.py`: implemented Neo4j persistence and aligned filtering behavior with the in-memory backend.
- `backend/app/services/ingestion.py`: added Markdown ingestion, validation, and generated-content exclusion for default content loads.
- `backend/app/services/content_service.py`: added content orchestration and Wikipedia seed import support.
- `backend/app/services/source_adapters.py`: added Wikipedia API fetching.
- `backend/app/services/wikipedia_seed_manifest.py`: defined the curated 100-entry import manifest.
- `backend/app/services/wikipedia_importer.py`: added automatic Wikipedia-to-Markdown import and relation generation.
- `backend/app/services/filtering.py`: added reusable area-filter matching logic.
- `backend/scripts/import_wikipedia_seed.py`: added a local script for regenerating imported sample data.
- `backend/tests/test_api.py`: added endpoint coverage including CORS verification.
- `backend/tests/test_ingestion.py`: added ingestion validation coverage.
- `backend/tests/test_wikipedia_importer.py`: added import manifest and importer behavior tests.
- `backend/tests/test_filtering.py`: added tests for area-alias filtering behavior.
- `content/README.md`: documented the source content format.
- `content/calculus/*.md`: added initial manual calculus seed entries.
- `content/generated/wikipedia/**/*.md`: generated 100 Wikipedia-backed sample entries for the app dataset.
- `frontend/package.json`: added frontend dependencies including Cytoscape graph tooling.
- `frontend/tsconfig.json`: configured TypeScript for the Next.js app.
- `frontend/next.config.mjs`: added Next.js config.
- `frontend/lib/api.ts`: added frontend API client helpers and updated backend base URL handling.
- `frontend/lib/types.ts`: added shared frontend type definitions.
- `frontend/components/MapExplorer.tsx`: wired search, graph, timeline, reset behavior, and graph depth state.
- `frontend/components/SearchPanel.tsx`: added filter controls and filter-reset UX.
- `frontend/components/KnowledgeGraph.tsx`: replaced the simple SVG graph with a Cytoscape-based explorer inspired by Juggl and Extended Graph.
- `frontend/components/TimelinePanel.tsx`: added the timeline UI.
- `frontend/components/WikiDetailCard.tsx`: added wiki detail rendering.
- `frontend/app/layout.tsx`: added app layout metadata.
- `frontend/app/page.tsx`: mounted the main explorer UI.
- `frontend/app/wiki/[slug]/page.tsx`: added standalone wiki entry pages.
- `frontend/app/globals.css`: added the site styling and the upgraded graph-explorer styling.
- `frontend/types/cytoscape-dagre.d.ts`: added local typing support for the graph layout plugin.

Notes:
- The current local runtime uses the in-memory repository because Neo4j is not installed on this machine.
- The frontend and backend were both verified locally, and the backend test suite passed.

