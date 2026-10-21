#!/usr/bin/env node
// © 2026 Lulamile Mkhungela · MIT · DesignOps
/**
 * DesignOps · UI guideline audit
 * ─────────────────────────────────────────────────────────────
 * Checks the dashboard against the external guidance DesignOps follows:
 *
 *   WAI-ARIA Authoring Practices  — tabs, dialog, status messages
 *   WCAG 2.2 AA                   — 1.4.3, 2.1.1, 2.4.1, 2.4.3, 2.4.7,
 *                                   2.4.11, 2.5.8, 3.3.2, 4.1.2, 4.1.3
 *   GOV.UK Design System criteria — usable, consistent, accessible names
 *
 *   node tools/ui-audit.mjs            # human summary, exit 1 on error
 *   node tools/ui-audit.mjs --json     # machine-readable
 *
 * The rules are deliberately narrow: each one can be traced to a named
 * requirement, and each failure names the element so it can be fixed.
 * Automated checks do not replace keyboard or screen-reader testing; what
 * they do is keep the regressions out.
 */
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, "..")

/* ── 1 · a small, honest contrast implementation ─────────────── */

function hexToRgb(color) {
  const hex = color.replace("#", "")
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
}

function luminance([r, g, b]) {
  const [rr, gg, bb] = [r, g, b]
    .map((c) => c / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb
}

function contrast(a, b) {
  const [hi, lo] = [luminance(hexToRgb(a)), luminance(hexToRgb(b))].sort(
    (x, y) => y - x
  )
  return (hi + 0.05) / (lo + 0.05)
}

/** Flatten a translucent foreground over an opaque background. */
function composite(fg, bg, alpha) {
  const f = hexToRgb(fg)
  const b = hexToRgb(bg)
  return (
    "#" +
    f
      .map((c, i) =>
        Math.round(c * alpha + b[i] * (1 - alpha))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  )
}

/* ── 2 · loading the dashboard ───────────────────────────────── */

const { JSDOM } = await import("jsdom").then((m) => m.default ?? m)

const html = readFileSync(join(ROOT, "index.html"), "utf8")
const css = readFileSync(join(ROOT, "assets", "styles.css"), "utf8")

function boot() {
  const dom = new JSDOM(html, {
    url: "http://localhost/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  })
  const { window } = dom
  window.scrollTo = () => {}
  window.HTMLElement.prototype.scrollIntoView = () => {}
  window.Audio = class {
    play() {
      return Promise.reject(new Error("no audio in audit"))
    }
    pause() {}
  }
  const store = new Map()
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
  })
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }),
  })
  window.URL.createObjectURL = () => "blob:audit"
  window.URL.revokeObjectURL = () => {}
  const bundle = ["assets/data.js", "assets/codegen.js", "assets/app.js"]
    .map((f) => readFileSync(join(ROOT, f), "utf8"))
    .join("\n;\n")
  window.eval(bundle + "\n;window.__COMPONENTS = COMPONENTS;")
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"))
  return window
}

const ROUTES = [
  "overview",
  "tokens",
  "components",
  "frameworks",
  "advisory",
  "demos",
  "lint",
  "requests",
  "storybook",
  "integrations",
  "guide",
]

/* ── 3 · helpers ─────────────────────────────────────────────── */

const TEXT = (el) => (el.textContent || "").replace(/\s+/g, " ").trim()

function hiddenFromAt(el) {
  for (let node = el; node; node = node.parentElement) {
    if (node.hidden || node.getAttribute("aria-hidden") === "true") return true
    if (node.tagName === "TEMPLATE") return true
  }
  return false
}

