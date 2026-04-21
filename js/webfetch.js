// Web page fetcher — deep content extraction from any URL via CORS proxy
const WebFetch = {
  PROXY: 'https://api.allorigins.win/raw?url=',

  isUrl(str) {
    return /^https?:\/\/.+\..+/.test(str.trim());
  },

  async fetch(url, statusCallback) {
    const sc = statusCallback || (() => {});
    try {
      sc('Fetching page...');
      const resp = await fetch(this.PROXY + encodeURIComponent(url));
      if (!resp.ok) throw new Error('Fetch failed: ' + resp.status);
      const html = await resp.text();
      sc('Parsing content...');
      const result = this.parse(html, url);

      // Crawl internal sub-pages for more content
      sc('Scanning linked pages...');
      const subPages = this._findSubPages(html, url);
      for (const sub of subPages.slice(0, 4)) {
        try {
          sc(`Scanning ${sub.label}...`);
          const subResp = await fetch(this.PROXY + encodeURIComponent(sub.url));
          if (subResp.ok) {
            const subHtml = await subResp.text();
            this._mergeSubPage(subHtml, sub.url, sub.label, result);
          }
        } catch (e) { /* skip failed sub-pages */ }
      }

      // Try to cross-reference extracted names with Wikidata
      sc('Looking up references...');
      await this._crossRefWikidata(result);

      return result;
    } catch (e) {
      return { url, title: url, description: 'Could not fetch page', nodes: [] };
    }
  },

  parse(html, url) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const base = new URL(url);
    const domain = base.hostname.replace('www.', '');

    const title = this._meta(doc, 'og:title') || doc.querySelector('title')?.textContent?.trim() || domain;
    const description = this._meta(doc, 'og:description') || this._meta(doc, 'description') || '';
    const image = this._meta(doc, 'og:image') || '';
    const siteName = this._meta(doc, 'og:site_name') || domain;
    const type = this._meta(doc, 'og:type') || 'website';

    const nodes = [];
    const mainId = 'web-' + domain + '-' + url.replace(/[^a-z0-9]/gi, '-').slice(0, 50);

    // Main page node
    nodes.push({
      id: mainId,
      type: type === 'profile' ? 'person' : 'organization',
      label: title,
      data: { name: title, desc: description, url, imageUrl: image || null, source: 'web' }
    });

    // Site node
    nodes.push({
      id: 'site-' + domain, type: 'organization', label: siteName,
      data: { name: siteName, url: 'https://' + domain, source: 'web' },
      linkTo: mainId, relation: 'hosted on'
    });

    // Social links
    this._extractSocials(doc, nodes, mainId);

    // JSON-LD
    this._extractJsonLd(doc, nodes, mainId);

    // Emails
    this._extractEmails(doc, nodes, mainId);

    // Images with meaningful alt text (artwork, portfolio pieces)
    this._extractImages(doc, nodes, mainId, base);

    // Body text analysis — extract names, places, keywords
    this._extractBodyContent(doc, nodes, mainId);

    // Headings
    this._extractHeadings(doc, nodes, mainId, title);

    return { url, title, description, image, nodes, mainId, domain };
  },

  // ── Image extraction ──
  _extractImages(doc, nodes, mainId, base) {
    const seen = new Set();
    const images = doc.querySelectorAll('img[src]');
    let count = 0;

    images.forEach(img => {
      if (count >= 12) return;
      const alt = (img.getAttribute('alt') || '').trim();
      const title = (img.getAttribute('title') || '').trim();
      const label = alt || title;

      // Skip tiny images, icons, logos, tracking pixels
      const src = img.getAttribute('src') || '';
      if (src.includes('pixel') || src.includes('tracking') || src.includes('favicon')) return;
      if (src.includes('logo') && !label) return;
      const w = parseInt(img.getAttribute('width') || '0');
      const h = parseInt(img.getAttribute('height') || '0');
      if ((w > 0 && w < 50) || (h > 0 && h < 50)) return;

      // Need a meaningful label
      if (!label || label.length < 3) return;
      // Skip generic labels
      if (/^(image|photo|img|picture|banner|header|icon|logo)\s*\d*$/i.test(label)) return;

      const key = label.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);

      // Resolve relative URLs
      let imgUrl = src;
      try { imgUrl = new URL(src, base).href; } catch(e) {}

      nodes.push({
        id: 'img-' + key.replace(/[^a-z0-9]/g, '-').slice(0, 50),
        type: 'artwork',
        label: label,
        data: { name: label, imageUrl: imgUrl, source: 'web-image' },
        linkTo: mainId,
        relation: 'artwork'
      });
      count++;
    });

    // Also check for figure/figcaption patterns
    doc.querySelectorAll('figure').forEach(fig => {
      if (count >= 12) return;
      const caption = fig.querySelector('figcaption')?.textContent?.trim();
      const figImg = fig.querySelector('img');
      if (!caption || caption.length < 3 || !figImg) return;

      const key = caption.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);

      let imgUrl = figImg.getAttribute('src') || '';
      try { imgUrl = new URL(imgUrl, base).href; } catch(e) {}

      nodes.push({
        id: 'img-' + key.replace(/[^a-z0-9]/g, '-').slice(0, 50),
        type: 'artwork',
        label: caption,
        data: { name: caption, imageUrl: imgUrl, source: 'web-image' },
        linkTo: mainId,
        relation: 'artwork'
      });
      count++;
    });
  },

  // ── Body text analysis ──
  _extractBodyContent(doc, nodes, mainId) {
    // Get visible text content
    const body = doc.querySelector('body');
    if (!body) return;

    // Remove scripts, styles, nav, footer
    const clone = body.cloneNode(true);
    clone.querySelectorAll('script, style, nav, footer, header, noscript, iframe').forEach(el => el.remove());
    const text = clone.textContent.replace(/\s+/g, ' ').trim();

    if (text.length < 50) return;

    // Extract potential proper nouns (capitalized multi-word phrases)
    const properNouns = new Set();
    const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
    let match;
    while ((match = namePattern.exec(text)) !== null) {
      const name = match[1].trim();
      // Filter out common non-name phrases
      if (name.length > 4 && name.length < 50 && !this._isCommonPhrase(name)) {
        properNouns.add(name);
      }
    }

    // Extract locations (City, State/Country patterns)
    const locationPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][A-Za-z\s]+)\b/g;
    const locations = new Set();
    while ((match = locationPattern.exec(text)) !== null) {
      const loc = match[0].trim();
      if (loc.length > 4 && loc.length < 60) locations.add(loc);
    }

    // Extract years and date references
    const years = new Set();
    const yearPattern = /\b(1[5-9]\d{2}|20[0-2]\d)\b/g;
    while ((match = yearPattern.exec(text)) !== null) {
      years.add(match[1]);
    }

    // Extract medium/material mentions common in art
    const artTerms = ['oil on canvas', 'acrylic', 'watercolor', 'mixed media', 'sculpture',
      'photography', 'digital art', 'printmaking', 'ceramic', 'textile', 'installation',
      'oil painting', 'gouache', 'charcoal', 'pastel', 'ink', 'lithograph', 'etching',
      'bronze', 'marble', 'wood', 'glass', 'collage', 'mural', 'fresco'];
    const foundMediums = new Set();
    const lowerText = text.toLowerCase();
    artTerms.forEach(term => {
      if (lowerText.includes(term)) foundMediums.add(term);
    });

    // Extract exhibition/gallery mentions
    const galleryPattern = /(?:gallery|museum|exhibition|show|collection|studio)\s*(?:at\s+)?([A-Z][A-Za-z\s&']+)/gi;
    const galleries = new Set();
    while ((match = galleryPattern.exec(text)) !== null) {
      const g = match[1].trim();
      if (g.length > 3 && g.length < 60) galleries.add(g);
    }

    const seen = new Set(nodes.map(n => n.label.toLowerCase()));

    // Add proper noun nodes (likely people, organizations)
    [...properNouns].slice(0, 8).forEach(name => {
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      nodes.push({
        id: 'name-' + key.replace(/[^a-z0-9]/g, '-').slice(0, 40),
        type: 'person', label: name,
        data: { name, source: 'text-extraction', needsLookup: true },
        linkTo: mainId, relation: 'mentioned'
      });
    });

    // Add locations
    [...locations].slice(0, 5).forEach(loc => {
      const key = loc.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      nodes.push({
        id: 'loc-' + key.replace(/[^a-z0-9]/g, '-').slice(0, 40),
        type: 'location', label: loc,
        data: { name: loc, place: loc, source: 'text-extraction' },
        linkTo: mainId, relation: 'location'
      });
    });

    // Add mediums
    [...foundMediums].slice(0, 4).forEach(m => {
      const key = m.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      nodes.push({
        id: 'medium-' + key.replace(/[^a-z0-9]/g, '-'),
        type: 'category', label: m.charAt(0).toUpperCase() + m.slice(1),
        data: { name: m, source: 'text-extraction' },
        linkTo: mainId, relation: 'medium'
      });
    });

    // Add galleries/exhibitions
    [...galleries].slice(0, 4).forEach(g => {
      const key = g.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      nodes.push({
        id: 'gallery-' + key.replace(/[^a-z0-9]/g, '-').slice(0, 40),
        type: 'organization', label: g,
        data: { name: g, source: 'text-extraction' },
        linkTo: mainId, relation: 'exhibited at'
      });
    });

    // Add decade nodes from years found
    const decades = new Set();
    [...years].forEach(y => decades.add(Math.floor(parseInt(y) / 10) * 10));
    [...decades].slice(0, 3).forEach(d => {
      const label = d + 's';
      nodes.push({
        id: 'decade-' + d,
        type: 'date', label,
        data: { decade: label, source: 'text-extraction' },
        linkTo: mainId, relation: 'active in'
      });
    });
  },

  _isCommonPhrase(str) {
    const common = ['all rights', 'privacy policy', 'terms of', 'cookie policy', 'read more',
      'learn more', 'click here', 'sign up', 'log in', 'contact us', 'about us',
      'follow us', 'get in touch', 'view more', 'see more', 'load more',
      'next page', 'previous page', 'go back', 'home page', 'main menu',
      'powered by', 'built with', 'designed by', 'copyright', 'all rights reserved'];
    const lower = str.toLowerCase();
    return common.some(c => lower.includes(c));
  },

  // ── Sub-page crawling ──
  _findSubPages(html, url) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const base = new URL(url);
    const pages = [];
    const seen = new Set([url]);

    // Look for internal links that are likely content pages
    const interestingPaths = ['portfolio', 'gallery', 'work', 'art', 'about', 'projects',
      'paintings', 'collection', 'exhibitions', 'bio', 'artist', 'music', 'discography',
      'shows', 'events', 'press', 'cv', 'resume'];

    doc.querySelectorAll('a[href]').forEach(a => {
      try {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        const resolved = new URL(href, base);
        if (resolved.hostname !== base.hostname) return;
        const path = resolved.pathname.toLowerCase();
        if (seen.has(resolved.href)) return;

        const isInteresting = interestingPaths.some(p => path.includes(p));
        const linkText = (a.textContent || '').trim().toLowerCase();
        const textInteresting = interestingPaths.some(p => linkText.includes(p));

        if (isInteresting || textInteresting) {
          seen.add(resolved.href);
          pages.push({
            url: resolved.href,
            label: a.textContent.trim() || path
          });
        }
      } catch (e) {}
    });

    return pages;
  },

  _mergeSubPage(html, url, label, result) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const base = new URL(url);
    const mainId = result.mainId;

    // Add sub-page as a node
    const pageId = 'page-' + url.replace(/[^a-z0-9]/gi, '-').slice(0, 50);
    const pageTitle = doc.querySelector('title')?.textContent?.trim() || label;
    result.nodes.push({
      id: pageId, type: 'category', label: pageTitle,
      data: { name: pageTitle, url, source: 'sub-page' },
      linkTo: mainId, relation: 'page'
    });

    // Extract images from sub-page
    this._extractImages(doc, result.nodes, pageId, base);

    // Extract body content from sub-page
    this._extractBodyContent(doc, result.nodes, pageId);

    // Extract headings
    this._extractHeadings(doc, result.nodes, pageId, pageTitle);
  },

  // ── Wikidata cross-reference ──
  async _crossRefWikidata(result) {
    // Find nodes that were extracted from text and might match Wikidata entities
    const lookupNodes = result.nodes.filter(n => n.data?.needsLookup);
    if (!lookupNodes.length) return;

    // Batch search — limit to 5 to avoid rate limiting
    for (const node of lookupNodes.slice(0, 5)) {
      try {
        const results = await Wiki.search(node.label);
        if (results.length > 0) {
          const best = results[0];
          // If the Wikidata result closely matches our extracted name, link them
          if (best.label.toLowerCase() === node.label.toLowerCase() ||
              best.label.toLowerCase().includes(node.label.toLowerCase()) ||
              node.label.toLowerCase().includes(best.label.toLowerCase())) {
            node.data.qid = best.id;
            node.data.desc = best.description || node.data.desc;
            node.data.wikiMatch = true;
          }
        }
      } catch (e) {}
    }
  },

  // ── Shared extractors ──
  _extractSocials(doc, nodes, mainId) {
    const patterns = [
      { pattern: /instagram\.com\/([^\/?"]+)/i, label: 'Instagram' },
      { pattern: /twitter\.com\/([^\/?"]+)/i, label: 'Twitter/X' },
      { pattern: /x\.com\/([^\/?"]+)/i, label: 'Twitter/X' },
      { pattern: /facebook\.com\/([^\/?"]+)/i, label: 'Facebook' },
      { pattern: /linkedin\.com\/(?:in|company)\/([^\/?"]+)/i, label: 'LinkedIn' },
      { pattern: /youtube\.com\/(?:@|channel\/|c\/)([^\/?"]+)/i, label: 'YouTube' },
      { pattern: /tiktok\.com\/@([^\/?"]+)/i, label: 'TikTok' },
      { pattern: /github\.com\/([^\/?"]+)/i, label: 'GitHub' },
      { pattern: /spotify\.com\/artist\/([^\/?"]+)/i, label: 'Spotify' },
      { pattern: /soundcloud\.com\/([^\/?"]+)/i, label: 'SoundCloud' },
      { pattern: /pinterest\.com\/([^\/?"]+)/i, label: 'Pinterest' },
      { pattern: /etsy\.com\/shop\/([^\/?"]+)/i, label: 'Etsy' },
      { pattern: /behance\.net\/([^\/?"]+)/i, label: 'Behance' },
      { pattern: /dribbble\.com\/([^\/?"]+)/i, label: 'Dribbble' },
      { pattern: /artstation\.com\/([^\/?"]+)/i, label: 'ArtStation' },
      { pattern: /saatchiart\.com\/([^\/?"]+)/i, label: 'Saatchi Art' },
      { pattern: /deviantart\.com\/([^\/?"]+)/i, label: 'DeviantArt' },
    ];
    const seen = new Set();
    doc.querySelectorAll('a[href]').forEach(a => {
      const href = a.href || a.getAttribute('href') || '';
      patterns.forEach(sp => {
        const match = href.match(sp.pattern);
        if (match && !seen.has(sp.label)) {
          seen.add(sp.label);
          const handle = match[1];
          nodes.push({
            id: 'social-' + sp.label.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + handle.toLowerCase(),
            type: 'organization', label: `${sp.label}: @${handle}`,
            data: { name: `${sp.label}: @${handle}`, url: href, source: 'web' },
            linkTo: mainId, relation: 'social profile'
          });
        }
      });
    });
  },

  _extractEmails(doc, nodes, mainId) {
    const emails = new Set();
    doc.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('mailto:')) {
        const email = href.replace('mailto:', '').split('?')[0].trim();
        if (email && !emails.has(email)) {
          emails.add(email);
          nodes.push({
            id: 'email-' + email.replace(/[^a-z0-9]/gi, '-'),
            type: 'category', label: email,
            data: { name: 'Email: ' + email, source: 'web' },
            linkTo: mainId, relation: 'contact'
          });
        }
      }
    });
  },

  _extractHeadings(doc, nodes, mainId, skipTitle) {
    const seen = new Set(nodes.map(n => n.label.toLowerCase()));
    doc.querySelectorAll('h1, h2, h3').forEach(h => {
      const text = h.textContent.trim();
      if (!text || text.length < 3 || text.length > 80) return;
      if (text === skipTitle) return;
      const key = text.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      nodes.push({
        id: 'topic-' + key.replace(/[^a-z0-9]/g, '-').slice(0, 40),
        type: 'category', label: text,
        data: { name: text, source: 'web' },
        linkTo: mainId, relation: 'topic'
      });
    });
  },

  _extractJsonLd(doc, nodes, mainId) {
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try {
        const ld = JSON.parse(script.textContent);
        const items = Array.isArray(ld) ? ld : [ld];
        items.forEach(item => this._parseLdItem(item, nodes, mainId));
      } catch (e) {}
    });
  },

  _parseLdItem(item, nodes, mainId) {
    if (!item || !item['@type']) return;
    const type = Array.isArray(item['@type']) ? item['@type'][0] : item['@type'];
    const name = item.name || item.headline || '';
    if (!name) return;

    const nodeType = type.toLowerCase().includes('person') ? 'person'
      : type.toLowerCase().includes('organization') || type.toLowerCase().includes('business') ? 'organization'
      : type.toLowerCase().includes('place') || type.toLowerCase().includes('address') ? 'location'
      : type.toLowerCase().includes('product') || type.toLowerCase().includes('creative') ? 'artwork'
      : 'category';

    const nodeId = 'ld-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40);
    if (nodes.length > 0 && nodes[0].label === name) return;

    const data = { name, desc: item.description || '', source: 'json-ld' };
    if (item.image) data.imageUrl = typeof item.image === 'string' ? item.image : item.image?.url || '';
    if (item.url) data.url = item.url;

    nodes.push({ id: nodeId, type: nodeType, label: name, data, linkTo: mainId, relation: type.toLowerCase() });

    ['author', 'creator', 'performer', 'location', 'publisher', 'memberOf', 'artist'].forEach(prop => {
      if (item[prop]) {
        const sub = Array.isArray(item[prop]) ? item[prop] : [item[prop]];
        sub.forEach(s => { if (typeof s === 'object') this._parseLdItem(s, nodes, mainId); });
      }
    });
  },

  _meta(doc, name) {
    const el = doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
    return el?.getAttribute('content')?.trim() || '';
  }
};
