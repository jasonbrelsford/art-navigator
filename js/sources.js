// Custom data source manager
const Sources = {
  list: [],

  init() {
    this.list = Store.loadSources();
  },

  add(name, urlTemplate) {
    if (!name || !urlTemplate || !urlTemplate.includes('{query}')) return false;
    this.list.push({ name, url: urlTemplate, enabled: true });
    Store.saveSources(this.list);
    return true;
  },

  remove(index) {
    this.list.splice(index, 1);
    Store.saveSources(this.list);
  },

  async search(query) {
    const results = [];
    const enabled = this.list.filter(s => s.enabled);
    const fetches = enabled.map(async (src) => {
      try {
        const url = src.url.replace('{query}', encodeURIComponent(query));
        const resp = await fetch(url);
        const data = await resp.json();
        // Normalize: expect array at root or in .results / .data / .items
        let items = Array.isArray(data) ? data : (data.results || data.data || data.items || data.search || []);
        if (!Array.isArray(items)) items = [];
        items.slice(0, 5).forEach(item => {
          results.push({
            label: item.label || item.name || item.title || 'Unknown',
            description: item.description || item.desc || item.summary || '',
            id: item.id || item.qid || null,
            source: src.name,
            raw: item
          });
        });
      } catch (e) { /* skip failed sources */ }
    });
    await Promise.all(fetches);
    return results;
  }
};
