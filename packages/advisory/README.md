# @designops/advisory

A **vendored, read-only** design-intelligence catalogue with an offline BM25
search: 79 UI styles, 192 product palettes, 74 font pairings, 119 UX
guidelines, 105 icons, 25 chart types, 17 GSAP motion presets and 22 stacks.

It is consulted through [`tools/advisory.mjs`](../../tools/advisory.mjs) at the
repo root, or directly:

```bash
python3 packages/advisory/scripts/search.py "dark fintech dashboard" --domain style
python3 packages/advisory/scripts/search.py "fintech dashboard" --design-system --json
python3 packages/advisory/scripts/search.py "form validation errors" --domain ux
python3 packages/advisory/scripts/search.py "server components" --stack nextjs
```

Requires **Python 3.x, standard library only.** No install step, no network.

## What it is for

Answering _"what should this look like?"_ — style, palette, typography, UX
guidance, stack conventions — before any code exists.

## What it is not

It is **advisory**. It has no opinion about _your_ project and cannot see it.
Nothing here is enforced, and nothing here is allowed to write to
[`tokens/tokens.json`](../../tokens/tokens.json):

- **Tokens** ([`tokens/tokens.json`](../../tokens/tokens.json)) are the source
  of truth. A recommendation becomes tokens only as a **proposal** a human
  approves — `node tools/advisory.mjs propose "…"` writes to
  `tokens/proposals/`, never to `tokens/tokens.json`.
- **`@designops/lint`** decides whether the code matches the system. The
  advisory never gets the last word; the linter does.

## Checks

```bash
pnpm --filter @designops/advisory run verify:data   # data contracts
pnpm --filter @designops/advisory run test          # 116 unit tests
```

Both run in CI. See [`VENDOR.md`](./VENDOR.md) for provenance, the upstream
commit this was copied from, and how to refresh it.
