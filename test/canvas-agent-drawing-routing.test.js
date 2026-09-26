'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { NATIVE_DRAWING_ROUTING, CANVAS_RENDERING_ROUTING, VISUAL_EXPLORER_SELECTION, getAuthoringGuidance } = require('../src/server/mcp/authoring-guidance.js');
const { WORKSPACE_INSTRUCTIONS } = require('../src/server/mcp/guidance.js');

test('Agent and external MCP share the whole-figure pen limit and complex Widget route', async () => {
  const { DOCUMENT_TOOL_INSTRUCTIONS } = await import('../src/server/canvas-agent/document-tools.mjs');
  for (const instructions of [DOCUMENT_TOOL_INSTRUCTIONS, WORKSPACE_INSTRUCTIONS,
    getAuthoringGuidance('visual-explorer').document, getAuthoringGuidance('general-html', 'full').document]) {
    assert.ok(instructions.includes(CANVAS_RENDERING_ROUTING));
    assert.equal(instructions.split(NATIVE_DRAWING_ROUTING).length - 1, 1);
    assert.ok(instructions.indexOf(VISUAL_EXPLORER_SELECTION) < instructions.indexOf(NATIVE_DRAWING_ROUTING));
    assert.match(instructions, /at most 10 strokes or primitive marks in total/);
    assert.match(instructions, /action="draw_ink"/);
    assert.match(instructions, /must use one HTML Widget through penecho_present_widget/);
    assert.match(instructions, /Count the whole figure, not each tool call/);
    assert.match(instructions, /do not split a complex diagram across batches/);
    assert.match(instructions, /Explicit user implementation constraints take precedence/);
    assert.match(instructions, /do not silently simplify required content or change format/);
  }
});

test('drawing guidance preserves Visual Explorer, small annotations, plots and source-only boundaries', () => {
  const requiredBoundaries = [
    /Apply the established task routing first/,
    /only selects native drawing versus a Widget for standalone new drawing requests/,
    /never replaces a selected Visual Explorer with native marks, even when its illustration needs fewer than 10 strokes/,
    /A few short labels alone do not force a Widget/,
    /follow visual-explorer guidance for explanation-first results and general-html for ordinary HTML tools or interaction-first results/,
    /does not convert existing Canvas objects or Widgets/,
    /constrain small edits\/annotations to an existing complex figure/,
    /change bare function graphs from penecho_plot/,
    /require Canvas output for source-only requests/,
  ];
  for (const boundary of requiredBoundaries) assert.match(NATIVE_DRAWING_ROUTING, boundary);
});
