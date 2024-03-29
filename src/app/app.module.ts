import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';
import { NetgraphComponent } from './netgraph/netgraph.component';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent,
    NetgraphComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
