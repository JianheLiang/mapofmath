# PR Change Log

This file records what changed for each project modification or PR-sized update.

## How to use

For every new modification:

1. Add a new entry at the top of the `Entries` section.
2. Use a stable identifier such as `PR-0002`, `PR-0003`, and so on (increment from the latest entry).
3. Keep the summary short and practical.
4. List the main files touched and what changed in each one.

**Automated assistants (Cursor, Codex, etc.):** After finishing a coding task in this repo, append a new entry at the **top** of **Entries** using the template below. Use **today’s date** from the user environment, set **Status: Local** unless the user says otherwise, and include **Notes** with how to verify the change (e.g. which page to open, any prerequisite like “search first”).

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

## PR-0009 - Repair log-scale timeline runtime and keep concise hover previews

Date: 2026-04-08
Status: Local

Summary:

- Debugged the newer log-scale timeline rewrite after it crashed the app with `TypeError: date.getTime is not a function`.
- Kept the concise pill-style timeline and short hover summaries, but hardened the axis formatter so the timeline can render safely in production again.

Files changed:

- `frontend/components/HorizontalTimeline.tsx`: added a safe `toEpochMs()` coercion helper so vis-timeline axis label callbacks work with `Date`, numeric, string, and date-like objects instead of assuming a native `Date` instance.

Notes:

- The log-scale timeline rewrite was present in the codebase but had not been recorded in this file; this entry documents the runtime fix for that change.
- Verified with a production build and live `200` responses for `/timeline` and `/wiki/integral` on `http://127.0.0.1:3000`.

## PR-0008 - Timeline pan/zoom, axis-only markers, preview on hover, homepage links

Date: 2026-04-08
Status: Local

Summary:

- Fixed vis-timeline wheel behavior: pan on scroll, zoom with Alt+scroll (`preferZoom` + `zoomKey: altKey`). Navigation with `previewHref` no longer fires on background clicks. Axis shows colored dots only; full title via tooltip and detail card on hover (debounced leave + card hover). Dedicated `/timeline` page keeps the detail card when a result is selected (`selectionPreview`). Homepage gains explicit links to the full timeline.

Files changed:

- `frontend/components/HorizontalTimeline.tsx`: interaction options; dot-only `content` + `title` tooltips; hover/selection preview logic; item-only click navigation when `previewHref` is set; `selectionPreview` prop.
- `frontend/components/TimelineExplorerPage.tsx`: `selectionPreview` enabled.
- `frontend/components/MapExplorer.tsx`: `id="section-timeline"`, **Open full timeline** / **Timeline home** links, copy update.
- `frontend/app/globals.css`: axis-dot styles, interaction hint + `kbd`, `touch-action` tweaks, home timeline link styles.

Notes:

- Zoom: **Alt + scroll** (Option on Mac). Plain wheel pans along time.
- Wiki-embedded timeline: no `selectionPreview`; large preview card appears on hover only.

## PR-0007 - Replace the custom timeline with vis-timeline

Date: 2026-04-08
Status: Local

Summary:

- Upgraded the timeline experience to use `vis-timeline` so horizontal panning, zooming, density handling, hover preview, and click-through navigation work as a real timeline surface.
- Updated the written project plan to reflect the new timeline engine and density/zoom requirements.

Files changed:

- `frontend/package.json` and `frontend/package-lock.json`: added `vis-timeline` to the frontend dependencies.
- `frontend/components/HorizontalTimeline.tsx`: replaced the custom positioned-dot renderer with a `vis-timeline` wrapper that supports pan, zoom, stacking, clustering, visible-range display, hover preview, focused selection, and wiki navigation.
- `frontend/app/layout.tsx`: imported the `vis-timeline` stylesheet globally.
- `frontend/app/globals.css`: added visual overrides so the timeline matches the white-and-blue wireframe style instead of the library defaults.
- `MapofMath_Plan.md`: updated the timeline section of the implementation plan to document the chosen open-source integration and required behaviors.

Notes:

- Verify on `/timeline` that you can drag horizontally, zoom in/out, hover to see previews, and click an event to open its wiki page.
- Verify the homepage preview and wiki-page local timeline still render and navigate correctly.

## PR-0006 - Implement MapofMath plan redesign across the main pages

Date: 2026-04-08
Status: Local

Summary:

- Implemented the light wireframe redesign with dedicated `/search`, `/graph`, and `/timeline` pages plus redesigned homepage previews.
- Extended the backend and wiki page rendering to support compact graph loads and the new horizontal timeline views.

Files changed:

