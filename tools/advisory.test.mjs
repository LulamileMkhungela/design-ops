/**
 * DesignOps · advisory bridge tests
 *
 *   node --test tools/advisory.test.mjs
 *
 * Colour maths runs on the pure functions. The bridge itself runs against a
 * fixed advisory payload, so these tests never touch Python or the network —
 * the catalogue's own 116 tests cover the search engine, and
 * `node tools/advisory.mjs check` covers the data.
 */

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

import {
  buildProposal,
  buildThemeCss,
  contrastRatio,
  impliedAlpha,
  mix,
  parseHex,
  rgbToOklab,
  shiftLightness,
} from "./advisory.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const currentTokens = JSON.parse(
  readFileSync(join(ROOT, "tokens", "tokens.json"), "utf8")
)

/* ── colour maths ───────────────────────────────────────────── */

test("parseHex accepts short, long and bare hex", () => {
  assert.deepEqual(parseHex("#fff"), [1, 1, 1])
  assert.deepEqual(parseHex("#000000"), [0, 0, 0])
  assert.deepEqual(parseHex("E8FF5A"), parseHex("#e8ff5a"))
})

test("parseHex rejects anything that is not a colour", () => {
  for (const bad of ["", "#12", "#12345", "rebeccapurple", null, 42]) {
    assert.equal(parseHex(bad), null, `expected ${String(bad)} to be rejected`)
  }
})

test("contrastRatio matches the WCAG reference values", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#FFFFFF")), 21)
  assert.equal(Math.round(contrastRatio("#FFFFFF", "#FFFFFF")), 1)
  // #767676 on white is the classic 4.54:1 boundary case.
  assert.ok(Math.abs(contrastRatio("#767676", "#FFFFFF") - 4.54) < 0.02)
})

test("mix travels through OKLab and is bounded by its endpoints", () => {
  assert.equal(mix("#000000", "#FFFFFF", 0), "#000000")
  assert.equal(mix("#000000", "#FFFFFF", 1), "#FFFFFF")
  const mid = mix("#E8FF5A", "#FFFFFF", 0.5)
  assert.match(mid, /^#[0-9A-F]{6}$/)
  // Halfway to white in OKLab is a lightened lime: green-dominant, blue-poor.
  const [r, g, b] = parseHex(mid)
  assert.ok(g > r && r > b, `unexpected channel order in ${mid}`)
})

test("shiftLightness clamps instead of wrapping", () => {
  assert.equal(shiftLightness("#000000", -1), "#000000")
  assert.equal(shiftLightness("#FFFFFF", 1), "#FFFFFF")
  assert.notEqual(shiftLightness("#808080", 0.1), "#808080")
})

test("impliedAlpha solves the CSS composite, and refuses when it cannot", () => {
  // #F0EDE6 at 70% over #0D0D0B — the system's own ink-muted pair.
  const a = impliedAlpha("#F0EDE6", "#0D0D0B", "#A9A7A1")
  assert.ok(a !== null, "expected a solvable alpha")
  assert.ok(Math.abs(a - 0.7) < 0.06, `alpha ${a} is not near 0.7`)
  // A colour that is not a composite of fg over bg has no single alpha.
  assert.equal(impliedAlpha("#FF0000", "#0000FF", "#123456"), null)
  assert.equal(impliedAlpha("#FFFFFF", "#FFFFFF", "#FFFFFF"), null)
})

/* ── the bridge ─────────────────────────────────────────────── */

const FIXTURE = {
  project_name: "Fixture",
  category: "Financial Dashboard",
  style: { id: "dark-mode-oled", name: "Dark Mode (OLED)" },
  colors: {
    primary: "#0F172A",
    on_primary: "#FFFFFF",
    secondary: "#1E293B",
    accent: "#22C55E",
    on_accent: "#0F172A",
    background: "#020617",
    foreground: "#F8FAFC",
    card: "#0E1223",
    card_foreground: "#F8FAFC",
    muted: "#1A1E2F",
    muted_foreground: "#94A3B8",
    border: "#334155",
    destructive: "#EF4444",
    on_destructive: "#000000",
    ring: "#FFFFFF",
  },
  typography: {
    heading: "Fira Code",
    body: "Fira Sans",
    mood: "dashboard, data, analytics",
    best_for: "Dashboards, analytics",
    google_fonts_url: "https://fonts.googleapis.com/css2?family=Fira+Code",
  },
  spacing_scale: {
    xs: "2px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "24px",
    "3xl": "32px",
  },
  key_effects: "Minimal glow",
  anti_patterns: "Light mode default, Slow rendering",
  constraints: ["real-time-updates"],
  decision_rules: { must_have: ["constraint:high-contrast"] },
  severity: "HIGH",
  dials: { density: 8, motion: 6, variance: 5 },
  source_identities: {
    product: "Financial Dashboard",
    style: "dark-mode-oled",
    typography: "Dashboard Data",
  },
  source_derivations: { color_mode: "dark" },
  reasoning_default: false,
}

const flat = (node, path = [], out = new Map()) => {
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith("$")) continue
    if (val && typeof val === "object" && "$value" in val)
      out.set([...path, key].join("."), val)
    else if (val && typeof val === "object") flat(val, [...path, key], out)
  }
  return out
}

