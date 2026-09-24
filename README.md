# DesignOps

**One design in Figma. Shipped to every framework.**
Built by **Lulamile Mkhungela** — a design-engineering system that ends the
“design says 16px, code says 15px” era.

> Tokens and components are defined once, then shipped — mechanically — to
> React, Vue, Angular, Svelte, Next.js, Nuxt, Remix, Astro, Ionic, MUI,
> Tailwind, React Native, Web Components and plain CSS. Developers reference
> the system and reuse; new components are requested, designed and shipped
> without ever leaving it.

---

## Why this exists

Design and development drift apart for boring, mechanical reasons:

| Problem | DesignOps answer |
| --- | --- |
| Designer specs `16px`, dev types `15px` | Values ship as **tokens** — nobody re-types a pixel |
| A framework can’t express a style | The pipeline **adapts per target** (e.g. tokens → `StyleSheet` values in React Native), devs never improvise |
| The same component rebuilt per stack, all slightly different | One schema **generates every framework** from a single source |
| Requests lost in Slack threads | In-app **request board**: dev asks → designer designs → one approval ships to all 14 targets |
| Docs rot the day they’re written | **Storybook syncs** from the pipeline; paths mirror Figma paths |
| Shipped code drifts from the system anyway | **@designops/lint** verifies every change — violations explain themselves with fixes from your own theme |

## Quick start

The dashboard is a zero-build static app.

```bash
# clone, then either:
open index.html                 # double-click works
# …or serve it (recommended: demo audio + the Lint playground API):
npm start                       # http://localhost:4173
```

Then click **▶ Watch demo** in the top bar for a narrated, guided tour
(~90 seconds, voiceover included — captions-only fallback if audio is blocked).

Rebuild the token artifacts exactly the way CI does:

```bash
npm run build:tokens            # tokens/tokens.json → dist/
npm run verify                  # fail if dist/ is stale (CI gate)
```

Run the verification engine (needs dependencies + a build first):

```bash
pnpm install && pnpm build      # install workspaces, build @designops/lint
npm start                       # dashboard + live Lint playground API
npm test                        # dashboard smoke tests + lint test suite
```

## The pipeline

```
01 Figma Variables ─ 02 Tokens JSON ─ 03 Transform ─ 04 Framework build ─ 05 Storybook
   source of design    versioned truth   Style Dict      14 targets at once   living docs
```

**The one rule that powers everything:** names never change.

```
color/primary/900  →  "color.primary.900"  →  --color-primary-900  →  colorPrimary900
   (Figma)               (tokens.json)            (CSS)                   (TypeScript)
```

## What’s in the repo

```
design-ops/
├── index.html               The dashboard (SPA, zero build step)
├── assets/
│   ├── styles.css           Dashboard design system
│   ├── data.js              Tokens, component schemas, frameworks, guide content
│   ├── codegen.js           Schema → React/Vue/Angular/Svelte/Astro/MUI/RN/… generators
│   └── app.js               Router, rendering, request pipeline, demo mode
├── tokens/tokens.json       W3C design tokens — the Figma Variables export (edit here or in Figma)
├── tools/ship.mjs           Node CLI: tokens.json → dist/ (same transform the packages use)
├── tools/lint-server.mjs    `npm start`: serves the dashboard + the live lint API
├── tools/lint-capture.mjs   Refresh the verbatim lint diagnostics in the app
├── packages/lint/           @designops/lint — the agent-first linter (ESLint + Oxlint)
├── packages/evals/          Agent evals + registry corpus tooling (private, never published)
├── dist/                    Generated artifacts: tokens.css / .scss / .ts / tailwind preset / manifest
├── demo/audio/              Narrated voiceover for the in-app guided demo
├── docs/GUIDE.md            The DesignOps handbook (also readable in-app under “Guide & docs”)
├── docs/ci-deploy.yml.example  Verify + GitHub Pages workflow — copy to .github/workflows to enable
└── CHANGELOG.md             System release notes (per-component version history lives in the app)
```

## Inside the dashboard

| View | What you do there |
| --- | --- |
| **Overview** | Pipeline health, recent activity, gateway quick-start |
| **Tokens** | Every token in every format — click to copy Figma name / CSS var / TS const; export files identical to CI output |
| **Components** | Expand a card: **Preview** (Figma mocks), **Inspect** (token-annotated values, click-to-copy), **Code** (14 framework tabs with generated, copy-ready snippets), **Usage & a11y**, **History** (full semantic version log per component — request-shipped components auto-append v1.0.0), plus comments & change requests |
| **Frameworks (ship)** | 14 targets with live ship status and per-stack install commands |
| **Requests** | The human gate: request a component, discuss in-thread with the designer, **Approve & ship** → it appears, coded, in every framework |
| **Storybook** | Story sync status + generated story scaffolds |
| **Integrations** | The 6 gateways (below) and when to use each |
| **Guide & docs** | The full handbook |