/** Accessible name, in the order assistive tech resolves it. */
function nameOf(el, doc) {
  const label = el.getAttribute("aria-label")
  if (label && label.trim()) return label.trim()
  const by = el.getAttribute("aria-labelledby")
  if (by) {
    const text = by
      .split(/\s+/)
      .map((id) => doc.getElementById(id))
      .filter(Boolean)
      .map(TEXT)
      .join(" ")
      .trim()
    if (text) return text
  }
  if (
    el.tagName === "INPUT" ||
    el.tagName === "SELECT" ||
    el.tagName === "TEXTAREA"
  ) {
    const id = el.getAttribute("id")
    const forLabel = id
      ? doc.querySelector(`label[for="${CSS_escape(id)}"]`)
      : null
    if (forLabel && TEXT(forLabel)) return TEXT(forLabel)
    const wrapping = el.closest("label")
    if (wrapping && TEXT(wrapping)) return TEXT(wrapping)
    if (el.getAttribute("alt")) return el.getAttribute("alt")
  }
  if (el.tagName === "IMG" && el.getAttribute("alt") !== null)
    return el.getAttribute("alt").trim()
  const content = TEXT(el)
  if (content) return content
  return (el.getAttribute("title") || "").trim()
}

function CSS_escape(value) {
  return String(value).replace(/["\\]/g, "\\$&")
}

function isInteractive(el) {
  if (
    ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "SUMMARY"].includes(
      el.tagName
    )
  )
    return true
  const role = el.getAttribute("role")
  if (["tab", "button", "link", "checkbox", "switch", "option"].includes(role))
    return true
  return false
}

/* ── 4 · the rules ───────────────────────────────────────────── */

function auditRoute(window, route) {
  const doc = window.document
  const issues = []
  const add = (rule, element, detail) =>
    issues.push({
      rule,
      route,
      detail,
      element: element ? element.outerHTML.slice(0, 160) : null,
    })

  // 1.3.1 / 4.1.2 — landmarks and a bypass route.
  if (doc.querySelectorAll("main").length !== 1)
    add("landmark-main", null, "expected exactly one <main>")
  const skip = doc.querySelector(".skip-link")
  if (!skip) add("skip-link", null, "no .skip-link")
  else if (skip.getAttribute("href") !== "#main")
    add("skip-link", skip, "skip link must target #main")

  // 2.4.1 — the skip link is the first focusable element.
  const focusables = [
    ...doc.querySelectorAll(
      "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])"
    ),
  ].filter(
    (el) => !hiddenFromAt(el) && el.getAttribute("aria-hidden") !== "true"
  )
  if (skip && focusables[0] !== skip) {
    add(
      "skip-link-first",
      focusables[0],
      "the skip link is not the first focus stop"
    )
  }

  // 1.3.1 — one h1, no skipped levels inside the rendered view.
  const view = doc.getElementById("view")
  const headings = [...view.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter(
    (h) => !hiddenFromAt(h)
  )
  const h1s = headings.filter((h) => h.tagName === "H1")
  if (h1s.length !== 1)
    add("heading-one", view, `${h1s.length} <h1> in the ${route} view`)
  let previous = 0
  for (const h of headings) {
    const level = Number(h.tagName[1])
    if (previous && level > previous + 1) {
      add(
        "heading-order",
        h,
        `h${previous} follows directly with h${level}: "${TEXT(h).slice(0, 60)}"`
      )
    }
    previous = level
  }

  // 2.1.1 / 4.1.2 — every button is a button, and has a type.
  for (const el of doc.querySelectorAll("button")) {
    if (
      el.getAttribute("type") !== "button" &&
      el.getAttribute("type") !== "submit"
    )
      add("button-type", el, "button without an explicit type")
    if (!nameOf(el, doc))
      add("button-name", el, "button has no accessible name")
  }

  // 4.1.2 — links have discernible text.
  for (const el of doc.querySelectorAll("a[href]")) {
    if (hiddenFromAt(el)) continue
    if (!nameOf(el, doc)) add("link-name", el, "link has no accessible name")
  }

  // 1.1.1 / 4.1.2 — images and frames are named.
  for (const img of doc.querySelectorAll("img")) {
    if (!img.hasAttribute("alt"))
      add("image-alt", img, 'img without alt (use alt="" when decorative)')
  }
  for (const frame of doc.querySelectorAll("iframe"))
    if (!frame.getAttribute("title"))
      add("frame-title", frame, "iframe without a title")

  // 3.3.2 — form controls have visible labels or an accessible name.
  for (const field of doc.querySelectorAll("input, select, textarea")) {
    if (field.type === "hidden") continue
    if (!nameOf(field, doc))
      add("field-label", field, "form control has no accessible name")
  }

  // APG tabs — tablist, tab, tabpanel, selection state, relationships.
  for (const list of doc.querySelectorAll("[role='tablist']")) {
    if (!nameOf(list, doc)) add("tablist-name", list, "tablist has no name")
    const tabs = [...list.querySelectorAll("[role='tab']")]
    if (!tabs.length) add("tablist-empty", list, "tablist without tabs")
    const zero = tabs.filter((t) => t.getAttribute("tabindex") === "0")
    if (tabs.length && zero.length !== 1)
      add(
        "tab-roving",
        list,
        `${zero.length} tabs are in the tab order; roving tabindex needs exactly one`
      )
    const selected = tabs.filter(
      (t) => t.getAttribute("aria-selected") === "true"
    )
    if (tabs.length && selected.length !== 1)
      add("tab-one-selected", list, `${selected.length} tabs are selected`)
    for (const tab of tabs) {
      const panel = doc.getElementById(tab.getAttribute("aria-controls") || "")
      if (!panel) continue
      const on = tab.getAttribute("aria-selected") === "true"
      if (on && panel.hidden)
        add("tab-panel-hidden", panel, "selected tab controls a hidden panel")
      if (!on && !panel.hidden)
        add("tab-panel-shown", panel, "unselected tab controls a visible panel")
    }
    tabs.forEach((tab) => {
      if (!["true", "false"].includes(tab.getAttribute("aria-selected")))
        add("tab-selected", tab, "tab without aria-selected")
      const controls = tab.getAttribute("aria-controls")
      if (!controls) add("tab-controls", tab, "tab without aria-controls")
      else if (!doc.getElementById(controls))
        add("aria-ref", tab, `aria-controls="${controls}" points at nothing`)
      else {
        const panel = doc.getElementById(controls)
        if (panel.getAttribute("role") !== "tabpanel")
          add("tab-panel-role", panel, "controlled element is not a tabpanel")
        if (panel.getAttribute("aria-labelledby") !== tab.id)
          add("tab-panel-label", panel, "tabpanel is not labelled by its tab")
      }
    })
    // 2.1.1 — the keys the APG requires.
    const wired =
      list.hasAttribute("data-tablist") || list.dataset.tablist === "true"
    if (!wired)
      add("tab-keys", list, "tablist has no keyboard wiring (data-tablist)")
  }

  // Disclosure cards: the header must be a button and control its body.
  for (const header of view.querySelectorAll(
    ".comp-card[data-comp] .comp-card-header"
  )) {
    if (header.tagName !== "BUTTON")
      add("disclosure", header, "component header is not a button")
    if (!header.hasAttribute("aria-expanded"))
      add("disclosure", header, "component header has no aria-expanded")
    const body = header.getAttribute("aria-controls")
    if (!body)
      add("disclosure", header, "component header has no aria-controls")
    else if (!doc.getElementById(body))
      add("aria-ref", header, `aria-controls="${body}" points at nothing`)
  }

  // 4.1.3 — a live region exists for status messages.
  if (!doc.querySelector("[role='status'], [aria-live]"))
    add("live-region", null, "no live region for status messages")

  // 4.1.2 — ids are unique and ARIA references resolve.
  const seen = new Map()
  for (const el of view.querySelectorAll("[id]")) {
    const id = el.getAttribute("id")
    seen.set(id, (seen.get(id) || 0) + 1)
  }
  for (const [id, count] of seen)
    if (count > 1)
      add("duplicate-id", null, `id="${id}" appears ${count} times`)
  for (const el of view.querySelectorAll(
    "[aria-controls], [aria-labelledby], [aria-describedby]"
  )) {
    for (const attr of [
      "aria-controls",
      "aria-labelledby",
      "aria-describedby",
    ]) {
      const value = el.getAttribute(attr)
      if (!value) continue
      for (const id of value.split(/\s+/)) {
        if (!doc.getElementById(id))
          add("aria-ref", el, `${attr}="${id}" points at nothing`)
      }
    }
  }

  // 4.1.2 — things that behave like controls must be controls.
  const hooks = [
    "data-route",
    "data-tab",
    "data-fw",
    "data-guide",
    "data-fkind",
    "data-copy",
    "data-source",
    "data-guide-link",
    "data-tokfilter",
    "data-compfilter",
    "data-ad-q",
    "data-ad-mode-set",
    "data-lint-preset",
    "data-lint-linter",
    "data-lint-fw",
    "data-open-comp",
    "data-req",
  ]
  for (const hook of hooks) {
    for (const el of view.querySelectorAll(`[${hook}]`)) {
      if (hiddenFromAt(el)) continue
      if (isInteractive(el)) continue
      add(
        "clickable-not-control",
        el,
        `[${hook}] on a ${el.tagName.toLowerCase()}`
      )
    }
  }
  return issues
}

function auditCss() {
  const issues = []
  if (!/:focus-visible/.test(css))
    issues.push({
      rule: "focus-visible",
      route: "css",
      detail: "no :focus-visible style; keyboard focus is invisible",
      element: null,
    })
  if (!/@media \(prefers-reduced-motion: reduce\)/.test(css))
    issues.push({
      rule: "reduced-motion",
      route: "css",
      detail: "no prefers-reduced-motion block",
      element: null,
    })

  // 2.5.8 — pointer targets are at least 24×24 CSS pixels.
  const smallTargets = [
    ".dm-filter",
    ".dm-pal",
    ".fw-tab",
    ".lt-tab",
    ".tb-chip",
    ".tag",
    ".demo-ctrl",
  ]
  const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, "")
  const rules = [...cssCode.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selectors: m[1].split(",").map((x) => x.trim()),
    body: m[2],
  }))
  for (const selector of smallTargets) {
    const body = rules
      .filter((r) => r.selectors.includes(selector))
      .map((r) => r.body)
      .join(";")
    const declared = [...body.matchAll(/min-height:\s*(\d+)px/g)].map((m) =>
      Number(m[1])
    )
    if (!declared.some((px) => px >= 24)) {
      issues.push({
        rule: "target-size",
        route: "css",
        detail: `${selector} does not declare min-height >= 24px`,
        element: null,
      })
    }
  }

  // 1.4.3 — the dashboard's own text tokens on its own surfaces.
  const vars = Object.fromEntries(
    [...css.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
  )
  const alpha = (name) =>
    Number((vars[name].match(/,\s*([\d.]+)\s*\)/) || [])[1])
  const pairs = [
    ["ink", "bg", "#f0ede6", 4.5],
    ["ink-70", "bg", composite("#f0ede6", "#0d0d0b", alpha("ink-70")), 4.5],
    ["ink-60", "bg", composite("#f0ede6", "#0d0d0b", alpha("ink-60")), 4.5],
    [
      "ink-60",
      "surface",
      composite("#f0ede6", "#1e1e1b", alpha("ink-60")),
      4.5,
    ],
    [
      "ink-60",
      "surface-2",
      composite("#f0ede6", "#242420", alpha("ink-60")),
      4.5,
    ],
    ["accent", "bg", "#e8ff5a", 4.5],
    ["red", "surface", "#f87171", 4.5],
    ["green", "surface", "#4ade80", 4.5],
    ["amber", "surface", "#fbbf24", 4.5],
    ["blue", "surface", "#60a5fa", 4.5],
    ["figma", "surface", "#9b72f8", 4.5],
    ["token", "surface", "#38bdf8", 4.5],
    ["bg", "accent", "#0d0d0b", 4.5],
  ]
  for (const [fg, bg, color, threshold] of pairs) {
    const ratio = contrast(color, vars[bg] || "#000000")
    if (ratio < threshold) {
      issues.push({
        rule: "contrast",
        route: "css",
        detail: `--${fg} on --${bg} is ${ratio.toFixed(2)}:1, needs ${threshold}:1`,
        element: null,
      })
    }
  }
  return issues
}

