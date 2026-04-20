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

  // Pick 3 connections: 1 artwork + 2 strongest non-artwork connections (shown as concept nodes)
  function pickFlowConnections(artwork) {
    const scored = getConnections(artwork);
    const meta = ART_DB.artworkMeta && ART_DB.artworkMeta[artwork.id];
    const result = [];

    // 1. Best artwork connection
    if (scored.length > 0) {
      const best = scored[0];
      result.push({
        type: 'artwork',
        id: best.artwork.id,
        label: best.artwork.title,
        sublabel: getArtist(best.artwork.artistId)?.name || '',
        image: best.artwork.image,
        relation: best.reason,
        color: '#c9a84c',
        data: best.artwork
      });
    }

    // 2-3. Two strongest concept connections
    const concepts = [];

    // Genre
    const genre = ART_DB.genres[artwork.genre];
    if (genre) concepts.push({ type: 'genre', label: genre.label, relation: 'Genre', color: '#5a8ec7', weight: 3 });

    // Technique
    if (meta?.technique) concepts.push({ type: 'technique', label: meta.technique, relation: 'Technique', color: '#2ecc71', weight: 4 });

    // Theme (pick the most connecting one)
    if (meta?.themes?.length) {
      const themeCounts = {};
      meta.themes.forEach(t => {
        let count = 0;
        ART_DB.artworks.forEach(a => {
          if (a.id !== artwork.id) {
            const am = ART_DB.artworkMeta?.[a.id];
            if (am?.themes?.includes(t)) count++;
          }
        });
        themeCounts[t] = count;
      });
      const bestTheme = meta.themes.sort((a, b) => (themeCounts[b] || 0) - (themeCounts[a] || 0))[0];
      concepts.push({ type: 'theme', label: bestTheme, relation: 'Theme', color: '#9b59b6', weight: themeCounts[bestTheme] || 0 });
    }

    // Depicted location
    if (meta?.depictedLocation) concepts.push({ type: 'depicted', label: meta.depictedLocation, relation: 'Depicts', color: '#e67e22', weight: 2 });

    // Palette
    if (meta?.palette) {
      const palLabels = { warm: 'Warm tones', cool: 'Cool tones', earth: 'Earth tones' };
      concepts.push({ type: 'palette', label: palLabels[meta.palette] || meta.palette, relation: 'Palette', color: '#e74c8b', weight: 1 });
    }

    // Artist era
    const artist = getArtist(artwork.artistId);
    if (artist) {
      const birthYear = parseInt(artist.born);
      if (birthYear) {
        let era;
        if (birthYear < 1600) era = 'Renaissance';
        else if (birthYear < 1700) era = 'Dutch Golden Age';
        else if (birthYear < 1800) era = 'Edo Period';
        else if (birthYear < 1870) era = 'Impressionism';
        else if (birthYear < 1900) era = 'Post-Impressionism';
        else era = 'Modern';
        concepts.push({ type: 'era', label: era, relation: 'Movement', color: '#8a6e3e', weight: 2 });
      }
    }

    // Sort by weight descending, pick top 2
    concepts.sort((a, b) => b.weight - a.weight);
    concepts.slice(0, 2).forEach(c => {
      result.push({ ...c, id: null, image: null, sublabel: '' });
    });

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
    const svgEl = document.getElementById('flow-lines');

    flow.classList.remove('hidden');

    // Selected piece in center
    selected.innerHTML = `
      <img src="${artwork.image}" alt="${artwork.title}">
      <div class="flow-title">${artwork.title}</div>
      <div class="flow-artist">${getArtist(artwork.artistId)?.name || ''}</div>`;

    // Get 3 connections
    const connections = pickFlowConnections(artwork);
    conns.innerHTML = '';

    connections.forEach(conn => {
      const node = document.createElement('div');
      node.className = 'flow-node';

      if (conn.type === 'artwork' && conn.image) {
        node.innerHTML = `
          <img src="${conn.image}" alt="${conn.label}">
          <div class="flow-node-label">${conn.label}</div>
          <div class="flow-node-relation">${conn.relation}</div>`;
        node.addEventListener('click', () => navigateTo(conn.id));
        node.addEventListener('contextmenu', (e) => { e.preventDefault(); showDetail(conn.id); });
      } else {
        node.innerHTML = `
          <div class="flow-dot" style="background:${conn.color}">${conn.type.slice(0,3).toUpperCase()}</div>
          <div class="flow-node-label">${conn.label}</div>
          <div class="flow-node-relation">${conn.relation}</div>`;
        // Click concept node → show artworks matching that concept
        node.addEventListener('click', () => showConceptArtworks(artwork, conn));
      }
      conns.appendChild(node);
    });

    // Draw SVG lines after layout settles
    requestAnimationFrame(() => {
      requestAnimationFrame(() => drawFlowLines());
    });
  }

  function drawFlowLines() {
    const svg = document.getElementById('flow-lines');
    const flow = document.getElementById('connection-flow');
    const selected = document.getElementById('flow-selected');
    const conns = document.querySelectorAll('.flow-node');

    const flowRect = flow.getBoundingClientRect();
    const selRect = selected.getBoundingClientRect();
    const sx = selRect.left + selRect.width / 2 - flowRect.left;
    const sy = selRect.top + selRect.height - flowRect.top;

    svg.setAttribute('viewBox', `0 0 ${flowRect.width} ${flowRect.height}`);
    svg.innerHTML = '';

    conns.forEach(node => {
      const r = node.getBoundingClientRect();
      const ex = r.left + r.width / 2 - flowRect.left;
      const ey = r.top - flowRect.top;
      const my = sy + (ey - sy) * 0.5;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${sx},${sy} C${sx},${my} ${ex},${my} ${ex},${ey}`);
      path.setAttribute('class', 'flow-line');
      svg.appendChild(path);
    });
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
      if (concept.type === 'era') match = true; // show all for era, we'll filter below
      if (match) matching.push(a);
    });

    // For era, filter by matching era
    if (concept.type === 'era') {
      matching = matching.filter(a => {
        const artist = getArtist(a.artistId);
        if (!artist) return false;
        const by = parseInt(artist.born);
        let era;
        if (by < 1600) era = 'Renaissance';
        else if (by < 1700) era = 'Dutch Golden Age';
        else if (by < 1800) era = 'Edo Period';
        else if (by < 1870) era = 'Impressionism';
        else if (by < 1900) era = 'Post-Impressionism';
        else era = 'Modern';
        return era === concept.label;
      });
    }

    // Show up to 6 on the wall
    const shuffled = [...matching].sort(() => Math.random() - 0.5).slice(0, 6);
    const subtitle = document.getElementById('gallery-subtitle');
    subtitle.textContent = `Artworks connected by ${concept.relation.toLowerCase()}: "${concept.label}"`;
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
