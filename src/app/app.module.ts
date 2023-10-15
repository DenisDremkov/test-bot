import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { DenysBotModule } from 'projects/bot/src/public-api';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    DenysBotModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
