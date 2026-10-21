# DesignOps

[![CI](https://github.com/LulamileMkhungela/design-ops/actions/workflows/ci.yml/badge.svg)](https://github.com/LulamileMkhungela/design-ops/actions/workflows/ci.yml)

DesignOps defines design tokens, generates framework components and checks UI code against the system.

- [`@designops/advisory`](./packages/advisory/README.md): offline design reference and token proposals.
- [`tokens/tokens.json`](./tokens/tokens.json): source of truth; 41 W3C DTCG tokens.
- [`@designops/lint`](./docs/README.md): six ESLint/Oxlint rules.

The linter is based on [shadcn-ui/lint](https://github.com/shadcn-ui/lint). The advisory catalogue contains vendored third-party data. See [AUTHORS.md](./AUTHORS.md) and [NOTICE.md](./NOTICE.md).

## Install the linter

Requires Node.js 20.19 or later. ESLint requires 9.30 or later; Oxlint requires 1.80 or later.

```bash
npm install -D @designops/lint eslint @typescript-eslint/parser
```

Add to `eslint.config.mjs`:

```js
import { plugin as designops } from "@designops/lint"
import tsParser from "@typescript-eslint/parser"

export default [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { designops },
    rules: {
      "designops/no-restyle": ["error", { allow: ["layout"] }],
    },
  },
]
```

Run `npx eslint .`. For Oxlint setup and framework-specific parser support, see [React](./docs/react.md), [Vue](./docs/vue.md) and [Svelte](./docs/svelte.md).

## Rules

| Rule                               | Purpose                                   |
| ---------------------------------- | ----------------------------------------- |
| `designops/no-restyle`             | Restrict component style overrides.       |
| `designops/no-raw-colors`          | Require theme colors.                     |
| `designops/no-arbitrary-values`    | Require tokens and scale values.          |
| `designops/no-inline-styles`       | Require classes or CSS custom properties. |
| `designops/no-unknown-classes`     | Detect classes that produce no CSS.       |
| `designops/require-static-classes` | Require statically readable class values. |

See the [rule reference](./docs/rules.md) for options and examples.

## Configure component detection

Set shared options under `settings.designops`:

```js
settings: {
  designops: {
    ui: "@/ds",
    mergeFunctions: ["mergeClasses"],
    variantFunctions: ["buttonVariants"],
    componentImports: ["^@acme/ui"],
    ignoreImports: ["^@acme/ui/legacy"],
  },
}
```

`ui` sets UI import prefixes. `mergeFunctions` and `variantFunctions` add class and variant helpers. `componentImports` and `ignoreImports` control component recognition. See [shared rule options](./docs/rules.md#recognition).

## Advisory and tokens

Search the offline catalogue or create a reviewable token proposal:

```bash
node tools/advisory.mjs search "form validation errors" --domain ux
node tools/advisory.mjs propose "dark fintech dashboard" --write
```

Proposals are written to `tokens/proposals/`; they do not modify `tokens/tokens.json`. Review and promote approved tokens, then run `npm run build:tokens` and `npm run verify`. The catalogue requires Python 3 and uses the standard library only. See [catalogue details](./packages/advisory/README.md) and [provenance](./packages/advisory/VENDOR.md).

## Demo gallery

Generate 40 demo sites across 20 categories, or generate one category or prompt:

```bash
pnpm demos:all
node tools/demo-build.mjs --category=Gaming
node tools/demo-build.mjs "pet grooming service"
```

Generated pages are in `demos/`. Each includes a matching lint fixture and uses the shared component and token system.

## Dashboard

Install dependencies, build the linter, then start the dashboard:

```bash
pnpm install
pnpm build
npm start              # http://localhost:4173
```

The dashboard includes token, component, framework, advisory, demo, lint and documentation views. Component targets generate React, Vue, Svelte, Angular and Astro components; MUI, React Native, Tailwind, CSS and Web Components targets provide styles or tokens.

The interface targets WCAG 2.2 AA and follows WAI-ARIA APG interaction patterns. Run `pnpm audit:ui` to check the dashboard.

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
npm run verify
```

See [contributing](./CONTRIBUTING.md), [setup](./SETUP.md), [documentation index](./docs/README.md) and [release guide](./.github/RELEASING.md).

## Licence

MIT, © 2026 Lulamile Mkhungela. See [NOTICE.md](./NOTICE.md) for third-party notices and the [vendored catalogue licence](./packages/advisory/LICENSE.vendored.md).
