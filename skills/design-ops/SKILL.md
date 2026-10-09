---
name: design-ops
description: "Design system workflow with verification. Turns a design direction into W3C design tokens, ships them to React, Vue, Svelte, Angular, Next, Nuxt, Astro and Tailwind, and verifies the result with @designops/lint — an agent-first linter for Tailwind design systems. Use when creating or changing design tokens, building or restyling UI components, choosing a palette or type scale for a product, adopting a design system in an existing codebase, or auditing UI for token drift, raw colours, arbitrary values and unknown classes."
license: MIT
metadata:
  author: Lulamile Mkhungela
  version: "1.1.0"
argument-hint: "[task] [component or product]"
---

# DesignOps

One design, every framework, verified. This skill has two halves:

- **`@designops/advisory`** — a vendored design-intelligence catalogue
  (styles, palettes, typography, UX guidelines, stacks) that answers _"what
  should this look like?"_. Advisory only.
- **`@designops/lint`** — six ESLint/Oxlint rules that answer _"does the code
  match the system?"_. Authoritative.

They are not peers. When they disagree, **the linter wins**.

## When to apply

Use this skill when the task touches **design tokens, component styling, or
design-system conformance**:

- Starting a new product or page and needing a palette, style or type scale.
- Creating, refactoring or restyling a UI component.
- Adding design tokens, or changing what a token means.
- Adopting a design system in a codebase that already has one.
- Auditing UI for drift: raw hex values, arbitrary Tailwind values, inline
  styles, restyling shared components, classes that generate no CSS.

Skip it for backend logic, API design, data modelling, infrastructure, or
non-visual testing — unless the change alters how something **looks**.

## The loop

```
   ADVISE          TOKENIZE          BUILD            VERIFY
 ┌──────────┐   ┌────────────┐   ┌───────────┐   ┌──────────────┐
 │ advisory │──▶│  proposal  │──▶│ dist/ for │──▶│ @designops/  │
 │  search  │   │ → approval │   │ 14 targets│   │     lint     │◀─┐
 └──────────┘   └────────────┘   └───────────┘   └──────────────┘  │
      ▲                                                    │        │
      └────────── a failing rule is a design decision ──────┴────────┘
```

Work left to right. Do not skip **VERIFY**, and do not skip **TOKENIZE**:
writing classes straight from an advisory result is the one move this skill
exists to prevent.

### 1 · Ground first

Before asking the catalogue anything, find out whether a system already
exists:

- `tokens/tokens.json` — the source of truth, W3C DTCG format.
- `components.json` — UI directory and import aliases.
- The Tailwind v4 theme (`@theme` block) — which colour tokens are declared.
- The lint config — which `designops/*` rules are on.

**If the project already has tokens, the advisory does not get to pick
colours.** Use it for style, layout, UX and stack guidance, not for a palette
that would fight the existing one.

### 2 · Advise

Search the local catalogue. It is offline and needs Python 3 (stdlib only):

```bash
# a whole direction
node tools/advisory.mjs propose "dark fintech dashboard" --write
# a targeted concern
node tools/advisory.mjs search "form validation errors" --domain ux
node tools/advisory.mjs search "data table empty state" --domain product
# a known stack
node tools/advisory.mjs search "server components" --stack nextjs
```

Use **2–5 meaningful terms** and name the product, platform or interaction.
Verify the returned style, product type and stack actually fit the user's
request before applying them. If a search returns nothing, **retry once** with
a narrower query or an explicit `--domain`, and if it still misses, say so and
label any general guidance as a fallback. Never present an unverified match as
a recommendation.

Domains: `style` `color` `chart` `landing` `product` `ux` `typography`
`google-fonts` `icons` `gsap` `react` `web`.

`propose` returns a token **proposal** with:

- `mapping` — every token and whether it is `advisory`, `derived` or
  `inherited`. Read it; the derived ones (hover, wash, subtle ink) are
  computed, not curated.
- `contrast` — WCAG ratios the catalogue never measured. **Fix failures before
  going on**, and tell the user what you changed and why.
- `guidance.unmappedAdvisoryFields` — values with no home in the token tree
  (`on_primary`, `ring`, `accent`, …) and where they belong.

### 3 · Tokenize

`propose --write` puts files in `tokens/proposals/<slug>/`. It **never** writes
`tokens/tokens.json`.

Show the user the mapping and the contrast table, then promote only the groups
they approve. Then:

```bash
node tools/ship.mjs --src tokens/proposals/<slug>/<slug>.tokens.json --out dist-proposals/<slug>
npm run build:tokens      # once promoted into tokens/tokens.json
npm run verify            # CI freshness gate
```

Add the proposal's `@theme` declarations to the project's global CSS. Until you
do, the linter cannot see the tokens and will report every utility built from
them as unknown.

### 4 · Build

Write components against the tokens. Use the token names, not the hex values:

```tsx
// right
<button className="bg-primary-900 text-ink-default rounded-md px-4">Save</button>
// wrong — every one of these is a lint error
<button className="bg-[#0F172A] text-[#F8FAFC] rounded-[6px]" style={{ padding: 16 }}>Save</button>
```

Prefer a variant on the shared component over a `className` override. If a
design needs a variant that does not exist, **add the variant** — do not restyle
at the call site.

### 5 · Verify

Run the linter. This is not optional and it is not the last step only:

```bash
npx eslint .                 # ESLint
npx oxlint --config .oxlintrc.json .   # Oxlint
```

The six rules:

| Rule                               | Catches                                         |
| ---------------------------------- | ----------------------------------------------- |
| `designops/no-raw-colors`          | hex/rgb/palette colours instead of theme tokens |
| `designops/no-arbitrary-values`    | `p-[13px]`, `bg-[#fff]` instead of the scale    |
| `designops/no-inline-styles`       | `style={{}}` instead of classes                 |
| `designops/no-restyle`             | overriding a design-system component's styling  |
| `designops/no-unknown-classes`     | classes that generate no CSS                    |
| `designops/require-static-classes` | class values the linter cannot read             |

Fix what it reports. If a fix needs a token that does not exist, go back to
**TOKENIZE** — that is the loop working, not a false positive. Do not silence a
rule to make a build pass.

## Rules of engagement

1. **The advisory is advisory.** It proposes; `tokens/tokens.json` disposes.
2. **The linter is authoritative.** A rule failure is a real finding. Fix it or
   justify it to the user; never quieten it to ship.
3. **No raw values in components.** If a colour or size is not a token, add the
   token.
4. **Extend, do not restyle.** New variant on the component, not a new
   `className` at the call site.
5. **Measure what the catalogue did not.** It never checks contrast. You do.
6. **Say when there is no match.** An unverified fallback must be labelled as
   one.

## Adopting in an existing codebase

Start from warnings, not errors. Enable one rule, clear it, enable the next —
`no-raw-colors` and `no-inline-styles` first, since they find the most drift
for the least noise. See
[docs/adoption.md](../../docs/adoption.md).

## Reference

- [docs/README.md](../../docs/README.md) — all documentation.
- [docs/how-it-works.md](../../docs/how-it-works.md) — how the linter reads components and themes.
- [docs/rules.md](../../docs/rules.md) — shared options, contracts, custom messages.
- [packages/advisory/README.md](../../packages/advisory/README.md) — the catalogue and its limits.
- [packages/advisory/VENDOR.md](../../packages/advisory/VENDOR.md) — provenance of the vendored data.
- `node tools/advisory.mjs` with no arguments — usage.
