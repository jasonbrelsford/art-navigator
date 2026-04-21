// localStorage persistence layer
const Store = {
  KEYS: { nodes: 'uge_nodes', links: 'uge_links', sources: 'uge_sources' },

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
  },

  saveSources(sources) {
    try { localStorage.setItem(this.KEYS.sources, JSON.stringify(sources)); } catch(e) {}
  },

  loadSources() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.sources) || '[]'); } catch(e) { return []; }
  },

  exportJSON(nodes, links) {
    const data = { nodes: nodes.map(n => ({ id:n.id, type:n.type, label:n.label, data:n.data })),
      links: links.map(l => ({ source: typeof l.source==='object'?l.source.id:l.source, target:typeof l.target==='object'?l.target.id:l.target, relation:l.relation }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'graph-export.json'; a.click();
    URL.revokeObjectURL(url);
  }
};
