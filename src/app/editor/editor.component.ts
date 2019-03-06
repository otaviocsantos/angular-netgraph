import { Component, OnInit, ViewChild } from '@angular/core';
import { UIDService } from '../_services/uid.service';
import { NetgraphComponent } from '../netgraph/netgraph.component';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {

  @ViewChild('net') net: NetgraphComponent;
  connections;
  disconnections;
  names = [];
  nodes;
  links;
  selected = null;
  data;

  constructor(private uidService: UIDService) {
    this.createInit();
  }

  get possibleConnections() {
    if (this.selected == null) {
      return [];
    }
    return this.nodes.filter(o => {
      if (!this.isConnected(o.id, this.selected.id) && o.id !== this.selected.id) {
        return o;
      }
    });
  }

  get possibleDisconnections() {
    if (this.selected == null) {
      return [];
    }
    return this.nodes.filter(o => {
      if (this.isConnected(o.id, this.selected.id)) {
        return o;
      }
    });

  }

  decideRadius() {
    return 5;
  }

  ngOnInit() {
  }

  createInit() {
    this.names = ['alice', 'bob', 'charlie', 'dolores', 'edward', 'ferdinand', 'gaston', 'hugo', 'iago', 'jivago'];

    this.nodes = this.names.map(o => {
      return {
        id: this.uidService.get(),
        label: o
      };
    });

    this.links = [];

    for (let i = 1; i < 8; i++) {
      this.links.push({
        source: this.nodes[0],
        target: this.nodes[i],
        group: Math.random() > 0.5 ? 'friends' : 'family'
      });
    }
    this.updateData();

  }
  select(event) {
    this.selected = event;
  }


  zoomIn() {
    this.net.zoom(5);
  }
  zoomOut() {
    this.net.zoom(-5);
  }

  getNodeById(id) {
    return this.nodes.filter(o => o.id === id)[0];
  }

  connect(source, target) {
    this.links.push({
      source,
      target,
      group: Math.random() > 0.5 ? 'friends' : 'family'
    });
    this.updateData();
  }

  updateData() {
    this.data = {
      nodes: [...this.nodes],
      links: [...this.links]
    };
  }

  disconnect(source, target) {
    this.links = this.links.filter(o => {
      if (o.source.id === source.id && o.target.id === target.id || o.source.id === target.id && o.target.id === source.id) {
        return;
      }
      return o;
    });
    this.updateData();

  }

  remove() {
    if (this.select != null) {
      this.nodes = this.nodes.filter(o => o.id !== this.selected.id);
      this.links = this.links.filter(o => {
        if (o.source.id !== this.selected.id && o.target.id !== this.selected.id) { return o; }
      });
      this.names = this.names.filter(o => o !== this.selected.label);

      this.updateData();

      this.selected = null;
    }
  }

  isConnected(nodeA, nodeB): boolean {

    for (const item of this.links) {
      if (item.source.id === nodeA && item.target.id === nodeB || item.source.id === nodeB && item.target.id === nodeA) {
        return true;
      }
    }
    return false;

  }

}
