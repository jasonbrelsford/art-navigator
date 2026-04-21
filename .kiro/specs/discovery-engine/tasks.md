# Implementation Plan: Discovery Engine

## Overview

Incremental implementation of the Discovery Engine for the Universal Graph Explorer. The plan follows a bottom-up approach: persistence layer first, then graph rendering extensions, then the discovery module, then app integration, and finally UI/CSS. Each task builds on the previous and can be tested independently.

## Tasks

- [x] 1. Extend Store module with ghost and dismissed persistence
  - [x] 1.1 Add ghost node and ghost link persistence to `js/store.js`
    - Add `ghostNodes: 'uge_ghost_nodes'`, `ghostLinks: 'uge_ghost_links'`, and `dismissed: 'uge_dismissed'` to `KEYS`
    - Implement `saveGhosts(ghostNodes, ghostLinks)` — serializes ghost nodes and links to localStorage
    - Implement `loadGhosts()` — returns `{ nodes, links }` from localStorage
    - _Requirements: 9.1_

  - [x] 1.2 Add dismissed list persistence to `js/store.js`
    - Implement `saveDismissed(dismissedSet)` — converts Set to JSON array and saves to localStorage
    - Implement `loadDismissed()` — returns a Set of dismissed entity identifiers from localStorage
    - Implement `clearDismissed()` — removes the dismissed key from localStorage
    - Update `clear()` to also call `clearDismissed()` and remove ghost keys
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ]* 1.3 Write property test for dismissed list round-trip (Property 8)
    - **Property 8: Dismissed list persistence round-trip**
    - For any array of unique entity identifier strings, `saveDismissed()` then `loadDismissed()` returns the same identifiers
    - **Validates: Requirements 6.6, 7.1**

  - [ ]* 1.4 Write property test for ghost persistence (Property 9)
    - **Property 9: Ghost node persistence preserves ghost flag and data**
    - For any mix of ghost and confirmed nodes, save/load round-trip preserves ghost flags and data separately
    - **Validates: Requirements 9.1, 9.3, 9.4**

  - [x] 1.5 Update `exportJSON` in `js/store.js` to include ghost nodes with a `ghost: true` flag
    - _Requirements: 9.3_

- [ ] 2. Checkpoint — Verify store extensions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Extend GraphEngine with ghost node rendering and management
  - [x] 3.1 Add ghost node radius scale and rendering logic to `js/graph-engine.js`
    - Add `GHOST_RADIUS` map: `{ person:14, artwork:11, organization:10, location:8, category:8, date:6, unknown:7 }`
    - Implement `addGhostNode(id, type, label, data, sourceNodeId)` — creates a node with `ghost: true`, uses `GHOST_RADIUS`, sets initial position near source node
    - Implement `addGhostLink(sourceId, targetId, relation)` — creates a link with `ghost: true`
    - _Requirements: 5.4, 5.6_

  - [ ]* 3.2 Write property test for ghost radius (Property 5)
    - **Property 5: Ghost radius is strictly smaller than confirmed radius**
    - For any node type, `GHOST_RADIUS[type] < RADIUS[type]`
    - **Validates: Requirements 5.4**

  - [x] 3.3 Update `rebuild()` in `js/graph-engine.js` for ghost styling
    - Ghost node circles: `stroke-dasharray: "4,3"`, `opacity: 0.5`, fill with reduced alpha
    - Ghost links: `stroke-dasharray: "6,4"`, reduced opacity
    - Ghost node hover: increase opacity to 0.8
    - Save ghosts separately via `Store.saveGhosts()`
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 9.1_

  - [x] 3.4 Implement `confirmGhost(nodeId)` in `js/graph-engine.js`
    - Set `ghost: false` on the node, restore confirmed `RADIUS` for its type
    - Update associated links to `ghost: false`
    - Call `rebuild()` to re-render with solid styling
    - Persist the now-confirmed node via `Store.save()`
    - _Requirements: 6.3, 6.4_

  - [ ]* 3.5 Write property test for ghost approval (Property 6)
    - **Property 6: Ghost approval restores confirmed node properties**
    - For any ghost node, after `confirmGhost()`, `ghost === false`, radius equals `RADIUS[type]`, node is in confirmed persistence
    - **Validates: Requirements 6.3, 6.4**

  - [x] 3.6 Implement `removeGhost(nodeId)` in `js/graph-engine.js`
    - Remove the ghost node from `nodes` array and `nodeMap`
    - Remove all links referencing the ghost node ID from `links` array
    - Call `rebuild()` to update the graph
    - _Requirements: 6.5_

  - [ ]* 3.7 Write property test for ghost removal (Property 7)
    - **Property 7: Ghost dismissal removes node and all associated links**
    - For any ghost node, after `removeGhost()`, node is absent from `nodes`, `nodeMap`, and no link references it
    - **Validates: Requirements 6.5**

  - [x] 3.8 Implement `getGhostNodes()` and `getGhostsBySource()` in `js/graph-engine.js`
    - `getGhostNodes()` returns all nodes where `ghost === true`
    - `getGhostsBySource()` returns a Map grouping ghost nodes by `data.discoveredFrom`
    - _Requirements: 8.2, 8.5_

  - [ ]* 3.9 Write property test for ghost grouping (Property 10)
    - **Property 10: Ghost nodes grouped correctly by source**
    - For any set of ghost nodes with `discoveredFrom`, `getGhostsBySource()` groups each ghost exactly once under its correct source key
    - **Validates: Requirements 8.2, 8.5**

  - [x] 3.10 Update `loadFromStore()` and `importJSON()` in `js/graph-engine.js`
    - `loadFromStore()`: also call `Store.loadGhosts()` and add ghost nodes/links with ghost styling
    - `importJSON()`: detect `ghost: true` flag on imported nodes and restore as ghost nodes
    - _Requirements: 9.2, 9.4_

