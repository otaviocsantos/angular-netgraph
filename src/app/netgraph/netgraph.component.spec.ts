import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NetgraphComponent } from './netgraph.component';

describe('NetgraphComponent', () => {
  let component: NetgraphComponent;
  let fixture: ComponentFixture<NetgraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NetgraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetgraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
