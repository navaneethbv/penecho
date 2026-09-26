'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../src/client/app/canvas-navigation.js'),'utf8');
const helperSource=source.slice(0,source.indexOf('\n  function canvasNavigationTextTarget'));
const PRESENTATION_KEY='penecho.widgetInteractionPresentation';

class FakeElement {
 constructor(tagName) {
  this.tagName=String(tagName).toUpperCase();
  this.children=[];
  this.listeners=new Map();
  this.attributes=new Map();
  this.parentNode=null;
  this.className='';
  this.disabled=false;
  this.textContent='';
 }
 setAttribute(name,value){this.attributes.set(name,String(value));}
 getAttribute(name){return this.attributes.get(name)??null;}
 removeAttribute(name){this.attributes.delete(name);}
 addEventListener(type,listener,options={}){
  const entries=this.listeners.get(type)||[];
  entries.push({listener,once:options.once===true});
  this.listeners.set(type,entries);
 }
 append(...children){for(const child of children){child.parentNode=this;this.children.push(child);}}
 prepend(...children){for(const child of [...children].reverse()){child.parentNode=this;this.children.unshift(child);}}
 dispatch(type,init={}){
  const entries=[...(this.listeners.get(type)||[])],event={...init,type,currentTarget:this,target:this};
  return entries.map(entry=>{
   if(entry.once){const current=this.listeners.get(type)||[],index=current.indexOf(entry);if(index>=0)current.splice(index,1);}
   return entry.listener(event);
  })[0];
 }
}

function harness({stored=null,failGet=false,failSet=false,downloadImpl=()=>Promise.resolve()}={}) {
 const storage=new Map([[PRESENTATION_KEY,stored]]);
 const writes=[],renders=[],positions=[],downloads=[],hostStateCalls=[];
 const localStorage={
  getItem(key){if(failGet)throw new Error('storage read failed');return storage.get(key)??null;},
  setItem(key,value){if(failSet)throw new Error('storage write failed');storage.set(key,value);writes.push([key,value]);}
 };
 const ctx={
  localStorage,
  requestInteractionLayerRender(){renders.push(true);},
  positionWidget(widget){positions.push(widget);},
  document:{createElement(tagName){return new FakeElement(tagName);}},
  t(key){return key;},
  OBJECT_CHROME_ICONS:{download:''},
  downloadWidgetImage(widget){downloads.push(widget);return downloadImpl(widget);},
  sendWidgetHostState(widget){hostStateCalls.push(widget);},
  setWidgetInteraction(){}
 };
 const api=vm.runInNewContext(`${helperSource};({widgetInteractionPresentation,switchWidgetPresentation,setWidgetPresentationZoom,setWidgetMaximized})`,ctx);
 return {api,downloads,hostStateCalls,storage,writes,renders,positions};
}

function widgetFixture({presentationToolbar={id:'existing-toolbar'}}={}) {
 const parent={id:'canvas-layer'};
 const classChanges=[];
 const shell={
  parentNode:parent,
  classList:{add(name){classChanges.push(['add',name]);},remove(name){classChanges.push(['remove',name]);}},
  attributes:new Map(),
  popoverOpen:false,
  setAttribute(name,value){this.attributes.set(name,value);},
  removeAttribute(name){this.attributes.delete(name);},
  showPopoverCalls:0,
  showPopover(){this.showPopoverCalls++;this.popoverOpen=true;},
  hidePopoverCalls:0,
  hidePopover(){this.hidePopoverCalls++;this.popoverOpen=false;},
  matches(selector){return selector===':popover-open'&&this.popoverOpen;},
  prependCalls:0,
  prepend(...children){this.prependCalls++;this.prepended=children[0];children[0].parentNode=this;}
 };
 const frame={focusCalls:0,focus(){this.focusCalls++;}};
 const widget={id:'widget-1',title:'Widget',shell,frame,presentationToolbar,maximized:false,w:240,h:160,contentW:480,contentH:320,presentationWidth:null,presentationHeight:null};
 return {widget,parent,shell,frame,toolbar:presentationToolbar,classChanges};
}

function toolbarButton(toolbar,label) {
 return toolbar?.children?.find(child=>child.tagName==='BUTTON'&&child.getAttribute('aria-label')===label);
}

function toolbarZoomLabel(toolbar) {
 return toolbar?.children?.find(child=>child.tagName==='OUTPUT');
}

test('Widget presentation defaults to maximized and honors saved canvas/max modes',()=>{
 const h=harness();
 assert.equal(h.api.widgetInteractionPresentation(),'maximized');
 h.storage.set(PRESENTATION_KEY,'canvas');
 assert.equal(h.api.widgetInteractionPresentation(),'canvas');
 h.storage.set(PRESENTATION_KEY,'maximized');
 assert.equal(h.api.widgetInteractionPresentation(),'maximized');
});

test('Widget presentation tolerates localStorage failures and still switches state',()=>{
 const readFailure=harness({failGet:true});
 assert.equal(readFailure.api.widgetInteractionPresentation(),'maximized');

 const writeFailure=harness({failSet:true});
 const fixture=widgetFixture();
 writeFailure.api.switchWidgetPresentation(fixture.widget,true);
 assert.equal(fixture.widget.maximized,true);
 assert.equal(fixture.shell.attributes.get('popover'),'manual');
 assert.equal(fixture.shell.showPopoverCalls,1);
 assert.deepEqual(writeFailure.writes,[]);
 assert.deepEqual(writeFailure.renders,[true]);
});

