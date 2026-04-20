// Ethereal Gallery — Navigation with Connection Flow
(function() {
  'use strict';

  const state = { history: [], visitedIds: new Set() };

  // ── Helpers ──
  const getArtwork = id => ART_DB.artworks.find(a => a.id === id);
  const getArtist = id => ART_DB.artists[id];
  const getMuseum = id => ART_DB.museums[id];

  // ── Connection scoring ──
  // Find the strongest connections for an artwork using the deep metadata
  function getConnections(artwork) {
    const meta = ART_DB.artworkMeta && ART_DB.artworkMeta[artwork.id];
    const connections = [];

    // Score all other artworks by shared attributes
    const scored = ART_DB.artworks
      .filter(a => a.id !== artwork.id)
      .map(other => {
        const otherMeta = ART_DB.artworkMeta && ART_DB.artworkMeta[other.id];
        let score = 0;
        const reasons = [];

        // Same artist (strong)
        if (other.artistId === artwork.artistId) { score += 5; reasons.push('Same artist'); }
        // Same genre
        if (other.genre === artwork.genre) { score += 3; reasons.push(ART_DB.genres[other.genre]?.label || other.genre); }
        // Same museum
        if (other.museumId === artwork.museumId) { score += 2; reasons.push('Same museum'); }
        // Same medium
        if (other.medium === artwork.medium) { score += 1; reasons.push('Same medium'); }

        if (meta && otherMeta) {
          // Shared themes
          const sharedThemes = (meta.themes || []).filter(t => (otherMeta.themes || []).includes(t));
          if (sharedThemes.length) { score += sharedThemes.length * 2; reasons.push(sharedThemes[0]); }
          // Same technique
          if (meta.technique && meta.technique === otherMeta.technique) { score += 3; reasons.push(meta.technique); }
          // Same palette
          if (meta.palette && meta.palette === otherMeta.palette) { score += 1; reasons.push(meta.palette + ' palette'); }
          // Same depicted location
          if (meta.depictedLocation && meta.depictedLocation === otherMeta.depictedLocation) { score += 4; reasons.push('Same scene'); }
          // Shared collectors
          const sharedColl = (meta.collectors || []).filter(c => (otherMeta.collectors || []).includes(c));
          if (sharedColl.length) { score += 3; reasons.push('Collected by ' + sharedColl[0]); }
        }

        // Same decade
        const y1 = artwork.year.match(/\d{4}/);
        const y2 = other.year.match(/\d{4}/);
        if (y1 && y2 && Math.floor(parseInt(y1[0])/10) === Math.floor(parseInt(y2[0])/10)) {
          score += 1; reasons.push('Same decade');
        }

        // Artist influence connection
        const artist1 = getArtist(artwork.artistId);
        const artist2 = getArtist(other.artistId);
        if (artist1?.influencedBy?.includes(other.artistId) || artist2?.influencedBy?.includes(artwork.artistId)) {
          score += 4; reasons.push('Artistic influence');
        }
        if (artist1?.socialCircle?.includes(other.artistId) || artist2?.socialCircle?.includes(artwork.artistId)) {
          score += 3; reasons.push('Social circle');
        }

        // Prefer unvisited
        if (!state.visitedIds.has(other.id)) score += 1;

        return { artwork: other, score, reason: reasons[0] || 'Discover' };
      })
      .sort((a, b) => b.score - a.score);

    return scored;
  }

  // Pick all meaningful connections for the radial flow
  function pickFlowConnections(artwork) {
    const scored = getConnections(artwork);
    const meta = ART_DB.artworkMeta && ART_DB.artworkMeta[artwork.id];
    const result = [];

    // Top 2-3 artwork connections
    scored.slice(0, 3).forEach(s => {
      result.push({
        type: 'artwork',
        id: s.artwork.id,
        label: s.artwork.title.length > 22 ? s.artwork.title.slice(0,20) + '…' : s.artwork.title,
        sublabel: getArtist(s.artwork.artistId)?.name || '',
        image: s.artwork.image,
        relation: s.reason,
        color: '#c9a84c',
        data: s.artwork
      });
    });

    // Concept connections — gather all available
    const concepts = [];

    const genre = ART_DB.genres[artwork.genre];
    if (genre) concepts.push({ type: 'genre', label: genre.label, relation: 'Genre', color: '#5a8ec7' });

    if (meta?.technique) concepts.push({ type: 'technique', label: meta.technique, relation: 'Technique', color: '#2ecc71' });

    if (meta?.themes?.length) {
      // Pick top 2 themes by how many other artworks share them
      const themeCounts = {};
      meta.themes.forEach(t => {
        themeCounts[t] = ART_DB.artworks.filter(a => a.id !== artwork.id && ART_DB.artworkMeta?.[a.id]?.themes?.includes(t)).length;
      });
      const sorted = [...meta.themes].sort((a, b) => (themeCounts[b] || 0) - (themeCounts[a] || 0));
      sorted.slice(0, 2).forEach(t => {
        concepts.push({ type: 'theme', label: t, relation: 'Theme', color: '#9b59b6' });
      });
    }

    if (meta?.depictedLocation) concepts.push({ type: 'depicted', label: meta.depictedLocation, relation: 'Depicts', color: '#e67e22' });

    if (meta?.palette) {
      const palLabels = { warm: 'Warm tones', cool: 'Cool tones', earth: 'Earth tones' };
      concepts.push({ type: 'palette', label: palLabels[meta.palette] || meta.palette, relation: 'Palette', color: '#e74c8b' });
    }

    const artist = getArtist(artwork.artistId);
    if (artist) {
      // Artist node
      concepts.push({ type: 'artist', label: artist.name, relation: 'Artist', color: '#6e5fa8' });

      // Era
      const birthYear = parseInt(artist.born);
      if (birthYear) {
        let era;
        if (birthYear < 1600) era = 'Renaissance';
        else if (birthYear < 1700) era = 'Dutch Golden Age';
        else if (birthYear < 1800) era = 'Edo Period';
        else if (birthYear < 1870) era = 'Impressionism';
        else if (birthYear < 1900) era = 'Post-Impressionism';
        else era = 'Modern';
        concepts.push({ type: 'era', label: era, relation: 'Movement', color: '#8a6e3e' });
      }
    }

    // Museum
    const museum = getMuseum(artwork.museumId);
    if (museum) concepts.push({ type: 'museum', label: museum.name.length > 22 ? museum.name.slice(0,20) + '…' : museum.name, relation: 'Museum', color: '#4a9e8e' });

    // Decade
    const ym = artwork.year.match(/\d{4}/);
    if (ym) {
      const decade = Math.floor(parseInt(ym[0]) / 10) * 10;
      concepts.push({ type: 'decade', label: decade + 's', relation: 'Decade', color: '#5d6d7e' });
    }

    concepts.forEach(c => result.push({ ...c, id: null, image: null, sublabel: '' }));

    return result;
  }

  // ── Render ──
  function renderWall(artworks) {
    const wall = document.getElementById('art-wall');
    wall.innerHTML = '';
    artworks.forEach(art => {
      const piece = document.createElement('div');
      piece.className = 'art-piece';
      piece.innerHTML = `
        <img src="${art.image}" alt="${art.title}" loading="lazy">
        <div class="art-label">
          <div class="art-label-title">${art.title}</div>
          <div class="art-label-artist">${getArtist(art.artistId)?.name || ''}</div>
          ${art.tag ? `<span class="art-label-tag">${art.tag}</span>` : ''}
        </div>`;
      piece.addEventListener('click', () => navigateTo(art.id));
      piece.addEventListener('contextmenu', (e) => { e.preventDefault(); showDetail(art.id); });
      wall.appendChild(piece);
    });
  }

  function renderConnectionFlow(artwork) {
    const flow = document.getElementById('connection-flow');
    const selected = document.getElementById('flow-selected');
    const conns = document.getElementById('flow-connections');

    flow.classList.remove('hidden');

    // Selected piece in center
    selected.innerHTML = `
      <img src="${artwork.image}" alt="${artwork.title}">
      <div class="flow-title">${artwork.title}</div>
      <div class="flow-artist">${getArtist(artwork.artistId)?.name || ''}</div>`;

    // Get all connections
    const connections = pickFlowConnections(artwork);
    conns.innerHTML = '';

    // Place nodes in a circle using CSS
    const count = connections.length;
    const radius = Math.min(window.innerWidth * 0.35, 280);

    connections.forEach((conn, i) => {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2; // start from top
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const node = document.createElement('div');
      node.className = 'flow-node';
      node.style.transform = `translate(${x}px, ${y}px)`;
      node.style.animationDelay = `${i * 0.06}s`;

      if (conn.type === 'artwork' && conn.image) {
        node.innerHTML = `
          <img src="${conn.image}" alt="${conn.label}">
          <div class="flow-node-label">${conn.label}</div>
          <div class="flow-node-sub">${conn.sublabel}</div>
          <div class="flow-node-relation">${conn.relation}</div>`;
        node.addEventListener('click', () => navigateTo(conn.id));
        node.addEventListener('contextmenu', (e) => { e.preventDefault(); showDetail(conn.id); });
      } else {
        node.innerHTML = `
          <div class="flow-dot" style="background:${conn.color}">${conn.relation.slice(0,3).toUpperCase()}</div>
          <div class="flow-node-label">${conn.label}</div>
          <div class="flow-node-relation">${conn.relation}</div>`;
        node.addEventListener('click', () => showConceptArtworks(artwork, conn));
      }
      conns.appendChild(node);
    });

    // Draw SVG lines from center to each node
    requestAnimationFrame(() => requestAnimationFrame(() => drawRadialLines(connections.length, radius)));
  }

  function drawRadialLines(count, radius) {
    const svg = document.getElementById('flow-lines');
    const flow = document.getElementById('connection-flow');
    const flowRect = flow.getBoundingClientRect();
    const cx = flowRect.width / 2;
    const cy = flowRect.height / 2;

    svg.setAttribute('viewBox', `0 0 ${flowRect.width} ${flowRect.height}`);
    svg.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      const ex = cx + Math.cos(angle) * radius;
      const ey = cy + Math.sin(angle) * radius;

      // Curved bezier from center to node
      const cpx = cx + Math.cos(angle) * radius * 0.4;
      const cpy = cy + Math.sin(angle) * radius * 0.4;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${cx},${cy} Q${cpx},${cpy} ${ex},${ey}`);
      path.setAttribute('class', 'flow-line');
      path.style.animationDelay = `${i * 0.1}s`;
      svg.appendChild(path);
    }
  }

  // Show artworks matching a concept (theme, technique, etc.)
  function showConceptArtworks(currentArt, concept) {
    const meta = ART_DB.artworkMeta;
    let matching = [];

    ART_DB.artworks.filter(a => a.id !== currentArt.id).forEach(a => {
      const am = meta?.[a.id];
      let match = false;

      if (concept.type === 'genre' && ART_DB.genres[a.genre]?.label === concept.label) match = true;
      if (concept.type === 'technique' && am?.technique === concept.label) match = true;
      if (concept.type === 'theme' && am?.themes?.includes(concept.label)) match = true;
      if (concept.type === 'depicted' && am?.depictedLocation === concept.label) match = true;
      if (concept.type === 'palette' && am?.palette && concept.label.toLowerCase().includes(am.palette)) match = true;

      // Museum — match by museum name
      if (concept.type === 'museum') {
        const mus = getMuseum(a.museumId);
        if (mus && concept.label.startsWith(mus.name.slice(0, 18))) match = true;
      }

      // Artist — match by artist name
      if (concept.type === 'artist') {
        const art = getArtist(a.artistId);
        if (art && art.name === concept.label) match = true;
      }

      // Decade — match by year
      if (concept.type === 'decade') {
        const ym = a.year.match(/\d{4}/);
        if (ym) {
          const dec = Math.floor(parseInt(ym[0]) / 10) * 10;
          if (concept.label === dec + 's') match = true;
        }
      }

      // Era — match by artist birth year
      if (concept.type === 'era') {
        const artist = getArtist(a.artistId);
        if (artist) {
          const by = parseInt(artist.born);
          let era;
          if (by < 1600) era = 'Renaissance';
          else if (by < 1700) era = 'Dutch Golden Age';
          else if (by < 1800) era = 'Edo Period';
          else if (by < 1870) era = 'Impressionism';
          else if (by < 1900) era = 'Post-Impressionism';
          else era = 'Modern';
          if (era === concept.label) match = true;
        }
      }

      if (match) matching.push(a);
    });

    if (matching.length === 0) {
      // Nothing matched — stay on current view, just update subtitle
      document.getElementById('gallery-subtitle').textContent = `No other artworks found for ${concept.relation.toLowerCase()}: "${concept.label}"`;
      return;
    }

    // Pick up to 6 and show on wall
    const shuffled = [...matching].sort(() => Math.random() - 0.5).slice(0, 6);
    const subtitle = document.getElementById('gallery-subtitle');
    subtitle.textContent = `${matching.length} artwork${matching.length > 1 ? 's' : ''} connected by ${concept.relation.toLowerCase()}: "${concept.label}"`;
    renderWall(shuffled.map(a => ({ ...a, tag: concept.label })));
    document.getElementById('connection-flow').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Navigation ──
  function navigateTo(artworkId) {
    const artwork = getArtwork(artworkId);
    if (!artwork) return;

    state.visitedIds.add(artworkId);
    state.history.push(artworkId);

    const artist = getArtist(artwork.artistId);
    const subtitle = document.getElementById('gallery-subtitle');
    subtitle.textContent = `"${artwork.title}" by ${artist?.name || 'Unknown'} — explore its connections`;

    // Show the selected piece + 2 next choices on the wall
    const scored = getConnections(artwork);
    const nextTwo = scored.slice(0, 2).map(s => ({ ...s.artwork, tag: s.reason }));
    renderWall(nextTwo);
    renderConnectionFlow(artwork);
    renderBreadcrumb();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showDetail(artworkId) {
    const art = getArtwork(artworkId);
    if (!art) return;
    const artist = getArtist(art.artistId);
    const museum = getMuseum(art.museumId);
    const genre = ART_DB.genres[art.genre];

    document.getElementById('detail-image').src = art.image;
    document.getElementById('detail-image').alt = art.title;
    document.getElementById('detail-title').textContent = art.title;
    document.getElementById('detail-artist').textContent = artist?.name || '';
    document.getElementById('detail-year').textContent = art.year;
    document.getElementById('detail-medium').textContent = art.medium;
    document.getElementById('detail-genre').textContent = genre ? genre.label : art.genre;
    document.getElementById('detail-provenance').textContent = art.provenance;
    document.getElementById('detail-museum').textContent = `${museum?.name || ''} — ${art.galleryRoom}`;
    document.getElementById('detail-museum-location').textContent = museum?.city || '';
    const addr = document.getElementById('detail-address');
    addr.textContent = museum?.address || '';
    addr.onclick = () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(museum?.address || '')}`, '_blank');
    document.getElementById('detail-artist-bio').textContent = artist?.bio || '';
    document.getElementById('detail-artist-contact').textContent = artist?.contact || '';

    document.getElementById('gallery-view').classList.remove('active');
    document.getElementById('detail-view').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderBreadcrumb() {
    const bc = document.getElementById('breadcrumb');
    bc.innerHTML = '';
    const home = document.createElement('span');
    home.textContent = 'Start';
    home.addEventListener('click', initGallery);
    bc.appendChild(home);

    state.history.forEach((id, i) => {
      const sep = document.createElement('span');
      sep.className = 'sep';
      sep.textContent = ' → ';
      bc.appendChild(sep);
      const art = getArtwork(id);
      const crumb = document.createElement('span');
      crumb.textContent = art ? (art.title.length > 20 ? art.title.slice(0,18) + '…' : art.title) : id;
      if (i < state.history.length - 1) {
        crumb.addEventListener('click', () => {
          state.history = state.history.slice(0, i + 1);
          navigateTo(id);
          state.history.pop();
        });
      }
      bc.appendChild(crumb);
    });
  }

  function initGallery() {
    state.history = [];
    state.visitedIds.clear();
    const pair = ART_DB.startingPairs[Math.floor(Math.random() * ART_DB.startingPairs.length)];
    const artworks = pair.map(id => ({ ...getArtwork(id), tag: null }));
    document.getElementById('gallery-subtitle').textContent = 'Choose a piece to begin your journey';
    document.getElementById('connection-flow').classList.add('hidden');
    renderWall(artworks);
    renderBreadcrumb();
    document.getElementById('gallery-view').classList.add('active');
    document.getElementById('detail-view').classList.remove('active');
  }

  document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('detail-view').classList.remove('active');
    document.getElementById('gallery-view').classList.add('active');
  });

  initGallery();
})();