test("advisory colours land on the DesignOps token paths", () => {
  const { tree, mapping } = buildProposal(FIXTURE, currentTokens)
  const tokens = flat(tree)
  const byToken = new Map(mapping.map((m) => [m.token, m]))

  assert.equal(tokens.get("color.primary.900").$value, "#0F172A")
  assert.equal(byToken.get("color.primary.900").source, "advisory")
  assert.equal(byToken.get("color.primary.900").from, "colors.primary")

  for (const [token, expected, from] of [
    ["color.neutral.900", "#020617", "colors.background"],
    ["color.neutral.800", "#0E1223", "colors.card"],
    ["color.neutral.700", "#1E293B", "colors.secondary"],
    ["color.neutral.600", "#1A1E2F", "colors.muted"],
    ["color.ink.default", "#F8FAFC", "colors.foreground"],
    ["color.ink.muted", "#94A3B8", "colors.muted_foreground"],
    ["color.danger.600", "#EF4444", "colors.destructive"],
  ]) {
    assert.equal(tokens.get(token).$value, expected, token)
    assert.equal(byToken.get(token).from, from, `${token} provenance`)
    assert.equal(byToken.get(token).source, "advisory", `${token} source`)
  }
})

test("hover and wash are derived, and the hover is not the accent", () => {
  const { tree, mapping } = buildProposal(FIXTURE, currentTokens)
  const tokens = flat(tree)
  const byToken = new Map(mapping.map((m) => [m.token, m]))

  assert.equal(byToken.get("color.primary.800").source, "derived")
  assert.equal(byToken.get("color.primary.50").source, "derived")
  assert.equal(byToken.get("color.ink.subtle").source, "derived")

  // The advisory accent (#22C55E green) is not a hover state for a navy
  // primary; the bridge derives the hover instead of borrowing it.
  assert.notEqual(tokens.get("color.primary.800").$value, "#22C55E")
  assert.notEqual(tokens.get("color.primary.800").$value, "#0F172A")
  assert.match(tokens.get("color.primary.800").$value, /^#[0-9A-F]{6}$/)

  // A dark accent lifts so the hover is visible; a light accent deepens,
  // which is what the system already does (primary.900 #e8ff5a → 800 #d5ef48).
  const lightness = (hex) => rgbToOklab(parseHex(hex))[0]
  assert.ok(
    lightness(tokens.get("color.primary.800").$value) >
      lightness(tokens.get("color.primary.900").$value),
    "a dark primary must hover lighter, or the hover is invisible"
  )
  const light = buildProposal(
    { ...FIXTURE, colors: { ...FIXTURE.colors, primary: "#E8FF5A" } },
    currentTokens
  )
  const lightTokens = flat(light.tree)
  assert.ok(
    lightness(lightTokens.get("color.primary.800").$value) <
      lightness(lightTokens.get("color.primary.900").$value),
    "a light primary must hover darker, matching the existing system"
  )
})

test("tokens the catalogue does not carry are inherited unchanged", () => {
  const { tree, mapping } = buildProposal(FIXTURE, currentTokens)
  const tokens = flat(tree)
  const inheritedNow = flat(currentTokens)

  for (const path of [
    "color.success.600",
    "color.warning.600",
    "color.info.600",
    "radius.full",
    "shadow.md",
    "motion.easing.out",
    "space.8",
    "typography.size.base",
    "typography.weight.bold",
  ]) {
    assert.equal(
      tokens.get(path).$value,
      inheritedNow.get(path).$value,
      `${path} must be inherited verbatim`
    )
  }
  const sources = new Map(mapping.map((m) => [m.token, m.source]))
  for (const path of [
    "color.success.600",
    "radius.full",
    "motion.easing.out",
  ]) {
    assert.equal(sources.get(path), "inherited", path)
  }
})

test("the density dial drives the spacing scale", () => {
  const { tree, mapping } = buildProposal(FIXTURE, currentTokens)
  const tokens = flat(tree)
  assert.equal(tokens.get("space.1").$value, "2px")
  assert.equal(tokens.get("space.3").$value, "8px")
  assert.equal(tokens.get("space.7").$value, "32px")
  // space.8 has no advisory slot and stays with the system.
  assert.equal(
    new Map(mapping.map((m) => [m.token, m.source])).get("space.8"),
    "inherited"
  )

  // With no spacing scale at all, the whole scale is inherited.
  const noDensity = { ...FIXTURE, spacing_scale: null }
  const tokens2 = flat(buildProposal(noDensity, currentTokens).tree)
  const inheritedNow = flat(currentTokens)
  for (let i = 1; i <= 8; i++) {
    assert.equal(
      tokens2.get(`space.${i}`).$value,
      inheritedNow.get(`space.${i}`).$value
    )
  }
})

test("typography families are adopted, sizes and weights inherited", () => {
  const { tree, mapping } = buildProposal(FIXTURE, currentTokens)
  const tokens = flat(tree)
  assert.equal(tokens.get("typography.family.heading").$value, "Fira Code")
  assert.equal(tokens.get("typography.family.body").$value, "Fira Sans")
  assert.equal(tokens.get("typography.family.heading").$type, "fontFamily")
  assert.equal(tokens.get("typography.size.xl").$value, "1.5rem")
  assert.equal(
    new Map(mapping.map((m) => [m.token, m.source])).get("typography.size.xl"),
    "inherited"
  )
})

test("contrast is measured for every pair the system renders", () => {
  const { contrast } = buildProposal(FIXTURE, currentTokens)
  assert.equal(contrast.length, 7)
  for (const c of contrast) {
    assert.ok(c.ratio > 0 && c.ratio <= 21, `${c.foreground}: ratio ${c.ratio}`)
    assert.equal(c.pass, c.ratio >= c.required)
    assert.ok(c.note.length > 0)
  }
  // This fixture's primary is a surface colour, not an accent: 1.13:1
  // against the background. The bridge must say so rather than accept it.
  const accent = contrast.find((c) => c.background === "color.primary.900")
  assert.ok(accent, "button-label pair missing")
  assert.equal(accent.foreground, "colors.on_primary")
  assert.equal(accent.pass, true)

  const onBg = contrast.find(
    (c) =>
      c.foreground === "color.primary.900" &&
      c.background === "color.neutral.900"
  )
  assert.equal(
    onBg.pass,
    false,
    "the navy-on-navy pair must be reported as failing"
  )
  assert.ok(onBg.ratio < 3)
})

test("a proposal is deterministic", () => {
  const a = buildProposal(FIXTURE, currentTokens)
  const b = buildProposal(FIXTURE, currentTokens)
  assert.deepEqual(a.tree, b.tree)
  assert.deepEqual(a.contrast, b.contrast)
})

test("guidance records what never became a token", () => {
  const { guidance } = buildProposal(FIXTURE, currentTokens)
  const fields = guidance.unmappedAdvisoryFields.map((u) => u.field)
  for (const field of [
    "colors.on_primary",
    "colors.ring",
    "colors.accent",
    "colors.card_foreground",
  ]) {
    assert.ok(fields.includes(field), `${field} should be reported as unmapped`)
  }
  for (const u of guidance.unmappedAdvisoryFields) {
    assert.ok(u.home.length > 20, `${u.field} needs a stated home`)
  }
  assert.deepEqual(guidance.antiPatterns, [
    "Light mode default",
    "Slow rendering",
  ])
  assert.equal(guidance.typography.heading, "Fira Code")
  assert.equal(guidance.severity, "HIGH")
})

test("the theme CSS declares the tokens where the linter can see them", () => {
  const { tree } = buildProposal(FIXTURE, currentTokens)
  const css = buildThemeCss(tree, { slug: "fixture" })
  assert.match(css, /@theme inline \{/)
  assert.match(css, /--color-primary-900: #0F172A;/)
  assert.match(css, /--color-neutral-900: #020617;/)
  assert.match(css, /--font-heading: Fira Code;/)
  assert.match(css, /--font-body: Fira Sans;/)
  // Non-colour scales stay plain custom properties.
  assert.match(css, /:root \{/)
  assert.match(css, /--radius-full: 9999px;/)
  assert.ok(
    !/\$value|\$type|\$description/.test(css),
    "no DTCG metadata leaked into CSS"
  )
})
