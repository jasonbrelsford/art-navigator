// Wikidata integration — universal entity loader
const Wiki = {
  // Important Wikidata properties and their graph relationship names
  PROPS: {
    P31:  { rel: 'instance of',    type: 'category' },
    P106: { rel: 'occupation',     type: 'category' },
    P27:  { rel: 'citizenship',    type: 'location' },
    P19:  { rel: 'born in',        type: 'location' },
    P20:  { rel: 'died in',        type: 'location' },
    P69:  { rel: 'educated at',    type: 'organization' },
    P108: { rel: 'employer',       type: 'organization' },
    P39:  { rel: 'position held',  type: 'category' },
    P102: { rel: 'political party',type: 'organization' },
    P135: { rel: 'movement',       type: 'category' },
    P136: { rel: 'genre',          type: 'category' },
    P264: { rel: 'record label',   type: 'organization' },
    P175: { rel: 'performer',      type: 'person' },
    P86:  { rel: 'composer',       type: 'person' },
    P170: { rel: 'creator',        type: 'person' },
    P50:  { rel: 'author',         type: 'person' },
    P57:  { rel: 'director',       type: 'person' },
    P161: { rel: 'cast member',    type: 'person' },
    P40:  { rel: 'child',          type: 'person' },
    P26:  { rel: 'spouse',         type: 'person' },
    P22:  { rel: 'father',         type: 'person' },
    P25:  { rel: 'mother',         type: 'person' },
    P737: { rel: 'influenced by',  type: 'person' },
    P1066:{ rel: 'student of',     type: 'person' },
    P112: { rel: 'founded by',     type: 'person' },
    P127: { rel: 'owned by',       type: 'organization' },
    P131: { rel: 'located in',     type: 'location' },
    P17:  { rel: 'country',        type: 'location' },
    P159: { rel: 'headquarters',   type: 'location' },
    P495: { rel: 'country of origin', type: 'location' },
    P571: { rel: 'inception',      type: 'date' },
    P569: { rel: 'born',           type: 'date' },
    P570: { rel: 'died',           type: 'date' },
    P577: { rel: 'published',      type: 'date' },
    P856: { rel: 'website',        type: 'url' },
    P18:  { rel: 'image',          type: 'image' },
  },

  COLORS: {
    person: '#7c6fca',
    location: '#c75a5a',
    organization: '#4a9e8e',
    category: '#5a8ec7',
    date: '#5d6d7e',
    artwork: '#d4a843',
    url: '#888',
    image: '#888',
    unknown: '#666',
  },

  async search(query) {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&limit=8&format=json&origin=*`;
    try {
      const r = await fetch(url);
      const d = await r.json();
      return (d.search || []).map(s => ({
        label: s.label, description: s.description || '', id: s.id, source: 'Wikidata'
      }));
    } catch(e) { return []; }
  },

  async loadEntity(qid) {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&languages=en&props=labels|descriptions|claims|sitelinks&format=json&origin=*`;
    try {
      const r = await fetch(url);
      const d = await r.json();
      return d.entities?.[qid] || null;
    } catch(e) { return null; }
  },

  async resolveLabel(qid) {
    if (!qid) return '';
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&languages=en&props=labels&format=json&origin=*`;
    try {
      const r = await fetch(url);
      const d = await r.json();
      return d.entities?.[qid]?.labels?.en?.value || qid;
    } catch(e) { return qid; }
  },

  // Extract all meaningful relationships from an entity
  async extractRelationships(entity) {
    const rels = [];
    const claims = entity.claims || {};
    const labelCache = {};

    // Collect all QIDs we need to resolve
    const qidsToResolve = new Set();
    for (const [prop, propClaims] of Object.entries(claims)) {
      const propInfo = this.PROPS[prop];
      if (!propInfo) continue;
      if (propInfo.type === 'date' || propInfo.type === 'url' || propInfo.type === 'image') continue;

      for (const claim of propClaims.slice(0, 4)) { // max 4 per property
        const val = claim.mainsnak?.datavalue?.value;
        if (val?.id) qidsToResolve.add(val.id);
      }
    }

    // Batch resolve labels (in chunks of 50)
    const qidArr = [...qidsToResolve];
    for (let i = 0; i < qidArr.length; i += 50) {
      const chunk = qidArr.slice(i, i + 50);
      try {
        const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.join('|')}&languages=en&props=labels&format=json&origin=*`;
        const r = await fetch(url);
        const d = await r.json();
        for (const [qid, ent] of Object.entries(d.entities || {})) {
          labelCache[qid] = ent.labels?.en?.value || qid;
        }
      } catch(e) {}
    }

    // Build relationships
    for (const [prop, propClaims] of Object.entries(claims)) {
      const propInfo = this.PROPS[prop];
      if (!propInfo) continue;

      for (const claim of propClaims.slice(0, 4)) {
        const snak = claim.mainsnak;
        if (!snak?.datavalue) continue;
        const val = snak.datavalue.value;

        if (propInfo.type === 'date') {
          const time = val?.time;
          if (time) {
            const year = time.replace(/^\+/, '').slice(0, 4);
            rels.push({ relation: propInfo.rel, label: year, type: 'date', qid: null });
          }
        } else if (propInfo.type === 'url') {
          rels.push({ relation: propInfo.rel, label: val, type: 'url', qid: null });
        } else if (propInfo.type === 'image') {
          const filename = val;
          rels.push({ relation: propInfo.rel, label: filename, type: 'image', qid: null,
            imageUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=300`
          });
        } else if (val?.id) {
          rels.push({
            relation: propInfo.rel,
            label: labelCache[val.id] || val.id,
            type: propInfo.type,
            qid: val.id
          });
        }
      }
    }

    // Extract dates for display
    const born = this.getDateClaim(claims, 'P569');
    const died = this.getDateClaim(claims, 'P570');
    const wikiUrl = entity.sitelinks?.enwiki
      ? `https://en.wikipedia.org/wiki/${entity.sitelinks.enwiki.title.replace(/ /g, '_')}`
      : null;

    return { rels, born, died, wikiUrl };
  },

  getDateClaim(claims, prop) {
    const c = claims[prop];
    if (!c?.[0]?.mainsnak?.datavalue?.value?.time) return null;
    return c[0].mainsnak.datavalue.value.time.replace(/^\+/, '').slice(0, 10);
  }
};
