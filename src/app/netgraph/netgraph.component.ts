import { Component, OnInit, ElementRef, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-netgraph',
  templateUrl: './netgraph.component.html',
  styleUrls: ['./netgraph.component.css']
})
export class NetgraphComponent implements OnInit, OnChanges {

  @Output() select = new EventEmitter<any>();

  svg;
  simulation;

  links: any[];
  nodes: any[];
  labels: any[];
  hidden: any[];

  groups;
  scale;

  nodeRadius = 5;
  repulsionForce = -850;

  nodeElements;
  linkElements;
  nodeLabelElements;
  labelElements;


  nodeClass = 'ngraph-node';
  linkClass = 'ngraph-link';
  nodeLabelClass = 'ngraph-node-label';
  labelClass = 'ngraph-label';

  linkStroke = 'black';
  linkOpacity = 1;
  linkWidth = 1;

  fontFamily = 'sans-serif';
  fontSize = '10px';
  fontFill = 'black';

  mEnabled = true;
  @Input('enabled') set enabled(value: boolean) {
    this.mEnabled = value;
    if (this.svg) {
      this.svg.style('opacity', this.mEnabled ? 1 : 0.5);
    }
  }
  get enabled(): boolean {
    return this.mEnabled;
  }

  private mWidth = 800;
  @Input('width') set width(value: number) {
    this.mWidth = Math.abs(value);
  }
  get width(): number {
    return this.mWidth;
  }

  private mHeight = 600;
  @Input('height') set height(value: number) {
    this.mHeight = Math.abs(value);
  }
  get height(): number {
    return this.mHeight;
  }

  @Input('value') set value(data: any) {
    if (data) {
      this.create(data.nodes, data.links);
    }
  }

  constructor(private container: ElementRef) {
    this.scale = d3.scaleOrdinal(d3.schemeCategory10);
  }

  ngOnInit() {
  }

  ngOnChanges(): void {
    if (!this.nodes) { return; }
    this.create(this.nodes, this.links);
  }

  create(nodes, links) {

    this.links = links;

    this.nodes = nodes;

    this.labels = [...Array.from(new Set(links.map(item => item.group)))];

    this.groups = [...Array.from(new Set(links.map(item => item.group)))];

    this.hidden = [];

    this.restart();
  }

  restart() {
    d3.select(this.container.nativeElement).select('svg').remove();

    const vbAttr = `${-this.width / 2} ${-this.height / 2} ${this.width} ${this.height}`;

    this.svg = d3.select(this.container.nativeElement).append('svg').attr('width', this.width).attr('height', this.height)
      .attr('viewBox', vbAttr);


    this.createSimulation(this.nodes, this.links);

    this.createLinks();

    this.createNodes();

    this.createNodeLabels();

    this.createLabels();

    this.startSimulation();

    this.update();
  }

  createLinks() {
    const l = this.svg
      .append('g');

    this.linkElements = l
      .selectAll('line')
      .data(this.links.filter(element => {
        if (this.hidden.indexOf(element.group) === -1) {
          return element;
        }
      }))
      .enter().append('line')
      .attr('stroke', this.linkStroke)
      .attr('class', this.linkClass)
      .attr('stroke-opacity', this.linkOpacity)
      .attr('stroke-width', this.linkWidth)
      ;
  }

  createNodes() {
    const n = this.svg
      .append('g');

    this.nodeElements = n
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(this.nodes.filter(element => {

        const link = this.getLink(this.nodes[0].id, element.id);

        if (link === undefined || this.hidden.indexOf(link.group) === -1) {
          return element;
        }

      }))
      .enter().append((o, i, l) => {
        const shape = i > 0 ? 'circle' : 'rect';

        return document.createElementNS('http://www.w3.org/2000/svg', shape);
      })
      .attr('r', this.nodeRadius)
      .attr('width', this.nodeRadius * 2)
      .attr('height', this.nodeRadius * 2)
      .attr('fill', d => this.color(d))
      .style('fill-opacity', 0.3)
      .style('stroke-width', 0)
      .on('click', (o, i, l) => { this.clicked(o, i, l); })
      // .on('click', this.clicked)
      .call(d3.drag()
        // .on('touch', (o) => { this.clicked(o); })
        .on('start', (o) => { this.dragstarted(o); })
        .on('drag', (o) => { this.dragged(o); })
        .on('end', (o) => { this.dragended(o); }))
      ;
  }



