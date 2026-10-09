# Changelog

All notable changes to the DesignOps system are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

> Component-level version history lives inside the dashboard
> (**Components → 🕘 History** on any card). This file tracks the system
> as a whole.

## [Unreleased]

DesignOps now verifies, not just ships — the dashboard gains a ninth
view backed by a real lint engine. It also answers the question that
comes before verification: _what should this look like?_

### Added

- **@designops/advisory** (`packages/advisory`) — a vendored
  design-intelligence catalogue: 79 searchable styles, 192 product
  palettes, 74 font pairings, 119 UX guidelines, 105 icons, 25 chart
  types, 22 stacks and 17 GSAP motion presets, with an offline BM25
  search (Python 3, standard library only). Vendored from
  `nextlevelbuilder/ui-ux-pro-max-skill@1a2c459` (MIT); provenance,
  exclusions and the refresh procedure are in `packages/advisory/VENDOR.md`.
- **Advisory bridge** (`tools/advisory.mjs`) — `search`, `propose` and
  `check`. `propose` turns a design direction into a W3C DTCG token
  proposal in `tokens/proposals/`, with a provenance mapping
  (advisory / derived / inherited), seven WCAG contrast checks, and a
  record of the advisory fields that became no token.
- **Agent skill** (`skills/design-ops/SKILL.md`) — the whole loop as a
  workflow an agent can follow: advise → tokenize → build → verify, plus
  the query contract and the rule that the linter outranks the catalogue.
- **Advisory dashboard view** and `/api/advisory`, so the catalogue is
  queryable from the dashboard as well as the terminal.
- **Demo site generator** (`tools/demo-build.mjs`) — turns an advisory query
  into a real, viewable website built entirely from the proposed tokens, and
  then lints it. The markup is emitted twice from the same template, once as
  `index.html` and once as JSX for `@designops/lint`, so the page you open is
  the page that was checked.
- **Demo gallery — forty sites, twenty categories.** Two demos for every
  category in our set: SaaS, Education,
  Pet Services, AI/Chatbot, E-commerce, Fintech/Crypto, Healthcare,
  Creative, Real Estate, Gaming, Food & Restaurant, Fitness, Travel,
  NFT/Web3, Beauty/Spa, Developer Tools, Entertainment, Legal, Events and
  Other. Each has its own palette and font pairing, each at 0 lint findings,
  each showing its measured contrast.
- **Component showcase** (`tools/demo-components.mjs`) — every generated
  page now carries a Components section rendering all eight DesignOps
  components (button, input, badge, card, alert, avatar, data table, toast)
  with every variant, using that page's own tokens. The generator was
  restructured to do this: content moved to `tools/demo-content.mjs`
  (40 entries of real copy, two per category, each pair given a distinct
  style direction so they do not collapse into the same look).
- **Gallery filters** — category chips, Light/Dark mode chips and a
  clickable palette row for narrowing the grid, with a "Showing N of 40
  demos" count line.
- **Demos are now built from the components.** The first pass bolted a
  component showcase onto a page whose sections were hand-written class
  strings, so the components sat in an appendix below the fold and were
  invisible in the gallery thumbnails. The page sections are now composed
  from parameterised primitives in `tools/demo-components.mjs`: the nav
  uses `button()`, the hero uses `badge()` + `input()` + `button()` +
  `avatarGroup()`, features and pricing use `card()`, the story uses
  `card()` + `avatar()`, plus an `alert()` banner and a `dataTable()`
  section. Five of the eight components are in the first viewport.
- Gallery previews enlarged (0.185 → 0.22 scale, 168px → 200px tall) and
  each card gained a "Components ↗" link that opens the demo at
  `#components`.
- **Demo previews now fit their card.** The preview renders the page at a
  virtual 1400x900 and scales it down, but the scale was hard-coded to
  0.22 — a fixed 308px image inside a card that is ~540px wide at two
  columns, so it either left dead space or clipped on narrow cards.
  `fitDemoShots()` in assets/app.js measures each card and sets the scale
  so the page fits the width exactly, with the height following the
  aspect ratio. Re-fits on resize and after the filters change the grid.
