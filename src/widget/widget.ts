import { Component,HostListener,HostBinding,Output,Input,OnInit,ViewChild,EventEmitter,ComponentFactoryResolver,AfterViewInit,ViewContainerRef} from '@angular/core';
import { GridItem } from '../griditem/griditem';

@Component({
  moduleId: module.id,
  selector: 'widget',
  templateUrl: './widget.html',
  styleUrls:['./widget.css']
})
export class NgWidget extends GridItem {

  public style:any={};
  // public size:any={'x':GridItem.gridConfig.minWidth,'y':GridItem.gridConfig.minHeight};
  public size: any;
  public isDrag:boolean=false;
  public isResize:boolean=false;
  public mousePoint:any= {};

  @Output() onActivateWidget = new EventEmitter<NgWidget>();
  @Output() onClose = new EventEmitter<NgWidget>();
  @Input() innerComponent;
  @Input() innerHTML;
  @Input() position;
  @Input() inputSize;
  @Input() id;
  @Input() widgetTitle;

  @ViewChild('header') header;
  @ViewChild('resizer') resizer;
  @ViewChild('target', {read: ViewContainerRef}) target: ViewContainerRef;

  constructor(private componentFactoryResolver: ComponentFactoryResolver){
    super();
  }

  ngOnInit(){
    this.size = {'x':this.inputSize.x,'y':this.inputSize.y};
    this.calcSize();
    this.calcPosition();
  }

  /**
   * 监听mousedown事件
   * 触发拖曳/调整大小事件
  **/
  @HostListener('mousedown', ['$event'])
  onMouseDown(e){
    // 判断拖拽还是改变尺寸
    if(e.srcElement == this.header.nativeElement || e.srcElement.parentElement == this.header.nativeElement){
      this.isDrag = true;
      // debugger;
      this.mousePoint.x = e.clientX;
      this.mousePoint.y = e.clientY;
      this.onActivateWidget.emit(this);
    } else if(e.srcElement == this.resizer.nativeElement){
      this.isResize = true;
      this.mousePoint.x = e.clientX;
      this.mousePoint.y = e.clientY;
      this.onActivateWidget.emit(this);
    }
    this.style['z-index'] = '1';
  }

  // 当控件未激活时重置
  reset(){
    this.style['z-index'] = 'auto';
    this.isDrag = false;
    this.isResize = false;
  }

  /**
   * 监听输入属性改变
   * 在widget中创建组件
  **/
  ngOnChanges(changes){
    if(changes.innerComponent && changes.innerComponent.currentValue){
      this.target.clear();
      let factory = this.componentFactoryResolver.resolveComponentFactory(this.innerComponent);
      this.target.createComponent(factory);
    }
  }

  // 销毁组件
  close(){
    this.onClose.emit(this);
  }
}
