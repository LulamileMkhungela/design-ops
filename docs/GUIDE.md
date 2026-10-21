# The DesignOps Guide

Complete documentation for the DesignOps system — the same content ships
in-app under **Guide & docs**, kept next to the code so it can be reviewed
and versioned like everything else.

Owner: **Lulamile Mkhungela** (design system)

---

## 1 · What is DesignOps

DesignOps is the operating layer between design and engineering. It exists
because teams drift: a designer specs `16px`, a developer writes `15px`; a
framework doesn’t support a style, so someone improvises. Multiply that by 80
components and five stacks and the product no longer looks designed.

This system removes the negotiation:

- **Tokens and components are defined once in Figma** and shipped,
  mechanically, to every framework.
- If a target can’t express a design directly (no CSS variables in React
  Native, for example), **the pipeline resolves the design into that target’s
  native format**. Developers never translate design by hand.
- **New components are requested inside the system**, designed, approved and
  shipped from one place — the conversation is attached to the artifact.

Roles:

- **Designers** work in Figma with variables; component properties are named
  to match code props.
- **Developers** install packages, copy generated snippets, and file
  requests. They review — they do not translate.
- **The pipeline** (export → transform → multi-target build → Storybook) is
  automated, versioned, and gated.

## 2 · The five-stage pipeline

Every component travels the same five gates. Nothing advances until the
current gate is green.

### 01 · Figma Variables

Components are built with auto-layout and variables. Every annotation
references a token (`space/4`, never `16px`). Component property names equal
the eventual code prop names — that contract is intentional and enforced.

### 02 · Tokens JSON

Variables export to versioned JSON (`tokens/tokens.json`, W3C Design Tokens
format). Reviewed by PR, never hand-edited. This file is the single source of
truth for every downstream artifact.

### 03 · Transform

A build step (`tools/ship.mjs` here; Style Dictionary compatible) compiles
tokens to CSS variables, Sass, TypeScript constants and a Tailwind preset
(`dist/`). One rule: `color/primary/900` → `--color-primary-900`. Slashes and
dots become hyphens in CSS, camelCase in TS. Nothing else changes.

### 04 · Framework build

Each target adapter consumes the transformed tokens:

| Target                  | Adapter shape                                               |
| ----------------------- | ----------------------------------------------------------- |
| React / Next.js / Remix | typed components + token CSS import                         |
| Vue / Nuxt              | SFCs + auto-registered Nuxt module                          |
| Svelte / SvelteKit      | SFCs, token-driven styles                                   |
| Angular / Ionic         | standalone components; tokens mapped onto Ionic vars        |
| Astro                   | zero-JS components with frontmatter props                   |
| MUI                     | tokens compiled into `createTheme`                          |
| Tailwind                | preset exposing token classes                               |
| React Native            | **values-only** `StyleSheet` module (no CSS vars on mobile) |
| Web Components / CSS    | custom elements + `:root` variables                         |

The Code tab of any component in the dashboard shows the exact output — the
same schema that ships the packages generates it.

### 05 · Storybook

Story paths mirror Figma paths (`Components / Button`). Controls mirror
props. Docs are generated from the component schema. A component is **stable**
only when all five stages are green and design sign-off compares Storybook
output against the Figma spec.

## 3 · The naming contract

Names are the system. If names drift, everything downstream drifts. There is
exactly one rule, enforced by tooling rather than memory:

```
color/primary/900  (Figma)
→ "color.primary.900" (JSON)
→ --color-primary-900 (CSS)
→ colorPrimary900     (TypeScript)
→ primary-900         (Tailwind)
```

- Component props are named identically in Figma and in code
  (`variant`, `size`, `loading`).
- Storybook paths mirror Figma component paths.
- Renames are breaking changes: major version + codemod.

## 4 · Requesting a component

When a dev needs something that doesn’t exist, they don’t build a bespoke one —
they ask, inside the system:

1. **Request** — describe the need and context on the Requests board
   (status: `requested`).