  createNodeLabels() {
    this.nodeLabelElements = this.svg.append('g')
      .selectAll(this.nodeLabelClass)
      .data(this.nodes.filter(element => {

        const link = this.getLink(this.nodes[0].id, element.id);

        if (link === undefined || this.hidden.indexOf(link.group) === -1) {
          return element;
        }

      }))
      .enter().append('text')
      .attr('font-size', this.fontSize)
      .attr('font-family', this.fontFamily)
      .style('cursor', 'default')
      .attr('class', this.nodeLabelClass)
      .style('cursor', 'pointer')
      .attr('fill', this.fontFill)
      .text(d => d.label)
      .on('click', (o, i, l) => { this.clicked(o, i, l); })
      .call(d3.drag()
        // .on('touch', (o) => { this.clicked(o); })
        .on('start', (o) => { this.dragstarted(o); })
        .on('drag', (o) => { this.dragged(o); })
        .on('end', (o) => { this.dragended(o); }))

      ;
  }

  createLabels() {

    this.labelElements = this.svg.append('g')
      .selectAll(this.labelClass)
      .data(this.labels)
      .enter().append('text')
      .attr('font-size', this.fontSize)
      .attr('font-family', this.fontFamily)
      .style('cursor', 'default')
      .attr('class', this.labelClass)
      .attr('fill', this.fontFill)
      .style('text-decoration', element => {
        return this.hidden.indexOf(element) > -1 ? 'line-through' : 'none';
      })
      .attr('x', (o, i, l) => 100 * i)
      .attr('y', 200)
      .text((o, i, l) => o)
      .on('click', (o, i, l) => { this.toggle(o, i, l); })
      ;
  }

  createSimulation(nodes, links) {
    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id))
      .force('charge', d3.forceManyBody().strength(this.repulsionForce))
      .force('x', d3.forceX())
      .force('y', d3.forceY());
  }

  startSimulation() {
    this.simulation.on('tick', () => {
      this.linkElements
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      this.nodeElements
        .attr('cx', d => d.x) // cx, cy for circle elements
        .attr('cy', d => d.y)
        .attr('x', d => d.x - this.nodeRadius) // x,y for rect elements
        .attr('y', d => d.y - this.nodeRadius)
        ;

      this.nodeLabelElements
        .attr('x', d => d.x)
        .attr('y', d => d.y);


    });
  }

  update() {
    this.enabled = this.mEnabled;
  }

  color(d) {
    const link = this.getLink(this.nodes[0].id, d.id);
    if (link !== undefined) {
      return this.scale(link.group);
    }
    return 'white';
  }

  getLink(source: number, target: number) {
    if (source === undefined || target === undefined) {
      return undefined;
    }
    return this.links.find(o => o.source.id === source && o.target.id === target);
  }

  toggle(o, i, l) {
    const search = this.hidden.indexOf(o);
    if (search > -1) {
      this.hidden.splice(search, 1);
    } else {
      this.hidden.push(o);
    }
    this.restart();
  }

  clicked(o, i, l) {
    if (d3.event.defaultPrevented) { return; } // dragged

    if (this.enabled) {

      this.select.emit(o);

    }
  }

  dragstarted(d) {
    if (this.enabled) {

      if (!d3.event.active) { this.simulation.alphaTarget(0.3).restart(); }
      d.fx = d.x;
      d.fy = d.y;
    }
  }

  dragged(d) {
    if (this.enabled) {

      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }
  }

  dragended(d) {
    if (this.enabled) {

      d.fx = d3.event.x;
      d.fy = d3.event.y;
      if (!d3.event.active) { this.simulation.alphaTarget(0); }
    }
  }

  zoomed() {
    this.simulation = d3.event.transform;
    // this.render();
  }

  zoom(value: number = 2) {

  }

}
