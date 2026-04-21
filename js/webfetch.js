// Web page fetcher — extracts metadata from any URL via CORS proxy
const WebFetch = {
  PROXY: 'https://api.allorigins.win/raw?url=',

  isUrl(str) {
    return /^https?:\/\/.+\..+/.test(str.trim());
  },

  async fetch(url) {
    try {
      const resp = await fetch(this.PROXY + encodeURIComponent(url));
      if (!resp.ok) throw new Error('Fetch failed');
      const html = await resp.text();
      return this.parse(html, url);
    } catch (e) {
      return { url, title: url, description: 'Could not fetch page', nodes: [] };
    }
  },

  parse(html, url) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const domain = new URL(url).hostname.replace('www.', '');

    // Basic metadata
    const title = this._meta(doc, 'og:title') || doc.querySelector('title')?.textContent?.trim() || domain;
    const description = this._meta(doc, 'og:description') || this._meta(doc, 'description') || '';
    const image = this._meta(doc, 'og:image') || '';
    const siteName = this._meta(doc, 'og:site_name') || domain;
    const type = this._meta(doc, 'og:type') || 'website';

    // Collect nodes to create
    const nodes = [];

    // Main page node
    nodes.push({
      id: 'web-' + domain + '-' + url.replace(/[^a-z0-9]/gi, '-').slice(0, 60),
      type: type === 'profile' ? 'person' : 'organization',
      label: title,
      data: { name: title, desc: description, url, imageUrl: image || null, source: 'web' }
    });

    // Site/domain node
    nodes.push({
      id: 'site-' + domain,
      type: 'organization',
      label: siteName,
      data: { name: siteName, url: 'https://' + domain, source: 'web' },
      linkTo: nodes[0].id,
      relation: 'hosted on'
    });

    // Extract social links
    const socialPatterns = [
      { pattern: /instagram\.com\/([^\/?"]+)/i, label: 'Instagram', type: 'organization' },
      { pattern: /twitter\.com\/([^\/?"]+)/i, label: 'Twitter/X', type: 'organization' },
      { pattern: /x\.com\/([^\/?"]+)/i, label: 'Twitter/X', type: 'organization' },
      { pattern: /facebook\.com\/([^\/?"]+)/i, label: 'Facebook', type: 'organization' },
      { pattern: /linkedin\.com\/(?:in|company)\/([^\/?"]+)/i, label: 'LinkedIn', type: 'organization' },
      { pattern: /youtube\.com\/(?:@|channel\/|c\/)([^\/?"]+)/i, label: 'YouTube', type: 'organization' },
      { pattern: /tiktok\.com\/@([^\/?"]+)/i, label: 'TikTok', type: 'organization' },
      { pattern: /github\.com\/([^\/?"]+)/i, label: 'GitHub', type: 'organization' },
      { pattern: /spotify\.com\/artist\/([^\/?"]+)/i, label: 'Spotify', type: 'organization' },
      { pattern: /soundcloud\.com\/([^\/?"]+)/i, label: 'SoundCloud', type: 'organization' },
      { pattern: /pinterest\.com\/([^\/?"]+)/i, label: 'Pinterest', type: 'organization' },
      { pattern: /etsy\.com\/shop\/([^\/?"]+)/i, label: 'Etsy', type: 'organization' },
    ];

    const seenSocial = new Set();
    const allLinks = doc.querySelectorAll('a[href]');
    allLinks.forEach(a => {
      const href = a.href;
      socialPatterns.forEach(sp => {
        const match = href.match(sp.pattern);
        if (match && !seenSocial.has(sp.label)) {
          seenSocial.add(sp.label);
          const handle = match[1];
          nodes.push({
            id: 'social-' + sp.label.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + handle.toLowerCase(),
            type: sp.type,
            label: `${sp.label}: @${handle}`,
            data: { name: `${sp.label}: @${handle}`, url: href, source: 'web' },
            linkTo: nodes[0].id,
            relation: 'social profile'
          });
        }
      });
    });

    // Extract JSON-LD structured data if present
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try {
        const ld = JSON.parse(script.textContent);
        const items = Array.isArray(ld) ? ld : [ld];
        items.forEach(item => this._parseLdItem(item, nodes));
      } catch (e) { /* skip bad JSON-LD */ }
    });

    // Extract email links
    const emails = new Set();
    allLinks.forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('mailto:')) {
        const email = href.replace('mailto:', '').split('?')[0].trim();
        if (email && !emails.has(email)) {
          emails.add(email);
          nodes.push({
            id: 'email-' + email.replace(/[^a-z0-9]/gi, '-'),
            type: 'category',
            label: email,
            data: { name: 'Email: ' + email, source: 'web' },
            linkTo: nodes[0].id,
            relation: 'contact'
          });
        }
      }
    });

    // Extract page headings as topic nodes (h1, h2)
    const headings = [];
    doc.querySelectorAll('h1, h2').forEach(h => {
      const text = h.textContent.trim();
      if (text && text.length > 2 && text.length < 80 && text !== title) {
        headings.push(text);
      }
    });
    // Take top 5 unique headings
    [...new Set(headings)].slice(0, 5).forEach(h => {
      nodes.push({
        id: 'topic-' + h.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40),
        type: 'category',
        label: h,
        data: { name: h, source: 'web' },
        linkTo: nodes[0].id,
        relation: 'topic'
      });
    });

    return { url, title, description, image, nodes };
  },

  _meta(doc, name) {
    const el = doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
    return el?.getAttribute('content')?.trim() || '';
  },

  _parseLdItem(item, nodes) {
    if (!item || !item['@type']) return;
    const type = Array.isArray(item['@type']) ? item['@type'][0] : item['@type'];
    const name = item.name || item.headline || '';
    if (!name) return;

    const nodeType = type.toLowerCase().includes('person') ? 'person'
      : type.toLowerCase().includes('organization') || type.toLowerCase().includes('business') ? 'organization'
      : type.toLowerCase().includes('place') || type.toLowerCase().includes('address') ? 'location'
      : 'category';

    const nodeId = 'ld-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40);
    // Avoid duplicating the main page node
    if (nodes.length > 0 && nodes[0].label === name) return;

    const data = { name, desc: item.description || '', source: 'json-ld' };
    if (item.image) data.imageUrl = typeof item.image === 'string' ? item.image : item.image.url || '';
    if (item.url) data.url = item.url;
    if (item.address) {
      const addr = typeof item.address === 'string' ? item.address : item.address.streetAddress || '';
      if (addr) data.desc += (data.desc ? '. ' : '') + addr;
    }

    nodes.push({
      id: nodeId, type: nodeType, label: name, data,
      linkTo: nodes[0]?.id, relation: type.toLowerCase()
    });

    // Nested items (e.g. author, location)
    ['author', 'creator', 'performer', 'location', 'publisher', 'memberOf'].forEach(prop => {
      if (item[prop]) {
        const sub = Array.isArray(item[prop]) ? item[prop] : [item[prop]];
        sub.forEach(s => { if (typeof s === 'object') this._parseLdItem(s, nodes); });
      }
    });
  }
};
