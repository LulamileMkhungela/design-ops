# design-ops

DesignOps — one design in Figma, shipped to every framework, and verified by
`@designops/lint`.

Three parts, in the order you use them:

|                                                        | Answers                                                                                             | Authoritative? |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | -------------- |
| [`@designops/advisory`](./packages/advisory/README.md) | _"What should this look like?"_ — styles, palettes, type pairings, UX guidelines, stack conventions | No — proposes  |
| [`tokens/tokens.json`](./tokens/tokens.json)           | _"What is our system?"_ — 41 W3C DTCG tokens, the single source of truth                            | **Yes**        |
| [`@designops/lint`](./docs/README.md)                  | _"Does the code match the system?"_ — six ESLint/Oxlint rules                                       | **Yes**        |

**DesignOps now verifies, not just ships.** The advisory proposes a direction,
the tokens record the decision, and the linter checks the result. When they
disagree, the linter wins.

```
   ADVISE          TOKENIZE          BUILD            VERIFY
 @designops/     tokens/          dist/ for        @designops/
  advisory  ──▶  proposals/  ──▶  14 targets  ──▶     lint       ─┐
     ▲                                                            │
     └────── a failing rule is a design decision ──────────────────┘
```

By [Lulamile Mkhungela](https://github.com/LulamileMkhungela) · MIT licence.

---

## Get started

### Install the linter

Requires Node.js 20.19 or later. Pick the linter you already use.

**ESLint** (9.30 or later) — React, Next.js, Vue, Svelte:

```bash
npm install -D @designops/lint eslint @typescript-eslint/parser
```

```js
// eslint.config.mjs
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

```bash
npx eslint .
```

**Oxlint** (1.80 or later; its JS plugin API is in alpha):

```bash
npm install -D @designops/lint oxlint
```

```json
// .oxlintrc.json
{
  "jsPlugins": ["@designops/lint"],
  "rules": {
    "designops/no-restyle": ["error", { "allow": ["layout"] }]
  }
}
```

Framework specifics: [React](./docs/react.md), [Vue](./docs/vue.md),
[Svelte](./docs/svelte.md). Adding it to a codebase that already has one:
[adoption](./docs/adoption.md).

### The six rules

| Rule                               | Catches                                         |
| ---------------------------------- | ----------------------------------------------- |
| `designops/no-restyle`             | overriding a design-system component's styling  |
| `designops/no-raw-colors`          | hex/rgb/palette colours instead of theme tokens |
| `designops/no-arbitrary-values`    | `p-[13px]`, `bg-[#fff]` instead of the scale    |
| `designops/no-inline-styles`       | `style={{}}` instead of classes                 |
| `designops/no-unknown-classes`     | classes that generate no CSS                    |
| `designops/require-static-classes` | class values the linter cannot read             |

Every diagnostic explains itself and suggests a fix drawn from **your** own
components, variants and theme. Full rule reference:
[docs/rules.md](./docs/rules.md).

### Settings

Component recognition, helpers and monorepos are configured through
`settings.designops`, which applies to every rule:

```js
settings: {
  designops: {
    ui: "@/ds",                     // import prefix: matches @/ds and @/ds/button
    mergeFunctions: ["mergeClasses"],
    variantFunctions: ["buttonVariants"],
    componentImports: ["^@acme/ui"],
    ignoreImports: ["^@acme/ui/legacy"],
  },
}
```

| Setting            | What it does                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------ |
| `ui`               | Import prefix for your UI directory, or an array of them.                                  |
| `mergeFunctions`   | Functions whose arguments contain classes. Extends `cn`, `clsx`, `cva`, `tv`, `twMerge`, … |
| `variantFunctions` | Functions whose object values contain classes. Extends `cva` and `tv`.                     |
| `componentImports` | Regex patterns that recognize a component import.                                          |
| `ignoreImports`    | Regex patterns excluded from recognition. Takes precedence.                                |

A rule's own option wins over the matching shared setting. In a monorepo,
scope these per app so each keeps its own theme and component directory —
see [docs/rules.md](./docs/rules.md#recognition).

---

## The advisory layer

A vendored design-intelligence catalogue — 79 searchable styles, 192 product
palettes, 74 font pairings, 119 UX guidelines, 105 icons, 25 chart types, 22
stacks and 17 GSAP motion presets — with an offline BM25 search. Python 3,
standard library only, no network.

```bash
node tools/advisory.mjs propose "dark fintech dashboard" --write
node tools/advisory.mjs search "form validation errors" --domain ux
node tools/advisory.mjs search "server components" --stack nextjs
node tools/advisory.mjs check
```

`propose` turns a design direction into a W3C DTCG token proposal in
`tokens/proposals/`. It **never** writes `tokens/tokens.json`. Alongside the
proposal you get:

- **A mapping** — every token, and whether it came from the advisory, was
  derived by the bridge, or was inherited unchanged from your system.
- **Seven WCAG contrast checks** — the catalogue hands over palettes it has
  never measured, so DesignOps measures them before you adopt them.
- **What did not become a token** — `on_primary`, `ring`, `accent` and the
  rest, each with a note on where it belongs.

Review it, promote the groups you approve, then:

```bash
node tools/ship.mjs --src tokens/proposals/<slug>/<slug>.tokens.json --out dist-proposals/<slug>
npm run build:tokens     # once promoted
npm run verify           # fail if dist/ is stale
```

The skill in [`skills/design-ops/SKILL.md`](./skills/design-ops/SKILL.md)
teaches an agent the whole loop. Provenance and what was deliberately left
out: [`packages/advisory/VENDOR.md`](./packages/advisory/VENDOR.md).

---

## Demo gallery

**Forty generated sites across twenty categories** — our own category set,
covering the product types a design system actually gets pointed at, two
demos each:

```bash
node tools/demo-build.mjs --all                    # regenerate all forty
node tools/demo-build.mjs --category=Gaming        # or just one category
node tools/demo-build.mjs "pet grooming service"   # or add your own
open demos/pawsome-care/index.html
```

The twenty categories: SaaS · Education · Pet Services · AI/Chatbot ·
E-commerce · Fintech/Crypto · Healthcare · Creative · Real Estate · Gaming ·
Food & Restaurant · Fitness · Travel · NFT/Web3 · Beauty/Spa · Developer
Tools · Entertainment · Legal · Events · Other.

Every site is emitted **twice** from the same template — once as the page you
open, once as JSX for the linter — so a finding is a finding about the page,
not about a separate copy. Each carries 44 declared tokens, nine sections,
and:

- **0 lint findings** across all four rules (`no-raw-colors`,
  `no-arbitrary-values`, `no-unknown-classes`, `no-inline-styles`),
- **no raw palette utility and no arbitrary value** anywhere in the markup,
- **its own palette and font pairing**, straight from the proposal,
- **built from the components, not just styled with the tokens.** The nav
  uses `button()`, the hero uses `badge()` + `input()` + `button()` +
  `avatarGroup()`, features and pricing use `card()`, the story uses
  `card()` + `avatar()`, there is an `alert()` banner at the top and a
  `dataTable()` section. Five of the eight are in the first viewport, so
  they are visible in the gallery thumbnail rather than buried.
- a **Components** section at the end showing all eight with every variant.

The gallery view filters by category, by Light/Dark mode, or by clicking a
palette swatch row, and shows "Showing N of 40 demos" as you narrow it.

Contrast is reported, not quietly fixed: several sites ship with a failing
pair, and that number is on the card. The fix is a design decision.

### One token the advisory does not propose

The advisory returns a heading/body font pairing and nothing else. A data
table needs a tabular face, so the generator adds `--font-mono` (JetBrains
Mono) on top of the proposal. It is declared in the theme, counted in the 44,
and requested from Google Fonts — never a silent fallback.

---

## Dashboard

```bash
npm install
npm start          # http://localhost:4173
```

Ten views, zero build step: Overview, Tokens, Components, Frameworks,
**Advisory**, **Demos**, Lint (with a live playground backed by the real
build), Requests, Storybook, Integrations and Guide & docs. The Advisory view
queries the catalogue through `/api/advisory`; the Demos view previews all
forty generated sites from `demos/manifest.json`, filterable by category,
mode or palette.

---

## Commands

```bash
pnpm install
pnpm build          # ESM and types in packages/lint/dist
pnpm test           # dashboard smoke tests, advisory bridge, then rule + Oxlint tests
pnpm typecheck
pnpm lint
pnpm format:write
pnpm corpus         # report findings in the pinned registry
pnpm corpus:check   # check that per-rule counts have not increased
pnpm evals          # agent evals; requires the Claude CLI
npm start           # dashboard at http://localhost:4173
npm run verify      # fail if dist/ token artifacts are stale
npm run build:tokens # rebuild dist/ from tokens/tokens.json
npm run advisory:check # validate the vendored catalogue (data contracts + tests)
pnpm lint:capture   # refresh the verbatim diagnostics in assets/data.js
```

## Documentation

Start here: [docs/README.md](./docs/README.md).

- [Setup guide](./SETUP.md) — for agents installing the linter.
- [How it works](./docs/how-it-works.md) — how the linter reads components and themes.
- [Configuring your design system](./docs/design-systems.md) — variants, contracts, messages.
- [Rules](./docs/rules.md) — shared options and per-rule reference.
- [Handbook](./docs/GUIDE.md) — the long-form guide, also readable in-app.
- [Evals](./docs/evals.md) — how the linter is measured.
- [Contributing](./CONTRIBUTING.md) — workspace setup, tests, benchmarks.

## Licence

MIT. The advisory catalogue is vendored MIT third-party data — see
[packages/advisory/LICENSE.vendored.md](./packages/advisory/LICENSE.vendored.md).
