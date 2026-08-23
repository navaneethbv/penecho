## Dependency freshness

Run `npx npm-check-updates` before starting a new task to check for newer dependency versions.
Run it separately in the root, `tools/mobile/`, and `tools/electron/` directories, since each has its own `package.json`.
Update what is safe, and skip a major bump if it breaks the toolchain rather than forcing it through, recording why in the PR description.
`tools/electron/` pulls in a git-protocol transitive dependency (`@electron/node-gyp`); an environment that blocks git fetches cannot regenerate its lockfile, so treat a failed `npm install` there as an environment limitation, not a reason to abandon the update.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
