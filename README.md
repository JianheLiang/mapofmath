# Map of Math MVP

Map of Math is a first-version full-stack knowledge platform for curated mathematics content. It combines:

- searchable wiki entries for concepts, theorems, and mathematicians
- an interactive graph view of connections between entries
- a historical timeline derived from entry metadata

## Repository Layout

- `backend/`: FastAPI API, content ingestion pipeline, Neo4j repository, tests
- `frontend/`: Next.js App Router frontend for search, graph exploration, timeline, and wiki detail pages
- `content/`: Markdown source-of-truth files with frontmatter metadata

## Stack

- Frontend: Next.js, React, TypeScript
- Backend: FastAPI, Pydantic
- Database: Neo4j
- Content authoring: Markdown with YAML frontmatter

## Quick Start

### 1. Start Neo4j

```powershell
docker compose up -d neo4j
```

Neo4j Browser will be available at [http://localhost:7474](http://localhost:7474).

### 2. Create a Python virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
```

### 3. Run the backend

```powershell
setx MAPOFMATH_CONTENT_DIR "D:\Mao@Huawei-NDZ-WFH9A\MATH\Mapofmath\content"
setx MAPOFMATH_NEO4J_URI "bolt://localhost:7687"
setx MAPOFMATH_NEO4J_USERNAME "neo4j"
setx MAPOFMATH_NEO4J_PASSWORD "mapofmath"

uvicorn backend.app.main:app --reload
```

### 4. Run the frontend

```powershell
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`.

## API Surface

- `GET /api/search`
- `GET /api/wiki/{slug}`
- `GET /api/graph`
- `GET /api/timeline`
- `POST /api/ingest`
- `POST /api/ingest/wikipedia`

## Content Authoring

Each Markdown file in `content/` must provide YAML frontmatter with:

- `slug`
- `title`
- `type`
- `summary`
- `area`
- `subarea`
- `historical_start_year`
- `period_label`
- `references`
- `relations`

The Markdown body is stored as the article content shown in the wiki detail view.

## Automated Wikipedia Seed Import

The backend now includes a manifest-driven Wikipedia importer that fetches curated pages, generates Markdown content, and ingests the result into the runtime store.

- Source manifest: `backend/app/services/wikipedia_seed_manifest.py`
- Import service: `backend/app/services/wikipedia_importer.py`
- Standalone script: `python -m backend.scripts.import_wikipedia_seed --limit 100`
- Generated dataset location: `content/generated/wikipedia`

To refresh the seed dataset through the API:

```powershell
Invoke-WebRequest -Method Post -Uri "http://127.0.0.1:8000/api/ingest/wikipedia?limit=100"
```
