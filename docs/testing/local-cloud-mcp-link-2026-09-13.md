# Local Canvas discovery through Cloud MCP — 2026-09-13

## Confirmed cause

The running UAT local host had Linked Device enabled and a saved device credential, while `cloudMcpEnabled` remained false. Its opted-in Canvas showed `MCP · Local online`. The local browser transport deliberately skips `/api/mcp/cloud-canvas` while that flag is false, so enabling the link alone could not publish the Canvas to Cloud MCP.

## Change

An explicit `enableLinkedDevice()` now enables the Cloud MCP route after the device-link operation succeeds. Browser MCP opt-in is still required: starting a host or linking an account alone does not publish closed/non-MCP canvases. A later explicit MCP disable or disconnect wins over an earlier asynchronous link operation. Saved account and device credentials are reused; existing disconnect, device replacement and separate MCP controls remain.

The change is in the canonical local `src/server/cloud-connector.js`; no Cloud subscription, billing or credit code changed. The running user process was not restarted. Its existing Cloud MCP control was enabled to restore access immediately; the new automatic link behavior loads on the next normal process restart.

## Validation

- 63 tests passed in `cloud-connector.test.js` and `mcp-cloud-transport.test.js`, including enable-only discovery state, stored credential reuse, disable-vs-link races, disconnect, replacement, route isolation and offline behavior.
- Fixed UAT acceptance used a disposable account and isolated host state. `Enable link` alone enabled Cloud MCP, an opted-in protocol Canvas appeared through public `penecho_list_canvases`, and disconnect/reconnect/replacement checks passed (six acceptance checkpoints).
- On the user's existing `http://192.168.3.158:3921/` page, the state changed from `MCP · Local online` to `MCP · Cloud + Local online`.
- The actual Cloud MCP connector discovered the Canvas and successfully ran `penecho_start_session` with `target:current`. The local page displayed the matching `Codex connection check` session. The returned upload URL was the UAT Cloud endpoint. No Canvas content was edited, and no local server was started or restarted for this check.

Logs: `/private/tmp/penecho-link-mcp-regression.log`, `/private/tmp/penecho-link-mcp-uat.log`.
