// Graph engine — D3 force simulation with dynamic add/remove
const GraphEngine = {
  nodes: [],
  links: [],
  nodeMap: {},
  simulation: null,
  svg: null, g: null, linkG: null, nodeG: null, defs: null,
  zoom: null,
  link: null, node: null,
  pinnedNode: null,
  onNodeClick: null,
  width: 0, height: 0,

  COLORS: {
    person: '#7c6fca', location: '#c75a5a', organization: '#4a9e8e',
    category: '#5a8ec7', date: '#5d6d7e', artwork: '#d4a843',
    url: '#888', image: '#888', unknown: '#666',
  },

  RADIUS: {
    person: 20, location: 12, organization: 14, category: 11,
    date: 8, artwork: 16, url: 6, image: 6, unknown: 10,
  },

  init(svgSelector) {
    this.svg = d3.select(svgSelector);
    this.width = window.innerWidth;
    this.height = window.innerHeight - 52;

    this.defs = this.svg.append('defs');
    const glow = this.defs.append('filter').attr('id', 'glow');
    glow.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'blur');
    glow.append('feMerge').selectAll('feMergeNode').data(['blur','SourceGraphic']).enter().append('feMergeNode').attr('in', d => d);

    this.g = this.svg.append('g');
    this.linkG = this.g.append('g');
    this.nodeG = this.g.append('g');

    this.zoom = d3.zoom().scaleExtent([0.1, 6]).on('zoom', e => this.g.attr('transform', e.transform));
    this.svg.call(this.zoom);

    this.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).distance(100).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-180))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius(d => (d.radius || 10) + 6))
      .force('x', d3.forceX(this.width / 2).strength(0.02))
      .force('y', d3.forceY(this.height / 2).strength(0.02))
      .on('tick', () => this._tick());

    this.svg.on('click', () => {
      this.pinnedNode = null;
      document.getElementById('info-panel').classList.remove('open');
      this._resetOpacity();
    });

    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight - 52;
      this.simulation.force('center', d3.forceCenter(this.width / 2, this.height / 2));
      this.simulation.alpha(0.2).restart();
    });
  },

  addNode(id, type, label, data) {
    if (this.nodeMap[id]) return this.nodeMap[id];
    const n = { id, type, label, data: data || {}, radius: this.RADIUS[type] || 10 };
    this.nodes.push(n);
    this.nodeMap[id] = n;
    return n;
  },

  addLink(sourceId, targetId, relation) {
    if (sourceId === targetId) return;
    if (!this.nodeMap[sourceId] || !this.nodeMap[targetId]) return;
    const exists = this.links.some(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      return s === sourceId && t === targetId && l.relation === relation;
    });
    if (!exists) this.links.push({ source: sourceId, target: targetId, relation });
  },

  rebuild() {
    this.simulation.nodes(this.nodes);
    this.simulation.force('link').links(this.links);

    // Links
    this.link = this.linkG.selectAll('line').data(this.links, d => {
      const s = typeof d.source === 'object' ? d.source.id : d.source;
      const t = typeof d.target === 'object' ? d.target.id : d.target;
      return s + '|' + t + '|' + d.relation;
    });
    this.link.exit().remove();
    const linkEnter = this.link.enter().append('line')
      .attr('class', 'link')
      .attr('stroke', d => {
        const src = typeof d.source === 'object' ? d.source : this.nodeMap[d.source];
        return this.COLORS[src?.type] || '#444';
      })
      .attr('stroke-width', d => d.relation === 'influenced by' || d.relation === 'spouse' ? 2 : 1);
    this.link = linkEnter.merge(this.link);

    // Image patterns for nodes with images
    this.nodes.filter(n => n.data?.imageUrl && !this.defs.select('#img-' + this._safeId(n.id)).node()).forEach(n => {
      this.defs.append('pattern')
        .attr('id', 'img-' + this._safeId(n.id))
        .attr('width', 1).attr('height', 1)
        .attr('patternContentUnits', 'objectBoundingBox')
        .append('image').attr('href', n.data.imageUrl)
        .attr('width', 1).attr('height', 1).attr('preserveAspectRatio', 'xMidYMid slice');
    });

    // Nodes
    this.node = this.nodeG.selectAll('.node').data(this.nodes, d => d.id);
    this.node.exit().remove();
    const nodeEnter = this.node.enter().append('g').attr('class', 'node')
      .call(d3.drag().on('start', (e,d) => this._dragStart(e,d)).on('drag', (e,d) => this._drag(e,d)).on('end', (e,d) => this._dragEnd(e,d)));

    nodeEnter.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.data?.imageUrl ? `url(#img-${this._safeId(d.id)})` : (this.COLORS[d.type] || '#666'))
      .attr('stroke', d => this.COLORS[d.type] || '#666')
      .attr('filter', 'url(#glow)');

    nodeEnter.append('text')
      .attr('dy', d => d.radius + 13)
      .attr('text-anchor', 'middle')
      .text(d => d.label.length > 22 ? d.label.slice(0, 20) + '…' : d.label);

    this._attachEvents(nodeEnter);
    this.node = nodeEnter.merge(this.node);

    this.simulation.alpha(0.4).restart();
    this._updateCount();
    Store.save(this.nodes, this.links);
  },

  clear() {
    this.nodes.length = 0;
    this.links.length = 0;
    this.nodeMap = {};
    this.pinnedNode = null;
    this.linkG.selectAll('*').remove();
    this.nodeG.selectAll('*').remove();
    this.link = this.linkG.selectAll('line');
    this.node = this.nodeG.selectAll('.node');
    this.simulation.nodes([]);
    this.simulation.force('link').links([]);
    Store.clear();
    this._updateCount();
  },

  loadFromStore() {
    const { nodes, links } = Store.load();
    if (!nodes.length) return false;
    nodes.forEach(n => this.addNode(n.id, n.type, n.label, n.data));
    links.forEach(l => this.addLink(l.source, l.target, l.relation));
    this.rebuild();
    return true;
  },

  importJSON(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      if (!data.nodes || !data.links) return false;
      data.nodes.forEach(n => this.addNode(n.id, n.type, n.label, n.data));
      data.links.forEach(l => this.addLink(l.source, l.target, l.relation));
      this.rebuild();
      return true;
    } catch(e) { return false; }
  },

  zoomTo(d) {
    this.svg.transition().duration(600).call(
      this.zoom.transform,
      d3.zoomIdentity.translate(this.width/2, this.height/2).scale(1.8).translate(-d.x, -d.y)
    );
  },

  _safeId(id) { return id.replace(/[^a-zA-Z0-9-]/g, '_'); },

  _tick() {
    if (this.link) this.link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
    if (this.node) this.node.attr('transform', d => `translate(${d.x},${d.y})`);
  },

  _dragStart(e,d) { if(!e.active) this.simulation.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; },
  _drag(e,d) { d.fx=e.x; d.fy=e.y; },
  _dragEnd(e,d) { if(!e.active) this.simulation.alphaTarget(0); d.fx=null; d.fy=null; },

  _attachEvents(sel) {
    const self = this;
    sel.on('mouseover', function(e, d) {
      if (!self.pinnedNode) self._highlightConnected(d);
    })
    .on('mouseout', function() {
      if (!self.pinnedNode) self._resetOpacity();
    })
    .on('click', function(e, d) {
      e.stopPropagation();
      self.pinnedNode = d;
      self._highlightConnected(d);
      if (self.onNodeClick) self.onNodeClick(d);
    });
  },

  _highlightConnected(d) {
    const connected = new Set([d.id]);
    this.links.forEach(l => {
      const s = typeof l.source==='object'?l.source.id:l.source;
      const t = typeof l.target==='object'?l.target.id:l.target;
      if (s===d.id) connected.add(t);
      if (t===d.id) connected.add(s);
    });
    this.node.style('opacity', n => connected.has(n.id) ? 1 : 0.08);
    this.link.style('stroke-opacity', l => {
      const s = typeof l.source==='object'?l.source.id:l.source;
      const t = typeof l.target==='object'?l.target.id:l.target;
      return (s===d.id||t===d.id) ? 0.6 : 0.02;
    });
    this.node.select('circle').attr('stroke-width', n => n.id===d.id ? 3 : 1.5);
  },

  _resetOpacity() {
    this.node.style('opacity', 1);
    this.link.style('stroke-opacity', 0.2);
    this.node.select('circle').attr('stroke-width', 1.5);
  },

  _updateCount() {
    const el = document.getElementById('node-count');
    if (el) el.textContent = `${this.nodes.length} nodes · ${this.links.length} links`;
  }
};
