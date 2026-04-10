# Web Page Design Plan

## Goal

Create a wiki navigation page with two possible interaction modes:

1. **Graph-centered search layout**
2. **Timeline-based navigation layout**

---

## 1. Graph-centered search layout

### Layout

- A **search panel** is placed on the left.
- A **graph visualization area** is placed on the right.
- The search panel contains:
  - a search bar
  - view/filter buttons
  - a list of search results

### Interaction

- When the user clicks a search result, the right side should render the **corresponding graph**, centered on the selected wiki page.
- After selection, the result area can change into a **context display** for the selected wiki page.
- The context display may include:
  - page title
  - summary
  - related items
  - metadata

### Intended behavior

- Search is used to locate a wiki page quickly.
- The graph then shows the selected page in relation to nearby nodes or linked pages.

---

## 2. Timeline-based navigation layout

### Layout

- A **search bar** is placed above a **horizontally scrollable timeline**.
- Each point on the timeline is a **dot** representing an event, file, or wiki entry.
- Dots may include short labels.

### Interaction

- **Hover on a dot**: show a preview card for the related content.
- **Click on a dot**: open or jump to the related wiki page.

### Intended behavior

- The timeline provides a chronological or ordered navigation view.
- It is suitable when the wiki content is strongly time-based.

---

## 3. Search results located under the search bar

### Layout

- Search results appear in a **small dropdown box directly below the search bar**.

### Interaction

- Clicking a result should **locate the matching item on the timeline**.
- The page may:
  - scroll to the target position, or
  - jump directly to the target marker

### Intended behavior

- Search acts as a fast locator.
- Timeline remains the main browsing surface.

---

## Suggested interpretation of the original sketch

The sketch appears to propose **two alternative UI directions**:

### Option A: Search + graph

- Best for exploring relationships between wiki pages.

### Option B: Search + timeline

- Best for exploring entries in chronological order.

A combined design is also possible:

- search at the top
- result dropdown below the search bar
- central timeline for navigation
- optional graph/detail panel for the selected item

---

## Recommended clarification for implementation

To make the design easier for a developer to implement, define the following explicitly:

### Data model

- What does each node or dot represent?
- What fields does each item have?
  - `id`
  - `title`
  - `summary`
  - `timestamp`
  - `links`

### Search behavior

- Should search match:
  - title only?
  - full text?
  - tags?
- Should results update live while typing?

### Preview behavior

- Is preview triggered by hover, click, or both?
- What content appears in the preview?

### Navigation behavior

- On click, should the page:
  - open a new wiki page,
  - update a detail panel,
  - or move the visualization to center on the selected item?

---

## Deliverables included

- `wiki_ui_wireframe_clean.png`: cleaned wireframe based on the sketch
- `webpage_design_spec.md`: rewritten and clarified requirement notes