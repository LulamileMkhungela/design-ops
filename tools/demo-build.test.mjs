/**
 * DesignOps · demo gallery tests
 *
 *   node --test tools/demo-build.test.mjs
 *
 * These test the SHIPPED galleries in demos/, not the generator in
 * isolation. The invariant that matters is the one the gallery advertises:
 * the page you can open and the JSX the linter reads carry identical class
 * strings, and neither contains a raw palette utility or an arbitrary
 * value. If someone edits the template and regenerates, this catches it.
 *
 * Skips when demos/ has not been generated: `node tools/demo-build.mjs --all`.
 */

import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const DEMOS = join(ROOT, "demos")
const MANIFEST = join(DEMOS, "manifest.json")

const BUILT = existsSync(MANIFEST)
const manifest = BUILT
  ? JSON.parse(readFileSync(MANIFEST, "utf8"))
  : { demos: [] }

/**
 * Tailwind's built-in palette names, plus white and black.
 *
 * `neutral` is in this list on purpose: DesignOps's own surface scale is
 * color.neutral.*, which shadows Tailwind's built-in neutral ramp. The
 * linter resolves it correctly because the theme declares every
 * --color-neutral-* it uses, but a stray neutral-500 would silently fall
 * through to Tailwind's grey. Checks below therefore compare against the
 * tokens a demo actually declares, not against this name list alone.
 */
const PALETTE_NAMES =
  "white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose"
const PALETTE_CLASS = new RegExp(
  `^(?:[a-z-]+:)*(?:bg|text|border|from|to|via|ring|divide|placeholder|caret|accent|outline|fill|stroke|decoration|shadow)-(?:${PALETTE_NAMES})(?:-\\d{2,3})?$`
)

/** The colour/font/scale tokens a demo's theme actually declares. */
const declaredTokens = (themeCss) =>
  new Set(
    [
      ...themeCss.matchAll(
        /(--(?:color|font|radius|space|text|shadow)-[a-z0-9-]+)\s*:/g
      ),
    ].map((m) => m[1])
  )

/** The token a colour utility would resolve to, or null if it is not one. */
const tokenFor = (cls) => {
  const m = cls
    .replace(/^[a-z-]+:/, "")
    .match(/^(bg|text|border|from|to|via|ring|font)-(.+)$/)
  if (!m) return null
  const [, kind, name] = m
  if (!/^[a-z0-9-]+$/.test(name)) return null
  return `--${kind === "font" ? "font" : "color"}-${name}`
}

const classesIn = (source) => {
  const out = []
  for (const m of source.matchAll(/class(?:Name)?="([^"]*)"/g)) {
    out.push(...m[1].split(/\s+/).filter(Boolean))
  }
  return out
}

const stripStyleBlocks = (html) => html.replace(/<style[\s\S]*?<\/style>/g, "")

test("skips loudly when no demos have been generated", { skip: BUILT }, () => {
  assert.fail(
    "demos/manifest.json missing — run `node tools/demo-build.mjs --all`."
  )
})

test(
  "the gallery manifest describes every generated site",
  { skip: !BUILT },
  () => {
    assert.ok(manifest.demos.length > 0, "manifest lists no demos")
    for (const d of manifest.demos) {
      for (const field of [
        "slug",
        "brand",
        "style",
        "typography",
        "colors",
        "contrast",
        "lint",
      ]) {
        assert.ok(d[field], `${d.slug} is missing "${field}"`)
      }
      assert.equal(typeof d.lint.findings, "number", `${d.slug} lint.findings`)
      assert.ok(d.contrast.total > 0, `${d.slug} recorded no contrast checks`)
    }
  }
)

test(
  "every demo ships a page, a lint-checked twin, a theme and a result",
  { skip: !BUILT },
  () => {
    for (const d of manifest.demos) {
      for (const file of [
        "index.html",
        "page.tsx",
        "theme.css",
        "lint.json",
        "proposal.json",
      ]) {
        assert.ok(
          existsSync(join(DEMOS, d.slug, file)),
          `demos/${d.slug}/${file} is missing`
        )
      }
    }
  }
)