## The gateway answer: do devs keep this open?

**No.** The dashboard is the *governance surface* (review, inspect, request,
approve). Daily consumption happens in the team’s own tools:

1. **CLI (easiest start)** — `npx designops init` detects your framework and wires
   tokens, Tailwind preset or MUI theme automatically.
2. **Packages (stay in sync)** — `npm i @designops/tokens @designops/react`
   (or vue / angular / svelte / mui / ionic / native). Design arrives as dependency
   updates, reviewed in PRs.
3. **CDN (zero install)** — one `<link>` for prototypes and legacy stacks.
4. **In-tool addons** — Storybook addon (spec per story), VS Code extension
   (var autocomplete + hover swatches), Figma plugin (two-way token sync).
5. **REST API + webhooks** — `GET /v1/tokens?target=react`, ship events to Slack/CI.
6. **The dashboard** — for design review, requests and sign-off.

**Recommendation:** CLI to start, packages to stay in sync, dashboard to govern.
Nobody is forced into a second tool.

## The request workflow (try it)

1. Go to **Requests** — the Data Table is sitting there with its Figma design attached.
2. Click **✓ Approve & ship to all 14 targets**.
3. Watch the pipeline run (~2s), then find Data Table in **Components** —
   with generated code for all 14 frameworks, inspect tables, and a Storybook scaffold.

Everything persists to `localStorage`, so your ships, comments and requests
survive a reload. Clear site data to reset the demo.

## Verify with @designops/lint

DesignOps now verifies, not just ships. **@designops/lint** is an
agent-first linter for Tailwind design systems (fork of
[shadcn-ui/lint](https://github.com/shadcn-ui/lint), MIT — same purpose,
same rule engine): you define what’s allowed, and every violation explains
itself with a fix drawn from your own components, variants and theme.

| Rule | What it catches |
| --- | --- |
| `designops/no-restyle` | Restyling a component with `className` |
| `designops/no-raw-colors` | Raw colors such as `bg-pink-500` |
| `designops/no-arbitrary-values` | Arbitrary values such as `p-[13px]` |
| `designops/no-inline-styles` | Inline styles and `<style>` elements |
| `designops/no-unknown-classes` | Classes Tailwind cannot generate |
| `designops/require-static-classes` | Component classes the linter cannot read |

- **In the dashboard:** open the **Lint** view — rule cards with verbatim
  diagnostics, a **live playground** (type TSX, get real diagnostics from
  the build), per-linter/per-framework setup snippets and programmable
  config (contracts, custom messages, shared settings).
- **In your project:** `npm install -D @designops/lint`, register the
  plugin in ESLint or Oxlint, enable the rules. Works with Tailwind v4
  projects (shadcn/ui not required) across React, Vue and Svelte — see
  [SETUP.md](SETUP.md) and [docs/](docs/README.md).
- **Under the hood:** `packages/lint` is the engine,
  `tools/lint-server.mjs` serves the dashboard plus the playground API,
  and `packages/evals` holds the agent evals and registry corpus tooling.

## Live connections (GitHub · Figma · Storybook)

The dashboard reads real data where it can, with seed fallbacks offline.
Manage everything under **Integrations → Live connections**:

- **GitHub (zero setup):** Overview's activity feed loads live commits
  from the configured repo (default `LulamileMkhungela/design-ops`),
  cached 5 minutes; any request can be filed as a prefilled GitHub
  issue in one click — no token needed for public repos.
- **Figma (your token):** paste a read-only personal access token plus
  the file key or URL and Components shows which cards match the real
  file, with a match-rate banner. Fetched directly, or via the
  same-origin `/api/figma` proxy under `npm start`. The token never
  leaves the browser except to api.figma.com.
- **Storybook (your URL):** paste a published Storybook URL and every
  story card deep-links to its real `?path=/story/…` page.

## For real adoption

This repo is the reference implementation of the system described in
[`docs/GUIDE.md`](docs/GUIDE.md): swap the sample packages for real npm
packages, point `tokens/tokens.json` at your Figma export, and keep
`tools/ship.mjs` as your CI transform. The dashboard reads the same schema
your packages build from — dashboard-reviewed code is byte-identical to
shipped code.

---

**DesignOps is a conversation with a pipeline attached — by Lulamile Mkhungela.**
MIT licensed.
