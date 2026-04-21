# Requirements Document

## Introduction

The Discovery Engine is an automated suggestion system for the Universal Graph Explorer. When a user adds a website or Wikidata entity to the graph, the Discovery Engine analyzes the entity's properties and content to find related entities, then presents them as visually distinct "ghost" nodes. Users can approve ghost nodes to promote them to full graph members or dismiss them to hide unwanted suggestions. The goal is to surface meaningful connections the user might not have found on their own, turning the graph into an active exploration tool rather than a purely manual one.

## Glossary

- **Discovery_Engine**: The module responsible for analyzing newly added nodes and generating suggested related entities.
- **Ghost_Node**: A suggested node rendered with dashed borders and reduced opacity, visually distinct from confirmed nodes, awaiting user approval or dismissal.
- **Ghost_Link**: A link connecting a ghost node to its source node, rendered with dashed stroke to match the ghost node styling.
- **Confirmed_Node**: A standard node in the graph that the user has explicitly added or approved.
- **Preview_Panel**: A UI panel that appears when a user clicks a ghost node, showing entity details and Approve/Dismiss actions.
- **Suggestions_Panel**: A UI panel listing all pending ghost nodes across the graph, accessible from the toolbar.
- **Dismissed_List**: A persisted set of entity identifiers that the user has dismissed, preventing re-suggestion.
- **Graph_Engine**: The existing D3.js force-directed graph renderer (graph-engine.js).
- **Wiki_Module**: The existing Wikidata API integration layer (wiki.js).
- **WebFetch_Module**: The existing web page fetcher and content extractor (webfetch.js).
- **Store_Module**: The existing localStorage persistence layer (store.js).
- **SPARQL_Query**: A structured query against the Wikidata Query Service endpoint used to find related entities by property relationships.
- **Content_Analyzer**: A subcomponent of the Discovery Engine that extracts themes, mediums, styles, and named entities from website text content.

## Requirements

### Requirement 1: Trigger Discovery on Node Addition

**User Story:** As a user, I want the app to automatically search for related entities whenever I add a new node, so that I can discover connections without manual searching.

#### Acceptance Criteria

1. WHEN a Confirmed_Node is added to the graph via Wikidata search, THE Discovery_Engine SHALL initiate a discovery process for that node within 1 second of the node being rendered.
2. WHEN a Confirmed_Node is added to the graph via URL fetch, THE Discovery_Engine SHALL initiate a discovery process for that node within 1 second of the node being rendered.
3. WHEN a Ghost_Node is approved and becomes a Confirmed_Node, THE Discovery_Engine SHALL initiate a discovery process for the newly confirmed node.
4. WHILE a discovery process is running for a node, THE Discovery_Engine SHALL display a subtle loading indicator on or near that node.
5. IF the discovery process fails due to a network error or API timeout, THEN THE Discovery_Engine SHALL log the error to the console and display a non-blocking status message to the user.

### Requirement 2: Wikidata SPARQL-Based Entity Discovery

**User Story:** As a user, I want the system to find related entities through Wikidata property relationships, so that I can see meaningful knowledge-graph connections.

#### Acceptance Criteria

1. WHEN a Confirmed_Node has a Wikidata QID and an occupation property (P106), THE Discovery_Engine SHALL query Wikidata for other entities sharing the same occupation values.
2. WHEN a Confirmed_Node has a Wikidata QID and a location property (P19, P131, or P27), THE Discovery_Engine SHALL query Wikidata for other entities associated with the same location or geographic region.
3. WHEN a Confirmed_Node has a Wikidata QID and a movement property (P135) or genre property (P136), THE Discovery_Engine SHALL query Wikidata for other entities sharing the same movement or genre.
4. WHEN a Confirmed_Node has a Wikidata QID and an "influenced by" property (P737) or "student of" property (P1066), THE Discovery_Engine SHALL query Wikidata for the influencers and their other students or influenced entities.
5. THE Discovery_Engine SHALL limit SPARQL query results to a maximum of 10 entities per query category to avoid overwhelming the graph.
6. THE Discovery_Engine SHALL exclude entities that already exist as Confirmed_Nodes in the graph from the suggestion results.
7. THE Discovery_Engine SHALL exclude entities present in the Dismissed_List from the suggestion results.

### Requirement 3: Content-Based Discovery from Websites

**User Story:** As a user, I want the system to analyze website content and find related entities based on themes and text, so that non-Wikidata sources also generate useful suggestions.

#### Acceptance Criteria

1. WHEN a Confirmed_Node originates from a URL fetch and contains extracted text content, THE Content_Analyzer SHALL identify art mediums, styles, and named entities from the text.
2. WHEN the Content_Analyzer identifies named entities from website text, THE Discovery_Engine SHALL cross-reference each identified name against Wikidata to find matching entities.
3. WHEN the Content_Analyzer identifies art medium or style terms from website text, THE Discovery_Engine SHALL query Wikidata for notable practitioners of those mediums or styles.
4. WHEN a Confirmed_Node originating from a URL fetch has an associated location, THE Discovery_Engine SHALL query Wikidata for galleries, museums, and art schools within the same geographic area.
5. THE Content_Analyzer SHALL reuse the existing text extraction logic in WebFetch_Module rather than duplicating extraction code.

### Requirement 4: Geographic Proximity Discovery

**User Story:** As a user, I want to discover entities near the same location as my graph nodes, so that I can explore local connections like nearby galleries, artists, and cultural institutions.

#### Acceptance Criteria

