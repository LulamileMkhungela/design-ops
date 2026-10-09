#!/usr/bin/env node
/**
 * DesignOps · advisory bridge
 * ─────────────────────────────────────────────────────────────
 * The seam between the vendored design-intelligence catalogue
 * (packages/advisory) and the DesignOps token pipeline.
 *
 *   node tools/advisory.mjs search "form validation errors" --domain ux
 *   node tools/advisory.mjs search "server components" --stack nextjs
 *   node tools/advisory.mjs propose "dark fintech dashboard" [--write] [--json]
 *   node tools/advisory.mjs check
 *
 * `search` is a thin, path-safe passthrough to the vendored Python CLI.
 *
 * `propose` is where the two projects actually meet. It turns an advisory
 * design system — a style, a palette, a font pairing, some UX guidance —
 * into a W3C DTCG token proposal in the same shape as tokens/tokens.json:
 *
 *   advisory field        →  token path            how
 *   colors.primary        →  color.primary.900     advisory
 *   colors.primary        →  color.primary.800     derived (hover, OKLab L)
 *   colors.primary        →  color.primary.50      derived (wash)
 *   colors.background     →  color.neutral.900     advisory
 *   colors.card           →  color.neutral.800     advisory
 *   colors.secondary      →  color.neutral.700     advisory
 *   colors.muted          →  color.neutral.600     advisory
 *   colors.foreground     →  color.ink.default     advisory
 *   colors.muted_fore..   →  color.ink.muted       advisory
 *   colors.destructive    →  color.danger.600      advisory
 *   typography.heading    →  typography.family.*   advisory
 *   spacing_scale         →  space.1 … space.7     advisory (density dial)
 *   everything else       →  unchanged             inherited
 *
 * Two rules govern the bridge, and they are the whole point of vendoring
 * rather than forking:
 *
 *   1. The advisory is ADVISORY. `propose` writes to tokens/proposals/,
 *      never to tokens/tokens.json. A human promotes it.
 *   2. DesignOps owns the checks. The catalogue hands over a palette it has
 *      never measured, so this tool measures it — WCAG contrast on every
 *      pair the system actually renders — and reports the numbers.
 *
 * Requires Python 3.x (standard library only) for the catalogue search.
 */
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, "..")
const ADVISORY = join(ROOT, "packages", "advisory")
const SEARCH_PY = join(ADVISORY, "scripts", "search.py")
const TOKENS = join(ROOT, "tokens", "tokens.json")
const PROPOSALS = join(ROOT, "tokens", "proposals")

const UPSTREAM = "nextlevelbuilder/ui-ux-pro-max-skill@1a2c459"

/* ── 1 · running the vendored catalogue ─────────────────────── */

function pythonBin() {
  for (const bin of ["python3", "python", "py"]) {
    const probe = spawnSync(bin, ["-c", "import sys; sys.exit(0)"], {
      stdio: "ignore",
    })
    if (!probe.error && probe.status === 0) return bin
  }
  return null
}

/**
 * Run the vendored search CLI. Uses execFileSync with an argument array, so
 * a query containing shell metacharacters is never interpreted.
 */
function runAdvisory(args) {
  const bin = pythonBin()
  if (!bin) {
    throw new Error(
      "Python 3 was not found. The advisory catalogue needs it (standard " +
        "library only). Install Python 3.x, or run the search directly: " +
        "python3 packages/advisory/scripts/search.py --help"
    )
  }
  if (!existsSync(SEARCH_PY)) {
    throw new Error(
      `Vendored catalogue is missing at ${SEARCH_PY}. See packages/advisory/VENDOR.md.`
    )
  }
  const res = spawnSync(bin, [SEARCH_PY, ...args], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    cwd: ADVISORY,
  })
  if (res.error) throw res.error
  if (res.status !== 0) {
    throw new Error(
      `packages/advisory/scripts/search.py exited ${res.status}:\n${res.stderr || ""}`
    )
  }
  return res.stdout
}

/* ── 2 · colour maths (sRGB → OKLab, WCAG contrast) ─────────── */

const clamp01 = (n) => Math.min(1, Math.max(0, n))

