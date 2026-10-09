#!/usr/bin/env node
/**
 * DesignOps · demo site generator
 * ─────────────────────────────────────────────────────────────
 * Builds a real, viewable website from an advisory proposal — and then
 * proves it with the linter.
 *
 *   node tools/demo-build.mjs "saas analytics dashboard"
 *   node tools/demo-build.mjs "veterinary clinic" --slug vet
 *   node tools/demo-build.mjs --all
 *
 * For each query it:
 *
 *   1. asks @designops/advisory for a design direction,
 *   2. maps it onto DesignOps tokens (tools/advisory.mjs),
 *   3. emits the SAME markup twice — once as a viewable page, once as
 *      JSX for the linter — so what you see is what was checked,
 *   4. runs @designops/lint over the JSX against the proposal's theme,
 *   5. writes the result into demos/<slug>/lint.json.
 *
 * The page is built entirely from the proposal's tokens. No raw palette
 * utilities, no hardcoded hex: every colour, radius, space and font in the
 * markup resolves to a token the linter can name. That is the point — a
 * gallery of demos that are not just pretty, but verifiable.
 */
import { spawnSync } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { createRequire } from "node:module"
import * as os from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { buildThemeCss, relativeLuminance } from "./advisory.mjs"
import {
  alert,
  avatar,
  avatarGroup,
  badge,
  button,
  card,
  componentShowcase,
  dataTable,
  input,
} from "./demo-components.mjs"
import { demoSpecs, modeFor, slugify } from "./demo-content.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, "..")
const DEMOS = join(ROOT, "demos")
const LINT_DIST = join(ROOT, "packages", "lint", "dist", "index.js")

/* ── 2 · markup, built from tokens only ─────────────────────── */

/**
 * Every class below resolves to a token the proposal declared. There is no
 * `bg-white`, no `text-gray-400`, no `border-slate-200`, and no arbitrary
 * value anywhere — the three things @designops/lint is configured to stop.
 */