- [ ] 4. Checkpoint — Verify graph engine extensions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create the Discovery module (`js/discovery.js`)
  - [x] 5.1 Implement rate limiting queue in `js/discovery.js`
    - Create the `Discovery` object with `_queue`, `_processing`, `_lastRequestTime`, `_pauseUntil` state
    - Implement `_enqueue(job)` and `_processQueue()` — FIFO processing with 1s minimum delay between SPARQL requests
    - Implement `_sparql(query)` — fetches from `https://query.wikidata.org/sparql`, handles HTTP 429 with 30s backoff, logs errors
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 5.2 Write property test for rate limiting FIFO order (Property 11)
    - **Property 11: Rate limiting queue processes in FIFO order with minimum delay**
    - For any sequence of N queued requests (N >= 2), execution order matches enqueue order and timestamps are >= 1000ms apart
    - **Validates: Requirements 10.1, 10.2**

  - [x] 5.3 Implement SPARQL query builders in `js/discovery.js`
    - `_buildOccupationQuery(qid, occupationQids)` — finds entities sharing the same occupations
    - `_buildLocationQuery(qid, locationQids)` — finds entities associated with the same locations
    - `_buildMovementQuery(qid, movementQids)` — finds entities sharing the same movement/genre
    - `_buildInfluenceQuery(qid, influenceQids)` — finds influencers and their network
    - `_buildGeoQuery(regionQid, entityTypes)` — finds galleries, museums, art schools, artists in a region
    - All queries include `LIMIT 10` and the wikibase label service
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3_

  - [ ]* 5.4 Write property test for SPARQL query QID inclusion (Property 1)
    - **Property 1: SPARQL query building includes all provided QIDs**
    - For any non-empty set of QIDs, the built query string contains every QID
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.3**

  - [ ]* 5.5 Write property test for SPARQL query limits (Property 2)
    - **Property 2: All SPARQL queries enforce result limits**
    - For any built query, the query string contains `LIMIT` with value ≤ 10
    - **Validates: Requirements 2.5, 4.3**

  - [ ]* 5.6 Write property test for geographic query entity types (Property 4)
    - **Property 4: Geographic query includes all required entity types**
    - For any region QID, the geo query includes Q1007870, Q33506, Q2385804, Q483501
    - **Validates: Requirements 4.2**

  - [x] 5.7 Implement candidate filtering in `js/discovery.js`
    - `_filterCandidates(candidates)` — removes candidates whose ID matches any confirmed node in `GraphEngine.nodeMap` (non-ghost) or any entry in the dismissed list from `Store.loadDismissed()`
    - Enforce `MAX_GHOSTS` (50) cap — skip if current ghost count + new candidates would exceed limit
    - _Requirements: 2.6, 2.7, 4.4, 7.3, 10.4_

  - [ ]* 5.8 Write property test for candidate filtering (Property 3)
    - **Property 3: Candidate filtering excludes confirmed and dismissed entities**
    - For any candidates, confirmed set, and dismissed set, no filtered result appears in either set
    - **Validates: Requirements 2.6, 2.7, 4.4, 7.3**

  - [ ]* 5.9 Write property test for ghost count cap (Property 12)
    - **Property 12: Ghost node count never exceeds maximum**
    - For any sequence of discovery operations, total ghost nodes never exceed 50
    - **Validates: Requirements 10.4**

  - [x] 5.10 Implement `_materializeGhosts()` in `js/discovery.js`
    - Convert filtered candidates into ghost nodes via `GraphEngine.addGhostNode()` and `GraphEngine.addGhostLink()`
    - Set `data.discoveredFrom`, `data.discoveryRelation`, `data.discoveryCategory` on each ghost
    - Call `GraphEngine.rebuild()` after adding all ghosts
    - _Requirements: 5.4, 5.6_

  - [x] 5.11 Implement `_discoverFromWikidata(node)` in `js/discovery.js`
    - Extract QIDs for occupation (P106), location (P19/P131/P27), movement (P135/P136), influence (P737/P1066) from node data
    - Build and enqueue SPARQL queries for each applicable category
    - Parse results, filter, and materialize ghost nodes
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 5.12 Implement `_discoverFromContent(node)` in `js/discovery.js`
    - `_extractThemes(node)` — extract art mediums, styles, and named entities from `node.data` text content (reuse WebFetch extraction patterns)
    - `_searchWikidataForTerms(terms)` — cross-reference extracted terms against Wikidata via `Wiki.search()`
    - Query Wikidata for notable practitioners of identified mediums/styles
    - If node has location data, run geographic discovery for nearby galleries/museums/art schools
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 5.13 Implement `_discoverFromLocation(node)` in `js/discovery.js`
    - Check if node has coordinate data or a resolved location QID
    - Build and enqueue geographic SPARQL query for entities in the same administrative region
    - Filter and materialize results
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.14 Implement `discover(node)` entry point in `js/discovery.js`
    - Route to `_discoverFromWikidata()` if node has a QID
    - Route to `_discoverFromContent()` if node originates from URL fetch
    - Route to `_discoverFromLocation()` if node has location data
    - Show loading indicator on the source node during discovery, hide on completion
    - Handle errors: log to console, show non-blocking status message
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 6. Checkpoint — Verify discovery module
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integrate discovery into app.js
  - [x] 7.1 Wire discovery triggers in `js/app.js`
    - Call `Discovery.discover(node)` at the end of `addFromWikidata()` after `GraphEngine.rebuild()`
    - Call `Discovery.discover(node)` at the end of `addFromUrl()` after `GraphEngine.rebuild()`
    - Call `Discovery.discover(node)` after ghost approval in the preview panel
    - _Requirements: 1.1, 1.2, 1.3, 6.7_

  - [x] 7.2 Extend `openPanel()` in `js/app.js` for ghost node preview
    - Detect if clicked node has `ghost: true`
    - Show suggestion source (`data.discoveredFrom` label) and relationship (`data.discoveryRelation`)
    - Show "Approve" and "Dismiss" buttons instead of "Expand connections"
    - Approve handler: call `GraphEngine.confirmGhost(nodeId)`, add to dismissed list removal if present, trigger `Discovery.discover()` on the newly confirmed node
    - Dismiss handler: call `GraphEngine.removeGhost(nodeId)`, add entity ID to dismissed list via `Store.saveDismissed()`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 7.3 Implement suggestions panel logic in `js/app.js`
    - Wire `btn-suggestions` click to toggle the suggestions panel open/closed
    - Render ghost nodes grouped by source using `GraphEngine.getGhostsBySource()`
    - Each entry: label, type badge, relationship, Approve and Dismiss buttons
    - Click entry → call `GraphEngine.zoomTo()` on the ghost node
    - Approve/Dismiss buttons in panel use same handlers as preview panel
    - Show empty state message when no ghost nodes remain
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_

  - [x] 7.4 Implement suggestions badge counter in `js/app.js`
    - Update `#suggestions-badge` text with count of `GraphEngine.getGhostNodes().length`
    - Show badge when count > 0, hide when count === 0
    - Call update after: discovery completes, ghost approved, ghost dismissed, graph loaded, graph cleared
    - _Requirements: 8.5_

  - [x] 7.5 Update clear handler in `js/app.js`
    - Ensure `btn-clear` click also calls `Store.clearDismissed()` (via the updated `GraphEngine.clear()`)
    - Reset suggestions badge to hidden
    - _Requirements: 7.4_

