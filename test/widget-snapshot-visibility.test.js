'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../src/client/app/canvas-runtime.js'),'utf8');
test('navigation visibility updates keep a capture target active until its capture ends',()=>{
 const start=source.indexOf('  function updateWidgetRenderVisibility('),end=source.indexOf('  let canvasWidgetCarrierPanX',start),classes=new Set();
 let initialized=0;
 const fn=vm.runInNewContext(source.slice(start,end)+';updateWidgetRenderVisibility',{view:{clientWidth:1000,clientHeight:800},state:{scale:1},sendWidgetInit:()=>initialized++});
 const widget={w:400,h:400,shell:{classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)}}};
 assert.equal(fn(widget,2000,2000),false);
 widget.snapshotCaptureActive=true;
 assert.equal(fn(widget,2000,2000),true);assert.equal(classes.has('widget-offscreen'),false);assert.equal(initialized,1);
 widget.snapshotCaptureActive=false;
 assert.equal(fn(widget,2000,2000),false);assert.equal(classes.has('widget-offscreen'),true);
 assert.equal(fn(widget,100,100),true);
});
test('capture activity lease clears on successful response and cancellation',async()=>{
 const start=source.indexOf('  async function requestWidgetSnapshot('),end=source.indexOf('  async function handleWidgetMessage(',start);
 for(const abort of [false,true]){
  const pending=new Map(),controller=new AbortController();
  const widget={renderActive:false,hostReady:true,initialized:true,contentW:400,contentH:400,contentVersion:0,shell:{classList:{remove(){},add(){}}},frame:{contentWindow:{postMessage(){}}}};
  const context={performance,crypto:{randomUUID:()=> 'capture'},WIDGET_SNAPSHOT_TIMEOUT_MS:1000,widgetSnapshotRequests:pending,location:{origin:'http://local'},setTimeout,clearTimeout,sendWidgetHostState(){},widgetSnapshotAbortError:()=>Error('cancelled')};
  const fn=vm.runInNewContext(source.slice(start,end)+';requestWidgetSnapshot',context);
  const promise=fn(widget,1000,true,controller.signal);
  assert.equal(widget.snapshotCaptureActive,true);
  if(abort){controller.abort();await assert.rejects(promise,/cancelled/);}
  else{const request=pending.get('capture');clearTimeout(request.timer);pending.delete('capture');controller.signal.removeEventListener('abort',request.abort);request.resolve({width:400,height:400});await promise;}
  assert.equal(widget.snapshotCaptureActive,false);assert.equal(widget.renderActive,false);assert.equal(widget.snapshotPromise,null);
 }
});
