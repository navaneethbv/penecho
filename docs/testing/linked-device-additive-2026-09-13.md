# Additive Linked Device capabilities

Cloud-native Canvas editing now keeps Cloud models and Cloud Library available while adding the online, account-owned Linked Device's connections and Server Library. The device remains pinned for the page lifetime; a different device returned by a later status query does not silently replace it.

## Behavior

- Browser editing and device availability are independent. Settings requests and Server Library requests use the selected device relay; Cloud library requests stay on Cloud.
- AI connections show hosted and device connections together. The existing Agent selects its Cloud or device WebSocket by connection. Local auxiliary command requests carry their connection ID through both relay boundaries.
- Missing, invalid, or offline devices leave Cloud capabilities available. Offline settings explain recovery rather than reporting an empty local configuration or asking to link again. Cached local connection controls become disabled, and the selected connection is retained rather than silently replaced.
- Settings Refresh, Agent opening, and Server Library reads refresh the device state through a shared in-flight status request with an 8-second timeout. No polling loop was added. An explicit device-offline relay error revokes device capability until recovery.
- Saving an existing Canvas retains its current storage location, including Server; an unsaved Cloud-browser Canvas defaults to Cloud. Device loss does not silently change its storage owner.
- The Cloud and host allowlists admit the reviewed AI POST routes and scoped settings writes. Explicit unknown connection IDs are rejected instead of falling back to the first connection. API credentials remain in the device's connection store.

## Design-source map

Existing Settings content and connection rows retain the `penecho-design-language.html` Settings examples and settings-list pattern. Only availability, localized status, and actions change. Library retains its existing source navigation and library-manager layout; no new appearance rules or containers were introduced.

## Validation

- 071 focused and expanded tests: 364 tests, 361 passed. The 3 remaining failures were reproduced against the pre-change Cloud Canvas mirror: two `resizeImageBox` fixture failures (`contentW` undefined), and the existing Studio Agent toolbar CSS assertion.
- Cloud `test/remote-canvas.test.mjs`: 9 passed, including account-owned device pinning, connection validation, and request forwarding.
- Generated client check, selective Cloud mirror check, syntax check, and scoped diff checks passed. The Impeccable detector returned no findings for touched UI source files.
- Isolated Chromium loaded the actual generated client/HTML/CSS with fixture APIs, without starting a PenEcho server or accessing a real account. Wide English, narrow Chinese, and a 480 CSS px compact viewport showed both model groups and enabled Manage, with no overflow in the affected regions. Actual Server and Cloud Library source controls each loaded their own fixture Canvas. No browser page errors were recorded.
- Browser evidence: `/tmp/penecho-linked-acceptance/report.json` and screenshots in that directory. This is a Chromium fixture check, not a real-account Linked Device or Electron 200% zoom acceptance run.

## Delivery limits

Changes are local to the 071 and Cloud repositories. `app.js`, `remote-canvas.js`, and `locales/zh.js` were synchronized using the official selective generator, preserving existing unrelated work. No deployment or real service restart was performed. Production acceptance requires the updated Cloud code and updated device runtime.

The existing HTTP relay returns buffered JSON, not NDJSON progress; the main Agent continues using its WebSocket. The existing Cloud plugin-improvement endpoint retains its prior device-based behavior; this change does not add hosted plugin improvement.

## Deployment follow-up: status disagreement

Compared pre-Link connector HEAD with current implementation. WebSocket opening,
hello and heartbeat mechanics were retained. A new close-code4001 terminal path
incorrectly erased credentials on ordinary socket replacement; restored the
previous reconnect policy, keeping4003 as terminal revocation. Real WebSocket
regression verifies credential preservation and a second authenticated hello.

The local Cloud dialog refreshed its cached status on open but redrew only when
account sign-in changed. It also stopped watching after first connection. Device
state changes now redraw independently of account changes; the existing watch
runs only while the Device panel is visible, skips unchanged rendering, and
stops when closed/hidden/another section is selected. Failed status reads retain
the account but show Status unavailable instead of stale Connected.

Cloud Devices already refreshes every5seconds. Quiet refresh failure now clears
stale Online badges, and request sequencing prevents an older failure replacing
a newer success. Same-data recovery redraws correctly. Officially synced only
cloud-connect.js after comparing the Cloud mirror.

Runtime read-only evidence: deployed UAT has the additive remote-canvas script.
Local connector logged repeated1006 closures and a handshake timeout, then a
successful hello at2026-09-13T09:43:01Z. Cloudflare Tunnel logs at09:33–09:43Z
contain QUIC no-recent-network-activity timeouts and abruptly ended Canvas and
connection HTTP requests. These1006 incidents do not execute the4001 regression.
A new local browser page loaded the corrected client and displayed Connected.
No user host process was restarted and no deployment was executed for this patch.

Validation: Cloud Connect UI80/80; Cloud dashboard status/home8/8. Connector full
suite53/54 including both modified close-code lifecycle tests; one unrelated
source-regex assertion against legacy-server.js at the AI loopback boundary
remains failing. Narrow/zoom visual acceptance for new unavailable labels and
post-deployment end-to-end relay acceptance remain pending.

## Library gateway failure UI

Design source map: Library shell -> penecho-design-language.html Canvas Library
manager example; recoverable failure -> Empty / Loading / Error and Modal list
empty examples. One explanation and one Retry action belong to the content
region. Grid loading/error states span all columns. Empty/unknown results do
not inherit another location's count or display a fabricated zero.

Fixed failure path to end and hide the loading activity after request settlement,
render one full-width error state, preserve previously loaded same-location
items when available, and retry the exact current location. Switching location
immediately updates the header even when its request fails. Error state survives
ordinary list rerenders until retry. Generated app.js and copied app.js,
style.css and locales/zh.js through the official Cloud sync.

Isolated browser fixture intercepted every request and injected502 for Server
while Cloud remained successful. Wide English1440px, Chinese720px and480px
zoom-proxy checks show one error, no active loading overlay, correct Server
heading, no measured overflow, and successful retry after restoring the mock
service. Screenshots/report: /tmp/penecho-library-error-acceptance/. This is
layout and failure-path evidence, not proof that live UAT transport is repaired.
Targeted Library state tests11/11 passed. Combined ui-controls and Library suite
124/127 passed; the remaining3 are the previously reported unrelated image,
widget validation and Studio CSS assertions.
