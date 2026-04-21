# Universal Graph Explorer

A visual knowledge graph that starts empty and grows as you search. Add anyone or anything — artists, musicians, politicians, companies, places — and watch connections appear automatically from Wikipedia/Wikidata.

## Quick Start

### Docker (recommended)
```bash
docker-compose up --build
# Open http://localhost:8080
```

### Static file
Just open `index.html` in a browser. No server needed — everything runs client-side.

## Features

- **Search & auto-add** — Type any name, select from Wikidata results, and the entity + all its relationships are added to the graph
- **Auto-discovered connections** — Birth/death locations, occupations, movements, influences, spouses, employers, political parties, genres, and 30+ relationship types are extracted automatically
- **Custom data sources** — Add your own JSON API endpoints via the ⚙ Sources panel. URLs must contain `{query}` as a placeholder
- **Persistent** — Everything saves to localStorage automatically. Survives page refreshes
- **Export/Import** — Download your graph as JSON, share it, import it elsewhere
- **Click to explore** — Click any node to pin its connections. Click connected nodes to navigate. Click background to deselect
- **Expand on demand** — Click "Expand connections" in the info panel to load more data for any node from Wikidata

## Data Sources

Wikidata is always available as the built-in source. To add custom sources:

1. Click ⚙ in the top right
2. Enter a name and URL template (must contain `{query}`)
3. The response should be JSON with an array containing objects with `label` and `description` fields

## Architecture

Pure client-side — no backend, no database. All state lives in the browser's localStorage.

- `js/store.js` — localStorage persistence + JSON export/import
- `js/sources.js` — Custom data source manager
- `js/wiki.js` — Wikidata API integration with relationship extraction
- `js/graph-engine.js` — D3.js force-directed graph with dynamic add/remove
- `js/app.js` — App controller, search, info panel, UI
