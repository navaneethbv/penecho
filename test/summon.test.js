"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const SUMMON = require("../public/summon.js");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("spatial echo projects the active canvas region into viewport coordinates", () => {
  assert.deepEqual(
    SUMMON.projectRegion({ x:120, y:80, w:300, h:140 }, { scale:1.5, panX:-40, panY:25 }),
    { x:140, y:145, w:450, h:210 },
  );
  assert.equal(SUMMON.projectRegion(null, { scale:1 }), null);
  assert.equal(SUMMON.normalizeRegion({ x:0, y:0, w:0, h:10 }), null);
});

test("spatial echo surrounds the current region and places one status line below it", () => {
  const region = { x:260, y:180, w:430, h:190 },
    layout = SUMMON.echoLayout(region, { width:1100, height:760 });
  assert.equal(layout.fallback, false);
  assert.ok(layout.outer.x < region.x);
  assert.ok(layout.outer.y < region.y);
  assert.ok(layout.outer.x + layout.outer.w > region.x + region.w);
  assert.ok(layout.outer.y + layout.outer.h > region.y + region.h);
  assert.ok(layout.inner.x > layout.outer.x && layout.inner.y > layout.outer.y);
  assert.ok(layout.inner.x + layout.inner.w < layout.outer.x + layout.outer.w);
  assert.ok(layout.status.y > layout.outer.y + layout.outer.h);
  assert.ok(layout.status.x - layout.status.w / 2 >= 0);
  assert.ok(layout.status.x + layout.status.w / 2 <= 1100);
});

test("spatial echo remains usable at viewport edges and without an input anchor", () => {
  const nearBottom = SUMMON.echoLayout({ x:120, y:510, w:500, h:180 }, { width:820, height:700 }),
    fallback = SUMMON.echoLayout(null, { width:820, height:700 });
  assert.ok(nearBottom.status.y < nearBottom.outer.y, "status moves above only when there is no room below");
  assert.ok(nearBottom.outer.x >= 0 && nearBottom.outer.y >= 0);
  assert.ok(nearBottom.outer.x + nearBottom.outer.w <= 820);
  assert.ok(nearBottom.outer.y + nearBottom.outer.h <= 700);
  assert.equal(fallback.fallback, true);
  assert.ok(fallback.outer.w >= 180 && fallback.outer.h >= 110);
});

test("the two organic contours are deterministic, smooth, and distinct", () => {
  const rect = { x:80, y:60, w:640, h:300 },
    outer = SUMMON.buildEchoContour(rect, "outer"),
    inner = SUMMON.buildEchoContour({ x:102, y:82, w:596, h:256 }, "inner");
  assert.ok(outer.length >= SUMMON.THINKING_LAYOUT.samples);
  assert.ok(inner.length >= SUMMON.THINKING_LAYOUT.samples);
  assert.ok(outer.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)));
  assert.deepEqual(SUMMON.buildEchoContour(rect, "outer"), outer);
  assert.notDeepEqual(inner, outer);
  const longestStep = Math.max(...outer.map((point, index) => {
    const next = outer[(index + 1) % outer.length];
    return Math.hypot(next.x - point.x, next.y - point.y);
  }));
  assert.ok(longestStep < 50, `contour segment ${longestStep} should remain visually smooth`);
});

test("the request lifetime drives one restrained spatial echo with reduced-motion support", () => {
  const html = read("public/index.html"),
    css = read("public/style.css"),
    source = read("public/summon.js"),
    core = read("src/client/app/core.js"),
    bootstrap = read("src/client/app/ui-bootstrap.js"),
    summon = html.indexOf('id="summonLayer"'),
    ink = html.indexOf('id="inkLayer"');
  assert.match(html, /<canvas id="summonLayer" class="summon-layer" hidden aria-hidden="true"><\/canvas>/);
  assert.ok(summon >= 0 && summon < ink, "the echo must remain behind ink and widgets");
  assert.match(source, /dataset\.effect = "spatial-echo"/);
  assert.match(source, /drawLightSweep\(ctx, model\.outline, outer, elapsed, getReducedMotion\(\), tint, fade\)/);
  assert.match(source, /reducedMotion \? 1 : easeOutCubic/);
  assert.match(source, /progress = reducedMotion \? 0\.5 :/);
  assert.match(source, /t\("summonUnderstanding"\)/);
  assert.doesNotMatch(source, /LOADER_TYPES|PHRASE_KEYS|TIP_KEYS|setInterval|createRadialGradient|shadowBlur|hsla\(/);
  assert.match(css, /AI thinking: a spatial echo around the current input region/);
  assert.match(css, /\.summon-caption\s*\{[^}]*var\(--summon-accent[^}]*font-family:\s*var\(--pe-font-ui[^}]*animation:\s*summonStatusIn/);
  assert.doesNotMatch(css, /font-family:\s*ui-rounded/);
  assert.doesNotMatch(css, /\.summon-hint|summonBlueGlow|summonTipIn/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*?\.summon-caption\s*\{[^}]*animation:\s*none/);
  assert.match(core, /getReducedMotion:\s*\(\)\s*=>\s*Boolean\(window\.matchMedia/);
  assert.match(core, /function showSummon\(\) \{[\s\S]*?summonFX\.show\(state\.summonAnchor\)/);
  assert.doesNotMatch(core, /chooseThinkingPlacement|summonScreenBlockers|summonControlBlockers/);
  assert.doesNotMatch(html, /summonEffectList|data-effect=|fx-preview/);
  assert.doesNotMatch(core, /summonEffect|setSummonEffect|previewSummon/);
  assert.doesNotMatch(bootstrap, /summon-effect-option|setSummonEffect|previewSummon/);
});

test("the top-right control keeps one active ring and no floating understanding card or font is added", () => {
  const html = read("public/index.html"),
    css = read("public/style.css"),
    source = read("public/summon.js"),
    core = read("src/client/app/core.js"),
    zh = read("public/locales/zh.js");
  assert.match(html, /id="aiOrb"[\s\S]*?class="ai-stop-icon"/);
  assert.match(core, /state\.busy \? t\("stopAIRequest"\) : t\("triggerAutoAI"\)/);
  assert.match(css, /@property --ai-orb-ring-angle[\s\S]*?body\[data-theme="studio"\] \.ai-embodiment\.working::before\s*\{[^}]*conic-gradient[^}]*ai-orb-ring-spin/);
  assert.doesNotMatch(css, /body\[data-theme="studio"\] \.ai-embodiment::before\s*\{/);
  assert.doesNotMatch(html, /understanding-card|summon-status-card/);
  assert.match(core, /summonUnderstanding:\s*"Understanding this part of the canvas\.\.\."/);
  assert.match(zh, /summonUnderstanding:\s*"正在理解这片内容…"/);
  assert.doesNotMatch(`${source}\n${css}`, /@font-face|\.woff2?|\.ttf|\.otf/);
});
