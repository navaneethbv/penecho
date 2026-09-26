# Raw image upload acceptance — 2026-09-13

## Delivered contract

The new `POST /mcp/images` binary endpoint is handled by the exact same HTTPS server/listener/port as `/mcp`. It reuses host bearer authorization, private CA, host/origin validation, discovery, global request capacity and shutdown ownership. No new port or service process is introduced.

The generated portable `client.js --upload-image FILE --canvas-id C --document-id D --request-id R` sends raw file bytes with built-in Node libraries only. Existing configured Node environment and optional `--state-directory` must be retained. Server-side Sharp validates and converts the bytes. The selected authorized connection and current document must match; the upload does not create an AI conversation. The returned `penecho-asset:` source works in Widget HTML/CSS and through the existing image placement tool.

Limits: original input 32 MiB / 40 megapixels; saved output at most 2048 pixels on the long edge and 800000 bytes including the Data URL prefix. Valid small static PNG/JPEG/WebP preserve bytes; other input tries PNG encoding first and WebP compression only as needed. Larger dimensions are resized before Canvas delivery. HEIC/HEIF needs a supported server codec. Request IDs bind original bytes and filename to the specific document; unknown outcomes are not automatically replayed.

Legacy MCP Data URLs, document references, built-in attachment adapters, and `skills/penecho-mcp/scripts/upload-image.cjs` remain compatible. No replacement of a working Codex chat attachment flow is required.

## Verification

- macOS consolidated suite: 188 passed across server/client upload, direct HTTPS authentication, generated bridge, existing stdio reconnect/cancellation, MCP service, Canvas document store, legacy helper, skill invocation and desktop packaging. After catching the real Canvas 2048px boundary, the affected normalization/skill/routing suite passed 18 tests. The 37 schema/guidance/attachment-adapter/Widget checks also passed.
- Linux: isolated arm64 container from an existing local image, no network, read-only source, ephemeral /tmp. 52 upload/server/legacy tests passed. Final image-size correction plus skill command passed 17 tests. Existing containers were not modified.
- Windows: actual configured SSH host, Node v22.15.1. Image dependencies were read from the installed PenEcho 1.3.0 desktop application (Sharp 0.35.4) and extracted into the dedicated temporary test directory; installation was untouched. 37 client/server-format/legacy-helper/skill tests passed. Final size correction and skill command passed 17 tests.
- Real raster fixtures cover PNG, WebP, JPG/JPEG, GIF, TIFF, AVIF; .tif alias remains covered by the legacy helper suite. Tests check alpha, exact bytes where preserved, dimensions, MIME, hashes, client-only source paths, server conversion, generated downloaded client invocation, returned references in actual HTML/CSS resolver, wrong-document/disconnected targets, duplicate receipts, decoding-time Canvas switches, invalid formats, limits, cancellation, redaction and cleanup.
- An independent Astra/medium skill acceptance pass executed the actual generated command against the actual isolated HTTPS upload implementation and actual normalization, then exercised the actual Widget reference resolver. It identified missing custom credential-directory guidance; the skill now explicitly preserves --state-directory.
- The source generator is current. Cloud's app.js mirror was updated through tools/sync-public-canvas.mjs --only=app.js after inspecting existing mirror changes, and selective --check passed. Existing cloud-connect.js and remote-canvas.js work was preserved. The raw operation uses the existing browser channel, including linked-device routing.

## Scope and remaining release step

Tests start isolated fixtures, not an installed PenEcho application service. The installed application dependencies were checked on Windows, and desktop package allow-list/native unpacking checks passed. No installers were rebuilt or deployed, and no existing client configuration or production trust identity was replaced. Existing applications/externally copied client.js and skills need the normal version update to receive the feature. Platform tests used local sockets on each system, not a live two-machine Canvas upload.

Implementation was delegated with explicit gpt-6-astra/low requests for server and client; independent skill acceptance requested gpt-6-astra/medium. The primary agent reviewed actual diffs, corrected the Canvas size integration boundary, and ran integration/platform acceptance. Model identity beyond invocation parameters was not separately inspected.
