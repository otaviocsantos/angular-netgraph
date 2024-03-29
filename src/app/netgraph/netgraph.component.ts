import { Component, OnInit, ElementRef, Input, Output, EventEmitter, ViewEncapsulation, OnChanges } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-netgraph',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './netgraph.component.html',
  styleUrls: ['./netgraph.component.css']
})
export class NetgraphComponent implements OnInit, OnChanges {

  @Output() select = new EventEmitter<any>();

  private svg;
  private simulation;
  private zoomFunc;
  private container;

  private links: any[];
  private nodes: any[];
  private hidden: any[];

  private groups;
  private scale;

  private mNodeRadius = 5;
  @Input('nodeRadius') set nodeRadius(value: number) {
    this.nodeRadius = value;
  }
  get nodeRadius(): number {
    return this.nodeRadius;
  }

  private mRepulsionForce = -850;
  @Input('repulsionForce') set repulsionForce(value: number) {
    this.mRepulsionForce = value;
  }
  get respulsioForce(): number {
    return this.mRepulsionForce;
  }

  private nodeElements;
  private linkElements;
  private nodeLabelElements;


  private mEnabled = true;
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

  constructor(private ground: ElementRef) {
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

    this.groups = [...Array.from(new Set(nodes.map(item => item.type)))];

    this.hidden = [];

    this.restart();
  }

  restart() {

    d3.select(this.ground.nativeElement).select('svg').remove();

    const vbAttr = `${-this.width / 2} ${-this.height / 2} ${this.width} ${this.height}`;

    this.svg = d3.select(this.ground.nativeElement).append('svg').attr('width', this.width).attr('height', this.height)
      .attr('id', 'graph')
      .attr('viewBox', vbAttr);

    this.container = this.svg.append('g');

    this.zoomFunc = d3.zoom()
      .scaleExtent([1 / 2, 10])
      .on('zoom', () => {
        this.container.attr('transform', d3.event.transform);
      });
    this.svg.call(this.zoomFunc);

    this.createSimulation(this.nodes, this.links);

    this.createLinks();

    this.createNodes();

    this.createNodeLabels();

    this.startSimulation();

    this.update();
  }


  createLinks() {
    const l = this.container
      .append('g');

    this.linkElements = l
      .selectAll('line')
      .data(this.links.filter(element => {
        if (this.hidden.indexOf(element.target.type) === -1 && this.hidden.indexOf(element.source.type) === -1) {
          return element;
        }
      }))
      .enter().append('line')
      .attr('class', 'ngraph-link')
      ;
  }

  createNodes() {
    const n = this.container
      .append('g');

    this.nodeElements = n
      .attr('class', 'ngraph-node')
      .selectAll('circle')
      .data(this.nodes.filter(element => {

        if (this.hidden.indexOf(element.type) === -1) {
          return element;
        }

      }))
      .enter().append((o, i, l) => {
        const shape = i > 0 ? 'circle' : 'rect';

        return document.createElementNS('http://www.w3.org/2000/svg', shape);
      })
      .attr('r', this.mNodeRadius)
      .attr('width', this.mNodeRadius * 2)
      .attr('height', this.mNodeRadius * 2)
      .attr('fill', d => this.color(d))

      .on('click', (o, i, l) => { this.clicked(o, i, l); })
      .call(d3.drag()
        // .on('touch', (o) => { this.clicked(o); })
        .on('start', (o) => { this.dragstarted(o); })
        .on('drag', (o) => { this.dragged(o); })
        .on('end', (o) => { this.dragended(o); }))
      ;
  }



  createNodeLabels() {

    this.nodeLabelElements = this.container.append('g')
      .selectAll('ngraph-node-label')
      .data(this.nodes.filter(element => {

        if (this.hidden.indexOf(element.type) === -1) {
          return element;
        }

      }))
      .enter().append('text')
      .attr('class', 'ngraph-node-label')
      .text(d => d.label)
      .on('click', (o, i, l) => { this.clicked(o, i, l); })
      .call(d3.drag()
        // .on('touch', (o) => { this.clicked(o); })
        .on('start', (o) => { this.dragstarted(o); })
        .on('drag', (o) => { this.dragged(o); })
        .on('end', (o) => { this.dragended(o); }))

      ;
  }

  createSimulation(nodes, links) {
    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id))
      .force('charge', d3.forceManyBody().strength(this.mRepulsionForce))
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
        .attr('x', d => d.x - this.mNodeRadius) // x,y for rect elements
        .attr('y', d => d.y - this.mNodeRadius)
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
    if (d.type) {
      return this.scale(d.type);
    }
    return 'white';
  }

  getLink(source: number, target: number) {
    if (source === undefined || target === undefined) {
      return undefined;
    }
    return this.links.find(o => o.source.id === source && o.target.id === target);
  }

  toggle(o) {

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

  zoom(value) {
    this.zoomFunc.scaleBy(this.svg, value);
  }

}
