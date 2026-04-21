# Art Navigator / Universal Graph Explorer

A visual knowledge graph for exploring connections between artworks, artists, museums, and beyond. Start with a curated art gallery or build your own graph from scratch using Wikipedia/Wikidata.

## Branches

| Branch | What it is | How to run |
|--------|-----------|------------|
| `main` | Curated art gallery with 30+ works from the Met and Art Institute of Chicago. Includes a radial connection flow and a full D3 force-directed graph. | Already live at [jasonbrelsford.github.io/art-navigator](https://jasonbrelsford.github.io/art-navigator/) |
| `feature/universal-graph-github-host` | Empty-start universal graph. Search for anyone or anything, connections auto-discovered from Wikidata. Fork it and host on GitHub Pages. | See [GitHub Pages Setup](#github-pages-fork--deploy) below |
| `feature/universal-graph-docker` | Same universal graph, packaged with Docker and nginx for local hosting. | See [Docker Setup](#docker-local-hosting) below |
| `feature/deep-connections` | Extended connection metadata (themes, techniques, palettes, collectors, influences, social circles, exhibitions) added to the curated gallery. | Merged into `main` |

---

## GitHub Pages (Fork & Deploy)

Use the `feature/universal-graph-github-host` branch to get your own hosted graph in under 2 minutes.

### Steps

1. **Fork this repo** — click Fork at the top right of the GitHub page

2. **Switch to the right branch** — in your fork, click the branch dropdown and select `feature/universal-graph-github-host`. Then go to Settings → Default branch and change it to `feature/universal-graph-github-host`

3. **Enable GitHub Pages** — go to Settings → Pages. Under "Build and deployment", select **GitHub Actions** as the source

4. **Wait ~1 minute** — the included workflow auto-deploys. Your graph is live at:
   ```
   https://YOUR-USERNAME.github.io/art-navigator/
   ```

5. **Start exploring** — search for artists, musicians, politicians, companies, places. Your data saves to your browser's localStorage automatically

### Sharing graphs

Your graph is private to your browser. To share:
- Click **↓ Export** to download a JSON file
- Send it to someone
- They click **↑ Import** on their instance

---

## Docker (Local Hosting)

Use the `feature/universal-graph-docker` branch to run locally with Docker.

### Steps

1. **Clone the repo**
   ```bash
   git clone https://github.com/jasonbrelsford/art-navigator.git
   cd art-navigator
   ```

2. **Switch to the Docker branch**
   ```bash
   git checkout feature/universal-graph-docker
   ```

3. **Build and run**
   ```bash
   docker-compose up --build
   ```

4. **Open** [http://localhost:8080](http://localhost:8080)

The Docker setup mounts your local `js/`, `css/`, and `index.html` as volumes, so you can edit files and refresh the browser without rebuilding.

To stop:
```bash
docker-compose down
```

---

## The Curated Gallery (main branch)

The `main` branch has a pre-loaded art gallery with:

- 30+ artworks from Vermeer, Monet, Van Gogh, Rembrandt, Hokusai, Renoir, Degas, Seurat, Caillebotte, Cassatt, Hopper, Caravaggio, Gauguin, and Manet
- Images from the Met Museum and Art Institute of Chicago open-access APIs
- A radial connection flow showing how each piece connects to others by theme, technique, genre, palette, decade, depicted location, and more
- A full D3 force-directed graph with all node types: artworks, artists, museums, locations, genres, eras, techniques, themes, palettes, collectors, patrons, decades, depicted locations, and exhibitions
- Wikidata search to add any artist and auto-fetch their works from museum APIs
- Influence chains and social circle connections between artists

### Live demo

[jasonbrelsford.github.io/art-navigator](https://jasonbrelsford.github.io/art-navigator/)

---

## Architecture

All branches are pure client-side — no backend, no database, no accounts.

```
js/store.js        — localStorage persistence + JSON export/import
js/sources.js      — Custom data source manager (add your own APIs)
js/wiki.js         — Wikidata API integration (30+ property types)
js/graph-engine.js — D3.js force-directed graph with dynamic add/remove
js/app.js          — App controller, search, panels, UI
```

The curated gallery (`main`) additionally has:
```
js/data.js         — Static art database with metadata
js/gallery.js      — Gallery navigation with radial connection flow
js/graph.js        — Full graph view with all connection types
```
