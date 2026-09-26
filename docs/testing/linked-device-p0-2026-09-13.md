# Linked Device P0 repair — 2026-09-13

Implementation is local only; no deployment, remote push, credential change or paid model call was performed. Existing unrelated worktree changes were preserved.

## Behavior

- Connection selection is scoped by Cloud origin, account, runtime and the Canvas-pinned device. Hosted choices have their own account/runtime scope. Local direct choices retain a local-origin scope.
- A legacy UUID is migrated only after catalog membership is verified. Cloud does not substitute another device's default model when a selection disappears. Settings/catalog responses are fenced by owner scope, and saved Agent resume credentials require a matching scope.
- Agent handshakes validate the selected connection against the target catalog. A correlated `CONNECTION_STALE` handshake rejection can refresh and retry once, keeping the same choice. Missing choices preserve the draft and expose the existing connection picker. Network/turn failures never enter this retry path.
- Preflight is fenced by conversation/session generation and selection scope. A Canvas, account or device change cannot complete an obsolete handshake.
- New Cloud hello advertises `capabilitiesAck:true`. Updated hosts remain Connecting until the current device/socket receives `capabilities_ack`; the existing hello deadline also bounds acknowledgement. Timeout reconnects with existing credentials. Hosts retain legacy hello behavior when connected to an older Cloud without this advertisement.
- Cloud capabilities use per-connection Redis tokens. Replacement and disconnect cannot reuse stale capabilities. Forwarding before registration returns recoverable `device_connecting`; forwarding while acknowledgement is pending is bounded and cannot precede the ack on the host socket. Expired requests cannot forward after a late ack.
- Cloud Agent availability requires ready plus `canvasAgent`. Browser status follows ready, clears on relevant transport failures, and refreshes pending capability registration without blocking Cloud document opening. After the brief readiness window, browser recovery continues without a retry-count limit using the host policy (three waits around 10 seconds, five around one minute, then waits around five minutes, each with 20% jitter). Recovery resets backoff; page exit or authorization failure stops background retries. Canvas device pinning is preserved.

## Verification

- Final Canvas/host focused suite: 214 passed, 0 failed. Includes selection, stale handshake, readiness, connector, hosted protocol, availability, identity, error, remote gate and Cloud controls tests.
- Final Cloud relay/remote/provider suite: 73 passed, 0 failed. Covers same-name/different-UUID selection on client; same-instance and cross-instance socket replacement; capabilities persistence/ack races; early settings requests; timeout and disconnect.
- Hosted runtime mirror, adapter, Agent and failure-trace tests: 18 passed, 0 failed.
- Broader earlier Canvas Agent regression: 477/478 passed. Existing `public/style.css` worktree changes to Agent panel material conflict with the old assertion in `test/canvas-agent-activity.test.js`; this repair does not alter that CSS or weaken that assertion.
- Isolated Chromium rendering with mocked network: English wide, Chinese narrow, and 2x-scale equivalent viewport. No page exceptions in the final pass; draft retained and actionable recovery text visible. No PenEcho application service was started. The browser was closed after verification.
- Client generator/check, syntax and diff checks passed. Impeccable detector reported no findings for the changed interaction files.
- Reviewed selective sync/check passed for public Canvas app, remote bridge, Cloud controls and Chinese locale, plus shared Agent router/peer/runtime. Existing unrelated mirrors were preserved.

## Release boundary

Deploy the Cloud readiness protocol and matching browser assets before rolling out the updated host build. Old hosts that already send capabilities are accepted by the new Cloud. New browser ready gating requires the new Cloud status contract; do not deploy the browser files alone to an old server. Mixed old/new Cloud relay instances need a coordinated rollout because old instances do not publish the per-connection readiness token.

These changes address connection identity and readiness correctness. Cloudflare tunnel reliability, UAT container restarts, and the product decision for explicit device takeover remain separate work. Actual Mac/Windows and edge-network UAT acceptance remains a deployment-stage check.

## Follow-up: persistent reconnect

Confirmed host retry has no attempt limit. Added persistent browser status recovery and offline backoff, retaining the pinned device and never replaying model turns. Follow-up checks: 3 targeted host reconnect tests and 47 browser retry/gate tests passed, including 25 consecutive failures, bounded jitter, recovery reset and pin preservation. Selective Cloud mirror sync/check passed. Still local only.
