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
    sale:     '#d4a017',  // amber
  };

  const NODE_RADIUS = {
    artwork: 18,
    artist: 22,
    museum: 16,
    location: 12,
    genre: 14,
    era: 10,
    medium: 10,
    sale: 10,
  };

  // ── Build graph data from ART_DB ──
  function buildGraph() {
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
      links.push({ source: sourceId, target: targetId, relation });
    }

    // Artists
    Object.entries(ART_DB.artists).forEach(([id, a]) => {
      addNode('artist-' + id, 'artist', a.name, a);
      // Extract birth/death locations as location nodes
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
      // Era node from birth year
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
      // Related genres
      if (g.related) {
        g.related.forEach(rg => {
          addLink('genre-' + id, 'genre-' + rg, 'related genre');
        });
      }
    });

    // Artworks
    ART_DB.artworks.forEach(art => {
      addNode(art.id, 'artwork', art.title, art);

      // → artist
      addLink(art.id, 'artist-' + art.artistId, 'created by');

      // → museum
      addLink(art.id, 'museum-' + art.museumId, 'housed at');

      // → genre
      addLink(art.id, 'genre-' + art.genre, 'genre');

      // → medium
      const medId = 'medium-' + art.medium.toLowerCase().replace(/[^a-z0-9]/g, '-');
      addNode(medId, 'medium', art.medium, { medium: art.medium });
      addLink(art.id, medId, 'medium');

      // → sale status (all historical works = not for sale)
      const saleId = 'sale-museum-collection';
      addNode(saleId, 'sale', 'Museum Collection (Not for Sale)', { status: 'Not for sale — permanent museum collection' });
      addLink(art.id, saleId, 'sale status');

      // → creation location (extract from provenance if possible)
      const prov = art.provenance.toLowerCase();
      let creationLoc = null;
      if (prov.includes('painted at giverny') || prov.includes('painted at')) {
        const match = art.provenance.match(/[Pp]ainted (?:at|in|during) ([^.]+)/);
        if (match) creationLoc = match[1].trim();
      }
      if (creationLoc) {
        const locId = 'loc-' + creationLoc.toLowerCase().replace(/[^a-z0-9]/g, '-');
        addNode(locId, 'location', creationLoc, { place: creationLoc });
        addLink(art.id, locId, 'created at');
      }
    });

    return { nodes, links };
  }

  // ── State ──
  let showLabels = true;
  let showImages = true;
  let activeFilters = new Set(Object.keys(COLORS));
  const { nodes, links } = buildGraph();

  // ── SVG setup ──
  const svg = d3.select('#graph');
  const width = window.innerWidth;
  const height = window.innerHeight;

  const defs = svg.append('defs');

  // Image patterns for artwork nodes
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

  // Zoom
  const zoom = d3.zoom()
    .scaleExtent([0.1, 6])
    .on('zoom', (e) => g.attr('transform', e.transform));
  svg.call(zoom);

  // ── Force simulation ──
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(d => {
      // Shorter links for direct relationships
      if (d.relation === 'created by' || d.relation === 'housed at') return 80;
      if (d.relation === 'genre' || d.relation === 'medium') return 100;
      return 120;
    }).strength(0.4))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => d.radius + 8))
    .force('x', d3.forceX(width / 2).strength(0.03))
    .force('y', d3.forceY(height / 2).strength(0.03));

  // ── Draw links ──
  const link = g.append('g').selectAll('line')
    .data(links).enter().append('line')
    .attr('class', 'link')
    .attr('stroke', d => {
      const src = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
      return COLORS[src ? src.type : 'artwork'] || '#444';
    })
    .attr('stroke-width', d => {
      if (d.relation === 'created by') return 2;
      if (d.relation === 'housed at') return 1.5;
      return 0.8;
    });

  // ── Draw nodes ──
  const node = g.append('g').selectAll('.node')
    .data(nodes).enter().append('g')
    .attr('class', 'node')
    .call(d3.drag()
      .on('start', dragStart)
      .on('drag', dragging)
      .on('end', dragEnd));

  // Circle for each node
  node.append('circle')
    .attr('r', d => d.radius)
    .attr('fill', d => {
      if (d.type === 'artwork' && d.data.image && showImages) {
        return 'url(#img-' + d.id.replace(/[^a-zA-Z0-9-]/g, '_') + ')';
      }
      return COLORS[d.type] || '#666';
    })
    .attr('stroke', d => COLORS[d.type] || '#666')
    .attr('filter', 'url(#glow)');

  // Labels
  const labels = node.append('text')
    .attr('dy', d => d.radius + 14)
    .attr('text-anchor', 'middle')
    .text(d => d.label.length > 24 ? d.label.slice(0, 22) + '…' : d.label);

  // ── Tooltip ──
  const tooltip = d3.select('#tooltip');

  node.on('mouseover', function (event, d) {
    let html = '';
    if (d.type === 'artwork' && d.data.image) {
      html += `<img src="${d.data.image}" alt="${d.label}">`;
    }
    html += `<div class="tt-type">${d.type}</div>`;
    html += `<h3>${d.label}</h3>`;

    if (d.type === 'artwork') {
      const artist = ART_DB.artists[d.data.artistId];
      html += `<div class="tt-detail">${artist ? artist.name : ''} · ${d.data.year}<br>${d.data.medium}</div>`;
    } else if (d.type === 'artist') {
      html += `<div class="tt-detail">${d.data.born} — ${d.data.died}</div>`;
    } else if (d.type === 'museum') {
      html += `<div class="tt-detail">${d.data.city}<br>${d.data.address}</div>`;
    } else if (d.type === 'location') {
      html += `<div class="tt-detail">${d.data.place}</div>`;
    }

    // Count connections
    const connCount = links.filter(l =>
      (typeof l.source === 'object' ? l.source.id : l.source) === d.id ||
      (typeof l.target === 'object' ? l.target.id : l.target) === d.id
    ).length;
    html += `<div class="tt-detail" style="margin-top:6px">${connCount} connections</div>`;

    tooltip.html(html).style('display', 'block');
    positionTooltip(event);

    // Highlight connections
    highlightConnections(d);
  })
  .on('mousemove', positionTooltip)
  .on('mouseout', function () {
    tooltip.style('display', 'none');
    resetHighlight();
  })
  .on('click', function (event, d) {
    event.stopPropagation();
    openInfoPanel(d);
  });

  function positionTooltip(event) {
    let x = event.pageX + 16;
    let y = event.pageY - 10;
    if (x + 320 > window.innerWidth) x = event.pageX - 336;
    if (y + 200 > window.innerHeight) y = event.pageY - 200;
    tooltip.style('left', x + 'px').style('top', y + 'px');
  }

  function highlightConnections(d) {
    const connected = new Set();
    connected.add(d.id);
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

  // ── Simulation tick ──
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // ── Drag ──
  function dragStart(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x; d.fy = d.y;
  }
  function dragging(event, d) {
    d.fx = event.x; d.fy = event.y;
  }
  function dragEnd(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null; d.fy = null;
  }

  // ── Info Panel ──
  function openInfoPanel(d) {
    const panel = document.getElementById('info-panel');
    const content = document.getElementById('panel-content');
    let html = '';

    if (d.type === 'artwork' && d.data.image) {
      html += `<img src="${d.data.image}" alt="${d.label}">`;
    }
    html += `<div class="panel-type">${d.type}</div>`;
    html += `<h2>${d.label}</h2>`;

    if (d.type === 'artwork') {
      const artist = ART_DB.artists[d.data.artistId];
      const museum = ART_DB.museums[d.data.museumId];
      html += `<div class="panel-section"><h3>Details</h3>
        <p>${artist ? artist.name : ''} · ${d.data.year}<br>${d.data.medium}<br>Gallery: ${d.data.galleryRoom}</p></div>`;
      html += `<div class="panel-section"><h3>Current Location</h3>
        <p>${museum ? museum.name : ''}<br>${museum ? museum.address : ''}</p></div>`;
      html += `<div class="panel-section"><h3>Provenance</h3><p>${d.data.provenance}</p></div>`;
      html += `<div class="panel-section"><h3>Sale Status</h3><p>Museum collection — not for sale</p></div>`;
    } else if (d.type === 'artist') {
      html += `<div class="panel-section"><h3>Life</h3><p>Born: ${d.data.born}<br>Died: ${d.data.died}</p></div>`;
      html += `<div class="panel-section"><h3>Biography</h3><p>${d.data.bio}</p></div>`;
      html += `<div class="panel-section"><h3>Contact</h3><p>${d.data.contact}</p></div>`;
    } else if (d.type === 'museum') {
      html += `<div class="panel-section"><h3>Address</h3><p>${d.data.address}</p>
        <p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.data.address)}" target="_blank" style="color:var(--gold)">Open in Maps →</a></p></div>`;
      if (d.data.website) html += `<div class="panel-section"><p><a href="${d.data.website}" target="_blank" style="color:var(--accent)">Visit Website →</a></p></div>`;
    } else if (d.type === 'location') {
      html += `<div class="panel-section"><p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.data.place)}" target="_blank" style="color:var(--gold)">Open in Maps →</a></p></div>`;
    } else if (d.type === 'genre') {
      html += `<div class="panel-section"><h3>Related Genres</h3><p>${(d.data.related || []).map(r => {
        const g = ART_DB.genres[r]; return g ? g.label : r;
      }).join(', ')}</p></div>`;
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
      if (sid === d.id) {
        const target = nodes.find(n => n.id === tid);
        if (target) connections.push({ node: target, relation: l.relation });
      }
      if (tid === d.id) {
        const source = nodes.find(n => n.id === sid);
        if (source) connections.push({ node: source, relation: l.relation });
      }
    });

    if (connections.length) {
      html += `<div class="panel-connections"><h3 style="font-family:'Cormorant Garamond',serif;color:var(--accent);margin-bottom:8px;">Connections (${connections.length})</h3>`;
      connections.forEach(c => {
        html += `<div class="conn-item" data-node-id="${c.node.id}">
          <span class="conn-dot" style="background:${COLORS[c.node.type]}"></span>
          <span class="conn-label">${c.node.label}</span>
          <span class="conn-rel">${c.relation}</span>
        </div>`;
      });
      html += '</div>';
    }

    content.innerHTML = html;
    panel.classList.add('open');

    // Click connections to navigate
    content.querySelectorAll('.conn-item').forEach(el => {
      el.addEventListener('click', () => {
        const targetNode = nodes.find(n => n.id === el.dataset.nodeId);
        if (targetNode) {
          openInfoPanel(targetNode);
          zoomToNode(targetNode);
        }
      });
    });
  }

  // Close panel
  document.querySelector('#info-panel .close-btn').addEventListener('click', () => {
    document.getElementById('info-panel').classList.remove('open');
  });

  // Zoom to node
  function zoomToNode(d) {
    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(2).translate(-d.x, -d.y)
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
      if (d.type === 'artwork' && d.data.image && showImages) {
        return 'url(#img-' + d.id.replace(/[^a-zA-Z0-9-]/g, '_') + ')';
      }
      return COLORS[d.type] || '#666';
    });
  });

  // ── Search ──
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    if (!q) {
      resetHighlight();
      return;
    }
    const matches = new Set();
    nodes.forEach(n => {
      if (n.label.toLowerCase().includes(q)) matches.add(n.id);
      if (n.type === 'artwork' && n.data.provenance && n.data.provenance.toLowerCase().includes(q)) matches.add(n.id);
      if (n.type === 'artist' && n.data.bio && n.data.bio.toLowerCase().includes(q)) matches.add(n.id);
    });

    // Also highlight connected nodes
    const expanded = new Set(matches);
    links.forEach(l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source;
      const tid = typeof l.target === 'object' ? l.target.id : l.target;
      if (matches.has(sid)) expanded.add(tid);
      if (matches.has(tid)) expanded.add(sid);
    });

    node.style('opacity', n => expanded.has(n.id) ? 1 : 0.05);
    link.style('stroke-opacity', l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source;
      const tid = typeof l.target === 'object' ? l.target.id : l.target;
      return (expanded.has(sid) && expanded.has(tid)) ? 0.5 : 0.02;
    });

    // Zoom to first match
    if (matches.size > 0) {
      const first = nodes.find(n => matches.has(n.id));
      if (first) zoomToNode(first);
    }
  });

  // Click background to close panel
  svg.on('click', () => {
    document.getElementById('info-panel').classList.remove('open');
  });

  // Resize
  window.addEventListener('resize', () => {
    simulation.force('center', d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2));
    simulation.alpha(0.3).restart();
  });

})();