- [ ] 8. Checkpoint — Verify app integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Add UI elements and CSS for ghost nodes and suggestions panel
  - [x] 9.1 Add suggestions button and panel markup to `index.html`
    - Add `<button id="btn-suggestions">` with `<span id="suggestions-badge">` to `.topbar-right`
    - Add `<script src="js/discovery.js"></script>` before `js/app.js` in the script load order
    - Add suggestions panel HTML (reuse `.panel` pattern) with `id="suggestions-panel"` and close button
    - _Requirements: 8.1_

  - [x] 9.2 Add ghost node and suggestions panel CSS to `css/app.css`
    - `.ghost-node circle` — `stroke-dasharray: 4,3; opacity: 0.5`
    - `.ghost-node:hover circle` — `opacity: 0.8`
    - `.ghost-link` — `stroke-dasharray: 6,4`
    - `.suggestions-badge` — positioned badge on the suggestions button, accent background, small font
    - `#suggestions-panel` — slide-out panel styling, grouped list items, approve/dismiss button styles
    - `.suggestion-group` — group header with source node label
    - `.suggestion-item` — entry with label, type, relationship, action buttons
    - `.suggestion-empty` — empty state message styling
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 8.1, 8.4, 8.6_

- [ ] 10. Final checkpoint — Verify complete feature
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The implementation language is JavaScript (vanilla, no build step) matching the existing codebase
- All new code follows the existing module pattern (global objects on `window`)
