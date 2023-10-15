import { NgModule } from '@angular/core';
import { DenysBotComponent } from './bot.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    DenysBotComponent
  ],
  imports: [
    CommonModule, // todo - optimization (import only elements wich need)
    FormsModule // todo - optimization (import only elements wich need)
  ],
  exports: [
    DenysBotComponent
  ]
})
export class DenysBotModule { }