/** Accepts `#rgb`, `#rrggbb`, with or without `#`. Returns null if invalid. */
export function parseHex(hex) {
  if (typeof hex !== "string") return null
  let h = hex.trim().replace(/^#/, "")
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("")
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

export function toHex([r, g, b]) {
  const part = (v) =>
    Math.round(clamp01(v) * 255)
      .toString(16)
      .padStart(2, "0")
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase()
}

const srgbToLinear = (c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
const linearToSrgb = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055

/** Björn Ottosson's OKLab transform. */
export function rgbToOklab([r, g, b]) {
  const lr = srgbToLinear(r)
  const lg = srgbToLinear(g)
  const lb = srgbToLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

export function oklabToRgb([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)].map(clamp01)
}

/** Interpolate two hex colours in OKLab. t=0 → from, t=1 → to. */
export function mix(from, to, t) {
  const a = rgbToOklab(parseHex(from))
  const b = rgbToOklab(parseHex(to))
  return toHex(oklabToRgb([0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t)))
}

/** Shift OKLab lightness. amount > 0 lightens. */
export function shiftLightness(hex, amount) {
  const [L, A, B] = rgbToOklab(parseHex(hex))
  return toHex(oklabToRgb([clamp01(L + amount), A, B]))
}

export function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex).map(srgbToLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a, b) {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * CSS composites rgba over its backdrop per channel in sRGB space, so the
 * alpha an advisory "muted" colour implies can be solved directly. Returns
 * null when the three channels disagree, i.e. the colour is not a composite
 * of `fg` over `bg` and should be emitted opaque instead.
 */
export function impliedAlpha(fg, bg, target) {
  const f = parseHex(fg)
  const b = parseHex(bg)
  const t = parseHex(target)
  if (!f || !b || !t) return null
  const alphas = [0, 1, 2]
    .map((i) =>
      Math.abs(f[i] - b[i]) < 1e-6 ? null : (t[i] - b[i]) / (f[i] - b[i])
    )
    .filter((a) => a !== null)
  if (alphas.length < 3) return null
  const lo = Math.min(...alphas)
  const hi = Math.max(...alphas)
  if (hi - lo > 0.15) return null
  const a = alphas.reduce((s, v) => s + v, 0) / alphas.length
  if (a <= 0.05 || a >= 1) return null
  return Math.round(a * 100) / 100
}

/* ── 3 · the token bridge ───────────────────────────────────── */

/** Advisory colour field → DesignOps token path. */
const COLOR_MAP = [
  ["background", "color.neutral.900", "app background"],
  ["card", "color.neutral.800", "raised background"],
  ["secondary", "color.neutral.700", "surface"],
  ["muted", "color.neutral.600", "surface hover"],
  ["foreground", "color.ink.default", "default ink"],
  ["muted_foreground", "color.ink.muted", "secondary ink"],
  ["destructive", "color.danger.600", "destructive actions, errors"],
]

/** Advisory fields with no token in the DesignOps tree, and where they go. */
const UNMAPPED_HOMES = {
  on_primary:
    "the foreground of a primary button — `--color-primary-foreground` in your Tailwind v4 @theme block",
  on_secondary:
    "`--color-secondary-foreground` in your Tailwind v4 @theme block",
  on_accent: "`--color-accent-foreground` in your Tailwind v4 @theme block",
  on_destructive:
    "`--color-destructive-foreground` in your Tailwind v4 @theme block",
  card_foreground:
    "same as ink.default on a card; add `--color-card-foreground` if you theme cards separately",
  ring: "`--color-ring` in your Tailwind v4 @theme block; focus visibility is a lint concern, not a token",
  accent:
    "`--color-accent` in your Tailwind v4 @theme block; DesignOps keeps one brand accent (color.primary.900)",
}

/** Advisory spacing scale (density dial) → DesignOps space.1 … space.7. */
const SPACE_MAP = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"]

function flatten(node, path = [], out = new Map()) {
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith("$")) continue
    if (val && typeof val === "object" && "$value" in val) {
      out.set([...path, key].join("."), val)
    } else if (val && typeof val === "object") {
      flatten(val, [...path, key], out)
    }
  }
  return out
}

function unflatten(entries) {
  const root = {}
  for (const [path, token] of entries) {
    let node = root
    const parts = path.split(".")
    parts.forEach((part, i) => {
      if (i === parts.length - 1) node[part] = token
      else node = node[part] ??= {}
    })
  }
  return root
}

const isColor = (v) => typeof v === "string" && parseHex(v) !== null

/**
 * Build a DTCG token proposal from an advisory design system.
 * Returns { tree, mapping, contrast, guidance }.
 */
export function buildProposal(ds, currentTokens) {
  const inherited = flatten(currentTokens)
  const entries = []
  const mapping = []
  const inherit = (path) => {
    const token = inherited.get(path)
    if (!token) return
    entries.push([path, { ...token }])
    mapping.push({
      token: path,
      from: "tokens/tokens.json",
      value: token.$value,
      source: "inherited",
      note: "unchanged from the current system",
    })
  }
  const adopt = (path, value, type, description, from, note) => {
    entries.push([
      path,
      { $value: value, $type: type, $description: description },
    ])
    mapping.push({
      token: path,
      from,
      value,
      source: note ? "derived" : "advisory",
      note,
    })
    return value
  }

  const colors = ds.colors || {}
  const typo = ds.typography || {}
  const styleId = ds.style?.id || "unknown"

  /* -- brand accent ------------------------------------------- */
  const primary = isColor(colors.primary) ? colors.primary : null

  if (primary) {
    adopt(
      "color.primary.900",
      primary,
      "color",
      `Primary 900 — brand accent (advisory: colors.primary for style ${styleId})`,
      "colors.primary"
    )

    // Hover (800): nudge OKLab lightness by 6%, away from mid-grey — a dark
    // accent lifts, a light accent deepens, which is what makes the hover
    // readable either way. DesignOps reads 800 as "the hover state of 900";
    // the catalogue has no hover concept at all.
    const primaryL = rgbToOklab(parseHex(primary))[0]
    const direction = primaryL < 0.5 ? 1 : -1
    const hover = shiftLightness(primary, 0.06 * direction)
    adopt(
      "color.primary.800",
      hover,
      "color",
      `Primary 800 — hover state of 900 (derived in OKLab from the advisory primary)`,
      "colors.primary",
      `derived: OKLab L ${direction > 0 ? "+" : "−"}0.06`
    )

    // Wash (50): a heavy mix toward white, matching the system's existing
    // tint role. Mixed in OKLab so the hue survives.
    adopt(
      "color.primary.50",
      mix(primary, "#FFFFFF", 0.88),
      "color",
      "Primary 50 — subtle tint, hover washes (derived in OKLab from the advisory primary)",
      "colors.primary",
      "derived: mix 88% toward white"
    )
  } else {
    inherit("color.primary.900")
    inherit("color.primary.800")
    inherit("color.primary.50")
  }

  /* -- neutrals and ink --------------------------------------- */
  for (const [field, path, label] of COLOR_MAP) {
    const value = colors[field]
    if (isColor(value)) {
      adopt(
        path,
        value,
        "color",
        `${label} (advisory: colors.${field} for style ${styleId})`,
        `colors.${field}`
      )
    } else {
      inherit(path)
    }
  }

  // Subtle ink: the catalogue stops at one muted level; DesignOps carries
  // three. Derive the third as a composite of ink over the surface.
  const ink = entries.find(([p]) => p === "color.ink.default")?.[1]?.$value
  const surface = entries.find(([p]) => p === "color.neutral.900")?.[1]?.$value
  if (isColor(ink) && isColor(surface)) {
    adopt(
      "color.ink.subtle",
      mix(ink, surface, 0.55),
      "color",
      "Subtle ink — hints, placeholders (derived: ink over surface, 55%)",
      "colors.foreground",
      "derived: mix 55% toward background"
    )
  } else {
    inherit("color.ink.subtle")
  }

  /* -- semantic colours the catalogue does not carry ---------- */
  for (const path of [
    "color.success.600",
    "color.warning.600",
    "color.info.600",
  ]) {
    const token = inherited.get(path)
    if (!token) continue
    entries.push([path, { ...token }])
    mapping.push({
      token: path,
      from: "tokens/tokens.json",
      value: token.$value,
      source: "inherited",
      note: "the catalogue has no success/warning/info palette — kept from the current system",
    })
  }

  /* -- spacing (density dial) --------------------------------- */
  const scale = ds.spacing_scale
  if (scale && typeof scale === "object") {
    SPACE_MAP.forEach((key, i) => {
      const value = scale[key]
      if (typeof value === "string" && /^\d+px$/.test(value)) {
        adopt(
          `space.${i + 1}`,
          value,
          "dimension",
          `Spacing ${i + 1} (advisory: spacing_scale.${key} at density ${
            ds.dials?.density ?? "—"
          })`,
          `spacing_scale.${key}`
        )
      } else {
        inherit(`space.${i + 1}`)
      }
    })
    inherit("space.8")
  } else {
    for (let i = 1; i <= 8; i++) inherit(`space.${i}`)
  }

  /* -- typography --------------------------------------------- */
  if (typo.heading) {
    adopt(
      "typography.family.heading",
      typo.heading,
      "fontFamily",
      `Heading font (advisory: typography.heading — ${typo.mood || "no mood recorded"})`,
      "typography.heading"
    )
  }
  if (typo.body) {
    adopt(
      "typography.family.body",
      typo.body,
      "fontFamily",
      `Body font (advisory: typography.body — ${typo.best_for || "no fit recorded"})`,
      "typography.body"
    )
  }
  for (const size of ["xs", "sm", "base", "lg", "xl"]) {
    inherit(`typography.size.${size}`)
  }
  for (const weight of ["regular", "medium", "bold"]) {
    inherit(`typography.weight.${weight}`)
  }

  /* -- everything else: radius, shadow, motion ---------------- */
  for (const r of ["sm", "md", "lg", "xl", "full"]) inherit(`radius.${r}`)
  for (const s of ["sm", "md", "lg"]) inherit(`shadow.${s}`)
  for (const d of ["fast", "base"]) inherit(`motion.duration.${d}`)
  inherit("motion.easing.out")

  /* -- the checks DesignOps adds ------------------------------ */
  const byPath = new Map(entries)
  const valueOf = (p) => byPath.get(p)?.$value
  // The button label is whatever the catalogue says sits on a primary
  // button; ink.default is only the fallback.
  const onPrimary = isColor(colors.on_primary) ? colors.on_primary : null
  const pairs = [
    [
      "color.ink.default",
      "color.neutral.900",
      4.5,
      "body text on the app background",
    ],
    [
      "color.ink.muted",
      "color.neutral.900",
      4.5,
      "secondary text on the app background",
    ],
    [
      "color.ink.subtle",
      "color.neutral.900",
      3,
      "hints and placeholders (large/UI text)",
    ],
    [
      "color.ink.default",
      "color.neutral.800",
      4.5,
      "body text on a raised card",
    ],
    [
      null,
      "color.primary.900",
      4.5,
      `label on a primary button (${onPrimary ? "advisory colors.on_primary" : "no on_primary — fell back to ink.default"})`,
      onPrimary || null,
    ],
    [
      "color.danger.600",
      "color.neutral.900",
      3,
      "error text and borders on the background",
    ],
    [
      "color.primary.900",
      "color.neutral.900",
      3,
      "accent against the background (UI text)",
    ],
  ]
  const contrast = []
  for (const [fgPath, bgPath, required, note, override] of pairs) {
    const a = override || (fgPath ? valueOf(fgPath) : null)
    const b = valueOf(bgPath)
    if (!isColor(a) || !isColor(b)) continue
    const ratio = Math.round(contrastRatio(a, b) * 100) / 100
    contrast.push({
      foreground: fgPath || "colors.on_primary",
      background: bgPath,
      ratio,
      required,
      pass: ratio >= required,
      note,
    })
  }

  /* -- guidance the catalogue gave that is not a token -------- */
  const unmapped = []
  for (const [field, home] of Object.entries(UNMAPPED_HOMES)) {
    if (colors[field])
      unmapped.push({ field: `colors.${field}`, value: colors[field], home })
  }

  return {
    tree: unflatten(entries),
    mapping,
    contrast,
    guidance: {
      typography: {
        heading: typo.heading || null,
        body: typo.body || null,
        mood: typo.mood || null,
        bestFor: typo.best_for || null,
        googleFontsUrl: typo.google_fonts_url || null,
        cssImport: typo.css_import || null,
      },
      effects: ds.key_effects || null,
      antiPatterns: ds.anti_patterns
        ? String(ds.anti_patterns)
            .split(/\s*,\s*|\s*;\s*/)
            .filter(Boolean)
        : [],
      constraints: ds.constraints || [],
      decisionRules: ds.decision_rules || {},
      severity: ds.severity || null,
      dials: ds.dials || null,
      motion: ds.motion_snippet || null,
      unmappedAdvisoryFields: unmapped,
    },
  }
}

/* ── 4 · Tailwind v4 theme (so the linter can enforce it) ───── */

/**
 * Emit the Tailwind v4 theme the proposal implies. Without this the tokens
 * exist but no linter can see them: @designops/lint reads `--color-*` inside
 * `@theme` to decide which colour utilities are declared.
 */
export function buildThemeCss(tree, { slug }) {
  const flat = flatten(tree)
  const colors = []
  const fonts = []
  const rest = []
  for (const [path, token] of flat) {
    const cssName = "--" + path.replace(/\./g, "-")
    if (path.startsWith("color.")) colors.push(`  ${cssName}: ${token.$value};`)
    // Any typography.family.* key, not just the heading/body pair — the
    // generator adds a mono face for tabular data and it has to resolve.
    else if (path.startsWith("typography.family."))
      fonts.push(`  --font-${path.split(".").pop()}: ${token.$value};`)
    else rest.push(`  ${cssName}: ${token.$value};`)
  }
  return `/* DesignOps · advisory proposal · ${slug}
 * GENERATED by tools/advisory.mjs from packages/advisory — review before use.
 *
 * Drop these declarations into the @theme block of your global CSS. Until
 * you do, @designops/lint has no way to know these tokens exist and will
 * report the utilities built from them as unknown.
 */
@import "tailwindcss";

@theme inline {
${colors.join("\n")}
${fonts.join("\n")}
}

:root {
${rest.join("\n")}
}
`
}

/* ── 5 · commands ───────────────────────────────────────────── */

function slugify(text) {
  return (
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "proposal"
  )
}

function cmdSearch(argv) {
  // Everything before the first flag is the query; the rest is passed
  // through verbatim, values included.
  let i = 0
  const words = []
  while (i < argv.length && !argv[i].startsWith("-")) words.push(argv[i++])
  const query = words.join(" ")
  if (!query) {
    console.error(
      'usage: node tools/advisory.mjs search "<query>" [--domain d] [--stack s]'
    )
    process.exit(1)
  }
  process.stdout.write(runAdvisory([query, ...argv.slice(i)]))
}

function cmdPropose(argv) {
  // Flags that take a value: their argument must not be read as query text.
  const VALUE_FLAGS = [
    "--slug",
    "--name",
    "--variance",
    "--motion",
    "--density",
  ]
  const BOOLEAN_FLAGS = ["--write"]

  const flags = new Set()
  const values = new Map()
  const words = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (VALUE_FLAGS.includes(arg)) {
      flags.add(arg)
      if (argv[i + 1] !== undefined) values.set(arg, argv[++i])
    } else if (BOOLEAN_FLAGS.includes(arg)) {
      flags.add(arg)
    } else {
      words.push(arg)
    }
  }

  const query = words.join(" ")
  if (!query) {
    console.error(
      'usage: node tools/advisory.mjs propose "<query>" [--slug s] [--write]'
    )
    process.exit(1)
  }
  const projectName = values.get("--name") ?? query
  const slug = values.get("--slug") ?? slugify(query)

  const args = [query, "--design-system", "--json", "-p", projectName]
  for (const flag of ["--variance", "--motion", "--density"]) {
    if (values.has(flag)) args.push(flag, values.get(flag))
  }

  const raw = runAdvisory(args)
  const ds = JSON.parse(raw).design_system
  const current = JSON.parse(readFileSync(TOKENS, "utf8"))
  const { tree, mapping, contrast, guidance } = buildProposal(ds, current)

  const files = []
  if (flags.has("--write")) {
    mkdirSync(PROPOSALS, { recursive: true })
    const tokensPath = join(PROPOSALS, `${slug}.tokens.json`)
    const themePath = join(PROPOSALS, `${slug}.theme.css`)
    const out = {
      $schema: "https://design-tokens.org/schema.json",
      $meta: {
        name: `designops-proposal-${slug}`,
        version: "0.1.0",
        owner: "DesignOps proposal — promote to tokens/tokens.json on approval",
        source: `Generated by tools/advisory.mjs from ${UPSTREAM} · query: ${query}`,
      },
      ...tree,
    }
    writeFileSync(tokensPath, JSON.stringify(out, null, 2) + "\n")
    writeFileSync(themePath, buildThemeCss(tree, { slug }))
    files.push(`tokens/proposals/${slug}.tokens.json`)
    files.push(`tokens/proposals/${slug}.theme.css`)
  }

  const result = {
    slug,
    query,
    source: {
      tool: "@designops/advisory (vendored from " + UPSTREAM + ")",
      style: ds.style?.id || null,
      styleName: ds.style?.name || null,
      product: ds.source_identities?.product || ds.category || null,
      typographyPairing: ds.source_identities?.typography || null,
      colorMode: ds.source_derivations?.color_mode || null,
      exactMatch: !ds.reasoning_default,
      severity: ds.severity || null,
    },
    next: flags.has("--write")
      ? [
          `Review tokens/proposals/${slug}.tokens.json`,
          "Add the @theme declarations to your global CSS so the linter can see them",
          "Promote approved groups into tokens/tokens.json, then run: npm run build:tokens",
          "Verify the result: npm run verify",
        ]
      : [
          "Re-run with --write to materialise the proposal into tokens/proposals/",
        ],
    files,
    contrast,
    mapping,
    guidance,
    tokens: tree,
  }
  console.log(JSON.stringify(result, null, 2))

  const failures = contrast.filter((c) => !c.pass)
  if (failures.length) {
    console.error(
      `\n⚠ ${failures.length} contrast check(s) failed — the catalogue never measured this palette.\n` +
        failures
          .map(
            (f) =>
              `  ${f.foreground} on ${f.background}: ${f.ratio}:1 (needs ${f.required}:1) — ${f.note}`
          )
          .join("\n") +
        "\nAdjust those values before promoting the proposal."
    )
  }
}

