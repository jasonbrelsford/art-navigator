// Discovery Engine — automated suggestion system via Wikidata SPARQL
const Discovery = {
  // Rate limiting state (5.1)
  _queue: [],
  _processing: false,
  _lastRequestTime: 0,
  _pauseUntil: 0,
  MIN_DELAY: 1000,
  BACKOFF_DELAY: 30000,
  MAX_GHOSTS: 50,
  MAX_PER_CATEGORY: 10,

  // ── Rate limiting queue (5.1) ──

  _enqueue(job) {
    this._queue.push(job);
    if (!this._processing) this._processQueue();
  },

  async _processQueue() {
    if (this._processing) return;
    this._processing = true;
    while (this._queue.length > 0) {
      const job = this._queue.shift();
      try {
        await job();
      } catch (e) {
        console.warn('Discovery queue job failed:', e);
      }
    }
    this._processing = false;
  },

  async _sparql(query) {
    // Wait for backoff if active
    const now = Date.now();
    if (now < this._pauseUntil) {
      await new Promise(r => setTimeout(r, this._pauseUntil - now));
    }
    // Enforce minimum delay between requests
    const elapsed = Date.now() - this._lastRequestTime;
    if (elapsed < this.MIN_DELAY) {
      await new Promise(r => setTimeout(r, this.MIN_DELAY - elapsed));
    }
    this._lastRequestTime = Date.now();

    const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query);
    try {
      const resp = await fetch(url, {
        headers: { 'Accept': 'application/sparql-results+json' }
      });
      if (resp.status === 429) {
        console.warn('Wikidata 429 — backing off 30s');
        this._pauseUntil = Date.now() + this.BACKOFF_DELAY;
        await new Promise(r => setTimeout(r, this.BACKOFF_DELAY));
        return this._sparql(query);
      }
      if (!resp.ok) {
        console.warn('SPARQL error:', resp.status);
        return [];
      }
      const data = await resp.json();
      return data?.results?.bindings || [];
    } catch (e) {
      console.warn('SPARQL fetch failed:', e);
      return [];
    }
  },

  // ── SPARQL query builders (5.3) ──

  _buildOccupationQuery(qid, occupationQids) {
    const values = occupationQids.map(q => 'wd:' + q).join(' ');
    return `SELECT ?item ?itemLabel WHERE {
  VALUES ?occ { ${values} }
  ?item wdt:P106 ?occ .
  ?item wdt:P31 wd:Q5 .
  FILTER(?item != wd:${qid})
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 10`;
  },

  _buildLocationQuery(qid, locationQids) {
    const values = locationQids.map(q => 'wd:' + q).join(' ');
    return `SELECT ?item ?itemLabel WHERE {
  VALUES ?loc { ${values} }
  { ?item wdt:P19 ?loc . } UNION { ?item wdt:P131 ?loc . } UNION { ?item wdt:P27 ?loc . }
  ?item wdt:P31 wd:Q5 .
  FILTER(?item != wd:${qid})
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 10`;
  },

  _buildMovementQuery(qid, movementQids) {
    const values = movementQids.map(q => 'wd:' + q).join(' ');
    return `SELECT ?item ?itemLabel WHERE {
  VALUES ?mov { ${values} }
  { ?item wdt:P135 ?mov . } UNION { ?item wdt:P136 ?mov . }
  ?item wdt:P31 wd:Q5 .
  FILTER(?item != wd:${qid})
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 10`;
  },

  _buildInfluenceQuery(qid, influenceQids) {
    const values = influenceQids.map(q => 'wd:' + q).join(' ');
    return `SELECT ?item ?itemLabel WHERE {
  VALUES ?inf { ${values} }
  { wd:${qid} wdt:P737 ?item . } UNION { ?item wdt:P737 wd:${qid} . } UNION { ?item wdt:P1066 ?inf . }
  FILTER(?item != wd:${qid})
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 10`;
  },

  _buildGeoQuery(regionQid, entityTypes) {
    const types = (entityTypes || ['Q1007870', 'Q33506', 'Q2385804', 'Q483501'])
      .map(q => 'wd:' + q).join(' ');
    return `SELECT ?item ?itemLabel ?typeLabel WHERE {
  VALUES ?type { ${types} }
  ?item wdt:P31 ?type .
  ?item wdt:P131 wd:${regionQid} .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 10`;
  },

  // ── Candidate filtering (5.7) ──

  _filterCandidates(candidates) {
    const dismissed = Store.loadDismissed();
    const currentGhostCount = GraphEngine.getGhostNodes().length;

    const filtered = candidates.filter(c => {
      // Exclude confirmed nodes (non-ghost entries in nodeMap)
      const existing = GraphEngine.nodeMap[c.id];
      if (existing && !existing.ghost) return false;
      // Exclude already-existing ghost nodes
      if (existing && existing.ghost) return false;
      // Exclude dismissed entities
      if (dismissed.has(c.id) || dismissed.has(c.qid)) return false;
      return true;
    });

    // Enforce MAX_GHOSTS cap
    const available = this.MAX_GHOSTS - currentGhostCount;
    if (available <= 0) return [];
    return filtered.slice(0, available);
  },

  // ── Materialize ghost nodes (5.10) ──

  _materializeGhosts(candidates, sourceNodeId, relation) {
    if (!candidates.length) return;
    for (const c of candidates) {
      const ghost = GraphEngine.addGhostNode(c.id, c.type || 'person', c.label, {
        ...c.data,
        discoveredFrom: sourceNodeId,
        discoveryRelation: relation,
        discoveryCategory: c.category || 'unknown',
      }, sourceNodeId);
      if (ghost) {
        GraphEngine.addGhostLink(sourceNodeId, c.id, relation);
      }
    }
    GraphEngine.rebuild();
  },

  // ── Parse SPARQL bindings into candidate objects ──

  _parseSparqlResults(bindings, category) {
    return bindings.map(b => {
      const uri = b.item?.value || '';
      const qid = uri.split('/').pop();
      const label = b.itemLabel?.value || qid;
      return {
        id: 'wiki-' + qid,
        qid,
        label,
        type: 'person',
        category,
        data: { qid, desc: b.typeLabel?.value || '' },
      };
    }).filter(c => c.qid && c.qid.startsWith('Q'));
  },

  // ── Wikidata-based discovery (5.11) ──

  async _discoverFromWikidata(node) {
    const qid = node.data?.qid;
    if (!qid) return;

    // Collect QIDs from node's relationships in the graph
    const occupationQids = [];
    const locationQids = [];
    const movementQids = [];
    const influenceQids = [];

    // Scan links for related nodes and extract their QIDs
    for (const link of GraphEngine.links) {
      const s = typeof link.source === 'object' ? link.source.id : link.source;
      const t = typeof link.target === 'object' ? link.target.id : link.target;
      const otherId = s === node.id ? t : (t === node.id ? s : null);
      if (!otherId) continue;
      const other = GraphEngine.nodeMap[otherId];
      if (!other?.data?.qid) continue;

      const rel = link.relation;
      if (rel === 'occupation') occupationQids.push(other.data.qid);
      if (rel === 'born in' || rel === 'located in' || rel === 'citizenship') locationQids.push(other.data.qid);
      if (rel === 'movement' || rel === 'genre') movementQids.push(other.data.qid);
      if (rel === 'influenced by' || rel === 'student of') influenceQids.push(other.data.qid);
    }

    // Also check node.data for direct property QIDs if stored
    if (node.data.occupations) occupationQids.push(...node.data.occupations);
    if (node.data.locations) locationQids.push(...node.data.locations);
    if (node.data.movements) movementQids.push(...node.data.movements);
    if (node.data.influences) influenceQids.push(...node.data.influences);

    // Build and run queries for each category that has QIDs
    if (occupationQids.length) {
      const query = this._buildOccupationQuery(qid, [...new Set(occupationQids)]);
      const results = await this._sparql(query);
      const candidates = this._parseSparqlResults(results, 'occupation');
      const filtered = this._filterCandidates(candidates);
      this._materializeGhosts(filtered, node.id, 'same occupation');
    }

    if (locationQids.length) {
      const query = this._buildLocationQuery(qid, [...new Set(locationQids)]);
      const results = await this._sparql(query);
      const candidates = this._parseSparqlResults(results, 'location');
      const filtered = this._filterCandidates(candidates);
      this._materializeGhosts(filtered, node.id, 'same location');
    }

    if (movementQids.length) {
      const query = this._buildMovementQuery(qid, [...new Set(movementQids)]);
      const results = await this._sparql(query);
      const candidates = this._parseSparqlResults(results, 'movement');
      const filtered = this._filterCandidates(candidates);
      this._materializeGhosts(filtered, node.id, 'same movement');
    }

    if (influenceQids.length) {
      const query = this._buildInfluenceQuery(qid, [...new Set(influenceQids)]);
      const results = await this._sparql(query);
      const candidates = this._parseSparqlResults(results, 'influence');
      const filtered = this._filterCandidates(candidates);
      this._materializeGhosts(filtered, node.id, 'influence network');
    }
  },

  // ── Content-based discovery (5.12) ──

  _extractThemes(node) {
    const themes = { mediums: [], styles: [], names: [] };
    const data = node.data || {};

    // Gather text from node data fields
    const text = [data.desc, data.name, data.content].filter(Boolean).join(' ');
    if (!text || text.length < 10) return themes;

    const lowerText = text.toLowerCase();

    // Art mediums (reuse WebFetch patterns)
    const artTerms = ['oil on canvas', 'acrylic', 'watercolor', 'mixed media', 'sculpture',
      'photography', 'digital art', 'printmaking', 'ceramic', 'textile', 'gouache',
      'charcoal', 'pastel', 'ink', 'collage', 'mural', 'oil painting'];
    artTerms.forEach(term => {
      if (lowerText.includes(term)) themes.mediums.push(term);
    });

    // Art styles/movements
    const styleTerms = ['impressionism', 'cubism', 'surrealism', 'abstract', 'expressionism',
      'minimalism', 'pop art', 'art nouveau', 'baroque', 'renaissance', 'contemporary',
      'modern art', 'realism', 'romanticism', 'post-impressionism'];
    styleTerms.forEach(term => {
      if (lowerText.includes(term)) themes.styles.push(term);
    });

    // Proper nouns (potential person names)
    const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
    let match;
    const seen = new Set();
    while ((match = namePattern.exec(text)) !== null && themes.names.length < 5) {
      const name = match[1].trim();
      const key = name.toLowerCase();
      if (name.length > 4 && name.length < 50 && !seen.has(key)) {
        seen.add(key);
        themes.names.push(name);
      }
    }

    return themes;
  },

  async _searchWikidataForTerms(terms) {
    const candidates = [];
    for (const term of terms.slice(0, 5)) {
      try {
        const results = await Wiki.search(term);
        if (results.length > 0) {
          const best = results[0];
          candidates.push({
            id: 'wiki-' + best.id,
            qid: best.id,
            label: best.label,
            type: 'person',
            category: 'content',
            data: { qid: best.id, desc: best.description || '' },
          });
        }
      } catch (e) {
        console.warn('Wiki search failed for:', term, e);
      }
    }
    return candidates;
  },

  async _discoverFromContent(node) {
    const themes = this._extractThemes(node);
    const allTerms = [...themes.mediums, ...themes.styles];

    // Search for practitioners of identified mediums/styles
    if (allTerms.length) {
      const searchTerms = allTerms.map(t => t + ' artist');
      const candidates = await this._searchWikidataForTerms(searchTerms);
      const filtered = this._filterCandidates(candidates);
      this._materializeGhosts(filtered, node.id, 'related style');
    }

    // Cross-reference named entities against Wikidata
    if (themes.names.length) {
      const candidates = await this._searchWikidataForTerms(themes.names);
      const filtered = this._filterCandidates(candidates);
      this._materializeGhosts(filtered, node.id, 'mentioned');
    }

    // If node has location data, run geographic discovery
    const locationQid = this._extractLocationQid(node);
    if (locationQid) {
      const query = this._buildGeoQuery(locationQid);
      const results = await this._sparql(query);
      const candidates = this._parseSparqlResults(results, 'geo');
      candidates.forEach(c => c.type = 'organization');
      const filtered = this._filterCandidates(candidates);
      this._materializeGhosts(filtered, node.id, 'nearby');
    }
  },

  // ── Location-based discovery (5.13) ──

  _extractLocationQid(node) {
    // Check node data for a location QID
    if (node.data?.locationQid) return node.data.locationQid;
    // Check linked location nodes for a QID
    for (const link of GraphEngine.links) {
      const s = typeof link.source === 'object' ? link.source.id : link.source;
      const t = typeof link.target === 'object' ? link.target.id : link.target;
      const otherId = s === node.id ? t : (t === node.id ? s : null);
      if (!otherId) continue;
      const other = GraphEngine.nodeMap[otherId];
      if (other?.type === 'location' && other?.data?.qid) return other.data.qid;
    }
    return null;
  },

  async _discoverFromLocation(node) {
    const regionQid = this._extractLocationQid(node);
    if (!regionQid) return;

    const query = this._buildGeoQuery(regionQid);
    const results = await this._sparql(query);
    const candidates = this._parseSparqlResults(results, 'geo');
    candidates.forEach(c => c.type = 'organization');
    const filtered = this._filterCandidates(candidates);
    this._materializeGhosts(filtered, node.id, 'nearby');
  },

  // ── Entry point (5.14) ──

  async discover(node) {
    if (!node) return;

    // Show loading indicator
    this._showLoading(node, true);

    this._enqueue(async () => {
      try {
        // Route to appropriate discovery method
        if (node.data?.qid) {
          await this._discoverFromWikidata(node);
        }
        if (node.data?.source === 'web' || node.data?.source === 'wordpress' || node.data?.url) {
          await this._discoverFromContent(node);
        }
        if (node.type === 'location' || this._extractLocationQid(node)) {
          await this._discoverFromLocation(node);
        }
      } catch (e) {
        console.error('Discovery failed for', node.label, e);
      } finally {
        this._showLoading(node, false);
      }
    });
  },

  // ── Loading indicator helpers ──

  _showLoading(node, show) {
    try {
      const nodeEl = GraphEngine.nodeG?.selectAll('.node')
        .filter(d => d.id === node.id);
      if (!nodeEl || nodeEl.empty()) return;

      if (show) {
        nodeEl.append('circle')
          .attr('class', 'discovery-loading')
          .attr('r', (node.radius || 10) + 6)
          .attr('fill', 'none')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.6);
      } else {
        nodeEl.selectAll('.discovery-loading').remove();
      }
    } catch (e) { /* non-critical UI */ }
  },
};