- `backend/app/main.py`, `backend/app/services/content_service.py`, `backend/app/repositories/base.py`, `backend/app/repositories/in_memory.py`, `backend/app/repositories/neo4j_repository.py`, and `backend/app/models/entities.py`: added `limit` support for search and graph endpoints and included `historical_start_year` on timeline items.
- `backend/tests/test_api.py`: added coverage for search limits, graph node limits, and timeline item year payloads.
- `frontend/components/MapExplorer.tsx`, `frontend/components/SearchExplorerPage.tsx`, `frontend/components/GraphExplorerPage.tsx`, and `frontend/components/TimelineExplorerPage.tsx`: implemented the new homepage and the three dedicated navigation pages with URL-synced state.
- `frontend/components/GraphCanvas.tsx`, `frontend/components/HorizontalTimeline.tsx`, `frontend/components/SearchControls.tsx`, `frontend/components/SearchResultsList.tsx`, and `frontend/components/TopNavigation.tsx`: added shared UI primitives for the wireframe search, graph, and timeline surfaces.
- `frontend/components/WikiArticleView.tsx` and `frontend/app/wiki/[slug]/page.tsx`: redesigned wiki pages to include a local historical timeline and a direct-connections graph while preserving article content and references.
- `frontend/app/globals.css`: replaced the prior dark homepage styling with the new white-and-blue visual system.

Notes:

- Verify by opening `/`, `/search`, `/graph`, `/timeline`, and a wiki page such as `/wiki/integral`.
- On `/graph`, the backend now caps the visible non-area nodes at 30.

## PR-0005 - Show graph and timeline before search

Date: 2026-04-08
Status: Local

Summary:

- The connections graph and historical timeline are always visible on the homepage; only the wiki result list stays empty until the user searches or applies filters.

Files changed:

- `frontend/components/MapExplorer.tsx`: removed `hasActiveSearch` conditional around `KnowledgeGraph` and `TimelinePanel` so they always mount; search API gating and `hasActiveSearch` for results unchanged.
- `frontend/components/SearchPanel.tsx`: updated helper copy and pre-search empty state to say the graph and timeline load below while this panel lists matches only after search/filter.

Notes:

- With no query or filters, `selectedCenterId` stays `null` and `getGraph` omits `center`; the in-memory backend returns **all** entries (optionally area-filtered), which can be a large graph. After search, the first result still becomes the graph center when none was set.

## PR-0004 - Knowledge graph readability and area styling

Date: 2026-04-08
Status: Local

Summary:

- Improved the Cytoscape connections view for less crowding, clearer edges, larger labels, and softer per-area clusters (elliptical compound shapes with pastel fills).

Files changed:

- `frontend/components/KnowledgeGraph.tsx`: added `areaTheme()` for stable pastel `hsla` fill/border/label per area; switched area parent shape to **ellipse** with higher padding; increased default **spacious** layout (cose `idealEdgeLength`, `nodeRepulsion`, `componentSpacing`, lower gravity, larger fit padding); bumped hierarchy/concentric spacing when not compact; larger node glyphs and label font (13px spacious), wider `text-max-width`, text outline for readability; thicker, higher-opacity edges and softer relation colors; default **compactMode** `false` (Spacious); focus-fit padding increased; toolbar copy and compact button labels updated.

Notes:

- **If the graph looks unchanged:** restart `next dev` or rebuild (`npm run build`) if you serve an old production bundle. Toggle **Compact** vs **Spacious** to compare density. (As of **PR-0005**, the graph mounts before any search; earlier notes about search-only visibility are obsolete.)

## PR-0003 - Collapse homepage wiki results until search

Date: 2026-04-08
Status: Local

Summary:

- Changed the homepage so it no longer auto-populates wiki entries before the user searches.
- Kept the search controls visible while moving the results area into an explicit post-search state.

Files changed:

- `frontend/components/MapExplorer.tsx`: added active-search gating so search results stay empty until the query or filters are used, reset the selected wiki center when clearing search state, and hide the graph and timeline panels until a search is active.
- `frontend/components/SearchPanel.tsx`: added a pre-search empty state message instead of showing wiki entries or a no-results warning on initial load.

Notes:

- This change affects the homepage search panel only; wiki detail pages and the rest of the app still work the same after a search is performed.

## PR-0002 - Stabilize local wiki-page navigation runtime

Date: 2026-04-07
Status: Local

Summary:

- Fixed the local wiki navigation failure by replacing the broken Next.js dev session with a clean production frontend run.
- Added a documented stable local frontend workflow so wiki pages can be opened reliably after rebuilds.

Files changed:

- `frontend/package.json`: added `start:local` and `serve:local` scripts for stable local frontend serving and documented a minimum Node engine.
- `README.md`: updated frontend startup instructions to use the stable local serving flow and noted the fallback cleanup path for dev mode.

Notes:

- Verified locally with `GET /` and `GET /wiki/integral`, both returning `200 OK` from the frontend on `http://127.0.0.1:3000`.

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