2. **Design** — the designer answers in-thread and attaches the Figma spec
   (status: `in design`).
3. **Approve & ship** — one click runs the pipeline: tokens reserved →
   multi-target build → Storybook scaffold → publish (status: `shipped`).
   The component appears in Components and on every framework card.
4. **Consume** — devs bump the package version (or copy the snippet).

In this reference app the flow persists to `localStorage`; in production the
same events flow through the REST API and webhooks.

## 5 · Integrating your app (the gateway)

**Do developers need the dashboard open all day? No.** It’s the governance and
review surface; consumption happens in the dev’s own tools:

1. **Packages (recommended)** — `npm i @designops/tokens @designops/react`
   (or vue, angular, svelte, sveltekit, astro, mui, ionic, native). Design
   arrives as versioned dependency updates.
2. **CLI** — `npx designops init` detects the framework and wires everything:
   token CSS import, Tailwind preset, MUI theme, config pinning.
3. **CDN link** — one `<link>` for prototypes, legacy and hack days.
4. **In-tool addons** — Storybook addon (Figma spec + approval per story),
   VS Code extension (token autocomplete, hover swatch), Figma plugin
   (two-way token sync).
5. **API + webhooks** — `GET /v1/tokens?target=react`,
   `GET /v1/components/{name}/{target}`, `POST /v1/requests`, plus
   `component.shipped` events to Slack/Teams/CI.

**Recommendation:** CLI to start, packages to stay in sync, dashboard to
govern. The dashboard and the packages read the same schema, so what you
review is byte-identical to what you ship.

## 6 · The advisory layer, and what verifies it

Two questions come before "does this work": _what should this look like?_ and
_does the code still match the system?_

```
   ADVISE          TOKENIZE          BUILD            VERIFY
 @designops/     tokens/          dist/ for        @designops/
  advisory  ──▶  proposals/  ──▶  14 targets  ──▶     lint
```

**Advise.** `@designops/advisory` is a vendored catalogue — styles, palettes,
type pairings, UX guidelines, stack conventions — searched offline by BM25
(Python 3, standard library only).

```bash
node tools/advisory.mjs propose "dark fintech dashboard" --write
node tools/advisory.mjs search "form validation errors" --domain ux
```

`propose` writes a W3C DTCG token proposal to `tokens/proposals/`. It never
writes `tokens/tokens.json`. Alongside the proposal you get a provenance
mapping (advisory / derived / inherited), seven measured WCAG contrast pairs,
and the advisory fields that became no token.

**Tokenize.** A human reviews the proposal and promotes the groups they
approve. That review is the gate: the catalogue proposes, the system decides.

**Verify.** `@designops/lint` checks the result. Six rules, each of which
explains itself and offers a fix drawn from your own components, variants and
theme. When a rule and the catalogue disagree, the rule wins.

### The demo gallery

`tools/demo-build.mjs` runs the whole loop for forty product categories: an
advisory query becomes a token proposal, the proposal becomes a page, and the
page is linted. Each site is emitted twice from one template — `index.html`
you can open, and `page.tsx` for the linter — so a finding is a finding about
the page you are looking at. Contrast is measured and reported, including the
pairs that fail.

```bash
node tools/demo-build.mjs --all
open demos/pawsome-care/index.html
```

## 7 · Governance & versioning

- **Semver everywhere.** Tokens and each framework adapter version
  independently; `dist/manifest.json` carries a content hash so apps fail
  fast on stale bundles. Every component carries a **version history**
  (History tab in the dashboard) where each release links back to the
  request, review or token change that caused it.
- **Change requests live on components** — comments, requests and approvals
  are part of the artifact.
- **Breaking visual changes** go through the request flow with a migration
  codemod.
- **Definition of stable:** all five stages green + design sign-off comparing
  Storybook against Figma.