test('repeated maximize/minimize preserves the Widget shell and frame without reparenting',()=>{
 const h=harness();
 const fixture=widgetFixture();
 const {widget,parent,shell,frame,toolbar}=fixture;

 h.api.setWidgetMaximized(widget,true);
 h.api.setWidgetMaximized(widget,true);
 h.api.setWidgetMaximized(widget,false);
 h.api.setWidgetMaximized(widget,false);
 h.api.setWidgetMaximized(widget,true);

 assert.equal(widget.shell,shell);
 assert.equal(widget.frame,frame);
 assert.equal(widget.presentationToolbar,toolbar);
 assert.equal(shell.parentNode,parent);
 assert.equal(shell.prependCalls,0);
 assert.equal(shell.showPopoverCalls,2);
 assert.equal(shell.hidePopoverCalls,1);
 assert.equal(widget.maximized,true);
 assert.equal(frame.focusCalls,3);
 assert.deepEqual(h.positions,[widget,widget,widget]);
});

test('Widget presentation zoom clamps, updates controls, and notifies the host',()=>{
 const h=harness();
 const fixture=widgetFixture();
 const controls={zoomOut:new FakeElement('button'),zoomIn:new FakeElement('button'),label:new FakeElement('output')};
 fixture.widget.presentationZoomControls=controls;

 h.api.setWidgetPresentationZoom(fixture.widget,70);
 assert.equal(fixture.widget.presentationZoom,70);
 assert.equal(fixture.shell.attributes.get('data-presentation-zoom'),'70');
 assert.equal(controls.label.textContent,'70%');
 assert.equal(controls.zoomOut.disabled,false);
 assert.equal(controls.zoomIn.disabled,false);
 assert.deepEqual(h.hostStateCalls,[fixture.widget]);

 h.api.setWidgetPresentationZoom(fixture.widget,0,false);
 assert.equal(fixture.widget.presentationZoom,50);
 assert.equal(fixture.shell.attributes.get('data-presentation-zoom'),'50');
 assert.equal(controls.label.textContent,'50%');
 assert.equal(controls.zoomOut.disabled,true);
 assert.equal(controls.zoomIn.disabled,false);
 assert.equal(h.hostStateCalls.length,1,'notifyHost=false must not send another host state');

 h.api.setWidgetPresentationZoom(fixture.widget,150);
 assert.equal(fixture.widget.presentationZoom,100);
 assert.equal(fixture.shell.attributes.get('data-presentation-zoom'),'100');
 assert.equal(controls.label.textContent,'100%');
 assert.equal(controls.zoomOut.disabled,false);
 assert.equal(controls.zoomIn.disabled,true);
 assert.equal(h.hostStateCalls.length,2);
});

test('maximizing creates one zoom control set, resets it on re-entry, and preserves Widget geometry',()=>{
 const h=harness();
 const fixture=widgetFixture({presentationToolbar:null});
 const {widget,parent,shell,frame}=fixture;
 const geometry={w:widget.w,h:widget.h,contentW:widget.contentW,contentH:widget.contentH};

 h.api.setWidgetMaximized(widget,true);
 const toolbar=widget.presentationToolbar;
 const zoomOut=toolbarButton(toolbar,'imageZoomOut');
 const zoomIn=toolbarButton(toolbar,'imageZoomIn');
 const label=toolbarZoomLabel(toolbar);
 assert.ok(toolbar);
 assert.ok(zoomOut);
 assert.ok(zoomIn);
 assert.ok(label);
 assert.equal(widget.presentationZoom,100);
 assert.equal(shell.attributes.get('data-presentation-zoom'),'100');
 assert.equal(label.textContent,'100%');
 assert.equal(zoomOut.disabled,false);
 assert.equal(zoomIn.disabled,true);
 zoomOut.dispatch('click');
 assert.equal(widget.presentationZoom,90);
 assert.equal(label.textContent,'90%');

 h.api.setWidgetMaximized(widget,false);
 assert.equal(widget.presentationZoom,100);
 assert.equal(shell.attributes.has('data-presentation-zoom'),false);
 h.api.setWidgetMaximized(widget,true);

 assert.strictEqual(widget.presentationToolbar,toolbar);
 assert.strictEqual(widget.frame,frame);
 assert.equal(shell.parentNode,parent);
 assert.equal(shell.prependCalls,1,'re-entry must not rebuild the toolbar or iframe');
 assert.equal(widget.presentationZoom,100);
 assert.equal(toolbarZoomLabel(toolbar).textContent,'100%');
 assert.equal(toolbarButton(toolbar,'imageZoomOut').disabled,false);
 assert.equal(toolbarButton(toolbar,'imageZoomIn').disabled,true);
 assert.deepEqual({w:widget.w,h:widget.h,contentW:widget.contentW,contentH:widget.contentH},geometry);
});

test('Widget download button restores itself after success and failure without toolbar index lookup',async()=>{
 let resolveDownload;
 const pending=new Promise(resolve=>{resolveDownload=resolve;});
 const success=harness({downloadImpl:()=>pending});
 const successFixture=widgetFixture({presentationToolbar:null});
 success.api.setWidgetMaximized(successFixture.widget,true);
 const successButton=toolbarButton(successFixture.widget.presentationToolbar,'downloadWidget');
 const successRun=successButton.dispatch('click');
 assert.equal(successButton.disabled,true);
 resolveDownload();
 await successRun;
 assert.equal(successButton.disabled,false);
 assert.deepEqual(success.downloads,[successFixture.widget]);

 const failure=harness({downloadImpl:async()=>{throw Error('download failed');}});
 const failureFixture=widgetFixture({presentationToolbar:null});
 failure.api.setWidgetMaximized(failureFixture.widget,true);
 const failureButton=toolbarButton(failureFixture.widget.presentationToolbar,'downloadWidget');
 await assert.rejects(failureButton.dispatch('click'),/download failed/);
 assert.equal(failureButton.disabled,false);
 assert.deepEqual(failure.downloads,[failureFixture.widget]);
});
