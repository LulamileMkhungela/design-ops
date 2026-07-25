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

## Quick start

The dashboard is a zero-build static app.

```bash
# clone, then either:
open index.html                 # double-click works
# …or serve it (recommended, so the demo audio loads cleanly):
npm start                       # http://localhost:4173
```

Then click **▶ Watch demo** in the top bar for a narrated, guided tour
(~90 seconds, voiceover included — captions-only fallback if audio is blocked).

Rebuild the token artifacts exactly the way CI does:

```bash
npm run build:tokens            # tokens/tokens.json → dist/
npm run verify                  # fail if dist/ is stale (CI gate)
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