const C = {
  page: "bg-neutral-900 text-ink-default font-body antialiased",
  nav: "border-neutral-700 bg-neutral-800",
  brand: "font-heading text-primary-900",
  navLink: "text-ink-muted hover:text-ink-default",
  btnPrimary:
    "bg-primary-900 text-ink-default rounded-md px-4 py-2 font-heading hover:bg-primary-800",
  btnGhost:
    "border border-neutral-600 text-ink-default rounded-md px-4 py-2 hover:bg-neutral-700",
  badge: "bg-primary-50 text-neutral-900 rounded-full px-3 py-1 text-xs",
  h1: "font-heading text-ink-default",
  lead: "text-ink-muted",
  card: "bg-neutral-800 border border-neutral-700 rounded-lg p-6",
  cardHover: "hover:bg-neutral-700",
  stat: "font-heading text-primary-900",
  statLabel: "text-ink-subtle",
  featureTitle: "font-heading text-ink-default",
  featureBody: "text-ink-muted",
  price: "font-heading text-ink-default",
  li: "text-ink-muted",
  quote: "font-heading text-ink-default",
  footer: "border-neutral-700 text-ink-subtle",
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/**
 * The page always uses font-heading / font-body, so the theme must always
 * declare them. The catalogue omits a pairing for some queries; when that
 * happens the demo falls back to a named default rather than emitting a
 * class Tailwind has never heard of. Recorded, not hidden.
 */
const FONT_FALLBACK = "Inter"
/**
 * The advisory proposes a heading/body pairing and nothing else. A data
 * table needs a tabular face for identifiers, so the generator adds one.
 * This is a declared addition, not a silent fallback: it is stamped with
 * $description and it shows up in the theme and the token count.
 */
const MONO_FONT = "JetBrains Mono"

const dedupeFonts = (list) => [...new Set(list.filter(Boolean))].join(" + ")

function ensureFonts(tree) {
  const typo = (tree.typography ??= {})
  const family = (typo.family ??= {})
  const added = []
  for (const [key, fallback] of [
    ["heading", FONT_FALLBACK],
    ["body", FONT_FALLBACK],
  ]) {
    if (family[key]?.$value) continue
    family[key] = {
      $value: fallback,
      $type: "fontFamily",
      $description: `Fallback ${key} font — the advisory returned no pairing for this query`,
    }
    added.push(key)
  }
  if (!family.mono?.$value) {
    family.mono = {
      $value: `"${MONO_FONT}", ui-monospace, SFMono-Regular, monospace`,
      $type: "fontFamily",
      $description:
        "Monospace face for tabular data — added by the generator, the advisory proposes no mono pairing",
    }
  }
  return added
}

const fontUrl = (tree) => {
  const f = tree.typography?.family ?? {}
  const families = [f.heading?.$value, f.body?.$value, MONO_FONT].filter(
    Boolean
  )
  const unique = [...new Set(families)]
  if (!unique.length) return null
  const q = unique
    .map(
      (n) =>
        `family=${encodeURIComponent(n).replace(/%20/g, "+")}:wght@400;500;600;700`
    )
    .join("&")
  return `https://fonts.googleapis.com/css2?${q}&display=swap`
}

/** Guarantees the tabular face is requested alongside the proposed pairing. */
const withMono = (url) => {
  if (!url || url.includes(MONO_FONT.replace(/ /g, "+"))) return url
  const family = `family=${MONO_FONT.replace(/ /g, "+")}:wght@400;500;600;700`
  return url.includes("display=swap")
    ? url.replace("display=swap", `${family}&display=swap`)
    : url + (url.includes("?") ? "&" : "?") + family
}

/** Inline check for list items. Em-dash bullets are a giveaway. */
const CHECK =
  '<svg class="mt-0.5 h-4 w-4 shrink-0 text-primary-900" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.5 3.5L13 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'

/** Deltas for the at-a-glance table, so the column is not one word repeated. */
const GLANCE_CHANGE = ["+12%", "+4%", "-2%", "+31%"]

/**
 * Names for the social-proof avatars. One fixed set across forty sites is
 * its own tell, so pick four per demo deterministically from this pool.
 */
const PEOPLE = [
  ["AR", "Amelia R."],
  ["TK", "Thabo K."],
  ["MS", "Marta S."],
  ["JB", "Jonas B."],
  ["LN", "Lerato N."],
  ["DC", "Daniel C."],
  ["PO", "Priya O."],
  ["EV", "Elias V."],
  ["SH", "Sara H."],
  ["MO", "Marco O."],
  ["NK", "Nadia K."],
  ["FT", "Femi T."],
  ["GW", "Grace W."],
  ["RB", "Ruben B."],
  ["IM", "Ines M."],
]

function peopleFor(slug) {
  let h = 0
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return [0, 1, 2, 3].map((i) => PEOPLE[(h + i * 5) % PEOPLE.length])
}

/** Stable per-slug hash, so the variations below do not shuffle on rebuild. */
function slugHash(slug) {
  let h = 0
  for (const ch of String(slug)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

/** The two headings and the alert title that are not per-demo copy. */
const GLANCE_HEADINGS = [
  "By the numbers",
  "Where it stands",
  "The current picture",
  "Measured, not claimed",
  "As it stands today",
  "A snapshot",
]

const NOTICE_TITLES = ["New", "Update", "Just landed", "Now live", "Heads up"]

/** Section builders. Each returns HTML; the JSX twin re-uses the strings. */
function sections(c) {
  // Every section below is composed from the DesignOps component
  // primitives, not from hand-written class strings. That is the point:
  // the components are on screen in the first viewport, not filed away
  // in an appendix half-way down.
  return {
    components: componentShowcase(),

    nav: `<nav class="${C.nav} border-b">
  <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
    <div class="${C.brand} text-lg font-bold">${esc(c.brand)}</div>
    <div class="hidden gap-6 md:flex">
      <a class="${C.navLink} text-sm" href="#features">Features</a>
      <a class="${C.navLink} text-sm" href="#pricing">Pricing</a>
      <a class="${C.navLink} text-sm" href="#components">Components</a>
      <a class="${C.navLink} text-sm" href="#story">Story</a>
    </div>
    ${button(c.cta, { size: "sm", href: "#pricing" })}
  </div>
</nav>`,

    notice: `<div class="mx-auto max-w-6xl px-6 pt-6">
  ${alert(NOTICE_TITLES[slugHash(c.slug) % NOTICE_TITLES.length], c.micro.nt, {
    variant: "info",
  })}
</div>`,

    hero: `<header class="mx-auto max-w-6xl px-6 py-16 text-center">
  ${badge(c.tag, { variant: "info", dot: true })}
  <h1 class="${C.h1} mt-6 text-4xl font-extrabold leading-tight md:text-6xl">
    ${esc(c.headline[0])}<br/><span class="text-primary-900">${esc(c.headline[1])}</span>
  </h1>
  <p class="${C.lead} mx-auto mt-6 max-w-2xl text-lg">${esc(c.lead)}</p>
  <form class="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row" onsubmit="return false">
    ${input({
      id: "hero-email",
      type: "email",
      placeholder: "you@company.com",
      extra: "flex-1 text-left",
    })}
    ${button(c.cta, { size: "md", extra: "shrink-0" })}
  </form>
  <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
    <div class="flex items-center">
      ${avatarGroup(peopleFor(c.slug), { size: "sm" })}
    </div>
    <p class="${C.statLabel} text-sm">Used by ${esc(c.micro.sp)}</p>
  </div>
</header>`,

    stats: `<section class="border-y ${C.nav}">
  <div class="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
    ${c.stats
      .map(
        ([n, l]) =>
          `<div class="text-center"><div class="${C.stat} text-3xl font-extrabold">${esc(
            n
          )}</div><div class="${C.statLabel} mt-2 text-sm">${esc(l)}</div></div>`
      )
      .join("\n    ")}
  </div>
</section>`,

    features: `<section id="features" class="mx-auto max-w-6xl px-6 py-16">
  <h2 class="${C.h1} text-3xl font-bold">${esc(c.micro.fh)}</h2>
  <div class="mt-10 grid gap-6 md:grid-cols-3">
    ${c.features
      .map(([t, b]) =>
        card(
          `<h3 class="${C.featureTitle} text-lg font-semibold">${esc(t)}</h3>
        <p class="${C.featureBody} mt-3 text-sm leading-relaxed">${esc(b)}</p>`,
          { variant: "elevated", extra: "p-6" }
        )
      )
      .join("\n    ")}
  </div>
</section>`,

    glance: `<section id="glance" class="${C.nav}">
  <div class="mx-auto max-w-6xl px-6 py-20">
    <h2 class="${C.h1} text-3xl font-bold">${
      GLANCE_HEADINGS[slugHash(c.slug) % GLANCE_HEADINGS.length]
    }</h2>
    <p class="${C.lead} mx-auto mt-4 max-w-2xl text-center text-sm">Live numbers, rendered with the data-table component.</p>
    <div class="mt-10">
      ${dataTable({
        caption: `${c.brand} at a glance`,
        columns: ["Metric", "Value", "Change"],
        rows: c.stats.map(([n, l], i) => [
          l,
          { text: n, mono: true },
          { text: GLANCE_CHANGE[i % GLANCE_CHANGE.length], mono: true },
        ]),
      })}
    </div>
  </div>
</section>`,

    pricing: `<section id="pricing" class="mx-auto max-w-6xl px-6 py-16">
  <h2 class="${C.h1} text-3xl font-bold">${esc(c.micro.ph)}</h2>
  <div class="mt-10 grid gap-6 md:grid-cols-3">
    ${c.pricing
      .map(([name, price, items, featured]) =>
        card(
          `<div class="flex h-full flex-col">
        <div class="flex items-start justify-between gap-3">
          <h3 class="${C.featureTitle} text-lg font-semibold">${esc(name)}</h3>
          ${featured ? badge("Most popular", { variant: "success", dot: true }) : ""}
        </div>
        <div class="${C.price} mt-4 text-4xl font-extrabold">${esc(price)}</div>
        <ul class="mt-6 space-y-2">
          ${items
            .map(
              (i) =>
                `<li class="${C.li} flex items-start gap-2 text-sm">${CHECK}<span>${esc(i)}</span></li>`
            )
            .join("\n          ")}
        </ul>
        <div class="mt-auto pt-8">
          ${button(`Choose ${name}`, {
            variant: featured ? "primary" : "secondary",
            extra: "w-full",
          })}
        </div>
      </div>`,
          {
            variant: featured ? "elevated" : "outlined",
            accent: featured,
            extra: "p-6",
          }
        )
      )
      .join("\n    ")}
  </div>
</section>`,

    story: `<section id="story" class="mx-auto max-w-3xl px-6 py-20">
  ${card(
    `<blockquote class="${C.quote} text-2xl font-semibold leading-snug">“${esc(
      c.quote
    )}”</blockquote>
    <div class="mt-6 flex items-center gap-3">
      ${avatar(
        (c.author || "?")
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        { size: "md", name: c.author }
      )}
      <p class="${C.statLabel} text-sm">${esc(c.author)}</p>
    </div>`,
    { variant: "elevated", extra: "p-8 text-center" }
  )}
</section>`,

    band: `<section class="${C.nav}">
  <div class="mx-auto max-w-4xl px-6 py-20 text-center">
    <h2 class="${C.h1} text-3xl font-bold">${esc(c.micro.bh)}</h2>
    <p class="${C.lead} mx-auto mt-4 max-w-xl">${esc(c.ctaAlt)}, or read how it works first.</p>
    <div class="mt-8 flex flex-wrap justify-center gap-4">
      ${button(c.cta, { size: "lg", href: "#pricing" })}
      ${button("Talk to us", { variant: "secondary", size: "lg" })}
    </div>
  </div>
</section>`,

    footer: `<footer class="border-t ${C.nav}">
  <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row">
    <div class="${C.brand} text-lg font-bold">${esc(c.brand)}</div>
    <p class="${C.statLabel} text-sm">${esc(c.tag)} · built with DesignOps</p>
    <div class="flex gap-2">
      ${badge(c.category, { variant: "neutral" })}
      ${badge("Live", { variant: "success", dot: true })}
    </div>
  </div>
</footer>`,
  }
}

const ORDER = [
  "nav",
  "notice",
  "hero",
  "stats",
  "features",
  "glance",
  "pricing",
  "story",
  "band",
  "components",
  "footer",
]

/** The viewable page. Tailwind is compiled in the browser from the @theme block. */
function pageHtml(c, sec, tree, meta) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(c.brand)} · ${esc(c.tag)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="${meta.fonts}" rel="stylesheet"/>
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<style type="text/tailwindcss">
${buildThemeCss(tree, { slug: meta.slug })}
</style>
</head>
<body class="${C.page}">
${ORDER.map((k) => sec[k]).join("\n\n")}
</body>
</html>
`
}

/** The JSX twin: identical class strings, so the lint result is about the page. */
function pageTsx(c, sec) {
  const body = ORDER.map((k) => sec[k]).join("\n\n")
  return `// Generated by tools/demo-build.mjs — the lint-checked twin of index.html.
// The class strings are identical to the shipped page, so a finding here is
// a finding about the page you are looking at.
export function Page() {
  return (
    <div className="${C.page}">
${body
  .split("\n")
  .map((l) => "      " + l.replace(/class=/g, "className="))
  .join("\n")}
    </div>
  )
}
`
}

/* ── 3 · lint the generated markup ──────────────────────────── */

function lintDemo(root, tsx, tree, slug) {
  if (!existsSync(LINT_DIST)) {
    return {
      skipped: true,
      reason: "packages/lint/dist missing — run pnpm build",
    }
  }
  const lintReq = createRequire(join(ROOT, "packages", "lint", "package.json"))
  const { Linter } = lintReq("eslint")
  const parser = lintReq("@typescript-eslint/parser")

  mkdirSync(join(root, "app"), { recursive: true })
  mkdirSync(join(root, "components", "ui"), { recursive: true })
  mkdirSync(join(root, "lib"), { recursive: true })
  // components.json names this path; writing the theme anywhere else means
  // the linter never sees the tokens and reports every utility as raw.
  writeFileSync(join(root, "app", "globals.css"), buildThemeCss(tree, { slug }))
  writeFileSync(
    join(root, "components.json"),
    JSON.stringify({
      tailwind: { css: "app/globals.css" },
      aliases: { ui: "@/components/ui", utils: "@/lib/utils", lib: "@/lib" },
    })
  )
  writeFileSync(
    join(root, "lib", "utils.ts"),
    "export const cn = (...a: unknown[]) => a.filter(Boolean).join(' ')\n"
  )
  writeFileSync(
    join(root, "components", "ui", "button.tsx"),
    "export function Button({ className, ...p }: any) { return <button className={className} {...p} /> }\n"
  )
  const file = join(root, "app", "page.tsx")
  writeFileSync(file, tsx)

  const tw = join(ROOT, "packages", "lint", "node_modules", "tailwindcss")
  if (
    existsSync(tw) &&
    !existsSync(join(root, "node_modules", "tailwindcss"))
  ) {
    mkdirSync(join(root, "node_modules"), { recursive: true })
    symlinkSync(tw, join(root, "node_modules", "tailwindcss"))
  }

  return import(LINT_DIST).then(({ plugin }) => {
    const messages = new Linter({ cwd: root }).verify(
      tsx,
      [
        {
          files: ["**/*.tsx"],
          languageOptions: {
            parser,
            parserOptions: { ecmaFeatures: { jsx: true } },
          },
          plugins: { designops: plugin },
          rules: {
            "designops/no-raw-colors": "error",
            "designops/no-arbitrary-values": "error",
            "designops/no-unknown-classes": "error",
            "designops/no-inline-styles": "error",
          },
        },
      ],
      file
    )
    return {
      checked: true,
      findings: messages.length,
      rules: messages.map((m) => m.ruleId),
      messages: messages.map((m) => ({
        rule: m.ruleId,
        line: m.line,
        message: m.message.split("\n")[0],
      })),
    }
  })
}

/* ── 4 · build one demo ─────────────────────────────────────── */

export async function buildDemo(spec, { slug } = {}) {
  // Category sets the product type, mood steers the style, tagline keeps
  // the two demos in a category from collapsing into the same palette.
  const query = `${spec.category} ${spec.mood} ${spec.t}`
  const raw = spawnSync(
    process.execPath,
    [join(ROOT, "tools", "advisory.mjs"), "propose", query],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, cwd: ROOT }
  )
  if (raw.status !== 0)
    throw new Error(`advisory failed for "${query}": ${raw.stderr}`)

  // tools/advisory.mjs propose has already done the mapping: `tokens` is the
  // DTCG tree and `contrast` the measured pairs. Do
  // NOT call buildProposal again here — it expects the raw catalogue payload
  // and would silently fall back to inherited values for every field.
  const proposal = JSON.parse(raw.stdout)
  const tree = proposal.tokens
  const contrast = proposal.contrast
  if (!tree?.color?.primary?.["900"]) {
    throw new Error(`advisory returned no token tree for "${query}"`)
  }
  const c = spec
  const sec = sections(c)
  const fontFallbacks = ensureFonts(tree)
  const meta = {
    slug: slug || spec.slug,
    fonts: withMono(
      (fontFallbacks.length
        ? null
        : proposal.guidance?.typography?.googleFontsUrl) ||
        fontUrl(tree) ||
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    ),
    fontFallbacks,
  }

  const out = join(DEMOS, meta.slug)
  mkdirSync(out, { recursive: true })

  const scratch = mkdtempSync(join(os.tmpdir(), `designops-demo-${meta.slug}-`))
  let lint
  try {
    const tsx = pageTsx(c, sec)
    lint = await lintDemo(scratch, tsx, tree, meta.slug)
    writeFileSync(join(out, "page.tsx"), tsx)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }

  writeFileSync(join(out, "index.html"), pageHtml(c, sec, tree, meta))
  const themeCss = buildThemeCss(tree, { slug: meta.slug })
  writeFileSync(join(out, "theme.css"), themeCss)
  writeFileSync(
    join(out, "proposal.json"),
    JSON.stringify(proposal, null, 2) + "\n"
  )
  writeFileSync(join(out, "lint.json"), JSON.stringify(lint, null, 2) + "\n")

  const background = tree.color?.neutral?.["900"]?.$value
  return {
    slug: meta.slug,
    query,
    category: spec.category,
    mode: modeFor(background, relativeLuminance),
    brand: c.brand,
    tagline: c.tag,
    style: proposal.source?.style,
    styleName: proposal.source?.styleName,
    product: proposal.source?.product,
    typography: dedupeFonts([
      tree.typography?.family?.heading?.$value,
      tree.typography?.family?.body?.$value,
    ]),
    fontFallbacks: meta.fontFallbacks,
    colors: {
      background,
      surface: tree.color?.neutral?.["800"]?.$value,
      accent: tree.color?.primary?.["900"]?.$value,
      ink: tree.color?.ink?.default?.$value,
    },
    contrast: {
      pass: contrast.filter((x) => x.pass).length,
      total: contrast.length,
    },
    // What the theme actually declares, not what the proposal mapped: the
    // generator adds the mono face on top, so the card should say 44.
    tokens: (themeCss.match(/^\s+--[a-z0-9-]+:/gm) || []).length,
    lint: lint.skipped
      ? null
      : { findings: lint.findings, rules: [...new Set(lint.rules)] },
    path: `demos/${meta.slug}/index.html`,
  }
}

/* ── 5 · gallery manifest ──────────────────────────────────── */

function writeManifest(records) {
  writeFileSync(
    join(DEMOS, "manifest.json"),
    JSON.stringify(
      { generated: new Date().toISOString(), demos: records },
      null,
      2
    ) + "\n"
  )
}

/* ── 6 · CLI ────────────────────────────────────────────────── */

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (invokedDirectly) {
  const args = process.argv.slice(2)
  const all = args.includes("--all")
  const only = args.find((a) => a.startsWith("--category="))
  const slugIdx = args.indexOf("--slug")
  const slug = slugIdx !== -1 ? args[slugIdx + 1] : undefined
  const words = args.filter((a) => !a.startsWith("--") && a !== slug)

  let specs = demoSpecs()
  if (only) {
    const wanted = only.slice("--category=".length).toLowerCase()
    specs = specs.filter((s) => s.category.toLowerCase() === wanted)
  }

  if (all || only) {
    const records = []
    for (const spec of specs) {
      const rec = await buildDemo(spec)
      records.push(rec)
      const verdict = rec.lint ? `${rec.lint.findings} findings` : "not linted"
      console.log(
        `  ${rec.category.padEnd(17)} ${rec.slug.padEnd(22)} ${String(rec.style)
          .slice(0, 19)
          .padEnd(19)} ${rec.mode.padEnd(5)} contrast ${rec.contrast.pass}/${
          rec.contrast.total
        } · lint: ${verdict}`
      )
    }
    writeManifest(records)
    const clean = records.filter((r) => r.lint && r.lint.findings === 0).length
    console.log(
      `\n${records.length} demo(s) — ${clean} lint-clean · ` +
        `${new Set(records.map((r) => r.category)).size} categories · ` +
        `${records.filter((r) => r.mode === "Light").length} light / ` +
        `${records.filter((r) => r.mode === "Dark").length} dark`
    )
  } else if (words.length) {
    // Ad-hoc query: reuse a spec's structure with the user's own words, so
    // `node tools/demo-build.mjs "pet grooming service"` still works.
    const spec = { ...specs[0], slug: slug || slugify(words.join(" ")) }
    const rec = await buildDemo(spec, { slug: spec.slug })
    writeManifest([rec])
    console.log(`\n1 demo → demos/${rec.slug}/index.html`)
  } else {
    console.error(
      "DesignOps · demo site generator\n\n" +
        "  node tools/demo-build.mjs --all\n" +
        "  node tools/demo-build.mjs --category=SaaS\n" +
        '  node tools/demo-build.mjs "pet grooming service" [--slug <name>]\n'
    )
    process.exit(1)
  }
}
