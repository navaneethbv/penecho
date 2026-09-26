"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const uiBootstrapSource = fs.readFileSync(path.join(root, "src/client/app/ui-bootstrap.js"), "utf8");
const canvasRuntimeSource = fs.readFileSync(path.join(root, "src/client/app/canvas-runtime.js"), "utf8");

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `expected ${name} in source`);
  const open = source.indexOf("{", start);
  assert.ok(open >= 0, `expected ${name} body`);

  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = open; index < source.length; index++) {
    const current = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (current === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (current === "*" && next === "/") {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (current === "\\") escaped = true;
      else if (current === quote) quote = "";
      continue;
    }
    if (current === "/" && next === "/") {
      lineComment = true;
      index++;
      continue;
    }
    if (current === "/" && next === "*") {
      blockComment = true;
      index++;
      continue;
    }
    if (["'", '"', "`"].includes(current)) {
      quote = current;
      continue;
    }
    if (current === "{") depth++;
    else if (current === "}" && --depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`unterminated ${name}`);
}

function ensureHarness(mode) {
  const state = { mode, handToolbarTargets: new Map() };
  const ensureHandToolbarRecord = vm.runInNewContext(
    `(${extractFunction(canvasRuntimeSource, "ensureHandToolbarRecord")})`,
    {
      Date,
      HAND_OBJECT_TOOLBAR_VISIBLE_MS: 10_000,
      handToolbarKey: (kind, id) => `${kind}:${id}`,
      state,
    },
  );
  return { ensureHandToolbarRecord, state };
}

function finishHarness({
  target,
  type = "pointerup",
  pointerId = 7,
  tapPointerId = pointerId,
  mode = "hand",
  viewMode = false,
  spacePan = false,
  touchCount = 0,
  dx = 0,
  dy = 0,
} = {}) {
  const state = {
    handToolbarTap: { id: tapPointerId, target, x: 100, y: 200 },
    mode,
    spacePan,
    touches: new Map(Array.from({ length: touchCount }, (_, index) => [index + 1, {}])),
    viewMode,
  };
  const calls = [];
  const finishHandCanvasTap = vm.runInNewContext(
    `(${extractFunction(uiBootstrapSource, "finishHandCanvasTap")})`,
    {
      Math,
      showHandObjectToolbar: (kind, object) => calls.push({ kind, object }),
      state,
    },
  );
  finishHandCanvasTap({
    clientX: 100 + dx,
    clientY: 200 + dy,
    pointerId,
    type,
  });
  return { calls, state };
}

test("Hand taps pass widget, image, text-box, and animation objects to the toolbar", () => {
  for (const kind of ["widget", "image", "text-box", "animation"]) {
    const object = { id: `${kind}-1` };
    const { calls, state } = finishHarness({ target: { kind, object } });

    assert.equal(calls.length, 1, `${kind} should be selected on a tap`);
    assert.equal(calls[0].kind, kind);
    assert.strictEqual(calls[0].object, object);
    assert.equal(state.handToolbarTap, null, `${kind} tap should be consumed`);
  }
});

test("Hand tap tolerance includes six pixels and rejects a larger drag", () => {
  const object = { id: "image-1" };
  assert.equal(finishHarness({ target: { kind: "image", object }, dx: 6 }).calls.length, 1);
  assert.equal(finishHarness({ target: { kind: "image", object }, dx: 6.01 }).calls.length, 0);
});

test("cancelled, multi-touch, view-mode, and space-pan gestures do not select", () => {
  const cases = [
    { type: "pointercancel" },
    { touchCount: 2 },
    { viewMode: true },
    { spacePan: true },
  ];
  for (const options of cases) {
    const { calls, state } = finishHarness({
      ...options,
      target: { kind: "text-box", object: { id: "text-1" } },
    });
    assert.equal(calls.length, 0, `${Object.keys(options).join("/")} must not select`);
    assert.equal(state.handToolbarTap, null, "the pending tap must be cleared");
  }
});

test("a different pointer cannot finish the pending Hand tap", () => {
  const tap = { id: 7, target: { kind: "animation", object: { id: "animation-1" } }, x: 100, y: 200 };
  const { calls, state } = finishHarness({
    pointerId: 8,
    tapPointerId: 7,
    target: tap.target,
  });
  assert.equal(calls.length, 0);
  assert.deepEqual(state.handToolbarTap, tap);
});

test("Hand toolbar records accept all four object kinds", () => {
  const { ensureHandToolbarRecord, state } = ensureHarness("hand");
  for (const kind of ["widget", "image", "text-box", "animation"]) {
    const object = { id: `${kind}-2` };
    const result = ensureHandToolbarRecord(kind, object);

    assert.ok(result, `${kind} should be allowed in Hand mode`);
    assert.equal(result.key, `${kind}:${object.id}`);
    assert.equal(result.record.kind, kind);
    assert.equal(result.record.id, object.id);
    assert.strictEqual(state.handToolbarTargets.get(result.key), result.record);
  }
});

test("Hand toolbar record creation is idempotent for an object", () => {
  const { ensureHandToolbarRecord, state } = ensureHarness("hand");
  const object = { id: "widget-2" };
  const first = ensureHandToolbarRecord("widget", object);
  const second = ensureHandToolbarRecord("widget", object);

  assert.strictEqual(second.record, first.record);
  assert.equal(state.handToolbarTargets.size, 1);
});

test("Pen mode keeps toolbar records limited to widgets", () => {
  const { ensureHandToolbarRecord, state } = ensureHarness("pen");
  const widget = { id: "widget-pen" };
  assert.ok(ensureHandToolbarRecord("widget", widget));
  for (const kind of ["image", "text-box", "animation"]) {
    assert.equal(ensureHandToolbarRecord(kind, { id: `${kind}-pen` }), null, `${kind} must stay unavailable in Pen mode`);
  }
  assert.equal(state.handToolbarTargets.size, 1);
});

test("Hand text activation opens the existing editor instead of an outline-only toolbar", () => {
  const item = { id:"text-box-1" }, calls = [];
  const show = vm.runInNewContext(`(${extractFunction(canvasRuntimeSource, 'showHandObjectToolbar')})`, {
    editTextBox:object => { calls.push(object); return true; },
  });
  assert.equal(show('text-box', item), true);
  assert.deepEqual(calls, [item]);
});

test("text editing accepts Hand and Select and preserves the originating tool", () => {
  for (const mode of ['hand', 'select', 'pen']) {
    const item = {id:'text-box-1',x:10,y:20,maxWidth:200,h:60,fontSize:20,image:{}}, editor = {}, calls = [];
    const state = {mode,textBoxes:[item],textEditors:new Map(),scale:1};
    const edit = vm.runInNewContext(`(${extractFunction(canvasRuntimeSource, 'editTextBox')})`, {
      state,TEXT_EDITOR_MIN_WIDTH:170,TEXT_EDITOR_MIN_HEIGHT:96,
      clearHandToolbarTarget(){},bringTextBoxToFront(){},
      createTextEditor:(_point, options) => { calls.push(options); return editor; },
      textEditorContentMetrics:() => ({}),textImageContentInset:() => ({}),
      textEditorOriginFromTextBox:() => ({x:10,y:20}),positionTextEditors(){},setStatusKey(){},render(){},
    });
    assert.equal(edit(item), mode !== 'pen');
    if (mode !== 'pen') assert.equal(calls[0].returnMode, mode);
    else assert.equal(calls.length,0);
  }
});

test("text rendering is isolated from ink and releases its backing store when empty", () => {
  const draws = [], context = new Proxy({}, {get:(_target,key) => (...args) => { if(key === 'drawImage') draws.push(args[0]); }});
  const inkTile = {id:'ink'}, text = {id:'text'}, state = {panX:0,panY:0,scale:1,textBoxes:[text]}, layer = {};
  const render = vm.runInNewContext(`(${extractFunction(canvasRuntimeSource,'renderTextContentLayer')})`, {
    state,textContentLayer:layer,devicePixelRatio:1,SIZE:32768,TILE:256,
    canvasViewportMetrics:() => ({width:800,height:600}),textContentCtx:context,
    forTiles:(_x,_y,_w,_h,draw) => draw(inkTile,0,0),drawSharpOverlays(){},
    drawTextBoxesToContext:ctx => ctx.drawImage(text,20,30),
  });
  render();
  assert.deepEqual(draws,[text]);
  assert.equal(layer.width,800);
  state.textBoxes = [];
  render();
  assert.equal(layer.width,1);
  assert.equal(layer.height,1);
  assert.deepEqual(inkTile,{id:'ink'});
});

test("text blur commits changed drafts without consuming the next Canvas action", async () => {
  const calls=[], classes=new Set(['active']);
  const editor={id:1,sourceTextBoxId:'text-1',textarea:{value:'changed'},element:{classList:{add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n))}}};
  const unselect=vm.runInNewContext(`(async ${extractFunction(canvasRuntimeSource,'unselectTextEditor')})`,{
    state:{textBoxes:[{id:'text-1',text:'original'}]},
    confirmTextEditor:async(item,options)=>calls.push([item,options.focusLoss]),
  });
  await unselect(editor);
  assert.deepEqual(calls,[[editor,true]]);
  assert.equal(classes.has('active'),false);
  assert.equal(classes.has('unselecting'),true);
  await unselect(editor);
  assert.equal(calls.length,1);
});

test("unchanged selected text loses selection without creating another history entry", async () => {
  const calls=[], editor={id:1,sourceTextBoxId:'text-1',textarea:{value:'same'}};
  const state={textBoxes:[{id:'text-1',text:'same'}],selectedTextBoxId:'text-1'};
  const unselect=vm.runInNewContext(`(async ${extractFunction(canvasRuntimeSource,'unselectTextEditor')})`,{
    state,removeTextEditor:e=>calls.push(e),requestRender:()=>calls.push('render'),
  });
  await unselect(editor);
  assert.equal(state.selectedTextBoxId,null);
  assert.deepEqual(calls,[editor,'render']);
});

test("focus within text controls or their help dialog keeps the editor selected", () => {
  const input={},button={},help={closest:selector=>selector==='#textHelpDialog'},outside={};
  const editor={element:{contains:target=>target===input||target===button}};
  const owns=vm.runInNewContext(`(${extractFunction(canvasRuntimeSource,'textEditorOwnsFocusTarget')})`,{textHelpInvoker:button});
  for(const target of [input,button,help]) assert.equal(owns(editor,target),true);
  assert.equal(owns(editor,outside),false);
});