test(
  "every demo passes @designops/lint with zero findings",
  { skip: !BUILT },
  () => {
    for (const d of manifest.demos) {
      const lint = JSON.parse(
        readFileSync(join(DEMOS, d.slug, "lint.json"), "utf8")
      )
      assert.equal(
        lint.findings,
        0,
        `demos/${d.slug} has ${lint.findings} finding(s):\n` +
          lint.messages.map((m) => `  ${m.rule}: ${m.message}`).join("\n")
      )
      // The manifest must not claim cleaner than the artefact says.
      assert.equal(
        d.lint.findings,
        lint.findings,
        `${d.slug} manifest disagrees with lint.json`
      )
    }
  }
)

test(
  "what you see is what was checked: html and tsx carry identical classes",
  { skip: !BUILT },
  () => {
    for (const d of manifest.demos) {
      const html = stripStyleBlocks(
        readFileSync(join(DEMOS, d.slug, "index.html"), "utf8")
      )
      const tsx = readFileSync(join(DEMOS, d.slug, "page.tsx"), "utf8")
      const fromHtml = classesIn(html)
      const fromTsx = classesIn(tsx)
      assert.ok(
        fromHtml.length > 50,
        `${d.slug} produced suspiciously few classes`
      )
      assert.deepEqual(
        fromHtml,
        fromTsx,
        `demos/${d.slug}: the shipped page and the linted twin have diverged\n` +
          `  only in html: ${fromHtml.filter((c) => !fromTsx.includes(c)).slice(0, 5)}\n` +
          `  only in tsx:  ${fromTsx.filter((c) => !fromHtml.includes(c)).slice(0, 5)}`
      )
    }
  }
)

test(
  "no demo uses an undeclared palette colour or an arbitrary value",
  { skip: !BUILT },
  () => {
    for (const d of manifest.demos) {
      const theme = declaredTokens(
        readFileSync(join(DEMOS, d.slug, "theme.css"), "utf8")
      )
      const html = stripStyleBlocks(
        readFileSync(join(DEMOS, d.slug, "index.html"), "utf8")
      )
      const tsx = readFileSync(join(DEMOS, d.slug, "page.tsx"), "utf8")
      for (const [label, source] of [
        ["index.html", html],
        ["page.tsx", tsx],
      ]) {
        const classes = classesIn(source)
        // A palette-named utility is only a violation when the theme does not
        // declare the token it resolves to — that is the difference between
        // DesignOps's color.neutral.* surface scale and Tailwind's grey ramp.
        const raw = classes.filter(
          (c) => PALETTE_CLASS.test(c) && !theme.has(tokenFor(c))
        )
        assert.deepEqual(
          raw,
          [],
          `demos/${d.slug}/${label} uses raw palette colours: ${raw.join(", ")}`
        )
        const arbitrary = classes.filter((c) => /\[[^\]]+\]/.test(c))
        assert.deepEqual(
          arbitrary,
          [],
          `demos/${d.slug}/${label} uses arbitrary values: ${arbitrary.join(", ")}`
        )
      }
    }
  }
)

test(
  "every colour and font class resolves to a declared token",
  { skip: !BUILT },
  () => {
    // Text size and weight utilities (text-sm, font-bold) are Tailwind's own
    // scale, not colours; a demo is allowed to use them.
    const NON_COLOUR_TEXT =
      /^(?:[a-z-]+:)*text-(?:xs|sm|base|lg|xl|\d?xl|left|center|right|justify)$/
    const NON_COLOUR_FONT =
      /^(?:[a-z-]+:)*font-(?:thin|light|normal|medium|semibold|bold|extrabold|black)$/
    // border, border-b, border-x … are widths, not colours. So are
    // border-collapse / border-separate / border-spacing, which are table
    // layout utilities that happen to start with the same prefix.
    const NON_COLOUR_BORDER =
      /^(?:[a-z-]+:)*border(?:-[trblxy]|-\d|-(?:collapse|separate|spacing))?$/

    for (const d of manifest.demos) {
      const theme = declaredTokens(
        readFileSync(join(DEMOS, d.slug, "theme.css"), "utf8")
      )
      const tsx = readFileSync(join(DEMOS, d.slug, "page.tsx"), "utf8")
      for (const cls of classesIn(tsx)) {
        const bare = cls.replace(/^[a-z-]+:/, "")
        if (NON_COLOUR_TEXT.test(bare) || NON_COLOUR_FONT.test(bare)) continue
        if (NON_COLOUR_BORDER.test(bare)) continue
        const token = tokenFor(cls)
        if (!token) continue
        assert.ok(
          theme.has(token),
          `demos/${d.slug}: "${cls}" resolves to ${token}, which theme.css never declares`
        )
      }
    }
  }
)

