import { Component,HostListener,ViewChild,ViewChildren,Input,Output,EventEmitter,OnInit,QueryList} from '@angular/core';
import { NgWidget } from '../widget/widget';
import { NgWidgetShadow } from '../widgetshadow/widgetshadow';
import { GridItem } from '../griditem/griditem';

@Component({
  moduleId: module.id,
  selector: 'grid',
  templateUrl: './grid.html',
  styleUrls:['./grid.css']
})
export class NgGrid implements OnInit {

  @Output() public onDragStart: EventEmitter<NgWidget> = new EventEmitter<NgWidget>();
  @Output() public onDrag: EventEmitter<NgWidget> = new EventEmitter<NgWidget>();
  @Output() public onDragStop: EventEmitter<NgWidget> = new EventEmitter<NgWidget>();
  @Output() public onResizeStart: EventEmitter<NgWidget> = new EventEmitter<NgWidget>();
  @Output() public onResize: EventEmitter<NgWidget> = new EventEmitter<NgWidget>();
  @Output() public onResizeStop: EventEmitter<NgWidget> = new EventEmitter<NgWidget>();

  @ViewChild('grid') grid;
  @ViewChildren(NgWidget) ngWidgets : QueryList<NgWidget>;
  @ViewChild(NgWidgetShadow) ngWidgetShadow;

  @Input() customConfig:any;
  @Input() setItem: any;

