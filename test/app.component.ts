import { Component, ViewChild,AfterViewInit} from '@angular/core';
import { NgGrid } from '../src/main';
import { ContentComponent } from './content/content.component';

@Component({
    selector: 'my-app',
    template: '<grid [customConfig]="customConfig" [setItem]="setItem"></grid>'
})
export class AppComponent implements AfterViewInit{

    @ViewChild(NgGrid) grid : NgGrid;

    public customConfig = {
      // 'maxWidth':5,
      // 'maxHeight':5,
      // 'minWidth':2,
      // 'minHeight':2,
    };
    public setItem = [
        { id: "1", position: {col: 1, row: 1}, size: {x: 1, y: 1} },
        { id: "2", position: {col: 2, row: 1}, size: {x: 1, y: 1} },
        { id: "3", position: {col: 3, row: 1}, size: {x: 1, y: 1} },
        { id: "4", position: {col: 1, row: 2}, size: {x: 1, y: 1} },
        { id: "5", position: {col: 4, row: 1}, size: {x: 1, y: 2} },
        { id: "6", position: {col: 2, row: 3}, size: {x: 3, y: 1} },
        { id: "7", position: {col: 2, row: 2}, size: {x: 1, y: 1} },
    ];
    ngAfterViewInit(){
        let widget = this.grid.addWidget();
        for(let i=0;i<widget.length;i++){
            widget[i].content = ContentComponent;
            widget[i].widgetTitle = widget[i].id;
        }
      (<any>window).grid = this.grid;
    }
}
