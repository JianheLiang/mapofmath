## Summary

Redesign the app to match the clean white-and-blue wireframe language from the image and `ui_v1.md`, while honoring `Pages_plan.md`'s three-page structure. The homepage becomes a sequential landing page with three blocks: a search-only block, a graph preview block, and a timeline preview block. The real exploration happens on dedicated Search, Graph, and Timeline pages, and every wiki page gains a direct-connections graph plus a historical timeline section.

## Key Changes

### 2. Routing and page structure

- Keep `/` as the homepage, but restructure it into three vertical sections:
  - Block A: search tab and filters only, no wiki list before search
  - Block B: graph preview that visually reflects the graph page
  - Block C: timeline preview that visually reflects the timeline page
  - Do not use strict rectangular blocks to separate each section, divide them naturally.
- Add dedicated routes:
  - `/search` for Page A
  - `/graph` for Page B
  - `/timeline` for Page C
  - keep `/wiki/[slug]` for wiki detail pages
- Preserve search/filter state in URL query params on `/search`, `/graph`, and `/timeline` so navigation between pages keeps the same context.

### 3. Homepage behavior

- Block A:
  - show only the search input and filters on the homepage
  - no wiki cards or dropdown before search
  - submitting search routes to `/search` with query params
- Block B:
  - show a compact interactive graph preview with the same blue-outline visual language as the wireframe
  - preview allows light pan/drag behavior
  - clicking anywhere in the preview routes to `/graph`
  - if a search result has already been selected in the current session, use it as the preview center
- Block C:
  - show a horizontally oriented timeline preview with dots and short labels
  - allow drag/scroll preview behavior
  - clicking anywhere routes to `/timeline`
- Homepage previews should feel alive, but they are teasers, not full work surfaces.

### 4. Search page (`/search`)

- Build Page A as a search-focused navigation page:
  - search bar at top
  - filters below or inline with the bar
  - results rendered directly below the search bar in a compact stacked list
- Results behavior:
  - live-update while typing
  - no results shown before a search is active
  - clicking a result opens `/wiki/[slug]`
- Reuse the existing search API and query filters, but add an explicit result limit for compact UI sections.

### 5. Graph page (`/graph`)

- Use the "graph-centered search layout" from the image and `ui_v1.md`:
  - left rail: search bar, filters, result list
  - main canvas: graph centered on the selected entry
  - contextual detail panel within the left rail or directly under results once an item is selected
- Interaction:
  - selecting a search result centers the graph on that wiki node
  - selected context shows title, summary, type, area, year, and direct links
  - clicking a node opens its wiki page
- Compactification rule:
  - cap visible non-area nodes at 30
  - choose nearest nodes to the center first, then trim by distance or graph relevance
- Keep the existing graph engine, but restyle it to fit the wireframe:
  - lighter canvas
  - thinner strokes
  - clearer labels
  - less heavy panel chrome

### 6. Timeline page (`/timeline`)

- Use the "timeline-based navigation layout" from the image:
  - search bar above the timeline
  - search results appear in a dropdown under the search bar
  - main surface is a horizontally scrollable timeline
- Implementation choice:
  - use `vis-timeline` as the primary timeline engine
  - replace the current custom timeline renderer for the main timeline surfaces
  - do not use `react-calendar-timeline` in v1 unless grouped scheduler-style lanes become necessary later
- Interaction:
  - dots represent wiki entries
  - hover shows a preview card with title, summary, type, and year
  - click opens `/wiki/[slug]`
  - selecting a search result scrolls or jumps to the matching dot and highlights it
- Additional behavior:
  - allow zoom in and zoom out so the visible time range can change on screen
  - display the current visible range in the UI
  - use stacking and clustering so dense events do not all coincide on the same point
  - preserve horizontal drag and pan as a first-class interaction
- The timeline remains the primary browsing surface; search acts as a locator rather than a replacement list.

### 7. Wiki page redesign

- Keep current content and references structure, but reorganize the page into three clear sections:
  - content and references
  - historical timeline section
  - direct-connections graph section
- Timeline section:
  - render the entry's own historical placement using its year and nearby entries from the same filtered timeline dataset
- Connections section:
  - render only direct linked neighbors, as required by `Pages_plan.md`
  - clicking a node jumps to the corresponding page
- Keep wiki pages light and readable; preserve the current article-first reading experience.

### 8. Frontend interfaces and backend support

- Frontend route and query state should standardize on:
  - `q`
  - `type`
  - `area`
  - `from`
  - `to`
  - `center` for `/graph`
  - `focus` or `target` for `/timeline`
- Public API additions:
  - `GET /api/search?...&limit=` to support compact dropdowns and sidebars
  - `GET /api/graph?...&limit=30` to enforce graph compactification consistently
- Timeline payload changes:
  - include each item's `historical_start_year` directly on timeline items, even when grouped, so the frontend can build a horizontal scale without re-deriving the year
- Timeline rendering changes:
  - convert year-only entries to point events on January 1 of the given year
  - render ranged entries when both start and end year are available
  - restyle imported `vis-timeline` CSS to match the white-and-blue wireframe language
- No new backend domain model is required; this is a presentation-layer expansion on top of existing wiki, graph, and timeline data.

## Test Plan

- Homepage:
  - initial load shows only search and filter block content plus preview blocks, with no wiki results exposed
  - clicking graph preview routes to `/graph`
  - clicking timeline preview routes to `/timeline`
  - submitting homepage search routes to `/search` with preserved filters
- Search page:
  - no results before active search
  - results appear directly below the search bar
  - filters narrow results correctly
  - clicking a result opens the correct wiki page
- Graph page:
  - selecting a result centers the graph correctly
  - graph never renders more than 30 non-area nodes
  - node click opens the correct wiki page
  - URL state restores the same selected graph center on reload
- Timeline page:
  - timeline is horizontally scrollable
  - zoom in and zoom out updates the visible time window
  - dense events stack or cluster instead of coinciding together
  - hover preview appears on dots
  - dropdown search can locate and focus the matching dot
  - clicking a dot opens the correct wiki page
- Wiki page:
  - direct-connections graph contains only direct neighbors
  - timeline section renders correctly for the selected entry
  - content and references remain intact
- Regression:
  - existing search, graph, timeline, and wiki API calls still succeed
  - homepage remains empty before search
  - `/wiki/[slug]` still renders without the previous runtime failure

## Assumptions And Defaults

- `ui_v1.md` is the intended file referenced as `u1_v1.md`.
- The image layouts map as agreed:
  - 1 → Graph page
  - 2 → Timeline page
  - 3 → Search page
- Homepage remains a sequential three-block landing page, not a single-mode app shell.
- Search behavior is live while typing on dedicated pages.
- Timeline hover preview is desktop-first; on touch devices, tap should act as focus before open if needed.
- Existing backend endpoints remain the main data source; only small query or payload extensions are needed.
