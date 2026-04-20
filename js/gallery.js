// Ethereal Gallery — Navigation Engine
(function() {
  'use strict';

  const state = {
    history: [],       // breadcrumb trail
    currentView: null, // 'gallery' or 'detail'
    visitedIds: new Set()
  };

  // Helpers
  function getArtwork(id) {
    return ART_DB.artworks.find(a => a.id === id);
  }
  function getArtist(id) {
    return ART_DB.artists[id];
  }
  function getMuseum(id) {
    return ART_DB.museums[id];
  }
  function getArtworksByArtist(artistId, excludeId) {
    return ART_DB.artworks.filter(a => a.artistId === artistId && a.id !== excludeId);
  }
  function getArtworksByGenre(genre, excludeId) {
    return ART_DB.artworks.filter(a => a.genre === genre && a.id !== excludeId);
  }

  // Pick N items from array, preferring unvisited
  function pickItems(arr, n) {
    const unvisited = arr.filter(a => !state.visitedIds.has(a.id));
    const pool = unvisited.length >= n ? unvisited : arr;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  // Generate next choices based on a clicked artwork
  function generateChoices(artwork) {
    const sameArtist = getArtworksByArtist(artwork.artistId, artwork.id);
    const sameGenre = getArtworksByGenre(artwork.genre, artwork.id);
    const genreInfo = ART_DB.genres[artwork.genre];
    let relatedGenreWorks = [];
    if (genreInfo) {
      genreInfo.related.forEach(g => {
        relatedGenreWorks = relatedGenreWorks.concat(
          getArtworksByGenre(g, artwork.id)
        );
      });
    }

    const choices = [];

    // 1 from same artist if available
    const artistPick = pickItems(sameArtist, 1);
    artistPick.forEach(a => choices.push({ ...a, tag: getArtist(a.artistId).name }));

    // 1 from same genre
    const genrePick = pickItems(sameGenre.filter(a => !choices.find(c => c.id === a.id)), 1);
    genrePick.forEach(a => choices.push({ ...a, tag: genreInfo ? genreInfo.label : artwork.genre }));

    // Fill remaining with related genre / discovery
    const remaining = 2 - choices.length;
    if (remaining > 0) {
      const discoveryPool = relatedGenreWorks.filter(a => !choices.find(c => c.id === a.id));
      const discoveryPick = pickItems(discoveryPool, remaining);
      discoveryPick.forEach(a => {
        const g = ART_DB.genres[a.genre];
        choices.push({ ...a, tag: g ? g.label : 'Discover' });
      });
    }

    // If still not enough, pull from anything
    if (choices.length < 2) {
      const allOthers = ART_DB.artworks.filter(a => a.id !== artwork.id && !choices.find(c => c.id === a.id));
      const fill = pickItems(allOthers, 2 - choices.length);
      fill.forEach(a => choices.push({ ...a, tag: 'Discover' }));
    }

    return choices;
  }

  // Render art pieces on the wall
  function renderWall(artworks) {
    const wall = document.getElementById('art-wall');
    wall.innerHTML = '';

    artworks.forEach(art => {
      const piece = document.createElement('div');
      piece.className = 'art-piece';
      piece.innerHTML = `
        <div class="art-frame">
          <img src="${art.image}" alt="${art.title}" loading="lazy">
        </div>
        <div class="art-label">
          <div class="art-label-title">${art.title}</div>
          <div class="art-label-artist">${getArtist(art.artistId).name}</div>
          ${art.tag ? `<span class="art-label-tag">${art.tag}</span>` : ''}
        </div>
      `;

      // Left click — navigate deeper
      piece.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(art.id);
      });

      // Right click — show detail
      piece.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showDetail(art.id);
      });

      wall.appendChild(piece);
    });
  }

  // Navigate to a new set of choices based on clicked artwork
  function navigateTo(artworkId) {
    const artwork = getArtwork(artworkId);
    if (!artwork) return;

    state.visitedIds.add(artworkId);
    state.history.push(artworkId);

    // Check if we've come full circle
    if (state.history.length > 4 && state.visitedIds.size >= ART_DB.artworks.length * 0.3) {
      // Offer to return to start
    }

    const choices = generateChoices(artwork);
    const subtitle = document.querySelector('.gallery-subtitle');
    const artist = getArtist(artwork.artistId);
    subtitle.textContent = `You chose "${artwork.title}" by ${artist.name} — where will you go next?`;

    renderWall(choices);
    renderBreadcrumb();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Show detail view
  function showDetail(artworkId) {
    const art = getArtwork(artworkId);
    if (!art) return;
    const artist = getArtist(art.artistId);
    const museum = getMuseum(art.museumId);
    const genre = ART_DB.genres[art.genre];

    document.getElementById('detail-image').src = art.image;
    document.getElementById('detail-image').alt = art.title;
    document.getElementById('detail-title').textContent = art.title;
    document.getElementById('detail-artist').textContent = artist.name;
    document.getElementById('detail-year').textContent = art.year;
    document.getElementById('detail-medium').textContent = art.medium;
    document.getElementById('detail-genre').textContent = genre ? genre.label : art.genre;
    document.getElementById('detail-provenance').textContent = art.provenance;
    document.getElementById('detail-museum').textContent = `${museum.name} — ${art.galleryRoom}`;
    document.getElementById('detail-museum-location').textContent = museum.city;

    const addressEl = document.getElementById('detail-address');
    addressEl.textContent = museum.address;
    addressEl.onclick = () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(museum.address)}`, '_blank');

    document.getElementById('detail-artist-bio').textContent = artist.bio;

    const contactEl = document.getElementById('detail-artist-contact');
    contactEl.textContent = artist.contact;

    switchView('detail');
  }

  function switchView(view) {
    document.getElementById('gallery-view').classList.toggle('active', view === 'gallery');
    document.getElementById('detail-view').classList.toggle('active', view === 'detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Breadcrumb
  function renderBreadcrumb() {
    const bc = document.getElementById('breadcrumb');
    bc.innerHTML = '';

    // Home
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
      crumb.textContent = art ? art.title : id;
      if (i < state.history.length - 1) {
        crumb.addEventListener('click', () => {
          // Rewind to this point
          state.history = state.history.slice(0, i + 1);
          navigateTo(id);
          // Remove the duplicate push
          state.history.pop();
        });
      }
      bc.appendChild(crumb);
    });
  }

  // Init — show two starting pieces
  function initGallery() {
    state.history = [];
    state.visitedIds.clear();

    const pair = ART_DB.startingPairs[Math.floor(Math.random() * ART_DB.startingPairs.length)];
    const artworks = pair.map(id => {
      const art = getArtwork(id);
      return { ...art, tag: null };
    });

    const subtitle = document.querySelector('.gallery-subtitle');
    subtitle.textContent = 'Choose a piece to begin your journey';

    renderWall(artworks);
    renderBreadcrumb();
    switchView('gallery');
  }

  // Back button
  document.getElementById('back-btn').addEventListener('click', () => {
    switchView('gallery');
  });

  // Close context menu on click anywhere
  document.addEventListener('click', () => {
    const existing = document.querySelector('.context-menu');
    if (existing) existing.remove();
  });

  // Start
  initGallery();
})();
