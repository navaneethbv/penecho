# MCP availability notices

Existing toolbar, Settings and Cloud MCP enable/disable actions are retained. This change adds feedback; it does not consolidate switches or change the Cloud MCP opt-in gate.

## Behavior

- The Canvas footer and Settings status report authenticated transport readiness: `MCP · Cloud + Local online`, `MCP · Cloud online`, or `MCP · Local online`, with Chinese equivalents. Connecting is not reported as online. Active AI/session and mutation feedback remains intact.
- Cloud Settings displays the same channel status beside its existing action. Local Settings uses its existing status pill. All entry points retain their existing behavior.
- A Cloud Canvas hides the Local MCP tab unless its selected Linked Device is online. Losing that device while Local is selected returns to Cloud and restores tab focus. Presence updates do not refetch credentials.
- A local Canvas always retains both configuration tabs. Cloud configuration starts with one warning while Linked Device is offline: “Linked Device is offline. Cloud MCP cannot reach this Canvas.”
- Changing the interface language also refreshes the tab labels.

## Design mapping

The existing segmented settings control and status pill are retained. The warning uses the design catalog's Inline state / Toast warning color (`--pe-warning`, light fallback `#9a5b12`); it is an inline sentence, without an added container. Configuration retains its existing three-step hierarchy. Cloud availability is placed beside the action it describes. No switch was removed.

## Validation and UAT

- 68 focused tests passed in `mcp-cloud-transport.test.js`, `mcp-settings.test.js`, and `mcp-settings-tabs.test.js`. Coverage includes authenticated ready versus socket-open, both runtime channel mappings, device disconnect, stale offline IDs, hidden-tab keyboard handling, live selection recovery, localized labels, and shared footer/Settings status.
- Expanded existing regression suite: 229 tests, 226 passed. Three existing `ui-controls.test.js` failures remain: two `resizeImageBox` fixtures reference undefined `contentW`, and the Studio Agent toolbar CSS assertion. These same failures are documented by the preceding additive Linked Device change; this task does not change those code paths or assertions.
- Real local UI, with an isolated UAT account and no user folders: English wide; Chinese at 768 px and 480 px; product 125% interface scale at 1280 px. Final warning and tab labels were visually inspected. Affected regions have no horizontal overflow. Viewport overrides were reset.
- The UAT service acceptance helper passed five connection/ownership groups, including 16 concurrent enables, preserved credentials across Disconnect/Reconnect, latest-device takeover, prior credential rejection, and explicit reclaim. These are service checks, not browser click acceptance.
- Browser click acceptance of MCP enable and linked-device transitions is pending: automatic approval review rejected the MCP click and requires action-time confirmation. The user was asked. Do not describe the live online-footer transitions or Cloud tab presence as browser-verified yet; these are currently covered by focused tests.
- Syntax, official generated-client check, and Impeccable detector passed (no findings).
- Five reviewed Canvas files were selectively synced through `tools/sync-public-canvas.mjs`. UAT static files were updated and verified byte-for-byte over HTTP. The deployed `app.js` was rebuilt with the official generator in isolated staging, retaining the prior UAT versions of unrelated modules. Pending additive Linked Device work and Dashboard changes were not implicitly deployed. Production was untouched.

Evidence logs: `/private/tmp/penecho-mcp-status-tests.log`, `/private/tmp/penecho-mcp-status-regression.log`, `/private/tmp/penecho-mcp-status-design.json`, and `/private/tmp/penecho-mcp-status-ui.log`. The browser acceptance helper reached its ten-minute limit while approval was pending; its finally block closed the temporary server and deleted the test account, sessions and host state. The test process and listening port were verified released, and both test tabs were closed. No live-browser connection pass was recorded. A temporary fixture used a random port; this task did not start 3921.