- **Accessibility is a gate:** every component contract names its keyboard
  and ARIA behaviour; the dashboard's own interface is checked by
  `pnpm audit:ui`, and contrast is verified at the token level before any
  component build starts.
- **Token changes are PRs** to `tokens/tokens.json`. `npm run verify` (and
  CI) fails if `dist/` is stale relative to the source — no silent drift.

## 8 · FAQ

**A framework can’t support a design — what happens?**
The pipeline adapts, the developer doesn’t (e.g. React Native receives a
values-only StyleSheet module). If a design is truly impossible on a target,
it’s flagged at the framework stage before code ships — never discovered in
production.

**Can we adopt gradually?**
Yes: start with the CSS variables (one link), then adopt adapters per
component. Class-only output (`.ds-btn`) exists for exactly this.

**Who owns a token?**
The design system owner owns definitions; consuming teams own usage. Token
changes are PRs against `tokens/tokens.json`.

**Does theming work?**
Tokens compile per theme — ship `tokens.dark.css` / `tokens.light.css` and
switch at runtime; components never change.

**Where does the dashboard run?**
Anywhere static files can live — GitHub Pages (ready-to-copy workflow in
`docs/ci-deploy.yml.example`), an S3 bucket, or inside the monorepo. It has no build step and no backend
dependency; production mode swaps `localStorage` for the API.

## 9 · Accessibility & the interaction contract

DesignOps treats **WCAG 2.2 AA** as the floor and the **WAI-ARIA Authoring
Practices** as the implementation contract for controls. The dashboard is part
of the product, so it follows the same rules as the components it ships.

**Structure.** One `main` landmark, one `h1` per view, a skip link as the first
focus stop, and navigation built from real links with `aria-current="page"`.
Headings never skip a level.

**Widgets.**

- Component cards are disclosure buttons: `aria-expanded`, `aria-controls`,
  and a body region named after the component.
- Card tabs are APG tabs: `tablist` / `tab` / `tabpanel`, `aria-selected` on
  every tab, `aria-controls` and `aria-labelledby`, one tab in the tab order
  (roving tabindex), Left/Right with wrap, Home/End, and a panel that can take
  focus when it has no focusable content.
- Framework targets are toggle buttons (`aria-pressed`) in a labelled group;
  the visible code panel swaps in place.
- Copy targets are buttons in the tab order, activated with Enter or Space,
  and the copy is announced through a polite live region.

**Forms.** Every field has a programmatic label. Hints and errors are linked
with `aria-describedby`, invalid fields set `aria-invalid`, and a busy button
exposes `aria-busy`. Errors are announced, not just coloured.

**Perception.** Text meets 4.5:1 against its surface. Focus is a 2px ring with
a 2px offset and is never removed. Pointer targets are at least 24×24 CSS
pixels. `prefers-reduced-motion` disables smooth scrolling and animation.

**Verification.** `pnpm audit:ui` boots the dashboard in jsdom, walks all
eleven views plus one expanded component card, and fails on missing landmarks
or names, click-only controls, broken ARIA references, heading gaps, tabs
without keyboard wiring, duplicate ids, contrast failures, missing focus
styles, motion that ignores the preference, or undersized targets. It also
checks that generated components still contain real structure: a `<table>`
with column headers and row loops, a labelled input, a ref-forwarding button.

Automation is a regression net, not a substitute for testing with a keyboard,
a screen reader and 200% zoom. Do that before a release that changes
interaction.

## 10 · Glossary

- **Design token** — the smallest design decision (color, space, radius…),
  stored as data.
- **Transform** — mechanical compilation of tokens into a target format.
- **Adapter** — the framework-specific package that maps tokens to idiomatic
  code.
- **Drift** — any difference between the Figma spec and shipped code.
  Target: zero.
- **Ship** — promote a component through all five stages into every target.
- **Gateway** — the channel through which a team consumes the system
  (CLI, packages, CDN, addons, API).

---

_DesignOps — design once, build everywhere. Built and maintained by
Lulamile Mkhungela._
