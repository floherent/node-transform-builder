# Node Transform Builder

Scaffolding tool for building Node.js transform documents for Coherent Spark.
Combines JSONata expressions with a TypeScript handler to produce deployable `*_transform.json` files.

## Build & Test

```bash
npm run build        # prebuild (lint JSONata) + rollup + postbuild (assemble transform)
npm test             # unit tests (Jest)
npm run test:e2e     # end-to-end tests (requires TRANSFORM_MODE="Node")
npm run format       # Prettier
npm run deploy       # publish to Coherent Spark (needs CSPARK_* env vars)
```

## Key Directories

- `transforms/` — source JSONata expressions (`request.jsonata`, `response.jsonata`)
- `assets/` — fixture data and mapping document (`mapping.json`)
- `scripts/` — build utilities (lint, create-transforms, validate-mapping, publish)
- `src/` — TypeScript handler, utils, types, constants
- `dist/` — build output (gitignored)

## JSONata Rules (IMPORTANT)

- **No backticks** anywhere in expressions — they break `dist/handler.js` at runtime.
- **Comments**: only one-line `/* … */` block comments. No `//` line comments.
- The build cleans expressions: strips comments, replaces `"` with `'`, collapses whitespace.
- Expressions must be valid standalone JSONata — no JS, no template literals.

## Mapping Document

`assets/mapping.json` is the source of truth for both request and response transforms.
Validate it with `node scripts/validate-mapping.js` before authoring transforms.

## Agents & Skills

- `.claude/agents/` — `jsonata-author` (writes transforms) and `jsonata-validator` (validates transforms)
- `.claude/skills/` — shared skills: `jsonata-syntax`, `mapping-document`, `jsonata-lint`, `jsonata-testing`
- `.cursor/skills/` — same skills in Cursor format
- `.cursor/rules/` — auto-applied rules for `.jsonata` files and `mapping.json`