function cmdCheck() {
  const steps = [
    ["catalogue data contracts", ["scripts/validate_data.py"]],
    [
      "catalogue unit tests",
      ["-m", "unittest", "discover", "-s", "scripts/tests", "-q"],
    ],
  ]
  let failed = 0
  for (const [label, args] of steps) {
    process.stdout.write(`\n▸ ${label}\n`)
    const res = spawnSync(pythonBin() || "python3", args, {
      cwd: ADVISORY,
      stdio: "inherit",
    })
    if (res.status !== 0) failed++
  }
  if (failed) {
    console.error(`\n✗ ${failed} advisory check(s) failed`)
    process.exit(1)
  }
  console.log("\n✓ advisory catalogue verified")
}

/* ── 6 · entry ──────────────────────────────────────────────── */

// Only run as a CLI when invoked directly, so the pure functions above can
// be imported by tools/advisory.test.mjs.
const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (!invokedDirectly) {
  // imported
} else {
  const [command, ...rest] = process.argv.slice(2)
  const commands = { search: cmdSearch, propose: cmdPropose, check: cmdCheck }

  if (!command || !commands[command]) {
    console.error(
      "DesignOps · advisory bridge\n\n" +
        '  node tools/advisory.mjs search "<query>" [--domain d] [--stack s] [--json]\n' +
        '  node tools/advisory.mjs propose "<query>" [--slug s] [--write]\n' +
        "  node tools/advisory.mjs check\n\n" +
        "Domains: style color chart landing product ux typography google-fonts\n" +
        "         icons gsap react web\n" +
        "Pass any other flag through to packages/advisory/scripts/search.py."
    )
    process.exit(command ? 1 : 0)
  }

  commands[command](rest)
}
