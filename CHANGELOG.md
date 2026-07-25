# Changelog

All notable changes to the DesignOps system are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

> Component-level version history lives inside the dashboard
> (**Components → 🕘 History** on any card). This file tracks the system
> as a whole.

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
