#!/usr/bin/env node
/**
 * DesignOps · advisory capture
 * © 2026 Lulamile Mkhungela · MIT
 * ─────────────────────────────────────────────────────────────
 * The dashboard is a zero-build SPA, so the advisory counts it shows
 * are frozen into assets/data.js instead of read at runtime. This tool
 * keeps that frozen copy honest against the catalogue's own summary.
 *
 *   node tools/capture-advisory.mjs           # check (default)
 *   node tools/capture-advisory.mjs --write   # rewrite the counts block
 *
 * Source of truth: packages/advisory/data/catalog-summary.json
 * Target: the `counts` array inside `const ADVISORY` in assets/data.js.
 *
 * Exits non-zero when the two disagree, so `npm test` and
 * `npm run advisory:check` fail on a stale dashboard.
 */
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, "..")
const DATA = join(ROOT, "assets", "data.js")
const SUMMARY = join(
  ROOT,
  "packages",
  "advisory",
  "data",
  "catalog-summary.json"
)

/** Catalogue summary field → the label the dashboard renders. */
const FIELDS = [
  ["styles.searchable", "searchable UI styles"],
  ["palettes", "product palettes"],
  ["fontPairings", "font pairings"],
  ["uxGuidelines", "UX guidelines"],
  ["curatedIcons", "curated icons"],
  ["chartTypes", "chart types"],
  ["stacks", "technology stacks"],
  ["motionPresets", "GSAP motion presets"],
]

function readAt(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object)
}

function expectedCounts() {
  const summary = JSON.parse(readFileSync(SUMMARY, "utf8"))
  return FIELDS.map(([path, label]) => {
    const n = readAt(summary.counts, path)
    if (typeof n !== "number") {
      throw new Error(`catalog-summary.json has no counts.${path}`)
    }
    return { n, label }
  })
}

/** Locate the `counts: [...]` block inside the ADVISORY object. */
function countBlock(source) {
  const advisoryAt = source.indexOf("const ADVISORY = {")
  if (advisoryAt === -1) throw new Error("assets/data.js has no const ADVISORY")
  const keyAt = source.indexOf("counts: [", advisoryAt)
  if (keyAt === -1) throw new Error("ADVISORY has no counts array")
  const open = source.indexOf("[", keyAt)
  const close = source.indexOf("]", open)
  if (close === -1) throw new Error("ADVISORY.counts is not closed")
  return { start: open + 1, end: close, text: source.slice(open + 1, close) }
}

function parseCounts(text) {
  return [...text.matchAll(/n:\s*(\d+),\s*label:\s*"([^"]+)"/g)].map((m) => ({
    n: Number(m[1]),
    label: m[2],
  }))
}

function renderCounts(counts) {
  const lines = counts.map(
    (c) => `    { n: ${c.n}, label: ${JSON.stringify(c.label)} },`
  )
  return "\n" + lines.join("\n") + "\n  "
}

const expected = expectedCounts()
const source = readFileSync(DATA, "utf8")
const block = countBlock(source)
const actual = parseCounts(block.text)

const mismatches = expected.filter(
  (want, i) =>
    !actual[i] || actual[i].n !== want.n || actual[i].label !== want.label
)
const extra = actual.length > expected.length

if (!mismatches.length && !extra) {
  console.log(
    `✓ dashboard counts match the catalogue (${expected.length} figures)`
  )
  process.exit(0)
}

console.log("✗ dashboard advisory counts are stale")
expected.forEach((want, i) => {
  const got = actual[i]
  const mark = got && got.n === want.n && got.label === want.label ? "=" : "≠"
  console.log(
    `  ${mark} ${want.label.padEnd(22)} catalogue ${String(want.n).padStart(4)}` +
      (got ? `  dashboard ${String(got.n).padStart(4)}` : "  dashboard —")
  )
})

if (process.argv.includes("--write")) {
  const next =
    source.slice(0, block.start) +
    renderCounts(expected) +
    source.slice(block.end)
  writeFileSync(DATA, next)
  console.log("→ assets/data.js updated; review the diff and commit it")
  process.exit(0)
}

console.log("Run `pnpm advisory:capture` to rewrite the block.")
process.exit(1)
