# MCP viewport placement verification — 2026-09-12

## Change

New page Widgets use the unobstructed live stage's width and height independently. Authored content pixels map to world coordinates through the existing Canvas zoom; no create-small-then-zoom-to-fit step remains in MCP reveal or Navigator follow. Native drawings, plots, standalone text and placed images share this mapping. Existing artifacts retain their mapping across edits and reopen. Explicit world-coordinate annotations retain their established coordinate contract.

Saved camera restoration preserves exact zoom. Text rerasterization and content patches preserve the saved world frame ratio. Widget content-size minimums are checked separately from world geometry, including width/height drag reflow.

## Browser and real MCP bridge evidence

Used an isolated local server on port 3924 and a visible browser, leaving the user's unsaved original tab intact. Executed actual MCP calls through the installed bridge and operated browser navigation, Canvas wheel zoom, undo/redo and reload.

- 50% Canvas zoom, portrait stage: page used 846 × 1451 content pixels, world frame 1692 × 2902; camera region and zoom unchanged.
- 27.4405818% Canvas zoom: mixed native text, 220 × 100 shapes, 3px connectors and a 480 × 220 Widget remained readable. Widget measured approximately 479.936 × 220.073 displayed pixels; camera zoom unchanged.
- 200% Canvas zoom: mixed Widget remained 480 × 220 screen pixels with 240 × 110 world frame. Text used 20px typography; native labels used 18px. Follow latest remained enabled.
- 700 × 900 browser: unobstructed stage 452 × 780; page content 404 × 708 and world frame 202 × 354 at 200%. Chinese text reflowed vertically and footer remained in view.
- Real MCP `draw_ink`: world width 1.5 at 200% produced a 3px red stroke. Actual Undo removed it, Redo restored it. Switching documents persisted raster tile `17,19`; after full reload and reopen both the stroke and 200% camera restored.
- Real MCP text source patch retained the 0.5 world/pixel ratio and position; updated text frame was 162.5 × 29.5 world units at 200%.

A first reload occurred while the active document was unsaved; that did not establish persistence failure. The subsequent workspace persist/reload test above passed.

## Automated checks

167 focused tests passed across mcp-canvas-runtime, mcp-primitives, mcp-text-viewport, mcp-follow-region, mcp-workspace-actions, canvas-documents and document-identity. The existing native Widget drag/chrome test also passed (168 combined).

The earlier broader 369-test run passed 367; two CSS source-contract assertions failed for the Agent toolbar in concurrently edited public/style.css (canvas-agent.test.js and ui-controls.test.js). Those unrelated changes were preserved. Impeccable detector returned no findings on the placement/native/document modules; git diff --check passed.

Implementation and browser review performed by the primary agent; delegated configurations were Astra/medium for native geometry and Luna/max for bounded regressions. Only requested model configuration was available for verification.

## Runtime scope

Client bundle rebuilt in public/app.js. Existing already-loaded pages retain old JavaScript until reload. The original user's tab was owned by another active browser task, so it was not forcibly refreshed or taken over. No remote deployment or push performed.
