// Universal Graph Explorer — App Controller
(function() {
  'use strict';

  // ── Init ──
  Sources.init();
  GraphEngine.init('#graph');
  GraphEngine.onNodeClick = openPanel;

  const hasData = GraphEngine.loadFromStore();
  if (!hasData) showEmptyState();

  // ── Search ──
  let searchTimeout = null;
  const searchInput = document.getElementById('search');
  const dropdown = document.getElementById('search-dropdown');

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = searchInput.value.trim();
    if (q.length < 2) { dropdown.classList.add('hidden'); return; }

    // Detect URL — skip Wikidata search, offer to fetch the page directly
    if (WebFetch.isUrl(q)) {
      dropdown.innerHTML = '';
      dropdown.innerHTML += '<div class="dropdown-header">Web Page</div>';
      const div = document.createElement('div');
      div.className = 'dropdown-item';
      div.innerHTML = `<div class="di-label">Fetch: ${q}</div><div class="di-desc">Extract metadata, social links, and structured data from this page</div><div class="di-source">Web</div>`;
      div.addEventListener('click', () => {
        dropdown.classList.add('hidden');
        searchInput.value = '';
        addFromUrl(q);
      });
      dropdown.appendChild(div);
      dropdown.classList.remove('hidden');
      return;
    }

    searchTimeout = setTimeout(async () => {
      const [wikiResults, customResults] = await Promise.all([
        Wiki.search(q),
        Sources.search(q)
      ]);

      const all = [...wikiResults, ...customResults];
      if (!all.length) { dropdown.classList.add('hidden'); return; }

      dropdown.innerHTML = '';
      if (wikiResults.length) {
        dropdown.innerHTML += '<div class="dropdown-header">Wikidata</div>';
        wikiResults.forEach(r => dropdown.appendChild(makeDropdownItem(r)));
      }
      if (customResults.length) {
        dropdown.innerHTML += '<div class="dropdown-header">Custom Sources</div>';
        customResults.forEach(r => dropdown.appendChild(makeDropdownItem(r)));
      }
      dropdown.classList.remove('hidden');
    }, 400);
  });

  // Also handle Enter key to fetch URL immediately
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      if (WebFetch.isUrl(q)) {
        dropdown.classList.add('hidden');
        searchInput.value = '';
        addFromUrl(q);
      }
    }
  });

  function makeDropdownItem(r) {
    const div = document.createElement('div');
    div.className = 'dropdown-item';
    div.innerHTML = `<div class="di-label">${r.label}</div>
      <div class="di-desc">${r.description}</div>
      <div class="di-source">${r.source}</div>`;
    div.addEventListener('click', () => {
      dropdown.classList.add('hidden');
      searchInput.value = '';
      if (r.source === 'Wikidata' && r.id) {
        addFromWikidata(r.id, r.label);
      } else {
        addFromCustom(r);
      }
    });
    return div;
  }

  // Close dropdown on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrap')) dropdown.classList.add('hidden');
  });

  // ── Add entity from Wikidata ──
  async function addFromWikidata(qid, label) {
    const nodeId = 'wiki-' + qid;
    if (GraphEngine.nodeMap[nodeId]) {
      showStatus(`${label} is already in the graph`);
      GraphEngine.zoomTo(GraphEngine.nodeMap[nodeId]);
      return;
    }

    showLoader(`Loading ${label} from Wikidata...`);
    removeEmptyState();

    const entity = await Wiki.loadEntity(qid);
    if (!entity) { hideLoader(); showStatus('Failed to load entity'); return; }

    const name = entity.labels?.en?.value || label;
    const desc = entity.descriptions?.en?.value || '';

    showLoader(`Extracting connections for ${name}...`);
    const { rels, born, died, wikiUrl } = await Wiki.extractRelationships(entity);

    // Determine primary type from relationships
    let primaryType = 'unknown';
    const occupations = rels.filter(r => r.relation === 'occupation').map(r => r.label.toLowerCase());
    const instanceOf = rels.filter(r => r.relation === 'instance of').map(r => r.label.toLowerCase());

    if (occupations.some(o => o.includes('paint') || o.includes('artist') || o.includes('sculptor'))) primaryType = 'person';
    else if (occupations.some(o => o.includes('musician') || o.includes('singer') || o.includes('composer'))) primaryType = 'person';
    else if (occupations.some(o => o.includes('politic') || o.includes('president') || o.includes('senator'))) primaryType = 'person';
    else if (occupations.length > 0) primaryType = 'person';
    else if (instanceOf.some(i => i.includes('human'))) primaryType = 'person';
    else if (instanceOf.some(i => i.includes('city') || i.includes('country') || i.includes('state'))) primaryType = 'location';
    else if (instanceOf.some(i => i.includes('company') || i.includes('organization') || i.includes('university'))) primaryType = 'organization';
    else if (instanceOf.some(i => i.includes('painting') || i.includes('sculpture') || i.includes('artwork'))) primaryType = 'artwork';

    // Find image
    const imageRel = rels.find(r => r.type === 'image');
    const imageUrl = imageRel?.imageUrl || null;

    // Add main node
    const data = { name, desc, born, died, wikiUrl, qid, imageUrl };
    GraphEngine.addNode(nodeId, primaryType, name, data);

    // Add relationship nodes and links
    let addedCount = 0;
    for (const rel of rels) {
      if (rel.type === 'date' || rel.type === 'url' || rel.type === 'image') continue;

      const relNodeId = rel.qid ? 'wiki-' + rel.qid : `${rel.type}-${rel.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      GraphEngine.addNode(relNodeId, rel.type, rel.label, { qid: rel.qid });
      GraphEngine.addLink(nodeId, relNodeId, rel.relation);
      addedCount++;
    }

    // Add decade node if we have birth year
    if (born) {
      const year = parseInt(born);
      if (year) {
        const decade = Math.floor(year / 10) * 10;
        const decId = 'decade-' + decade;
        GraphEngine.addNode(decId, 'date', decade + 's', { decade: decade + 's' });
        GraphEngine.addLink(nodeId, decId, 'active in');
      }
    }

    GraphEngine.rebuild();
    hideLoader();
    showStatus(`Added ${name} with ${addedCount} connections`);

    setTimeout(() => {
      const n = GraphEngine.nodeMap[nodeId];
      if (n) GraphEngine.zoomTo(n);
    }, 400);

    // Trigger discovery for the newly added node (7.1)
    const addedNode = GraphEngine.nodeMap[nodeId];
    if (addedNode) Discovery.discover(addedNode);
    updateSuggestionsBadge();
  }

  // ── Add from URL (web page scraping) ──
  async function addFromUrl(url) {
    showLoader(`Fetching ${url}...`);
    removeEmptyState();

    const result = await WebFetch.fetch(url, (msg) => {
      document.getElementById('loader-text').textContent = msg;
    });
    hideLoader();

    if (!result.nodes.length) {
      showStatus('Could not extract any data from that page');
      return;
    }

    let addedCount = 0;
    const mainNodeId = result.nodes[0]?.id;

    // First pass: add all nodes
    result.nodes.forEach(n => {
      if (!GraphEngine.nodeMap[n.id]) {
        GraphEngine.addNode(n.id, n.type, n.label, n.data);
        addedCount++;
      }
    });

    // Second pass: add all links (now all nodes exist in nodeMap)
    result.nodes.forEach(n => {
      if (n.linkTo) {
        GraphEngine.addLink(n.linkTo, n.id, n.relation || 'related');
      }
    });

    GraphEngine.rebuild();
    showStatus(`Added ${addedCount} nodes from ${url}`);

    if (mainNodeId && GraphEngine.nodeMap[mainNodeId]) {
      setTimeout(() => GraphEngine.zoomTo(GraphEngine.nodeMap[mainNodeId]), 400);
    }

    // Trigger discovery for the main node from URL fetch (7.1)
    const mainNode = mainNodeId && GraphEngine.nodeMap[mainNodeId];
    if (mainNode) Discovery.discover(mainNode);
    updateSuggestionsBadge();
  }

  // ── Add from custom source ──
  function addFromCustom(result) {
    const nodeId = 'custom-' + result.label.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (GraphEngine.nodeMap[nodeId]) {
      showStatus(`${result.label} is already in the graph`);
      return;
    }
    removeEmptyState();
    GraphEngine.addNode(nodeId, 'unknown', result.label, {
      name: result.label, desc: result.description, source: result.source, raw: result.raw
    });
    GraphEngine.rebuild();
    showStatus(`Added ${result.label} from ${result.source}`);
  }

  // ── Info Panel ──
  function openPanel(d) {
    const panel = document.getElementById('info-panel');
    const content = document.getElementById('panel-content');
    let html = '';

    if (d.data?.imageUrl) html += `<img src="${d.data.imageUrl}" alt="${d.label}" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:12px;">`;
    html += `<div class="p-type">${d.type}</div>`;
    html += `<h2>${d.label}</h2>`;

    if (d.data?.desc) html += `<div class="p-section"><p>${d.data.desc}</p></div>`;

    // Ghost node preview (7.2)
    if (d.ghost) {
      const sourceNode = d.data?.discoveredFrom ? GraphEngine.nodeMap[d.data.discoveredFrom] : null;
      const sourceLabel = sourceNode ? sourceNode.label : (d.data?.discoveredFrom || 'unknown');
      if (d.data?.discoveryRelation) html += `<div class="p-section"><h3>Suggested via</h3><p>${d.data.discoveryRelation}</p></div>`;
      html += `<div class="p-section"><h3>Discovered from</h3><p>${sourceLabel}</p></div>`;
      html += `<div class="p-section" style="margin-top:16px;display:flex;gap:8px;">`;
      html += `<button class="btn-primary" id="btn-ghost-approve">Approve</button>`;
      html += `<button class="btn-primary" id="btn-ghost-dismiss" style="background:var(--danger);">Dismiss</button>`;
      html += `</div>`;
    } else {
      if (d.data?.born) html += `<div class="p-section"><h3>Born</h3><p>${d.data.born}</p></div>`;
      if (d.data?.died) html += `<div class="p-section"><h3>Died</h3><p>${d.data.died}</p></div>`;
      if (d.data?.wikiUrl) html += `<div class="p-section"><a href="${d.data.wikiUrl}" target="_blank">Wikipedia →</a></div>`;
    }

    // Connections
    const conns = [];
    GraphEngine.links.forEach(l => {
      const s = typeof l.source==='object'?l.source.id:l.source;
      const t = typeof l.target==='object'?l.target.id:l.target;
      if (s===d.id) { const n=GraphEngine.nodeMap[t]; if(n) conns.push({node:n,rel:l.relation}); }
      if (t===d.id) { const n=GraphEngine.nodeMap[s]; if(n) conns.push({node:n,rel:l.relation}); }
    });

    if (conns.length) {
      html += `<div class="p-conn"><h3 style="font-size:0.8rem;color:var(--accent);margin-bottom:8px;">Connections (${conns.length})</h3>`;
      conns.forEach(c => {
        html += `<div class="p-conn-item" data-id="${c.node.id}">
          <span class="p-conn-dot" style="background:${GraphEngine.COLORS[c.node.type]||'#666'}"></span>
          ${c.node.label}
          <span class="p-conn-rel">${c.rel}</span>
        </div>`;
      });
      html += '</div>';
    }

    // Expand button if this node has a Wikidata QID and hasn't been fully loaded (only for confirmed nodes)
    if (!d.ghost && d.data?.qid && !d.data?.expanded) {
      html += `<div class="p-section" style="margin-top:16px;"><button class="btn-primary" id="btn-expand">Expand connections from Wikidata</button></div>`;
    }

    content.innerHTML = html;
    panel.classList.add('open');

    // Connection clicks
    content.querySelectorAll('.p-conn-item').forEach(el => {
      el.addEventListener('click', () => {
        const n = GraphEngine.nodeMap[el.dataset.id];
        if (n) { GraphEngine.pinnedNode = n; GraphEngine._highlightConnected(n); openPanel(n); GraphEngine.zoomTo(n); }
      });
    });

    // Expand button
    const expandBtn = document.getElementById('btn-expand');
    if (expandBtn) {
      expandBtn.addEventListener('click', async () => {
        expandBtn.disabled = true;
        expandBtn.textContent = 'Loading...';
        await addFromWikidata(d.data.qid, d.label);
        d.data.expanded = true;
        openPanel(d);
      });
    }

    // Ghost approve/dismiss buttons (7.2)
    const approveBtn = document.getElementById('btn-ghost-approve');
    if (approveBtn) {
      approveBtn.addEventListener('click', () => {
        GraphEngine.confirmGhost(d.id);
        panel.classList.remove('open');
        GraphEngine.pinnedNode = null;
        GraphEngine._resetOpacity();
        Discovery.discover(GraphEngine.nodeMap[d.id]);
        updateSuggestionsBadge();
        renderSuggestionsPanel();
        showStatus(`Approved: ${d.label}`);
      });
    }
    const dismissBtn = document.getElementById('btn-ghost-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        const dismissed = Store.loadDismissed();
        dismissed.add(d.data?.qid || d.id);
        Store.saveDismissed(dismissed);
        GraphEngine.removeGhost(d.id);
        panel.classList.remove('open');
        GraphEngine.pinnedNode = null;
        GraphEngine._resetOpacity();
        updateSuggestionsBadge();
        renderSuggestionsPanel();
        showStatus(`Dismissed: ${d.label}`);
      });
    }
  }

  document.getElementById('panel-close').addEventListener('click', () => {
    document.getElementById('info-panel').classList.remove('open');
    GraphEngine.pinnedNode = null;
    GraphEngine._resetOpacity();
  });

  // ── Suggestions Panel (7.3) ──
  document.getElementById('btn-suggestions').addEventListener('click', () => {
    const panel = document.getElementById('suggestions-panel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) renderSuggestionsPanel();
  });

  document.getElementById('suggestions-close').addEventListener('click', () => {
    document.getElementById('suggestions-panel').classList.remove('open');
  });

  function renderSuggestionsPanel() {
    const container = document.getElementById('suggestions-content');
    const grouped = GraphEngine.getGhostsBySource();

    if (grouped.size === 0) {
      container.innerHTML = '<div class="suggestion-empty">No pending suggestions. Add nodes to discover connections.</div>';
      return;
    }

    let html = '';
    grouped.forEach((ghosts, sourceId) => {
      const sourceNode = GraphEngine.nodeMap[sourceId];
      const sourceLabel = sourceNode ? sourceNode.label : sourceId;
      html += `<div class="suggestion-group">`;
      html += `<div class="suggestion-group-header">From: ${sourceLabel}</div>`;
      ghosts.forEach(g => {
        html += `<div class="suggestion-item" data-id="${g.id}">`;
        html += `<span class="si-label">${g.label}</span>`;
        html += `<span class="si-rel">${g.data?.discoveryRelation || ''}</span>`;
        html += `<span class="si-actions">`;
        html += `<button class="si-approve" data-id="${g.id}" data-qid="${g.data?.qid || ''}" data-label="${g.label}">✓</button>`;
        html += `<button class="si-dismiss" data-id="${g.id}" data-qid="${g.data?.qid || ''}" data-label="${g.label}">✕</button>`;
        html += `</span></div>`;
      });
      html += `</div>`;
    });
    container.innerHTML = html;

    // Wire click-to-zoom on entries
    container.querySelectorAll('.suggestion-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.si-actions')) return;
        const n = GraphEngine.nodeMap[el.dataset.id];
        if (n) { GraphEngine.zoomTo(n); GraphEngine.pinnedNode = n; GraphEngine._highlightConnected(n); openPanel(n); }
      });
    });

    // Wire approve buttons
    container.querySelectorAll('.si-approve').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const label = btn.dataset.label;
        GraphEngine.confirmGhost(id);
        const node = GraphEngine.nodeMap[id];
        if (node) Discovery.discover(node);
        updateSuggestionsBadge();
        renderSuggestionsPanel();
        showStatus(`Approved: ${label}`);
      });
    });

    // Wire dismiss buttons
    container.querySelectorAll('.si-dismiss').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const qid = btn.dataset.qid;
        const label = btn.dataset.label;
        const dismissed = Store.loadDismissed();
        dismissed.add(qid || id);
        Store.saveDismissed(dismissed);
        GraphEngine.removeGhost(id);
        updateSuggestionsBadge();
        renderSuggestionsPanel();
        showStatus(`Dismissed: ${label}`);
      });
    });
  }

  // ── Suggestions Badge (7.4) ──
  function updateSuggestionsBadge() {
    const badge = document.getElementById('suggestions-badge');
    const count = GraphEngine.getGhostNodes().length;
    badge.textContent = count;
    if (count > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  // Initial badge update on load
  updateSuggestionsBadge();

  // ── Controls ──
  document.getElementById('btn-clear').addEventListener('click', () => {
    if (confirm('Clear the entire graph? This cannot be undone.')) {
      GraphEngine.clear();
      showEmptyState();
      updateSuggestionsBadge();
      // Close suggestions panel if open
      document.getElementById('suggestions-panel').classList.remove('open');
    }
  });

  document.getElementById('btn-export').addEventListener('click', () => {
    const confirmedNodes = GraphEngine.nodes.filter(n => !n.ghost);
    const confirmedLinks = GraphEngine.links.filter(l => !l.ghost);
    const ghostNodes = GraphEngine.nodes.filter(n => n.ghost);
    const ghostLinks = GraphEngine.links.filter(l => l.ghost);
    Store.exportJSON(confirmedNodes, confirmedLinks, ghostNodes, ghostLinks);
  });

  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      removeEmptyState();
      if (GraphEngine.importJSON(ev.target.result)) {
        showStatus('Graph imported successfully');
        updateSuggestionsBadge();
      } else {
        showStatus('Failed to import — invalid format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // ── Sources Modal ──
  document.getElementById('btn-sources').addEventListener('click', () => {
    renderSourcesList();
    document.getElementById('sources-modal').classList.remove('hidden');
  });

  document.getElementById('sources-close').addEventListener('click', () => {
    document.getElementById('sources-modal').classList.add('hidden');
  });

  document.getElementById('btn-add-source').addEventListener('click', () => {
    const name = document.getElementById('source-name').value.trim();
    const url = document.getElementById('source-url').value.trim();
    if (!name || !url) {
      showStatus('Enter both a name and URL');
      return;
    }
    if (WebFetch.isUrl(url) && !url.includes('{query}')) {
      showStatus('To fetch a single page, paste the URL in the search bar at the top instead. This panel is for API endpoints with {query} placeholders.');
      return;
    }
    if (Sources.add(name, url)) {
      document.getElementById('source-name').value = '';
      document.getElementById('source-url').value = '';
      renderSourcesList();
      showStatus(`Added source: ${name}`);
    } else {
      showStatus('URL must contain {query} as a placeholder — e.g. https://api.example.com/search?q={query}');
    }
  });

  function renderSourcesList() {
    const list = document.getElementById('sources-list');
    list.innerHTML = '';
    Sources.list.forEach((s, i) => {
      const div = document.createElement('div');
      div.className = 'source-item';
      div.innerHTML = `<span class="si-name">${s.name}</span><span class="si-url">${s.url}</span>`;
      const btn = document.createElement('button');
      btn.textContent = 'Remove';
      btn.addEventListener('click', () => { Sources.remove(i); renderSourcesList(); });
      div.appendChild(btn);
      list.appendChild(div);
    });
  }

  // ── Helpers ──

  // ── Help Modal ──
  document.getElementById('btn-help').addEventListener('click', () => {
    document.getElementById('help-modal').classList.remove('hidden');
  });
  document.getElementById('help-close').addEventListener('click', () => {
    document.getElementById('help-modal').classList.add('hidden');
  });

  function showStatus(msg) {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(showStatus._t);
    showStatus._t = setTimeout(() => el.classList.add('hidden'), 3500);
  }
  function hideStatus() { document.getElementById('status').classList.add('hidden'); }

  function showLoader(msg) {
    document.getElementById('loader-text').textContent = msg || 'Loading...';
    document.getElementById('loader').classList.remove('hidden');
    // Safety: auto-hide after 15s in case something fails
    clearTimeout(showLoader._safety);
    showLoader._safety = setTimeout(() => hideLoader(), 15000);
  }
  function hideLoader() {
    clearTimeout(showLoader._safety);
    document.getElementById('loader').classList.add('hidden');
  }

  function showEmptyState() {
    if (document.getElementById('empty-state')) return;
    const div = document.createElement('div');
    div.id = 'empty-state';
    div.className = 'empty-state';
    div.innerHTML = `<h2>Your graph is empty</h2><p>Search for anyone or anything above — artists, musicians, politicians, places, companies — and watch the connections appear.</p><p style="margin-top:12px;font-size:0.75rem;color:rgba(107,104,128,0.5);">Click <strong>?</strong> in the top right to learn how to host your own copy.</p>`;
    document.getElementById('app').appendChild(div);
  }

  function removeEmptyState() {
    const el = document.getElementById('empty-state');
    if (el) el.remove();
  }

})();
