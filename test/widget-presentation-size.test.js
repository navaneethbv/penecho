'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../src/client/app/canvas-runtime.js'), 'utf8');
const start = source.indexOf('  function applyWidgetPresentationSize(');
const end = source.indexOf('  async function handleWidgetMessage(', start);
const functionSource = source.slice(start, end);

function harness({ maximized = true, styleRule = true, contentW = 320, contentH = 200, presentationWidth, presentationHeight } = {}) {
  const writes = [];
  const style = {
    width: '320px',
    height: '200px',
    transform: 'translate3d(10px,20px,0) scale(1,1)',
    '--widget-natural-width': '320px',
    '--widget-natural-height': '200px',
    setProperty(name, value) {
      writes.push([name, value]);
      this[name] = value;
    },
  };
  const hostStateCalls = [];
  const widget = {
    id: 'widget-1',
    maximized,
    styleRule: styleRule === false ? null : styleRule === true ? { style } : styleRule,
    contentW,
    contentH,
    w: 777,
    h: 555,
    presentationWidth,
    presentationHeight,
  };
  const context = {
    sendWidgetHostState(value) {
      hostStateCalls.push(value);
    },
  };
  const applyWidgetPresentationSize = vm.runInNewContext(`${functionSource}; applyWidgetPresentationSize`, context);
  return { applyWidgetPresentationSize, widget, style, writes, hostStateCalls };
}

test('valid presentation sizes are ceiled, preserve saved geometry, and update only presentation variables', () => {
  const h = harness();
  const savedGeometry = { contentW: h.widget.contentW, contentH: h.widget.contentH, w: h.widget.w, h: h.widget.h };
  const untouchedStyle = {
    width: h.style.width,
    height: h.style.height,
    transform: h.style.transform,
    '--widget-natural-width': h.style['--widget-natural-width'],
    '--widget-natural-height': h.style['--widget-natural-height'],
  };

  assert.equal(h.applyWidgetPresentationSize(h.widget, { width: 640.1, height: 399.2 }), true);
  assert.equal(h.widget.presentationWidth, 641);
  assert.equal(h.widget.presentationHeight, 400);
  assert.deepEqual(h.writes, [
    ['--widget-presentation-width', '641px'],
    ['--widget-presentation-height', '400px'],
  ]);
  assert.deepEqual({
    width: h.style.width,
    height: h.style.height,
    transform: h.style.transform,
    '--widget-natural-width': h.style['--widget-natural-width'],
    '--widget-natural-height': h.style['--widget-natural-height'],
  }, untouchedStyle);
  assert.deepEqual({ contentW: h.widget.contentW, contentH: h.widget.contentH, w: h.widget.w, h: h.widget.h }, savedGeometry);
  assert.equal(h.hostStateCalls.length, 1);
  assert.equal(h.hostStateCalls[0], h.widget);
});

test('presentation sizes never shrink below the saved content dimensions', () => {
  const h = harness({ contentW: 320, contentH: 200 });

  assert.equal(h.applyWidgetPresentationSize(h.widget, { width: 319.2, height: 199.1 }), true);
  assert.equal(h.widget.presentationWidth, 320);
  assert.equal(h.widget.presentationHeight, 200);
  assert.deepEqual(h.writes, [
    ['--widget-presentation-width', '320px'],
    ['--widget-presentation-height', '200px'],
  ]);
  assert.equal(h.hostStateCalls.length, 1);
});

test('the finite 100000px presentation limit is inclusive', () => {
  const h = harness();

  assert.equal(h.applyWidgetPresentationSize(h.widget, { width: 100000, height: 100000 }), true);
  assert.deepEqual(h.writes, [
    ['--widget-presentation-width', '100000px'],
    ['--widget-presentation-height', '100000px'],
  ]);
  assert.equal(h.hostStateCalls.length, 1);
});

test('unchanged presentation sizes do not send another host state update', () => {
  const h = harness({ presentationWidth: 641, presentationHeight: 400 });

  assert.equal(h.applyWidgetPresentationSize(h.widget, { width: 640.1, height: 399.2 }), false);
  assert.deepEqual(h.writes, []);
  assert.equal(h.hostStateCalls.length, 0);
});

test('invalid or inactive presentation size requests return false without mutation', () => {
  const invalidMessages = [
    { width: 0, height: 200 },
    { width: 200, height: 0 },
    { width: -1, height: 200 },
    { width: 200, height: -1 },
    { width: Number.NaN, height: 200 },
    { width: 200, height: Number.NaN },
    { width: Number.POSITIVE_INFINITY, height: 200 },
    { width: 200, height: Number.POSITIVE_INFINITY },
    { width: 100000.1, height: 200 },
    { width: 200, height: 100000.1 },
    { width: 'not-a-number', height: 200 },
    {},
  ];

  for (const message of invalidMessages) {
    const h = harness();
    assert.equal(h.applyWidgetPresentationSize(h.widget, message), false, JSON.stringify(message));
    assert.equal(h.widget.presentationWidth, undefined);
    assert.equal(h.widget.presentationHeight, undefined);
    assert.deepEqual(h.writes, []);
    assert.equal(h.hostStateCalls.length, 0);
  }

  for (const options of [
    { maximized: false },
    { styleRule: false },
    { styleRule: { style: null } },
  ]) {
    const h = harness(options);
    assert.equal(h.applyWidgetPresentationSize(h.widget, { width: 640, height: 400 }), false);
    assert.equal(h.widget.presentationWidth, undefined);
    assert.equal(h.widget.presentationHeight, undefined);
    assert.deepEqual(h.writes, []);
    assert.equal(h.hostStateCalls.length, 0);
  }
});
