# DesignOps site — showcase + live playground

Zero-dependency showcase for `@designops/lint`:

- `index.html` / `styles.css` / `app.js` — static showcase. Rule cards and
  the hero terminal show **verbatim** diagnostics from the real build.
- `server.mjs` — static file server plus `POST /api/lint`, which runs the
  real lint build in-process against a scratch copy of the demo design
  system (`packages/lint/test/fixtures/project`). Powers the playground.
- `capture.mjs` — refreshes the verbatim diagnostics embedded in `app.js`.

## Run

```bash
pnpm build        # the playground lints with packages/lint/dist
npm run site      # http://localhost:4173 (PORT= to override)
```

`npm run site` = `node site/server.mjs`. The server is a local preview
tool, not hardened for production hosting: it lints whatever code is
posted to `/api/lint` (32KB limit, scratch dir in the OS temp folder).

## Refresh the embedded diagnostics

When rule messages change, re-capture and paste into the `RULES` table
and `TERMINAL_TEXT` in `app.js`:

```bash
pnpm site:capture
```

## Static hosting

`index.html`, `styles.css`, and `app.js` are fully self-contained (no
CDNs, no build step). `.github/workflows/site.yml` deploys them to
GitHub Pages, where the showcase works and the playground shows a
"run the server locally" note (no API on a static host).