  public gridStyle:any= {};
  public gridConfig:any={'maxCol':5,'maxRow':5,'theme':'light','colWidth':250,'rowHeight':180,'marginLeft':10,
  'marginTop':10,'marginRight':10,'marginBottom':10,'minWidth':1,'minHeight':1,'maxWidth':5,'maxHeight':5
};
public activeWidget:NgWidget;
public widgets=[];
public windowScroll:any={x:0,y:0};
public collisionsFlag:number;

// 设置自定义配置
ngOnInit(){
  for(var config in this.customConfig){
    this.gridConfig[config] = this.customConfig[config];
  }
  GridItem.gridConfig = this.gridConfig;
}

/**
 * 监听mouse move 事件
 * 处理小部件拖动和调整大小
**/
@HostListener('document:mousemove', ['$event'])
onMouseMove(e){
  if(this.activeWidget){
    if(this.activeWidget.isDrag){
      // debugger
      this.onDrag.emit(this.activeWidget);
      let top = parseInt(this.activeWidget.style.top);
      let left = parseInt(this.activeWidget.style.left);
      let dx = e.clientX - this.activeWidget.mousePoint.x;
      let dy = e.clientY - this.activeWidget.mousePoint.y;
      let gridPos = this._getPosition();
      // 如果有新的row/col,更新它
      if(this.ngWidgetShadow.position.row != gridPos.row || this.ngWidgetShadow.position.col != gridPos.col){
        this._checkCollision(gridPos,this.activeWidget.size,this.activeWidget.id);
        this.ngWidgetShadow.setPosition(gridPos);
        this._calcGridSize();
      }
      // 保持小部件在网格中
      if(top > 0 || dy > 0){
        this.activeWidget.style.top = top + dy > 0 ? (top+dy).toString()+'px' : 0;
        this.activeWidget.mousePoint.y = e.clientY;
      }
      if(left > 0 || dx > 0){
        this.activeWidget.style.left = left + dx > 0 ? (left+dx).toString()+'px' : 0;
        this.activeWidget.mousePoint.x = e.clientX;
      }
    } else if(this.activeWidget.isResize){
      this.onResize.emit(this.activeWidget);
      let dx = e.clientX - this.activeWidget.mousePoint.x;
      let dy = e.clientY - this.activeWidget.mousePoint.y;
      let size = this._getSize();
      let height = parseInt(this.activeWidget.style.height);
      let width = parseInt(this.activeWidget.style.width);

      // 如果有新的row/col,更新它
      if(this.ngWidgetShadow.size.x != size.x || this.ngWidgetShadow.size.y != size.y){
        this._checkCollision(this.activeWidget.position,size,this.activeWidget.id)
        this.ngWidgetShadow.setSize(size);
        this._calcGridSize();
      }

      // 检查最小和最大高度/宽度
        if(height + dy >= this.gridConfig.minHeight * this.gridConfig.rowHeight){
        if(this.gridConfig.maxHeight == -1 || height + dy <= this.gridConfig.maxHeight * this.gridConfig.rowHeight + this.gridConfig.marginTop){
          this.activeWidget.style.height = (height+dy).toString()+'px';
          this.activeWidget.mousePoint.y = e.clientY;
        }else{
          this.activeWidget.style.height = (this.gridConfig.maxHeight * this.gridConfig.rowHeight + this.gridConfig.marginTop).toString()+'px';
        }
      } else{
        this.activeWidget.style.height = (this.gridConfig.minHeight * this.gridConfig.rowHeight).toString()+'px';
      }
      if(width + dx  >= this.gridConfig.minWidth * this.gridConfig.colWidth){
        if(this.gridConfig.maxWidth == -1 || width + dx <= this.gridConfig.maxWidth * this.gridConfig.colWidth + this.gridConfig.marginLeft){
          this.activeWidget.style.width = (width+dx).toString()+'px';
          this.activeWidget.mousePoint.x = e.clientX;
        }else{
          this.activeWidget.style.width = (this.gridConfig.maxWidth * this.gridConfig.colWidth + this.gridConfig.marginLeft).toString()+'px';
        }
      }else{
        this.activeWidget.style.width = (this.gridConfig.minWidth * this.gridConfig.colWidth).toString()+'px';
      }

    }
  }
}

/**
 * 侦听鼠标上机mouseup事件
 * 发出onDragStop/onResizeStop事件
 * 将活动控件设置为小部件阴影坐标
 * 钝化阴影控件
 **/
@HostListener('document:mouseup', ['$event'])
onMouseUp(e){
  console.log(this.widgets);
  if(this.activeWidget){
    if(this.activeWidget.isDrag){
      this.onDragStop.emit(this.activeWidget);
      this.activeWidget.setPosition(this.ngWidgetShadow.position);
      this._findWidgetById(this.activeWidget.id).position = this.ngWidgetShadow.position;
      this._calcGridSize();
    }else if(this.activeWidget.isResize){
      this.onResizeStop.emit(this.activeWidget);
      this.activeWidget.setSize(this.ngWidgetShadow.size);
      this._findWidgetById(this.activeWidget.id).size = this.ngWidgetShadow.size;
      this._calcGridSize();
    }
    this.ngWidgetShadow.deactivate();
    this.activeWidget.reset();
  }
    this.activeWidget = null;
}

/**
 * 侦听窗口滚动事件
 * 如果拖动和滚动，更新小部件位置
 **/
@HostListener('window:scroll',['$event'])
onScroll(e){
  if(this.activeWidget){
    if(this.activeWidget.isDrag){
      var dx = window.scrollX - this.windowScroll.x;
      var dy = window.scrollY - this.windowScroll.y;
      let top = parseInt(this.activeWidget.style.top);
      let left = parseInt(this.activeWidget.style.left);
      let gridPos = this._getPosition();

      // 更新新行/新列
      if(this.ngWidgetShadow.position.row != gridPos.row || this.ngWidgetShadow.position.col != gridPos.col){
        this._checkCollision(gridPos,this.activeWidget.size,this.activeWidget.id);
        this.ngWidgetShadow.setPosition(gridPos);
        this._calcGridSize();
      }
      // 检查是否在网格中
      if(top > 0 || dy > 0){
        this.activeWidget.style.top = top + dy > 0 ? (top + dy).toString()+'px' : 0;
      }
      if(left > 0 || dx > 0){
        this.activeWidget.style.left = left + dx > 0 ? (left + dx).toString()+'px' : 0;
      }
    }
  }
  this.windowScroll.x = window.scrollX;
  this.windowScroll.y = window.scrollY;
}

// 查找与给定位置相撞的小部件
private _getCollision(position,size,id){
    var collisions=[];
    this.ngWidgets.forEach((widget)=>{
        if(widget.id != id && widget.id != this.activeWidget.id){
            if(((widget.position.col >= position.col && widget.position.col < position.col + size.x)
                || (widget.position.col + widget.size.x-1 >= position.col && widget.position.col + widget.size.x-1 < position.col + size.x)
                || (position.col >= widget.position.col && position.col < widget.position.col + widget.size.x))
                && ((widget.position.row >= position.row && widget.position.row < position.row + size.y)
                || (widget.position.row + widget.size.y-1 >= position.row && widget.position.row + widget.size.y-1 < position.row + size.y)
                || (position.row >= widget.position.row && position.row < widget.position.row + widget.size.y))){
                collisions.push(widget);
            }
        }
    });
    return collisions;
}

// 检查小部件碰撞并相应调整
private _checkCollision(position,size,id){
    var collisions = this._getCollision(position,size,id);

    let widgetFirst = true;
    collisions.forEach((widget)=>{
        console.log(widget.id)
        // debugger
        // console.log(this.ngWidgetShadow);
        // if((this.ngWidgetShadow.position.row<widget.position.row)&&widgetFirst){
        //     widgetFirst = false;
        //     widget.position.row = widget.position.row-1;
        //     console.log(widget);
        // }else{
        widget.position.row = position.row + size.y;
        // }
        widget.calcPosition();
        this._checkCollision(widget.position,widget.size,widget.id);
    });
}

/**
  * 关于小部件事件
  * 拖动或调整大小事件
  * 激活小部件阴影
 **/
onActivateWidget(widget:NgWidget){
  if(widget.isDrag){
    this.onDragStart.emit(widget);
  }else if(widget.isResize){
    this.onResizeStart.emit(widget);
  }
  this.ngWidgetShadow.activate();
  this.ngWidgetShadow.setPosition(widget.position);
  this.ngWidgetShadow.setSize(widget.size);
  this.activeWidget = widget;
}

// 移除特定控件
onClose(widget:NgWidget){
  for(var i = 0; i < this.widgets.length;i++){
    if(this.widgets[i].id == widget.id){
      this.widgets.splice(i,1);
    }
  }
}

// 在空列中添加具有唯一guid的小部件
addWidget():any{

  // 生成唯一的guid

  // function guid(){
  //   function s4() {
  //     return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  //   }
  //   return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  // }
  // var emptyCol = this._findEmptyCol();

  // let newWidget = {
  //   id: guid(),
  //   position:{
  //     'col': emptyCol,
  //     'row': 1
  //   },
  //   size:{
  //     'x':GridItem.gridConfig.minWidth,
  //     'y':GridItem.gridConfig.minHeight
  //   }
  // };
  let newWidget;
  this.setItem.forEach(si=>{
    // debugger
      newWidget = {
          id: si.id,
          position:{
              'col': si.position.col,
              'row': si.position.row
          },
          size:{
              'x':si.size.x,
              'y':si.size.y
          },
      };
      this.widgets.push(newWidget);
  });
    this._calcGridSize();
  // return newWidget;
    return this.widgets;
}

// 移除所有小部件
empty(){
  this.widgets = [];
}

// 活动控件的位置
private _getPosition(){
  let col = Math.round(parseInt(this.activeWidget.style.left) / (this.gridConfig.colWidth + this.gridConfig.marginLeft/2))+ 1;
  let row = Math.round(parseInt(this.activeWidget.style.top) / (this.gridConfig.rowHeight + this.gridConfig.marginTop/2)) + 1;

  return {'col':col,'row':row};
}

// 活动控件的大小
private _getSize(){
  let x =  Math.round(parseInt(this.activeWidget.style.width) / (this.gridConfig.colWidth + this.gridConfig.marginLeft/2));
  let y =  Math.round(parseInt(this.activeWidget.style.height) / (this.gridConfig.rowHeight + this.gridConfig.marginTop/2));
  return {'x':x,'y':y};
}

// 获取网格内的当前鼠标位置。
private _getMousePosition(e) {
  const refPos: any = this.grid.nativeElement.getBoundingClientRect();
  let left: number = e.clientX - refPos.left;
  let top: number = e.clientY - refPos.top;
  return {
    left: left,
    top: top
  };
}

// 用ID查找ngWidget
private _findNgWidgetById(id){
  for(let i = 0;i < this.ngWidgets.length;i++){
    if(this.ngWidgets[i].id == id){
      return this.ngWidgets[i];
    }
  }
}

// 通过ID查找小部件
private _findWidgetById(id){
  for(let i = 0;i < this.widgets.length;i++){
    if(this.widgets[i].id == id){
      return this.widgets[i];
    }
  }
}

// 在网格中找到空列
    private _findEmptyCol(){
  var col = 0;
  this.widgets.forEach((widget)=>{
    if(widget.position.col + widget.size.x > col)
    col = widget.position.col + widget.size.x - 1;
  });
  return col+1;
}

//
private _checkBlankBegin(){
  this.ngWidgets.forEach(item=>{
      this._checkBlank(item);
  })
}
private _checkBlank(item){
    let checkTest1 = [];
    let checkTest2 = [];
    let checkTest3 = [];
    this.ngWidgets.forEach(widget=>{
        if(widget.id != item.id){
          if(item.position.col==widget.position.col){
              checkTest1.push(widget);
          }else if((item.position.col>widget.position.col && item.position.col <= widget.position.col+widget.size.x-1)
              && (item.position.row>widget.position.row && item.position.row <= widget.position.row+widget.size.y-1 )){
              checkTest2.push(widget);
          }else if(item.position.col<widget.position.col && item.position.col+item.size.x-1>=widget.position.col+widget.size.x-1){
              checkTest3.push(widget);
          }
        }
    });
    if(checkTest1.length==0&&item.position.row!=1){
        if(checkTest2.length!==0){
            console.log(checkTest2[0].id);
        }else if(checkTest3.length!==0){
            console.log(checkTest3[0].id);
        }else{
            item.position.row =1;
            item.calcPosition();
        }
    }
}

// 重新计算网格大小
private _calcGridSize(){
  var maxRow = this.gridConfig.maxRow;
  var maxCol = this.gridConfig.maxCol;
  this.widgets.forEach((widget)=>{
    if( (widget.position.col + widget.size.x - 1) > maxCol )
    maxCol = widget.position.col + widget.size.x - 1;
    if((widget.position.row + widget.size.y -1) > maxRow)
    maxRow = widget.position.row + widget.size.y -1;
  });
  if((this.ngWidgetShadow.position.col + this.ngWidgetShadow.size.x - 1) > maxCol )
  maxCol = this.ngWidgetShadow.position.col + this.ngWidgetShadow.size.x - 1;
  if((this.ngWidgetShadow.position.row + this.ngWidgetShadow.size.y -1) > maxRow)
  maxRow = this.ngWidgetShadow.position.row + this.ngWidgetShadow.size.y -1;
  this.gridStyle.width = ((maxCol * (this.gridConfig.colWidth+2)) + (maxCol * this.gridConfig.marginLeft)
  + this.gridConfig.marginRight).toString()+'px';
  this.gridStyle.height = ((maxRow * (this.gridConfig.rowHeight+2)) + (maxRow * this.gridConfig.marginTop)
  + this.gridConfig.marginBottom).toString()+'px';
  }
}