/* ── 5 · run ─────────────────────────────────────────────────── */

function auditCodegen(window) {
  const issues = []
  const add = (detail) =>
    issues.push({
      rule: "component-real",
      route: "codegen",
      detail,
      element: null,
    })
  const COMPONENTS = window.__COMPONENTS
  const comp = (id) => COMPONENTS.find((c) => c.id === id)
  const need = (id, target, patterns) => {
    const out = window.snippetFor(comp(id), target)
    for (const [label, re] of patterns) {
      if (!re.test(out)) add(`${id} · ${target}: missing ${label}`)
    }
  }
  for (const target of ["react", "next", "remix"]) {
    need("button", target, [
      ["native button", /<button/],
      ["ref forwarding", /forwardRef/],
      ["prop spread", /\{\.\.\.rest\}/],
      ["loading state", /aria-busy/],
    ])
    need("input", target, [
      ["label association", /htmlFor={fieldId}/],
      ["error wiring", /aria-invalid/],
      ["description wiring", /aria-describedby/],
    ])
    need("card", target, [
      ["polymorphic element", /as: Tag/],
      ["prop spread", /\{\.\.\.rest\}/],
    ])
    need("data-table", target, [
      ["table element", /<table/],
      ["column headers", /scope='col'/],
      ["sort state", /aria-sort/],
      ["row loop", /visible\.map/],
      ["pagination", /Page \{current\} of \{pageCount\}/],
    ])
  }
  for (const target of ["vue", "nuxt"]) {
    need("data-table", target, [
      ["table element", /<table/],
      ["column headers", /scope="col"/],
      ["sort state", /aria-sort/],
      ["row loop", /v-for=/],
    ])
    need("button", target, [
      ["native button", /<button/],
      ["event forwarding", /@click/],
    ])
  }
  need("data-table", "svelte", [
    ["table element", /<table/],
    ["row loop", /#each visible/],
  ])
  need("data-table", "angular", [
    ["table element", /<table/],
    ["row loop", /\*ngFor="let row of visible"/],
  ])
  need("data-table", "astro", [
    ["table element", /<table/],
    ["row loop", /rows\.slice/],
  ])
  return issues
}

const window = boot()
const results = []

for (const route of ROUTES) {
  window.location.hash = "#/" + route
  window.dispatchEvent(new window.Event("hashchange"))
  await new Promise((resolve) => setTimeout(resolve, 0))
  results.push(
    ...auditRoute(window, route).map((issue) => Object.assign(issue, { route }))
  )
}
results.push(...auditCodegen(window))

// The component cards are disclosures: open one and audit what it reveals.
window.location.hash = "#/components"
window.dispatchEvent(new window.Event("hashchange"))
await new Promise((resolve) => setTimeout(resolve, 0))
const firstCard = window.document.querySelector(
  "#comp-button .comp-card-header"
)
if (!firstCard) {
  results.push({
    rule: "disclosure",
    route: "components",
    detail: "no component card header to open",
    element: null,
  })
} else {
  firstCard.click()
  await new Promise((resolve) => setTimeout(resolve, 0))
  results.push(...auditRoute(window, "components (expanded)"))
}

results.push(...auditCss())

const json = process.argv.includes("--json")
if (json) {
  console.log(JSON.stringify({ issues: results }, null, 2))
} else {
  const byRule = new Map()
  for (const issue of results) {
    if (!byRule.has(issue.rule)) byRule.set(issue.rule, [])
    byRule.get(issue.rule).push(issue)
  }
  for (const [rule, list] of [...byRule].sort(
    (a, b) => b[1].length - a[1].length
  )) {
    console.log(`\n${rule}  (${list.length})`)
    for (const issue of list.slice(0, 6)) {
      console.log(`  ${issue.route}: ${issue.detail}`)
      if (issue.element) console.log(`    ${issue.element}`)
    }
    if (list.length > 6) console.log(`  … ${list.length - 6} more`)
  }
  console.log(`\n${results.length} issue(s) across ${ROUTES.length} views`)
}
process.exit(results.length ? 1 : 0)
