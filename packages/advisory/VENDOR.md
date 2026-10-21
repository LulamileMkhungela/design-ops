# Vendored advisory catalogue

`packages/advisory` is a **vendored copy** of the design-intelligence layer of
[`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill),
not a fork and not a reimplementation.

|                     |                                                                                                                                                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upstream repository | `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`                                                                                                                                                                                      |
| Upstream commit     | `1a2c459b35f26116fd165b0a0f30597f252749ff` (2026-10-08)                                                                                                                                                                                        |
| Upstream path       | `src/ui-ux-pro-max/` (`scripts/`, `data/`)                                                                                                                                                                                                     |
| Upstream licence    | MIT © 2024 Next Level Builder — see [`LICENSE.vendored.md`](./LICENSE.vendored.md)                                                                                                                                                             |
| Why vendored        | It is the curated advisory catalogue (styles, palettes, typography, UX guidelines, icons, charts, stacks) and the stdlib BM25 search that makes it queryable. Without it, an agent asked to design has no local source of design intelligence. |

## What was taken

- `scripts/core.py` — BM25 search, domain detection, stack search.
- `scripts/search.py` — the CLI (`--domain`, `--stack`, `--design-system`, `--json`).
- `scripts/design_system.py` — aggregates style + colour + typography + reasoning
  into one design-system recommendation.
- `scripts/reasoning_contract.py` — decision-rule parsing and application.
- `scripts/validate_data.py` — offline data-contract validation.
- `scripts/tests/` — the upstream unit tests that do not depend on files outside
  the vendored tree.
- `data/` — the full catalogue (CSVs, `stacks/`, provenance and summary files).

## What was deliberately left out

The rest of the upstream repository:

- **The agent skills and plugin manifests** (`.claude/skills/*`,
  `.claude-plugin/`, `cli/assets/skills/`). DesignOps ships its own skill in
  [`skills/design-ops/`](../../skills/design-ops/SKILL.md) and does not install
  a Claude Code plugin.
- **The other six upstream skills** (`design`, `design-system`, `brand`,
  `banner-design`, `slides`, `ui-styling`). They cover logo generation, slide
  decks, banners and brand-identity programmes, which are off-mission for a
  design-system pipeline.
- **The upstream CLI, gallery, preview and example projects.** The CLI only
  installs skills into agent configs; `tools/advisory.mjs` replaces it here.
- **Upstream's catalog-refresh tooling** (`scripts/refresh-google-fonts.py`,
  `scripts/refresh-icon-catalog.py`, `scripts/generate-catalog-summary.py` and
  the relevance evaluator). These live at the upstream repo root, hit the
  network, and maintain _their_ release process. The two tests that guard them
  (`test_catalog_refresh.py`, `test_catalog_summary_line_endings.py`) were
  therefore not vendored either.

## Local adaptations

The vendored code is kept byte-identical to upstream. Only the layout differs,
because the catalogue moved from `src/ui-ux-pro-max/` to `packages/advisory/`:

- `core.py` resolves `DATA_DIR` as `Path(__file__).parent.parent / "data"`, so
  the catalogue resolves correctly in either layout with no edit.
- The vendored tests anchor on `Path(__file__).resolve().parent.parent`, which
  is `packages/advisory/scripts` here.

No source file has been modified. If you need to patch one, record it in this
file with the reason.

## Keeping it fresh

```bash
pnpm advisory:check   # validate_data.py + the vendored unit tests
```

The catalogue is deliberately static: it is read-only data and the search is
offline, so a bump is a review step, not a dependency update. Refresh by
re-copying from a newer upstream commit and recording the new commit hash in
the table above. Vendor only `src/ui-ux-pro-max/{scripts,data}` — see the
exclusions above.

## Provenance inside the data

`data/data-provenance.json` records, per record, where the value came from and
its review status; `data/catalog-summary.json` records the snapshot hashes.
`validate_data.py` is the offline contract check over both.
