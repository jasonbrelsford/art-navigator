# Universal Graph Explorer

A visual knowledge graph that starts empty and grows as you search. Add anyone or anything — artists, musicians, politicians, companies, places — and watch connections appear automatically from Wikipedia/Wikidata.

## Get Your Own (Fork & Deploy)

1. Click **Fork** at the top right of this repo
2. In your fork, go to **Settings → Pages**
3. Under "Build and deployment", select **GitHub Actions** as the source
4. Wait ~1 minute — your graph is live at `https://YOUR-USERNAME.github.io/art-navigator/`
5. Start searching and building your graph

That's it. No server, no database, no accounts. Your graph data lives in your browser's localStorage.

## Features

- **Search & auto-add** — Type any name, select from Wikidata results, and the entity + all its relationships are added to the graph
- **Auto-discovered connections** — 30+ relationship types extracted automatically: locations, occupations, movements, influences, spouses, employers, political parties, genres, and more
- **Custom data sources** — Add your own JSON API endpoints via the ⚙ Sources panel
- **Persistent** — Everything saves to localStorage automatically
- **Export/Import** — Download your graph as JSON, share it, import it elsewhere
- **Click to explore** — Click any node to pin its connections and see details
- **Expand on demand** — Click "Expand connections" in the info panel to load more data for any node

## Sharing Graphs

Your graph is private to your browser. To share:
1. Click **↓ Export** to download a JSON file
2. Send the file to someone
3. They click **↑ Import** on their instance

## Architecture

Pure client-side static site. No backend needed.

```
js/store.js        — localStorage persistence + JSON export/import
js/sources.js      — Custom data source manager
js/wiki.js         — Wikidata API integration (30+ property types)
js/graph-engine.js — D3.js force-directed graph with dynamic add/remove
js/app.js          — App controller, search, panels, UI
```