1. WHEN a Confirmed_Node has coordinate data or a resolved location with a Wikidata QID, THE Discovery_Engine SHALL query Wikidata for entities within the same administrative region.
2. WHEN performing a geographic discovery query, THE Discovery_Engine SHALL search for entities of type gallery (Q1007870), museum (Q33506), art school (Q2385804), and artist (Q483501) within the region.
3. THE Discovery_Engine SHALL limit geographic discovery results to a maximum of 10 entities per entity type.
4. THE Discovery_Engine SHALL exclude entities that already exist as Confirmed_Nodes or are present in the Dismissed_List from geographic results.

### Requirement 5: Ghost Node Rendering

**User Story:** As a user, I want suggested nodes to look visually distinct from my confirmed nodes, so that I can immediately tell which parts of the graph are suggestions versus my own research.

#### Acceptance Criteria

1. THE Graph_Engine SHALL render Ghost_Nodes with a dashed border (stroke-dasharray) instead of a solid border.
2. THE Graph_Engine SHALL render Ghost_Nodes at 50% opacity compared to Confirmed_Nodes.
3. THE Graph_Engine SHALL render Ghost_Links with a dashed stroke pattern matching the Ghost_Node styling.
4. THE Graph_Engine SHALL render Ghost_Nodes with a smaller radius than the equivalent Confirmed_Node type radius.
5. WHEN the user hovers over a Ghost_Node, THE Graph_Engine SHALL increase the Ghost_Node opacity to 80% to indicate interactivity.
6. THE Graph_Engine SHALL position Ghost_Nodes near their source Confirmed_Node in the force layout by applying an initial position offset from the source node.

### Requirement 6: Ghost Node Approval Workflow

**User Story:** As a user, I want to approve or dismiss suggested nodes, so that I control what becomes part of my permanent graph.

#### Acceptance Criteria

1. WHEN the user clicks a Ghost_Node, THE Preview_Panel SHALL open displaying the entity label, type, description, source of the suggestion, and the relationship to the source node.
2. THE Preview_Panel SHALL display an "Approve" button and a "Dismiss" button for Ghost_Nodes.
3. WHEN the user clicks the "Approve" button in the Preview_Panel, THE Graph_Engine SHALL convert the Ghost_Node into a Confirmed_Node by applying full opacity, solid borders, and standard radius.
4. WHEN the user clicks the "Approve" button in the Preview_Panel, THE Store_Module SHALL persist the newly confirmed node and its links to localStorage.
5. WHEN the user clicks the "Dismiss" button in the Preview_Panel, THE Graph_Engine SHALL remove the Ghost_Node and its Ghost_Links from the graph.
6. WHEN the user clicks the "Dismiss" button in the Preview_Panel, THE Store_Module SHALL add the dismissed entity identifier to the Dismissed_List in localStorage.
7. WHEN a Ghost_Node is approved, THE Discovery_Engine SHALL initiate a new discovery process for the approved node (as specified in Requirement 1, Criterion 3).

### Requirement 7: Dismissed Entity Persistence

**User Story:** As a user, I want dismissed suggestions to stay dismissed across sessions, so that I am not repeatedly shown entities I have already rejected.

#### Acceptance Criteria

1. THE Store_Module SHALL persist the Dismissed_List to localStorage under a dedicated key.
2. WHEN the application loads, THE Store_Module SHALL load the Dismissed_List from localStorage.
3. THE Discovery_Engine SHALL check every candidate entity against the Dismissed_List before creating a Ghost_Node.
4. WHEN the user clears the graph using the existing clear button, THE Store_Module SHALL also clear the Dismissed_List.

### Requirement 8: Suggestions Panel

**User Story:** As a user, I want a centralized view of all pending suggestions, so that I can review and manage them without hunting through the graph.

#### Acceptance Criteria

1. THE application SHALL display a toolbar button that opens the Suggestions_Panel.
2. THE Suggestions_Panel SHALL list all current Ghost_Nodes grouped by their source Confirmed_Node.
3. WHEN the user clicks a Ghost_Node entry in the Suggestions_Panel, THE Graph_Engine SHALL zoom to and highlight that Ghost_Node in the graph.
4. THE Suggestions_Panel SHALL display an "Approve" and "Dismiss" button next to each listed Ghost_Node.
5. THE Suggestions_Panel SHALL display the total count of pending suggestions on the toolbar button as a badge.
6. WHEN all Ghost_Nodes are approved or dismissed, THE Suggestions_Panel SHALL display a message indicating no pending suggestions remain.

### Requirement 9: Ghost Node Persistence

**User Story:** As a user, I want pending suggestions to survive page reloads, so that I do not lose suggestions I have not yet reviewed.

#### Acceptance Criteria

1. THE Store_Module SHALL persist Ghost_Nodes and Ghost_Links to localStorage separately from Confirmed_Nodes and Confirmed_Links.
2. WHEN the application loads, THE Graph_Engine SHALL restore Ghost_Nodes from localStorage and render them with ghost styling.
3. WHEN the user exports the graph as JSON, THE Store_Module SHALL include Ghost_Nodes in the export with a flag indicating their ghost status.
4. WHEN the user imports a graph JSON file containing Ghost_Nodes, THE Graph_Engine SHALL restore them with ghost styling.

### Requirement 10: Discovery Rate Limiting

**User Story:** As a user, I want the discovery process to respect API rate limits, so that the application remains responsive and does not get blocked by Wikidata.

#### Acceptance Criteria

1. THE Discovery_Engine SHALL space sequential SPARQL queries to the Wikidata Query Service by a minimum of 1 second between requests.
2. THE Discovery_Engine SHALL queue discovery requests and process them sequentially when multiple nodes are added in rapid succession.
3. IF the Wikidata Query Service returns an HTTP 429 (Too Many Requests) response, THEN THE Discovery_Engine SHALL pause all queued requests for 30 seconds before retrying.
4. THE Discovery_Engine SHALL limit the total number of Ghost_Nodes in the graph to 50 at any time to maintain rendering performance.
