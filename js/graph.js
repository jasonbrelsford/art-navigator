// Ethereal Gallery — Force-Directed Connection Graph
(function () {
  'use strict';

  // ── Color palette for node types ──
  const COLORS = {
    artwork:  '#c9a84c',  // gold
    artist:   '#6e5fa8',  // purple
    museum:   '#4a9e8e',  // teal
    location: '#c75a5a',  // rose
    genre:    '#5a8ec7',  // blue
    era:      '#8a6e3e',  // bronze
    medium:   '#7a7a7a',  // grey
    patron:   '#d48a2e',  // orange
    sale:     '#d4a017',  // amber
  };

  const NODE_RADIUS = {
    artwork: 18, artist: 22, museum: 16, location: 12,
    genre: 14, era: 10, medium: 10, patron: 14, sale: 10,
  };

  // ── Shared mutable graph state ──
  const nodes = [];
  const links = [];
  const nodeMap = {};

  function addNode(id, type, label, data) {
    if (nodeMap[id]) return nodeMap[id];
    const node = { id, type, label, data, radius: NODE_RADIUS[type] || 12 };
    nodes.push(node);
    nodeMap[id] = node;
    return node;
  }

  function addLink(sourceId, targetId, relation) {
    if (sourceId === targetId) return;
    // Avoid duplicate links
    const exists = links.some(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      return s === sourceId && t === targetId && l.relation === relation;
    });
    if (!exists) links.push({ source: sourceId, target: targetId, relation });
  }

  // ── Build initial graph from ART_DB ──
  function buildGraph() {
    // Artists
    Object.entries(ART_DB.artists).forEach(([id, a]) => {
      addNode('artist-' + id, 'artist', a.name, a);
      const birthPlace = a.born.split(', ').slice(1).join(', ');
      const deathPlace = a.died.split(', ').slice(1).join(', ');
      if (birthPlace) {
        const locId = 'loc-' + birthPlace.toLowerCase().replace(/[^a-z0-9]/g, '-');
        addNode(locId, 'location', birthPlace, { place: birthPlace });
        addLink('artist-' + id, locId, 'born in');
      }
      if (deathPlace) {
        const locId = 'loc-' + deathPlace.toLowerCase().replace(/[^a-z0-9]/g, '-');
        addNode(locId, 'location', deathPlace, { place: deathPlace });
        addLink('artist-' + id, locId, 'died in');
      }
      const birthYear = parseInt(a.born);
      if (birthYear) {
        let era;
        if (birthYear < 1600) era = 'Renaissance';
        else if (birthYear < 1700) era = 'Dutch Golden Age';
        else if (birthYear < 1800) era = 'Edo Period';
        else if (birthYear < 1870) era = 'Impressionism';
        else if (birthYear < 1900) era = 'Post-Impressionism';
        else era = 'Modern';
        const eraId = 'era-' + era.toLowerCase().replace(/[^a-z0-9]/g, '-');
        addNode(eraId, 'era', era, { era });
        addLink('artist-' + id, eraId, 'movement');
      }
    });

    // Museums
    Object.entries(ART_DB.museums).forEach(([id, m]) => {
      addNode('museum-' + id, 'museum', m.name, m);
      const locId = 'loc-' + m.city.toLowerCase().replace(/[^a-z0-9]/g, '-');
      addNode(locId, 'location', m.city, { place: m.city });
      addLink('museum-' + id, locId, 'located in');
    });

    // Genres
    Object.entries(ART_DB.genres).forEach(([id, g]) => {
      addNode('genre-' + id, 'genre', g.label, g);
      if (g.related) g.related.forEach(rg => addLink('genre-' + id, 'genre-' + rg, 'related genre'));
    });

    // Artworks
    ART_DB.artworks.forEach(art => {
      addNode(art.id, 'artwork', art.title, art);
      addLink(art.id, 'artist-' + art.artistId, 'created by');
      addLink(art.id, 'museum-' + art.museumId, 'housed at');
      addLink(art.id, 'genre-' + art.genre, 'genre');

      // Medium
      const medId = 'medium-' + art.medium.toLowerCase().replace(/[^a-z0-9]/g, '-');
      addNode(medId, 'medium', art.medium, { medium: art.medium });
      addLink(art.id, medId, 'medium');

      // Sale status
      const saleId = 'sale-museum-collection';
      addNode(saleId, 'sale', 'Museum Collection (Not for Sale)', { status: 'Not for sale — permanent museum collection' });
      addLink(art.id, saleId, 'sale status');

      // Patron / funder
      if (art.patron && !art.patron.startsWith('Self-funded') && !art.patron.startsWith('Unknown')) {
        const patronName = art.patron.split(' (')[0]; // strip parenthetical
        const patronId = 'patron-' + patronName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        addNode(patronId, 'patron', art.patron, { name: art.patron });
        addLink(art.id, patronId, 'funded by');
      }

      // Creation location from provenance
      const match = art.provenance.match(/[Pp]ainted (?:at|in|during) ([^.]+)/);
      if (match) {
        const loc = match[1].trim();
        const locId = 'loc-' + loc.toLowerCase().replace(/[^a-z0-9]/g, '-');
        addNode(locId, 'location', loc, { place: loc });
        addLink(art.id, locId, 'created at');
      }
    });
  }

  buildGraph();

  // ── State — default to artworks only ──
  let showLabels = true;
  let showImages = true;
  let activeFilters = new Set(['artwork']);

  // ── SVG setup ──
  const svg = d3.select('#graph');
  const width = window.innerWidth;
  const height = window.innerHeight;
  const defs = svg.append('defs');

  // Image patterns
  nodes.filter(n => n.type === 'artwork' && n.data.image).forEach(n => {
    defs.append('pattern')
      .attr('id', 'img-' + n.id.replace(/[^a-zA-Z0-9-]/g, '_'))
      .attr('width', 1).attr('height', 1)
      .attr('patternContentUnits', 'objectBoundingBox')
      .append('image')
      .attr('href', n.data.image)
      .attr('width', 1).attr('height', 1)
      .attr('preserveAspectRatio', 'xMidYMid slice');
  });

  // Glow filter
  const glow = defs.append('filter').attr('id', 'glow');
  glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
  glow.append('feMerge').selectAll('feMergeNode')
    .data(['blur', 'SourceGraphic']).enter()
    .append('feMergeNode').attr('in', d => d);

  const g = svg.append('g');
  const zoom = d3.zoom().scaleExtent([0.1, 6]).on('zoom', (e) => g.attr('transform', e.transform));
  svg.call(zoom);

  // ── Force simulation ──
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(d => {
      if (d.relation === 'created by' || d.relation === 'housed at') return 80;
      if (d.relation === 'genre' || d.relation === 'medium' || d.relation === 'funded by') return 100;
      return 120;
    }).strength(0.4))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => d.radius + 8))
    .force('x', d3.forceX(width / 2).strength(0.03))
    .force('y', d3.forceY(height / 2).strength(0.03));

  // ── Draw links ──
  const linkG = g.append('g');
  let link = linkG.selectAll('line').data(links).enter().append('line')
    .attr('class', 'link')
    .attr('stroke', d => {
      const src = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
      return COLORS[src ? src.type : 'artwork'] || '#444';
    })
    .attr('stroke-width', d => {
      if (d.relation === 'created by') return 2;
      if (d.relation === 'housed at' || d.relation === 'funded by') return 1.5;
      return 0.8;
    });

  // ── Draw nodes ──
  const nodeG = g.append('g');
  let node = nodeG.selectAll('.node').data(nodes).enter().append('g')
    .attr('class', 'node')
    .call(d3.drag().on('start', dragStart).on('drag', dragging).on('end', dragEnd));

  node.append('circle')
    .attr('r', d => d.radius)
    .attr('fill', d => {
      if (d.type === 'artwork' && d.data.image && showImages)
        return 'url(#img-' + d.id.replace(/[^a-zA-Z0-9-]/g, '_') + ')';
      return COLORS[d.type] || '#666';
    })
    .attr('stroke', d => COLORS[d.type] || '#666')
    .attr('filter', 'url(#glow)');

  let labels = node.append('text')
    .attr('dy', d => d.radius + 14)
    .attr('text-anchor', 'middle')
    .text(d => d.label.length > 24 ? d.label.slice(0, 22) + '…' : d.label);

  // Apply initial filter (artworks only)
  resetHighlight();

  // ── Tooltip ──
  const tooltip = d3.select('#tooltip');

  function attachNodeEvents(sel) {
    sel.on('mouseover', function (event, d) {
      let html = '';
      if (d.type === 'artwork' && d.data.image) html += `<img src="${d.data.image}" alt="${d.label}">`;
      html += `<div class="tt-type">${d.type}</div><h3>${d.label}</h3>`;
      if (d.type === 'artwork') {
        const artist = ART_DB.artists[d.data.artistId];
        html += `<div class="tt-detail">${artist ? artist.name : ''} · ${d.data.year}<br>${d.data.medium}`;
        if (d.data.patron) html += `<br>Patron: ${d.data.patron}`;
        html += `</div>`;
      } else if (d.type === 'artist') {
        html += `<div class="tt-detail">${d.data.born} — ${d.data.died}</div>`;
      } else if (d.type === 'museum') {
        html += `<div class="tt-detail">${d.data.city}<br>${d.data.address}</div>`;
      } else if (d.type === 'patron') {
        html += `<div class="tt-detail">${d.data.name}</div>`;
      } else if (d.type === 'location') {
        html += `<div class="tt-detail">${d.data.place}</div>`;
      }
      const connCount = links.filter(l =>
        (typeof l.source === 'object' ? l.source.id : l.source) === d.id ||
        (typeof l.target === 'object' ? l.target.id : l.target) === d.id
      ).length;
      html += `<div class="tt-detail" style="margin-top:6px">${connCount} connections</div>`;
      tooltip.html(html).style('display', 'block');
      positionTooltip(event);
      highlightConnections(d);
    })
    .on('mousemove', positionTooltip)
    .on('mouseout', function () { tooltip.style('display', 'none'); resetHighlight(); })
    .on('click', function (event, d) { event.stopPropagation(); openInfoPanel(d); });
  }

  attachNodeEvents(node);

  function positionTooltip(event) {
    let x = event.pageX + 16, y = event.pageY - 10;
    if (x + 320 > window.innerWidth) x = event.pageX - 336;
    if (y + 200 > window.innerHeight) y = event.pageY - 200;
    tooltip.style('left', x + 'px').style('top', y + 'px');
  }

  function highlightConnections(d) {
    const connected = new Set([d.id]);
    links.forEach(l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source;
      const tid = typeof l.target === 'object' ? l.target.id : l.target;
      if (sid === d.id) connected.add(tid);
      if (tid === d.id) connected.add(sid);
    });
    node.style('opacity', n => connected.has(n.id) ? 1 : 0.1);
    link.style('stroke-opacity', l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source;
      const tid = typeof l.target === 'object' ? l.target.id : l.target;
      return (sid === d.id || tid === d.id) ? 0.7 : 0.03;
    });
  }

  function resetHighlight() {
    node.style('opacity', d => activeFilters.has(d.type) ? 1 : 0.08);
    link.style('stroke-opacity', l => {
      const src = typeof l.source === 'object' ? l.source : nodes.find(n => n.id === l.source);
      const tgt = typeof l.target === 'object' ? l.target : nodes.find(n => n.id === l.target);
      if (src && tgt && activeFilters.has(src.type) && activeFilters.has(tgt.type)) return 0.25;
      return 0.03;
    });
  }

  simulation.on('tick', () => {
    link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  function dragStart(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
  function dragging(event, d) { d.fx = event.x; d.fy = event.y; }
  function dragEnd(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }

  // ── Info Panel ──
  function openInfoPanel(d) {
    const panel = document.getElementById('info-panel');
    const content = document.getElementById('panel-content');
    let html = '';
    if (d.type === 'artwork' && d.data.image) html += `<img src="${d.data.image}" alt="${d.label}">`;
    html += `<div class="panel-type">${d.type}</div><h2>${d.label}</h2>`;

    if (d.type === 'artwork') {
      const artist = ART_DB.artists[d.data.artistId];
      const museum = ART_DB.museums[d.data.museumId];
      html += `<div class="panel-section"><h3>Details</h3>
        <p>${artist ? artist.name : ''} · ${d.data.year}<br>${d.data.medium}<br>Gallery: ${d.data.galleryRoom}</p></div>`;
      if (d.data.patron) html += `<div class="panel-section"><h3>Patron / Funder</h3><p>${d.data.patron}</p></div>`;
      html += `<div class="panel-section"><h3>Current Location</h3>
        <p>${museum ? museum.name : ''}<br>${museum ? museum.address : ''}</p></div>`;
      html += `<div class="panel-section"><h3>Provenance</h3><p>${d.data.provenance}</p></div>`;
      html += `<div class="panel-section"><h3>Sale Status</h3><p>Museum collection — not for sale</p></div>`;
    } else if (d.type === 'artist') {
      html += `<div class="panel-section"><h3>Life</h3><p>Born: ${d.data.born}<br>Died: ${d.data.died}</p></div>`;
      html += `<div class="panel-section"><h3>Biography</h3><p>${d.data.bio}</p></div>`;
      html += `<div class="panel-section"><h3>Contact</h3><p>${d.data.contact}</p></div>`;
      if (d.data.wikiUrl) html += `<div class="panel-section"><p><a href="${d.data.wikiUrl}" target="_blank" style="color:var(--accent)">Wikipedia →</a></p></div>`;
    } else if (d.type === 'museum') {
      html += `<div class="panel-section"><h3>Address</h3><p>${d.data.address}</p>
        <p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.data.address)}" target="_blank" style="color:var(--gold)">Open in Maps →</a></p></div>`;
      if (d.data.website) html += `<div class="panel-section"><p><a href="${d.data.website}" target="_blank" style="color:var(--accent)">Visit Website →</a></p></div>`;
    } else if (d.type === 'patron') {
      html += `<div class="panel-section"><p>Patron / funder of artworks</p></div>`;
    } else if (d.type === 'location') {
      html += `<div class="panel-section"><p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.data.place)}" target="_blank" style="color:var(--gold)">Open in Maps →</a></p></div>`;
    } else if (d.type === 'genre') {
      html += `<div class="panel-section"><h3>Related Genres</h3><p>${(d.data.related || []).map(r => { const gg = ART_DB.genres[r]; return gg ? gg.label : r; }).join(', ')}</p></div>`;
    } else if (d.type === 'era') {
      html += `<div class="panel-section"><p>Art movement / historical period</p></div>`;
    } else if (d.type === 'medium') {
      html += `<div class="panel-section"><p>Artistic medium: ${d.data.medium}</p></div>`;
    } else if (d.type === 'sale') {
      html += `<div class="panel-section"><p>${d.data.status}</p></div>`;
    }

    // Connections list
    const connections = [];
    links.forEach(l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source;
      const tid = typeof l.target === 'object' ? l.target.id : l.target;
      if (sid === d.id) { const t = nodes.find(n => n.id === tid); if (t) connections.push({ node: t, relation: l.relation }); }
      if (tid === d.id) { const s = nodes.find(n => n.id === sid); if (s) connections.push({ node: s, relation: l.relation }); }
    });
    if (connections.length) {
      html += `<div class="panel-connections"><h3 style="font-family:'Cormorant Garamond',serif;color:var(--accent);margin-bottom:8px;">Connections (${connections.length})</h3>`;
      connections.forEach(c => {
        html += `<div class="conn-item" data-node-id="${c.node.id}">
          <span class="conn-dot" style="background:${COLORS[c.node.type]}"></span>
          <span class="conn-label">${c.node.label}</span>
          <span class="conn-rel">${c.relation}</span></div>`;
      });
      html += '</div>';
    }
    content.innerHTML = html;
    panel.classList.add('open');
    content.querySelectorAll('.conn-item').forEach(el => {
      el.addEventListener('click', () => {
        const tn = nodes.find(n => n.id === el.dataset.nodeId);
        if (tn) { openInfoPanel(tn); zoomToNode(tn); }
      });
    });
  }

  document.querySelector('#info-panel .close-btn').addEventListener('click', () => {
    document.getElementById('info-panel').classList.remove('open');
  });

  function zoomToNode(d) {
    svg.transition().duration(750).call(
      zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(2).translate(-d.x, -d.y)
    );
  }

  // ── Legend ──
  function buildLegend() {
    const legend = document.getElementById('legend');
    let html = '<h2>Node Types</h2>';
    Object.entries(COLORS).forEach(([type, color]) => {
      const count = nodes.filter(n => n.type === type).length;
      const active = activeFilters.has(type);
      html += `<div class="legend-item ${active ? '' : 'dimmed'}" data-type="${type}">
        <span class="legend-dot" style="background:${color}"></span>
        <span>${type.charAt(0).toUpperCase() + type.slice(1)} (${count})</span>
      </div>`;
    });
    // Show All / Show Artworks Only buttons
    html += `<div style="margin-top:10px;display:flex;gap:6px;">
      <button id="legend-all" style="flex:1;background:none;border:1px solid rgba(110,95,168,0.3);color:var(--dim);font-size:0.65rem;padding:4px 8px;cursor:pointer;">Show All</button>
      <button id="legend-art-only" style="flex:1;background:none;border:1px solid rgba(110,95,168,0.3);color:var(--dim);font-size:0.65rem;padding:4px 8px;cursor:pointer;">Art Only</button>
    </div>`;
    legend.innerHTML = html;

    legend.querySelectorAll('.legend-item').forEach(el => {
      el.addEventListener('click', () => {
        const type = el.dataset.type;
        if (activeFilters.has(type)) activeFilters.delete(type);
        else activeFilters.add(type);
        el.classList.toggle('dimmed');
        resetHighlight();
      });
    });
    document.getElementById('legend-all').addEventListener('click', () => {
      activeFilters = new Set(Object.keys(COLORS));
      buildLegend();
      resetHighlight();
    });
    document.getElementById('legend-art-only').addEventListener('click', () => {
      activeFilters = new Set(['artwork']);
      buildLegend();
      resetHighlight();
    });
  }
  buildLegend();

  // ── Controls ──
  document.getElementById('btn-reset').addEventListener('click', () => {
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    simulation.alpha(0.5).restart();
  });
  document.getElementById('btn-toggle-labels').addEventListener('click', () => {
    showLabels = !showLabels;
    labels.style('display', showLabels ? 'block' : 'none');
  });
  document.getElementById('btn-toggle-images').addEventListener('click', () => {
    showImages = !showImages;
    node.select('circle').attr('fill', d => {
      if (d.type === 'artwork' && d.data.image && showImages)
        return 'url(#img-' + d.id.replace(/[^a-zA-Z0-9-]/g, '_') + ')';
      return COLORS[d.type] || '#666';
    });
  });

  // ── Wikidata artist search & auto-add ──
  let searchTimeout = null;
  const searchInput = document.getElementById('search-input');
  const wikiStatus = document.createElement('div');
  wikiStatus.id = 'wiki-status';
  wikiStatus.style.cssText = 'position:absolute;bottom:52px;left:50%;transform:translateX(-50%);z-index:10;font-size:0.75rem;color:var(--accent);display:none;background:rgba(18,18,31,0.9);padding:6px 14px;border:1px solid rgba(110,95,168,0.2);';
  document.getElementById('app').appendChild(wikiStatus);

  async function searchWikidata(query) {
    // Search Wikidata for artists (Q1028181 = painter, Q483501 = artist)
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&limit=5&format=json&origin=*`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      return data.search || [];
    } catch (e) { return []; }
  }

  async function getWikidataEntity(qid) {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&languages=en&props=labels|descriptions|claims|sitelinks&format=json&origin=*`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      return data.entities[qid];
    } catch (e) { return null; }
  }

  function getClaimValue(entity, prop) {
    const claims = entity.claims[prop];
    if (!claims || !claims[0]) return null;
    const snak = claims[0].mainsnak;
    if (snak.datatype === 'time') return snak.datavalue?.value?.time?.replace(/^\+/, '').slice(0, 4);
    if (snak.datatype === 'wikibase-item') return snak.datavalue?.value?.id;
    if (snak.datatype === 'string') return snak.datavalue?.value;
    return null;
  }

  async function getEntityLabel(qid) {
    if (!qid) return '';
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&languages=en&props=labels&format=json&origin=*`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      return data.entities[qid]?.labels?.en?.value || qid;
    } catch (e) { return qid; }
  }

  async function addArtistFromWikidata(qid) {
    const artistNodeId = 'artist-wiki-' + qid;
    if (nodeMap[artistNodeId]) {
      wikiStatus.textContent = 'Artist already in graph';
      wikiStatus.style.display = 'block';
      setTimeout(() => wikiStatus.style.display = 'none', 2000);
      zoomToNode(nodeMap[artistNodeId]);
      return;
    }

    wikiStatus.textContent = 'Loading artist from Wikidata...';
    wikiStatus.style.display = 'block';

    const entity = await getWikidataEntity(qid);
    if (!entity) { wikiStatus.textContent = 'Could not load artist'; setTimeout(() => wikiStatus.style.display = 'none', 2000); return; }

    const name = entity.labels?.en?.value || qid;
    const desc = entity.descriptions?.en?.value || '';
    const birthYear = getClaimValue(entity, 'P569'); // date of birth
    const deathYear = getClaimValue(entity, 'P570'); // date of death
    const birthPlaceQid = getClaimValue(entity, 'P19'); // place of birth
    const deathPlaceQid = getClaimValue(entity, 'P20'); // place of death
    const movementQids = (entity.claims['P135'] || []).map(c => c.mainsnak?.datavalue?.value?.id).filter(Boolean); // movement
    const wikiUrl = entity.sitelinks?.enwiki ? `https://en.wikipedia.org/wiki/${entity.sitelinks.enwiki.title.replace(/ /g, '_')}` : null;

    // Resolve place names
    const [birthPlace, deathPlace] = await Promise.all([
      birthPlaceQid ? getEntityLabel(birthPlaceQid) : Promise.resolve(''),
      deathPlaceQid ? getEntityLabel(deathPlaceQid) : Promise.resolve('')
    ]);

    // Resolve movement names
    const movements = await Promise.all(movementQids.slice(0, 3).map(q => getEntityLabel(q)));

    const born = birthYear ? `${birthYear}, ${birthPlace}` : birthPlace || 'Unknown';
    const died = deathYear ? `${deathYear}, ${deathPlace}` : deathPlace || 'Unknown';

    // Add artist node
    const artistData = { name, born, died, bio: desc, contact: wikiUrl ? `See Wikipedia: ${wikiUrl}` : 'No contact information available', wikiUrl };
    addNode(artistNodeId, 'artist', name, artistData);

    // Birth/death locations
    if (birthPlace) {
      const locId = 'loc-' + birthPlace.toLowerCase().replace(/[^a-z0-9]/g, '-');
      addNode(locId, 'location', birthPlace, { place: birthPlace });
      addLink(artistNodeId, locId, 'born in');
    }
    if (deathPlace) {
      const locId = 'loc-' + deathPlace.toLowerCase().replace(/[^a-z0-9]/g, '-');
      addNode(locId, 'location', deathPlace, { place: deathPlace });
      addLink(artistNodeId, locId, 'died in');
    }

    // Movements / eras
    movements.forEach(m => {
      const eraId = 'era-' + m.toLowerCase().replace(/[^a-z0-9]/g, '-');
      addNode(eraId, 'era', m, { era: m });
      addLink(artistNodeId, eraId, 'movement');
    });

    // If no movements found, assign by birth year
    if (movements.length === 0 && birthYear) {
      const y = parseInt(birthYear);
      let era = 'Unknown';
      if (y < 1600) era = 'Renaissance';
      else if (y < 1700) era = 'Baroque';
      else if (y < 1800) era = 'Neoclassicism';
      else if (y < 1870) era = 'Impressionism';
      else if (y < 1900) era = 'Post-Impressionism';
      else era = 'Modern';
      const eraId = 'era-' + era.toLowerCase().replace(/[^a-z0-9]/g, '-');
      addNode(eraId, 'era', era, { era });
      addLink(artistNodeId, eraId, 'movement');
    }

    // Connect to existing artists sharing locations or eras
    // (this creates the cross-connections that make the graph interesting)

    // Rebuild the visualization
    rebuildVisualization();

    // Make the new artist visible
    activeFilters.add('artist');
    activeFilters.add('location');
    activeFilters.add('era');
    buildLegend();
    resetHighlight();

    wikiStatus.textContent = `Added ${name} to the graph`;
    setTimeout(() => wikiStatus.style.display = 'none', 3000);

    // Zoom to the new node
    setTimeout(() => {
      const newNode = nodes.find(n => n.id === artistNodeId);
      if (newNode) zoomToNode(newNode);
    }, 500);
  }

  function rebuildVisualization() {
    // Restart simulation with new data
    simulation.nodes(nodes);
    simulation.force('link').links(links);

    // Rebind links
    link = linkG.selectAll('line').data(links);
    const linkEnter = link.enter().append('line')
      .attr('class', 'link')
      .attr('stroke', d => {
        const src = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
        return COLORS[src ? src.type : 'artwork'] || '#444';
      })
      .attr('stroke-width', d => {
        if (d.relation === 'created by') return 2;
        if (d.relation === 'housed at' || d.relation === 'funded by') return 1.5;
        return 0.8;
      });
    link = linkEnter.merge(link);

    // Add image patterns for new artwork nodes
    nodes.filter(n => n.type === 'artwork' && n.data.image && !defs.select('#img-' + n.id.replace(/[^a-zA-Z0-9-]/g, '_')).node()).forEach(n => {
      defs.append('pattern')
        .attr('id', 'img-' + n.id.replace(/[^a-zA-Z0-9-]/g, '_'))
        .attr('width', 1).attr('height', 1)
        .attr('patternContentUnits', 'objectBoundingBox')
        .append('image')
        .attr('href', n.data.image)
        .attr('width', 1).attr('height', 1)
        .attr('preserveAspectRatio', 'xMidYMid slice');
    });

    // Rebind nodes
    node = nodeG.selectAll('.node').data(nodes, d => d.id);
    const nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .call(d3.drag().on('start', dragStart).on('drag', dragging).on('end', dragEnd));

    nodeEnter.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => {
        if (d.type === 'artwork' && d.data.image && showImages)
          return 'url(#img-' + d.id.replace(/[^a-zA-Z0-9-]/g, '_') + ')';
        return COLORS[d.type] || '#666';
      })
      .attr('stroke', d => COLORS[d.type] || '#666')
      .attr('filter', 'url(#glow)');

    nodeEnter.append('text')
      .attr('dy', d => d.radius + 14)
      .attr('text-anchor', 'middle')
      .text(d => d.label.length > 24 ? d.label.slice(0, 22) + '…' : d.label);

    attachNodeEvents(nodeEnter);
    node = nodeEnter.merge(node);
    labels = node.selectAll('text');

    simulation.alpha(0.5).restart();
    buildLegend();
  }

  // ── Search with Wikidata integration ──
  let wikiResults = [];

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = searchInput.value.toLowerCase().trim();

    // Remove any existing dropdown
    const existing = document.getElementById('search-dropdown');
    if (existing) existing.remove();

    if (!q) { resetHighlight(); return; }

    // First: highlight local matches
    const matches = new Set();
    nodes.forEach(n => {
      if (n.label.toLowerCase().includes(q)) matches.add(n.id);
      if (n.type === 'artwork' && n.data.provenance && n.data.provenance.toLowerCase().includes(q)) matches.add(n.id);
      if (n.type === 'artist' && n.data.bio && n.data.bio.toLowerCase().includes(q)) matches.add(n.id);
    });

    const expanded = new Set(matches);
    links.forEach(l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source;
      const tid = typeof l.target === 'object' ? l.target.id : l.target;
      if (matches.has(sid)) expanded.add(tid);
      if (matches.has(tid)) expanded.add(sid);
    });

    if (matches.size > 0) {
      node.style('opacity', n => expanded.has(n.id) ? 1 : 0.05);
      link.style('stroke-opacity', l => {
        const sid = typeof l.source === 'object' ? l.source.id : l.source;
        const tid = typeof l.target === 'object' ? l.target.id : l.target;
        return (expanded.has(sid) && expanded.has(tid)) ? 0.5 : 0.02;
      });
      const first = nodes.find(n => matches.has(n.id));
      if (first) zoomToNode(first);
    }

    // Then: search Wikidata after a debounce
    if (q.length >= 3) {
      searchTimeout = setTimeout(async () => {
        wikiResults = await searchWikidata(q);
        // Filter to likely artists (check description for painter/artist/sculptor)
        const artistTerms = ['paint', 'artist', 'sculptor', 'printmaker', 'illustrat', 'drawer', 'engraver'];
        const filtered = wikiResults.filter(r => {
          const desc = (r.description || '').toLowerCase();
          return artistTerms.some(t => desc.includes(t));
        });

        if (filtered.length > 0) {
          showSearchDropdown(filtered, q);
        }
      }, 600);
    }
  });

  function showSearchDropdown(results, query) {
    const existing = document.getElementById('search-dropdown');
    if (existing) existing.remove();

    const dropdown = document.createElement('div');
    dropdown.id = 'search-dropdown';
    dropdown.style.cssText = `
      position:absolute; bottom:52px; left:50%; transform:translateX(-50%);
      width:320px; background:rgba(18,18,31,0.97); border:1px solid rgba(110,95,168,0.3);
      z-index:20; max-height:240px; overflow-y:auto;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'padding:8px 12px;font-size:0.65rem;color:var(--accent);letter-spacing:0.1em;text-transform:uppercase;border-bottom:1px solid rgba(110,95,168,0.15);';
    header.textContent = 'Add artist from Wikidata';
    dropdown.appendChild(header);

    results.forEach(r => {
      const item = document.createElement('div');
      item.style.cssText = 'padding:8px 12px;cursor:pointer;transition:background 0.2s;font-size:0.8rem;';
      item.innerHTML = `<span style="color:var(--text)">${r.label}</span><br><span style="color:var(--dim);font-size:0.7rem">${r.description || ''}</span>`;
      item.addEventListener('mouseenter', () => item.style.background = 'rgba(110,95,168,0.15)');
      item.addEventListener('mouseleave', () => item.style.background = 'none');
      item.addEventListener('click', () => {
        dropdown.remove();
        searchInput.value = '';
        addArtistFromWikidata(r.id);
      });
      dropdown.appendChild(item);
    });

    document.getElementById('search-box').appendChild(dropdown);

    // Close on click outside
    const closeHandler = (e) => {
      if (!dropdown.contains(e.target) && e.target !== searchInput) {
        dropdown.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 100);
  }

  // Click background to close panel
  svg.on('click', () => {
    document.getElementById('info-panel').classList.remove('open');
    const dd = document.getElementById('search-dropdown');
    if (dd) dd.remove();
  });

  // Resize
  window.addEventListener('resize', () => {
    simulation.force('center', d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2));
    simulation.alpha(0.3).restart();
  });

})();