- **`--font-mono`** — the advisory proposes a heading/body pairing and no
  tabular face, so the generator adds one (JetBrains Mono). Declared in the
  theme, counted in the 44 tokens, requested from Google Fonts.
- **Known naming collision, documented:** the DesignOps surface scale is
  `color.neutral.*`, which shadows Tailwind's built-in `neutral` ramp. It
  resolves correctly because the theme declares every `--color-neutral-*`
  used, but a stray `neutral-500` would silently fall through to Tailwind's
  grey. See `tools/demo-build.test.mjs`.
- Root `README.md` — previously a stub, while nine docs deep-linked into
  `#get-started` and `#settings`.

### Changed

- `tools/demo-build.mjs --all` now rebuilds the whole catalogue; `--category=<name>`
  rebuilds one. A bare query still generates a single site.
- `buildThemeCss()` emits any `typography.family.*` key rather than only the
  hard-coded heading/body pair, so an added mono face resolves.
- `tools/ship.mjs` accepts `--src` and `--out`, so an advisory proposal
  travels the same pipeline into its own directory. Default output and
  the CI freshness gate are byte-identical.

### Added (earlier in this cycle)

- **Lint view** in the dashboard: the six `@designops/lint` rules with
  verbatim diagnostics, a **live playground** (type TSX, get real
  diagnostics from the build), per-linter/per-framework setup snippets
  and programmable config (contracts, custom messages, shared settings).
- **@designops/lint** (`packages/lint`) — agent-first linter for Tailwind
  design systems (ESLint + Oxlint; React, Vue, Svelte), forked from
  shadcn-ui/lint with the `designops/` rule namespace.
- **Dashboard server with lint API** (`tools/lint-server.mjs`, `npm start`)
  — serves the dashboard plus `POST /api/lint` for the playground;
  `tools/lint-capture.mjs` refreshes the verbatim diagnostics in the app.
- **Agent evals + registry corpus tooling** (`packages/evals`, private) —
  the measurement suite behind the linter, ratcheted in CI.
- **Live connections** (GitHub · Figma · Storybook) — Overview
  activity reads real commits, requests file as GitHub issues, Figma
  sync matches components against a real file, and story cards
  deep-link to a published Storybook. Seeds render offline.

## [1.0.0] — 2026-07-25

First release — one design in Figma, shipped to every framework.

### Added

- **Dashboard (zero-build SPA)** with eight views: Overview, Tokens,
  Components, Frameworks, Requests, Storybook, Integrations and Guide & docs.
- **41 design tokens** in W3C DTCG format (`tokens/tokens.json`) — color,
  spacing, radius, typography and shadow — each copyable as a Figma name,
  CSS variable or TypeScript constant.
- **8 shipped components** — Button, Input, Badge, Card, Alert, Avatar,
  Data Table and Toast — each with:
  - live preview and token-annotated inspect tables with click-to-copy,
  - generated, copy-ready code for all **14 targets**: React, Next.js,
    Remix, Vue, Nuxt, Svelte, Angular, Ionic, Astro, MUI, Tailwind,
    React Native, Web Components and plain CSS,
  - usage & accessibility guidance,
  - a full semantic **version history**.
- **Request pipeline** — request a component, discuss in-thread with the
  designer, attach the Figma design, and one approval ships generated code
  to all 14 targets. Shipped components automatically append `v1.0.0` to
  their in-app history.
- **Narrated demo mode** — an 8-scene guided tour with voiceover
  (`demo/audio/`), with captions-only fallback.
- **Token transform CLI** (`tools/ship.mjs`) — `tokens.json` → CSS custom
  properties, SCSS map, TypeScript constants and a Tailwind preset, plus a
  manifest; `--check` mode acts as the CI gate against stale artifacts.
- **Test suite** — 51 DOM tests (`tools/smoke.test.cjs`) covering routing,
  card tabs, code generation for every target, the request-to-ship flow,
  demo mode and per-component history.
- **Documentation** — the DesignOps handbook (`docs/GUIDE.md`, also
  readable in-app under Guide & docs) and a copy-ready CI + GitHub Pages
  workflow (`docs/ci-deploy.yml.example`).
