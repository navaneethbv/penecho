---
name: penecho-mcp
description: Create, read, or edit PenEcho canvases, including following the user's drawings and notes.
---

Use connected tools; search only missing deferred tools. Bind once with start_session; retain sessionId/documentId and stable client/sessionKey. Use target:current for the user's current Canvas.

Follow live schemas; get_guidance only for the needed topic. Keep artifact IDs. Read source/contentHash before patching. Retry uncertain writes with identical arguments/requestId. Capture when visual evidence is needed; combine final mutation and completion. Inbox reads do not acknowledge.


For file uploads, use the same client.js configured as the PenEcho stdio MCP entry. Its required installation location is `~/.penecho/mcp/client.js` on macOS/Linux or `%USERPROFILE%\.penecho\mcp\client.js` on Windows, not the skill or application directory. Do not choose another directory or filename. The PenEcho MCP entry and upload command must both use this fixed path expanded against the current user home. If the entry points elsewhere, correct it through setup before uploading. Read the configured Node executable and `--host-id` from the PenEcho MCP entry; reuse its environment and state-directory option. Run `node "ABSOLUTE_CLIENT_JS_PATH" --host-id HOST_ID --upload-image "ABSOLUTE_IMAGE_PATH" --canvas-id CANVAS_ID --document-id DOCUMENT_ID --request-id UNIQUE_ID`, substituting the configured Node executable. Obtain both IDs from start_session target:current. Follow upload_image source parameters for formats, limits and returned source usage.

`HOST_ID` identifies the PenEcho server: copy the setup prompt `hostId` or the value after `--host-id` in this Agent's MCP entry. It is not canvasId, documentId or sessionId; never guess or derive it. The client resolves the server address/port automatically through saved state and discovery, so do not inspect its source or parse port mappings. When creating this local skill during setup, record the actual server hostId and resolved fixed client.js/Node paths for subsequent uploads. Never store access tokens in the skill.
