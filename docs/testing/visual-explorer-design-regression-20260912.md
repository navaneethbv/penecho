# Visual Explorer design contract regression — 2026-09-12

Baseline: PenEcho 1.2.0, commit `84d4f8d`. Comparison is against the source before this repair, `8b478e4`.

## Confirmed difference

The canonical design body in `src/server/canvas-agent/visual-explorer-contract.md`, from “Do not start from visual decoration.” to the invocation section, is unchanged from 1.2.0: 8,398 characters, SHA-256 `569b4a973d4efb4a39a6ca07338693fcbc9d899a16fa83d2f8831c8c27703d69`.

However, 1.2.0 injected the full contract into the initial Agent context. The shared tool implementation changed this to on-demand guidance, with default `brief`. That independently written brief omitted the full design body and explicitly allowed ordinary HTML/SVG explanations to proceed without full guidance. The recent second failed travel-map request read `visual-explorer` with `detail:brief` (see the separate output-limit report). Preserving the source file therefore did not preserve the requirements actually supplied to the model.

| Requirement | 1.2.0 contract | Previous default brief |
|---|---|---|
| Information structure | Layered overview, relationships and detailed panels, adapted to task | Clear title, short explanation, one meaningful visual |
| Reading depth | 3–5 seconds / 30 seconds / 3 minutes | No equivalent layered requirement |
| Typography | Coordinated family, scale, weight, line height and casing across regions | Readable normal CSS type |
| Visual style | Modular analytical infographic, crisp professional technical figure | Generic restrained visual advice |
| Concision | Explicit criteria and full-mode exceptions | Smallest useful format as the general direction |

This is a confirmed prompt regression and a plausible material contributor to weaker results. No same-model, same-request rendered A/B experiment has been completed in this repair, so the exact contribution to an individual picture is not established. Model behavior, output budget and rendering size can also affect output; this report does not assign them causal shares.

## Repair and tradeoff

Default and explicit `brief` Visual Explorer reads now return the same complete canonical design guidance as `full`. The independent abbreviated design document was removed. Shared routing requires the guidance before Visual Explorer authoring unless already present in context. Agent and MCP share this implementation. The Cloud mirror was updated through its official scoped sync.

Loading remains on demand, unlike 1.2.0 initial injection. One read supplies all design requirements; no brief-then-full follow-up is needed. This does not remove the potential first guidance round trip relative to 1.2.0. The response grows from 4,250 to 14,285 JavaScript string characters (not measured model tokens), including current routing and delivery instructions. This repair prioritizes restoring the design contract; it does not claim a speedup. Current source-patching, geometry preservation, combined capture and schema fixes remain in place.

## Validation and remaining acceptance

- Local guidance, public event and schema suites: 20 passed.
- The new regression test executes the actual built-in Agent tool and MCP stdio handlers with both omitted detail and explicit brief; both deliver the full document and its correct hash without Canvas discovery.
- Cloud mirror provenance and runtime import suites: 2 passed.
- Historical design-body comparison: byte-identical.
- No new real-model rendered comparison, desktop package, installation or deployment was performed for this repair. Existing installed applications do not acquire this source change automatically. Visual quality acceptance remains outstanding.

## Follow-up: restore 1.2.0 initial delivery

At the user's explicit request to restore the 1.2.0 requirements, the built-in Agent now includes the complete shared Visual Explorer contract in its first system prompt at order 120, matching the historical loading point. It no longer needs a preliminary guidance read for this contract. MCP still serves the same complete contract through its prompt/guidance entry points. Restored the final composition-wide typography review requirement; current tool names, source patching, live geometry preservation and other current protocol fixes are retained rather than advertising obsolete 1.2.0 tool arguments.

The new Harness integration test captures the actual first model-bound request (using a stub CLI, not a live model), verifies that the full contract appears exactly once, and checks that current tools remain advertised. Targeted tests: 15 passed; existing Agent suite: 88 passed; Cloud mirror/import tests: 2 passed. No visual-quality A/B or desktop rebuild was performed in this follow-up.

These changes require the executing PenEcho runtime to be updated and restarted; they do not change skill files, MCP connection addresses, credentials or client launch configuration. Restart persistent MCP/client processes and test in a new Agent conversation to avoid retained old context. Source commits and Cloud mirror sync are not an installed-app update or deployment.

## Follow-up: canonical selection conditions

The shared selection text now comes directly from the canonical 1.2.0 paragraph (verified identical to commit 84d4f8d), with only the obsolete native plot invocation replaced by `penecho_plot`. This restores the explicit default even without an infographic request, the concrete examples, and the exclusions for existing-element edits and interaction/simulation/live-data/ordinary-HTML deliverables. Agent and MCP share this text. Sixteen targeted tests pass, including first-request injection and exact selection-paragraph coverage. This remains a source change, not an installed-app update.
