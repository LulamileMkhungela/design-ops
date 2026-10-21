# Changelog

All notable changes to the DesignOps system are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

> Component-level version history lives inside the dashboard
> (**Components → 🕘 History** on any card). This file tracks the system
> as a whole.

## [Unreleased]

DesignOps now verifies what it ships. The dashboard gains two views —
**Advisory** and **Demos** — taking it to eleven, and the Lint view is
backed by a real engine. The advisory answers the question that comes
before verification: _what should this look like?_

### Added

- **A UI guideline audit** (`tools/ui-audit.mjs`). It boots the dashboard in
  jsdom, walks all eleven views and an expanded component card, and fails on
  missing landmarks or accessible names, click-only controls, broken ARIA
  references, heading gaps, tabs without keyboard wiring, duplicate ids,
  contrast failures, missing focus styles, motion that ignores
  `prefers-reduced-motion`, undersized targets, or generated components that
  are still wrappers. `pnpm test` runs it before the advisory and lint suites.
- **A published interaction contract.** `docs/GUIDE.md` and the in-app
  handbook now state the standard the interface is held to: WCAG 2.2 AA plus
  the WAI-ARIA Authoring Practices for widgets, with the audit as the
  regression net.
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
- **Layout and copy pass.** Removed the repeated shapes that made the pages
  feel templated. Alignment: pricing cards had two competing `border` classes
  on one element (the wrong one won depending on Tailwind's emit order)
  and their CTAs sat at whatever height the list above them happened to
  end — now one border, `flex h-full flex-col`, CTA on `mt-auto`. The
  stats band declared `border-y` and `border-b` together. Copy: em-dash
  list bullets replaced with a check glyph; the redundant badge that
  echoed each pricing tier's own name removed; section headings, the
  notice line and the social-proof count are now per demo
  (`MICROCOPY`), fixing 35 sites whose "Trusted by <first stat>" read as
  "Trusted by 12 weeks"; the at-a-glance table's constant Status/Period
  columns replaced with a varying Change column; avatars and two
  remaining constant headings rotate on a stable per-slug hash.
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

- **The dashboard is keyboard-complete.** Component cards are disclosure
  buttons, card tabs are APG tabs (roving tabindex, Left/Right, Home/End),
  framework pickers are pressed buttons in a labelled group, copy targets are
  reachable with Enter and Space, and the sidebar is built from real links
  with `aria-current`. A skip link, a visible focus ring, 24×24 CSS-px
  targets, `prefers-reduced-motion`, and a polite live region for route,
  tab and copy announcements complete the pass. The muted ink token moved
  from 45% to 60% opacity so small labels clear 4.5:1 on every surface.
- **Generated code is code, not a sketch.** The React targets now emit a
  ref-forwarding Button, a polymorphic Card, a real DataTable (caption,
  scoped headers, `aria-sort`, sorting, pagination, empty state) and an Input
  wired with `htmlFor`, `aria-invalid` and `aria-describedby`. Vue, Svelte,
  Angular and Astro get matching implementations, including working sort and
  pagination where the framework supports it. Badge, Alert, Avatar and Toast
  render their props instead of a bare slot.
- **The gaming demo is now Ladder Lab**, with a matching slug, palette and
  copy across the gallery manifest, the bundled fallback and the regenerated
  site.

- **Authorship made explicit in the repository, not only in the README.**
  `AUTHORS.md` and `NOTICE.md` record who wrote what and the exact scope of
  the three third-party notices (shadcn-ui/lint, the vendored catalogue, the
  test fixtures). `.mailmap` folds the early tooling identity into the author,
  `CODEOWNERS` names the owner, and every package manifest carries the same
  author and repository metadata.
- **The guided tour works from the keyboard.** Space pauses, the arrow keys
  move between scenes, Escape exits, and focus stays inside the dialog while
  it is open. Captions are announced politely, the credit line is visible in
  the overlay, and the scene clock follows the real recording length instead
  of the advertised duration.
- **The in-app handbook documents the new loop.** Guide & docs gains an
  _Advise → verify_ section (and `docs/GUIDE.md` a matching chapter), because
  the two newest views were the two the handbook did not mention.
- **The gallery stopped saying "0 categories".** The count line read
  `categories` off the fetched manifest, which never carried the key — the
  fallback did, so the bug only appeared against the real gallery. The
  manifest now writes the list, the view derives it when an older manifest
  omits it, and a test covers the case.
- **Every generated site now has a head.** Title, a description taken from
  its own lead copy, a `theme-color` from its own tokens, a favicon built
  from its own accent, and a generator credit. Forty pages that rendered
  identically in a browser tab now read as forty products.
- **The dashboard has a cover, not a screenshot.** `docs/assets/cover.svg` is
  the source; `docs/assets/cover.sh` renders `cover.png`, and the drawing
  shows a real `no-restyle` diagnostic rather than an approximation of one.
  It replaces a cover whose message ("Use a variant (sm, lg) for size") was
  the linter's text from two releases ago.
- **Fixed a flaky project-cache test.** `package.json` was re-read only when
  its mtime changed, so two writes in the same millisecond — ordinary on a
  fast Linux filesystem — left a stale `imports` map behind. The read is now
  refreshed on the same one-second beat as the rest of the filesystem memo.
- **The dashboard server answers bad input with 4xx, not 500.** A malformed
  JSON body, an oversized payload or a non-string `code` now says what was
  wrong instead of surfacing a stack-trace-shaped message.
- **Docs and release plumbing corrected.** The README's view count, the
  `#rules` anchor, the stale `README#react` link, the missing release guide
  and the missing changeset config are fixed. `tools/capture-advisory.mjs`
  now keeps the dashboard's frozen catalogue counts honest, and
  `pnpm advisory:check` fails when they drift.
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