test(
  "each demo has its own palette, not the default system one",
  { skip: !BUILT },
  () => {
    const accents = manifest.demos.map((d) => d.colors.accent)
    // With forty demos the catalogue inevitably hands the same accent to
    // more than one product type. What must hold is that the palette is
    // actually varying — not that every single one is unique.
    assert.ok(
      new Set(accents).size >= Math.min(12, Math.ceil(accents.length / 3)),
      `only ${new Set(accents).size} distinct accents across ${
        accents.length
      } demos — the proposal is not reaching the theme`
    )
    const defaultTokens = JSON.parse(
      readFileSync(join(ROOT, "tokens", "tokens.json"), "utf8")
    )
    const defaultPrimary =
      defaultTokens.color.primary["900"].$value.toLowerCase()
    for (const d of manifest.demos) {
      assert.notEqual(
        String(d.colors.accent).toLowerCase(),
        defaultPrimary,
        `demos/${d.slug} fell back to the default system accent (${defaultPrimary})`
      )
    }
  }
)

/**
 * The twenty categories the gallery covers. Hard-coded here on purpose:
 * this is the promise the gallery makes, and it should break loudly the
 * day the category set changes.
 */
const GALLERY_CATEGORIES = [
  "SaaS",
  "Education",
  "Pet Services",
  "AI/Chatbot",
  "E-commerce",
  "Fintech/Crypto",
  "Healthcare",
  "Creative",
  "Real Estate",
  "Gaming",
  "Food & Restaurant",
  "Fitness",
  "Travel",
  "NFT/Web3",
  "Beauty/Spa",
  "Developer Tools",
  "Entertainment",
  "Legal",
  "Events",
  "Other",
]

test(
  "the gallery covers every category, with more than one demo each",
  { skip: !BUILT },
  async () => {
    const { CATEGORIES } = await import("./demo-content.mjs")
    const declared = CATEGORIES.map((c) => c.name)

    assert.deepEqual(
      declared,
      GALLERY_CATEGORIES,
      "demo-content.mjs no longer matches the gallery category set"
    )

    const byCategory = new Map()
    for (const d of manifest.demos) {
      assert.ok(d.category, `${d.slug} has no category`)
      byCategory.set(d.category, (byCategory.get(d.category) || 0) + 1)
    }

    for (const cat of GALLERY_CATEGORIES) {
      const n = byCategory.get(cat) || 0
      assert.ok(
        n >= 2,
        `category "${cat}" has ${n} demo(s) — the gallery promises at least two`
      )
    }
    assert.equal(
      byCategory.size,
      GALLERY_CATEGORIES.length,
      `manifest has ${byCategory.size} categories, expected ${GALLERY_CATEGORIES.length}`
    )
  }
)

test("every demo is tagged Light or Dark", { skip: !BUILT }, () => {
  for (const d of manifest.demos) {
    assert.ok(
      d.mode === "Light" || d.mode === "Dark",
      `${d.slug} has mode "${d.mode}" — the gallery filter needs one of the two`
    )
  }
  const modes = new Set(manifest.demos.map((d) => d.mode))
  assert.ok(modes.size === 2, "the gallery has no light/dark mix to filter on")
})

/**
 * The point of the restructure: demos must exercise the real DesignOps
 * components, not just inherit the tokens. Each page carries a Components
 * section rendering all eight.
 */
const COMPONENTS = [
  "Button",
  "Input Field",
  "Badge / Chip",
  "Card",
  "Alert",
  "Avatar",
  "Data Table",
  "Toast",
]

test(
  "every demo renders all eight DesignOps components",
  { skip: !BUILT },
  () => {
    for (const d of manifest.demos) {
      const html = readFileSync(join(DEMOS, d.slug, "index.html"), "utf8")
      for (const name of COMPONENTS) {
        assert.ok(
          html.includes(`>${name}<`),
          `demos/${d.slug} does not render the ${name} component`
        )
      }
      assert.ok(
        html.includes('id="components"'),
        `demos/${d.slug} has no component showcase section`
      )
    }
  }
)

/**
 * A component buried at the bottom of the page is not "a demo using the
 * components" — you cannot see it, and the gallery thumbnail stops well
 * above it. These are the markers each component leaves in the markup,
 * checked first in the whole page and then again above the fold.
 */
