// localStorage persistence layer
const Store = {
  KEYS: { nodes: 'uge_nodes', links: 'uge_links', sources: 'uge_sources', ghostNodes: 'uge_ghost_nodes', ghostLinks: 'uge_ghost_links', dismissed: 'uge_dismissed' },

  save(nodes, links) {
    try {
      const n = nodes.map(n => ({ id:n.id, type:n.type, label:n.label, data:n.data, radius:n.radius }));
      const l = links.map(l => ({
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target,
        relation: l.relation
      }));
      localStorage.setItem(this.KEYS.nodes, JSON.stringify(n));
      localStorage.setItem(this.KEYS.links, JSON.stringify(l));
    } catch (e) { console.warn('Store save failed:', e); }
  },

  load() {
    try {
      const n = JSON.parse(localStorage.getItem(this.KEYS.nodes) || '[]');
      const l = JSON.parse(localStorage.getItem(this.KEYS.links) || '[]');
      return { nodes: n, links: l };
    } catch (e) { return { nodes: [], links: [] }; }
  },

  clear() {
    localStorage.removeItem(this.KEYS.nodes);
    localStorage.removeItem(this.KEYS.links);
    localStorage.removeItem(this.KEYS.ghostNodes);
    localStorage.removeItem(this.KEYS.ghostLinks);
    this.clearDismissed();
  },

  saveGhosts(ghostNodes, ghostLinks) {
    try {
      const n = ghostNodes.map(n => ({ id:n.id, type:n.type, label:n.label, data:n.data, radius:n.radius, ghost:true }));
      const l = ghostLinks.map(l => ({
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target,
        relation: l.relation, ghost: true
      }));
      localStorage.setItem(this.KEYS.ghostNodes, JSON.stringify(n));
      localStorage.setItem(this.KEYS.ghostLinks, JSON.stringify(l));
    } catch (e) { console.warn('Store saveGhosts failed:', e); }
  },

  loadGhosts() {
    try {
      const n = JSON.parse(localStorage.getItem(this.KEYS.ghostNodes) || '[]');
      const l = JSON.parse(localStorage.getItem(this.KEYS.ghostLinks) || '[]');
      return { nodes: n, links: l };
    } catch (e) { return { nodes: [], links: [] }; }
  },

  saveDismissed(dismissedSet) {
    try {
      localStorage.setItem(this.KEYS.dismissed, JSON.stringify([...dismissedSet]));
    } catch (e) { console.warn('Store saveDismissed failed:', e); }
  },

  loadDismissed() {
    try {
      return new Set(JSON.parse(localStorage.getItem(this.KEYS.dismissed) || '[]'));
    } catch (e) { return new Set(); }
  },

  clearDismissed() {
    localStorage.removeItem(this.KEYS.dismissed);
  },

  saveSources(sources) {
    try { localStorage.setItem(this.KEYS.sources, JSON.stringify(sources)); } catch(e) {}
  },

  loadSources() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.sources) || '[]'); } catch(e) { return []; }
  },

  exportJSON(nodes, links, ghostNodes, ghostLinks) {
    const allNodes = nodes.map(n => ({ id:n.id, type:n.type, label:n.label, data:n.data }));
    if (ghostNodes) ghostNodes.forEach(n => allNodes.push({ id:n.id, type:n.type, label:n.label, data:n.data, ghost:true }));
    const allLinks = links.map(l => ({ source: typeof l.source==='object'?l.source.id:l.source, target:typeof l.target==='object'?l.target.id:l.target, relation:l.relation }));
    if (ghostLinks) ghostLinks.forEach(l => allLinks.push({ source: typeof l.source==='object'?l.source.id:l.source, target:typeof l.target==='object'?l.target.id:l.target, relation:l.relation, ghost:true }));
    const data = { nodes: allNodes, links: allLinks };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'graph-export.json'; a.click();
    URL.revokeObjectURL(url);
  }
};
