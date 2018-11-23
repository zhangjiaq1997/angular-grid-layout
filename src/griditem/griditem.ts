import { Input,OnInit } from '@angular/core';

export class GridItem{

  public style:any={};
  public position:any={};
  public size:any={};

  public static gridConfig;

  // sets position to input 设置输入位置
  setPosition(newPosition){
    this.position = newPosition;
    this.calcPosition();
  }

  // sets position to input 设置输入尺寸
  setSize(newSize){
    this.size = newSize;
    this.calcSize();
  }

  //使用margin将 col/row 的位置转换成px
  calcPosition(){
    const x: number = (GridItem.gridConfig.colWidth + GridItem.gridConfig.marginLeft+2) * (this.position.col - 1) + GridItem.gridConfig.marginLeft;
    const y: number = (GridItem.gridConfig.rowHeight + GridItem.gridConfig.marginTop+2) * (this.position.row - 1) + GridItem.gridConfig.marginTop;
    this.style.left = x.toString()+'px';
    this.style.top = y.toString()+'px';
  }

  // 使用margin将 col/row 的尺寸转换成px
  calcSize(){
    const w: number = (GridItem.gridConfig.colWidth * this.size.x) + (GridItem.gridConfig.marginLeft * (this.size.x - 1));
    const h: number = (GridItem.gridConfig.rowHeight * this.size.y) + (GridItem.gridConfig.marginTop * (this.size.y - 1));
    this.style.width = w.toString()+'px';
    this.style.height = h.toString()+'px';
  }

}