const COMPONENT_MARKERS = {
  button: "font-medium transition-opacity",
  input: '<input class="w-full rounded-md border',
  badge: "rounded-full px-3 py-1 text-xs font-medium",
  card: "rounded-lg border border-neutral-700 bg-neutral-800 shadow-md",
  alert: 'role="status"',
  avatar: "rounded-full bg-primary-900 font-heading",
  "data-table": '<table class="w-full border-collapse"',
  toast: "shadow-lg",
}

test(
  "every demo is built from the components, not just token-styled markup",
  { skip: !BUILT },
  () => {
    for (const d of manifest.demos) {
      const html = readFileSync(join(DEMOS, d.slug, "index.html"), "utf8")
      for (const [name, marker] of Object.entries(COMPONENT_MARKERS)) {
        assert.ok(
          html.includes(marker),
          `demos/${d.slug} never renders the ${name} component`
        )
      }
    }
  }
)

test(
  "components are visible above the fold, not only in the appendix",
  { skip: !BUILT },
  () => {
    // Everything before the features section is what the gallery
    // thumbnail actually shows.
    const aboveFold = ["button", "input", "badge", "alert", "avatar"]
    for (const d of manifest.demos) {
      const html = readFileSync(join(DEMOS, d.slug, "index.html"), "utf8")
      const head = html.slice(
        html.indexOf("<body"),
        html.indexOf('id="features"')
      )
      assert.ok(
        html.indexOf('id="features"') > 0,
        `demos/${d.slug} has no features section to split the fold on`
      )
      for (const name of aboveFold) {
        assert.ok(
          head.includes(COMPONENT_MARKERS[name]),
          `demos/${d.slug} renders ${name} only below the fold`
        )
      }
    }
  }
)

test(
  "the component showcase is token-only, like the rest of the page",
  { skip: !BUILT },
  async () => {
    const { componentShowcase } = await import("./demo-components.mjs")
    const html = componentShowcase()
    const classes = [...html.matchAll(/class="([^"]+)"/g)]
      .flatMap((m) => m[1].split(/\s+/))
      .filter(Boolean)

    const arbitrary = classes.filter((c) => /\[[^\]]+\]/.test(c))
    assert.equal(
      arbitrary.length,
      0,
      `component showcase uses arbitrary values: ${arbitrary.join(", ")}`
    )

    // Only utility prefixes that resolve against a declared colour token.
    const rawPalette = classes.filter(
      (c) =>
        PALETTE_CLASS.test(c) &&
        /-(?:white|black|gray|slate|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?$/.test(
          c
        )
    )
    assert.equal(
      rawPalette.length,
      0,
      `component showcase uses raw palette utilities: ${rawPalette.join(", ")}`
    )
  }
)

test(
  "no demo renders a placeholder or an undefined value",
  { skip: !BUILT },
  () => {
    for (const d of manifest.demos) {
      const html = readFileSync(join(DEMOS, d.slug, "index.html"), "utf8")
      // A template that destructures the wrong arity ships visible
      // "undefined" in a button label — this catches that class of bug.
      assert.ok(
        !html.includes("undefined"),
        `demos/${d.slug} renders the string "undefined"`
      )
      for (const bad of ["lorem ipsum", "[object Object]", "NaN"]) {
        assert.ok(
          !html.toLowerCase().includes(bad),
          `demos/${d.slug} renders "${bad}"`
        )
      }
    }
  }
)

test(
  "the bundled fallback matches the generated manifest",
  { skip: !BUILT },
  () => {
    const src = readFileSync(join(ROOT, "assets", "data.js"), "utf8")
    const fallback = new Function(src + "; return DEMO_FALLBACK")()
    assert.equal(
      fallback.demos.length,
      manifest.demos.length,
      `DEMO_FALLBACK has ${fallback.demos.length} demos, manifest has ${
        manifest.demos.length
      } — regenerate with the build`
    )
    assert.equal(
      fallback.categories.length,
      GALLERY_CATEGORIES.length,
      `DEMO_FALLBACK lists ${fallback.categories.length} categories, expected ${
        GALLERY_CATEGORIES.length
      }`
    )
    for (const d of fallback.demos) {
      assert.ok(d.category, `fallback demo ${d.slug} has no category`)
      assert.ok(
        d.mode === "Light" || d.mode === "Dark",
        `fallback demo ${d.slug} has mode "${d.mode}"`
      )
    }
  }
)
