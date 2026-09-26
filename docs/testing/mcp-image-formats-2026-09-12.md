# MCP image upload validation — 2026-09-12

Scope: agent-side file preparation, stdio MCP upload protocol with a fake bridge, real schema validation, and isolated Canvas document/Widget asset tests. No running PenEcho service was started; this is not a two-machine end-to-end or browser visual test.

## Format expectations

- WebP: recommended compact general delivery; small input bytes remain unchanged, including alpha.
- PNG: recommended lossless screenshots, text/diagrams and transparency; small input bytes remain unchanged.
- JPG and JPEG: both extensions use image/jpeg; small photo input bytes remain unchanged.
- GIF, TIF/TIFF and AVIF: convert to bounded static PNG/WebP. First frame/page only.
- HEIC/HEIF: conditional codec support, not universally available. This machine's Sharp 0.35.4 / libheif 1.23.2 has no HEVC decoder. Direct runtime probe of the bundled dylib's heif_have_decoder_for_format returned false for HEVC (1), true for AV1 (4). Sharp HEVC fixture encoding also returned Unsupported compression. A macOS sips HEIC fixture attempt failed with error 13; no HEIC image decode success is claimed. Export such input to PNG/JPEG/WebP with an available decoder first.

## Reference and storage checks

Seven targeted canvas-documents tests passed: attachment hashing/deduplication and persistence across save/reopen under four crypto configurations; same-document assets/index.json discovery; cross-document rejection; image placement with aspect ratio; background Widget hydration; idempotent upload receipts.

Two widget-image-assets tests passed: HTML img and CSS url resolution while preserving authored references, missing/invalid source rejection, and bounded expansion.

Upload helper tests additionally check actual raster decoding, content hashes, MIME/name consistency, output Data URL bounds, malformed inputs, input size/pixel caps, document binding and child-process cleanup. Bridge responses are simulated; they do not establish actual network delivery or browser rendering.

## Final test run

`node --test test/mcp-upload-helper.test.js test/mcp-schema.test.js`: 30 passed. The helper's 13 cases include real PNG, WebP, .jpg, .jpeg, GIF, .tif, .tiff, AVIF inputs. PNG/WebP alpha and all four recommended-format input bytes are preserved below the upload limit. Decoded dimensions, SHA-256, MIME, filenames and outgoing MCP Data URLs are asserted. Combined with the seven document cases and two Widget resolver cases above, 39 checks passed in this validation.

Test addition was delegated with requested model gpt-5.6-luna / max; primary agent reviewed the actual diff and reran the suite. Model identity beyond invocation parameters was not independently inspected.
