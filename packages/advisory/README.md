# @designops/advisory

Offline, read-only design reference catalogue with BM25 search: UI styles, palettes, font pairings, UX guidance, icons, charts, motion presets and framework stacks.

Requires Python 3; uses the standard library only. No installation or network access is required.

## Search

Run through `tools/advisory.mjs` or call the Python search tool directly:

```bash
python3 packages/advisory/scripts/search.py "dark fintech dashboard" --domain style
python3 packages/advisory/scripts/search.py "fintech dashboard" --design-system --json
python3 packages/advisory/scripts/search.py "form validation errors" --domain ux
python3 packages/advisory/scripts/search.py "server components" --stack nextjs
```

## Token proposals

The catalogue does not inspect or enforce a project's design system. `tools/advisory.mjs propose` writes proposals to `tokens/proposals/`; it never writes `tokens/tokens.json`. Review proposals before promotion. The linter remains the enforcement layer.

## Checks

```bash
pnpm --filter @designops/advisory run verify:data
pnpm --filter @designops/advisory run test
```

See [`VENDOR.md`](./VENDOR.md) for source, licence and refresh procedure.
