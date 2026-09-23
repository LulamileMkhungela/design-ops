/* DesignOps site: showcase rendering, setup tabs, hero terminal, and the
   live playground client. The RULES diagnostics below are verbatim output
   of the @designops/lint build — refresh with `pnpm site:capture`. */

"use strict"

/* ── Rule cards: violation + verbatim diagnostic + fix ─────────────── */

const RULES = [
  {
    id: "designops/no-restyle",
    title: "no-restyle",
    blurb:
      "Restyling a component with className. The component owns its look; pages own layout.",
    bad: '<Button className="p-4">Submit</Button>',
    message:
      '"p-4" is not allowed on <Button>: <Button> owns its spacing. Use a size (default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg), or margin here or gap on the parent for space around it. Add a size in components/ui/button.tsx only if the design explicitly calls for one.',
    fix: '<Button size="lg" className="mt-4">Submit</Button>',
  },
  {
    id: "designops/no-raw-colors",
    title: "no-raw-colors",
    blurb: "Raw palette colors such as bg-pink-500. Theme colors only.",
    bad: '<div className="bg-pink-500">…</div>',
    message:
      '"bg-pink-500" uses the raw Tailwind palette and no declared theme color is close to it. Use one of: accent, background, border, card, destructive, foreground, input, muted, popover, primary, ring, secondary (+6 more), or declare --color-<name> in app/globals.css for a new color.',
    fix: '<div className="bg-primary">…</div>',
  },
  {
    id: "designops/no-arbitrary-values",
    title: "no-arbitrary-values",
    blurb: "Arbitrary values such as p-[13px]. Stay on the theme scale.",
    bad: '<div className="p-[13px]">…</div>',
    message:
      '"p-[13px]" hardcodes an off-token value. Use "p-3.25" instead (same value, on the scale).',
    fix: '<div className="p-3.25">…</div>',
  },
  {
    id: "designops/no-inline-styles",
    title: "no-inline-styles",
    blurb: "Inline styles and <style> elements. Style through classes.",
    bad: '<div style={{ color: "red" }}>…</div>',
    message:
      "Inline style sets color. Style through classes; use CSS custom properties for dynamic values.",
    fix: '<div className="text-destructive">…</div>',
  },
  {
    id: "designops/require-static-classes",
    title: "require-static-classes",
    blurb: "Component classes the linter cannot read, such as `bg-${color}`.",
    bad: "<Button className={`mt-${n}`}>…</Button>",
    message:
      "Dynamically built className on <Button> cannot be checked. Use static class strings.",
    fix: '<Button className={n ? "mt-4" : "mt-2"}>…</Button>',
  },
  {
    id: "designops/no-unknown-classes",
    title: "no-unknown-classes",
    blurb: "Classes Tailwind cannot generate, such as rounded-huge.",
    bad: '<div className="rounded-huge">…</div>',
    message:
      '"rounded-huge" is not a class this project\'s Tailwind knows, so no CSS is generated for it. Fix the spelling, or declare it with @utility in app/globals.css.',
    fix: '<div className="rounded-3xl">…</div>',
  },
]

/* ── Hero terminal: verbatim eslint run ───────────────────────────── */

const TERMINAL_TEXT = `$ npx eslint app/demo-page.tsx

app/demo-page.tsx
  7:25  error  "p-4" is not allowed on <Button>: <Button> owns its spacing. Use a size (default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg), or margin here or gap on the parent for space around it.
  10:22  error  "bg-pink-500" uses the raw Tailwind palette and no declared theme color is close to it. Use one of: accent, background, border, card, destructive, foreground, input, muted, popover, primary, ring, secondary (+6 more), or declare --color-<name> in app/globals.css for a new color.
  13:22  error  "p-[13px]" hardcodes an off-token value. Use "p-3.25" instead (same value, on the scale).
  16:28  error  Inline style sets color. Style through classes; use CSS custom properties for dynamic values.
  19:26  error  Dynamically built className on <Button> cannot be checked. Use static class strings.
  22:22  error  "rounded-huge" is not a class this project's Tailwind knows, so no CSS is generated for it. Fix the spelling, or declare it with @utility in app/globals.css.

✖ 6 problems (6 errors, 0 warnings)`

/* ── Setup snippets ───────────────────────────────────────────────── */

const STARTER_RULES_JS = `    rules: {
      "designops/no-restyle": ["error", { allow: ["layout"] }],
      "designops/no-raw-colors": "error",
      "designops/no-arbitrary-values": "error",
      "designops/no-inline-styles": "error",
      "designops/require-static-classes": "error",
      "designops/no-unknown-classes": "error",
    },`

const SETUPS = {
  eslint: {
    label: "eslint.config.mjs",
    react: {
      label: "eslint.config.mjs · React",
      code: `# npm install -D @designops/lint eslint @typescript-eslint/parser

import { plugin as designops } from "@designops/lint"
import tsParser from "@typescript-eslint/parser"
import { defineConfig } from "eslint/config"

export default defineConfig([
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { designops },
${STARTER_RULES_JS}
  },
  {
    files: ["components/ui/**"],
    rules: { "designops/no-restyle": "off" },
  },
])

# npx eslint .`,
    },
    vue: {
      label: "eslint.config.mjs · Vue",
      code: `# npm install -D @designops/lint eslint @typescript-eslint/parser vue-eslint-parser

import { plugin as designops } from "@designops/lint"
import tsParser from "@typescript-eslint/parser"
import { defineConfig } from "eslint/config"
import vueParser from "vue-eslint-parser"

export default defineConfig([
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tsParser },
    },
    plugins: { designops },
${STARTER_RULES_JS}
  },
])

# npx eslint .`,
    },
    svelte: {
      label: "eslint.config.mjs · Svelte",
      code: `# npm install -D @designops/lint eslint @typescript-eslint/parser svelte-eslint-parser

import { plugin as designops } from "@designops/lint"
import tsParser from "@typescript-eslint/parser"
import { defineConfig } from "eslint/config"
import svelteParser from "svelte-eslint-parser"

export default defineConfig([
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parser: svelteParser,
      parserOptions: { parser: tsParser },
    },
    plugins: { designops },
${STARTER_RULES_JS}
  },
])

# npx eslint .`,
    },
  },
  oxlint: {
    label: ".oxlintrc.json",
    react: {
      label: ".oxlintrc.json · React",
      code: `// npm install -D @designops/lint oxlint
{
  "jsPlugins": ["@designops/lint"],
  "rules": {
    "designops/no-restyle": ["error", { "allow": ["layout"] }],
    "designops/no-raw-colors": "error",
    "designops/no-arbitrary-values": "error",
    "designops/no-inline-styles": "error",
    "designops/require-static-classes": "error",
    "designops/no-unknown-classes": "error"
  },
  "overrides": [
    {
      "files": ["components/ui/**"],
      "rules": { "designops/no-restyle": "off" }
    }
  ]
}

// npx oxlint`,
    },
    vue: {
      label: ".oxlintrc.json · Vue",
      code: `// npm install -D @designops/lint oxlint
// Oxlint reads <script> blocks; templates need ESLint (see docs/vue.md).
{
  "jsPlugins": ["@designops/lint"],
  "rules": {
    "designops/no-restyle": ["error", { "allow": ["layout"] }],
    "designops/no-raw-colors": "error",
    "designops/no-arbitrary-values": "error",
    "designops/no-inline-styles": "error",
    "designops/require-static-classes": "error",
    "designops/no-unknown-classes": "error"
  }
}

// npx oxlint`,
    },
    svelte: {
      label: ".oxlintrc.json · Svelte",
      code: `// npm install -D @designops/lint oxlint
// Oxlint reads <script> blocks; markup needs ESLint (see docs/svelte.md).
{
  "jsPlugins": ["@designops/lint"],
  "rules": {
    "designops/no-restyle": ["error", { "allow": ["layout"] }],
    "designops/no-raw-colors": "error",
    "designops/no-arbitrary-values": "error",
    "designops/no-inline-styles": "error",
    "designops/require-static-classes": "error",
    "designops/no-unknown-classes": "error"
  }
}

// npx oxlint`,
    },
  },
}

const CONFIG_CODE = `// Per-component contracts: each part of the system gets its own rules.
"designops/no-restyle": ["error", {
  allow: ["layout"],
  // Custom messages, with {{placeholders}} filled from your system.
  message: { spacing: "Use a {{component}} size: {{sizes}}." },
  contracts: [
    { pattern: "^CardTitle$", allow: ["layout", "typography"] },
    { pattern: "^CardContent$", allow: ["layout", "spacing"] },
  ],
}],
"designops/no-raw-colors": ["error", {
  message: "Use a theme color from {{file}}.",
}],

// Shared recognition + guidance (oxlint: root "settings";
// ESLint: the same object in your config).
"settings": {
  "designops": {
    "ui": "@/ds",
    "componentImports": ["^@acme/ui(/|$)"],
    "note": "See DESIGN.md for approved exceptions."
  }
}`

/* ── Playground presets ───────────────────────────────────────────── */

const PRESETS = [
  {
    name: "All six",
    code: `import { Button } from "@/components/ui/button"

export function Demo({ color }: { color: string }) {
  return (
    <main className="mx-auto max-w-2xl">
      <Button className="p-4">Submit</Button>
      <div className="bg-pink-500">Raw color</div>
      <div className="p-[13px]">Arbitrary value</div>
      <div style={{ color: "red" }}>Inline style</div>
      <Button className={\`mt-\${color}\`}>Dynamic</Button>
      <div className="rounded-huge">Unknown class</div>
      <Button size="lg" className="mt-4 w-full">
        Save changes
      </Button>
    </main>
  )
}`,
  },
  {
    name: "Restyle",
    code: `import { Button } from "@/components/ui/button"

export const A = () => <Button className="p-4">Submit</Button>`,
  },
  {
    name: "Raw color",
    code: `export const A = () => <div className="bg-pink-500">Raw color</div>`,
  },
  {
    name: "Arbitrary",
    code: `export const A = () => <div className="p-[13px]">Arbitrary</div>`,
  },
  {
    name: "Inline style",
    code: `export const A = () => <div style={{ color: "red" }}>Inline</div>`,
  },
  {
    name: "Dynamic",
    code: `import { Button } from "@/components/ui/button"

export const A = ({ n }: { n: string }) => (
  <Button className={\`mt-\${n}\`}>Dynamic</Button>
)`,
  },
  {
    name: "Unknown",
    code: `export const A = () => <div className="rounded-huge">Unknown</div>`,
  },
  {
    name: "Clean ✓",
    code: `import { Button } from "@/components/ui/button"

export function Save() {
  return (
    <main className="mx-auto max-w-2xl">
      <div className="bg-primary p-3.25">On-theme, on-scale</div>
      <Button size="lg" className="mt-4 w-full">
        Save changes
      </Button>
    </main>
  )
}`,
  },
]

/* ── Helpers ──────────────────────────────────────────────────────── */

function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function shortRule(id) {
  return id ? id.replace(/^designops\//, "") : "error"
}

/* ── Rule cards ───────────────────────────────────────────────────── */

function renderRules() {
  const host = document.getElementById("rule-cards")
  host.innerHTML = RULES.map(
    (r) => `
    <article class="rule-card">
      <header><code class="rule-id">${esc(r.id)}</code></header>
      <p class="rule-blurb">${esc(r.blurb)}</p>
      <p class="rule-label bad">violation</p>
      <pre class="snippet bad"><code>${esc(r.bad)}</code></pre>
      <p class="rule-label out">diagnostic · verbatim</p>
      <p class="diagnostic">${esc(r.message)}</p>
      <p class="rule-label ok">fix</p>
      <pre class="snippet ok"><code>${esc(r.fix)}</code></pre>
    </article>`
  ).join("")
}

/* ── Copy buttons ─────────────────────────────────────────────────── */

function wireCopy() {
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const el = document.getElementById(btn.dataset.copy)
      const text = el ? el.textContent : ""
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        const ta = document.createElement("textarea")
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand("copy")
        ta.remove()
      }
      const prev = btn.textContent
      btn.textContent = "Copied!"
      setTimeout(() => (btn.textContent = prev), 1200)
    })
  })
}

/* ── Setup tabs ───────────────────────────────────────────────────── */

const setupState = { linter: "eslint", framework: "react" }

function renderSetup() {
  const { linter, framework } = setupState
  const entry = SETUPS[linter][framework]
  document.getElementById("setup-label").textContent = entry.label
  document.getElementById("setup-code").textContent = entry.code
  document.querySelectorAll("[data-linter]").forEach((b) => {
    const on = b.dataset.linter === linter
    b.classList.toggle("active", on)
    b.setAttribute("aria-selected", String(on))
  })
  document.querySelectorAll("[data-framework]").forEach((b) => {
    const on = b.dataset.framework === framework
    b.classList.toggle("active", on)
    b.setAttribute("aria-selected", String(on))
  })
}

function wireSetup() {
  document.querySelectorAll("[data-linter]").forEach((b) =>
    b.addEventListener("click", () => {
      setupState.linter = b.dataset.linter
      renderSetup()
    })
  )
  document.querySelectorAll("[data-framework]").forEach((b) =>
    b.addEventListener("click", () => {
      setupState.framework = b.dataset.framework
      renderSetup()
    })
  )
  document.getElementById("config-code").textContent = CONFIG_CODE
  renderSetup()
}

/* ── Hero terminal ────────────────────────────────────────────────── */

function runTerminal() {
  const el = document.getElementById("terminal-text")
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = TERMINAL_TEXT
    return
  }
  const step = 9
  let i = 0
  function tick() {
    i = Math.min(i + step, TERMINAL_TEXT.length)
    el.textContent = TERMINAL_TEXT.slice(0, i)
    if (i < TERMINAL_TEXT.length) {
      setTimeout(tick, 24)
    } else {
      setTimeout(() => {
        i = 0
        el.textContent = ""
        setTimeout(tick, 600)
      }, 9000)
    }
  }
  tick()
}

/* ── Playground ───────────────────────────────────────────────────── */

const pg = {
  available: false,
  timer: null,
  seq: 0,
}

function setStatus(text, cls) {
  const el = document.getElementById("pg-status")
  el.textContent = text
  el.className = "pg-status" + (cls ? " " + cls : "")
}

function renderResults(diagnostics, ms) {
  const list = document.getElementById("results")
  const count = document.getElementById("pg-count")
  count.textContent =
    diagnostics.length === 0
      ? "0 problems"
      : diagnostics.length +
        (diagnostics.length === 1 ? " problem" : " problems")
  if (diagnostics.length === 0) {
    list.innerHTML = `<li class="pg-empty"><span class="pg-check">✓</span> Clean — 0 problems${ms != null ? ` in ${ms}ms` : ""}.</li>`
    return
  }
  list.innerHTML = diagnostics
    .map(
      (d) => `<li class="pg-item">
        <span class="pg-loc">${d.line}:${d.column}</span>
        <span class="pg-rule">${esc(shortRule(d.ruleId))}</span>
        <span class="pg-msg">${esc(d.message)}</span>
      </li>`
    )
    .join("")
}

async function lintNow() {
  const editor = document.getElementById("editor")
  if (!pg.available) return
  const code = editor.value
  if (!code.trim()) {
    renderResults([], null)
    setStatus("idle", "")
    return
  }
  const seq = ++pg.seq
  setStatus("linting…", "busy")
  try {
    const res = await fetch("/api/lint", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    if (seq !== pg.seq) return // a newer keystroke won
    if (!res.ok) throw new Error(data.error || "lint failed")
    renderResults(data.diagnostics, data.ms)
    setStatus(
      data.diagnostics.length === 0
        ? `✓ clean · ${data.ms}ms`
        : `${data.diagnostics.length} error${data.diagnostics.length === 1 ? "" : "s"} · ${data.ms}ms`,
      data.diagnostics.length === 0 ? "clean" : "dirty"
    )
  } catch (error) {
    if (seq !== pg.seq) return
    setStatus("error", "dirty")
    document.getElementById("results").innerHTML =
      `<li class="pg-empty">Lint failed: ${esc(error.message)}</li>`
  }
}

function lintSoon() {
  clearTimeout(pg.timer)
  pg.timer = setTimeout(lintNow, 450)
}

function syncGutter() {
  const editor = document.getElementById("editor")
  const gutter = document.getElementById("gutter")
  const lines = editor.value.split("\n").length
  let text = ""
  for (let n = 1; n <= lines; n++) text += n + "\n"
  gutter.textContent = text
  gutter.scrollTop = editor.scrollTop
}

function wirePlayground() {
  const editor = document.getElementById("editor")
  const presets = document.getElementById("presets")
  presets.innerHTML = PRESETS.map(
    (p, i) =>
      `<button class="preset${i === 0 ? " active" : ""}" data-preset="${i}">${esc(p.name)}</button>`
  ).join("")
  editor.value = PRESETS[0].code
  syncGutter()

  presets.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-preset]")
    if (!btn) return
    presets
      .querySelectorAll(".preset")
      .forEach((b) => b.classList.remove("active"))
    btn.classList.add("active")
    editor.value = PRESETS[Number(btn.dataset.preset)].code
    syncGutter()
    lintNow()
  })
  editor.addEventListener("input", () => {
    syncGutter()
    lintSoon()
  })
  editor.addEventListener("scroll", syncGutter)
  editor.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault()
      const { selectionStart, selectionEnd } = editor
      editor.setRangeText("  ", selectionStart, selectionEnd, "end")
      syncGutter()
      lintSoon()
    }
  })
}

async function checkHealth() {
  const note = document.getElementById("pg-note")
  try {
    const res = await fetch("/api/health")
    if (!res.ok) throw new Error("no api")
    const data = await res.json()
    pg.available = true
    document.getElementById("version-chip").textContent = "v" + data.version
    note.innerHTML = `Connected to <code>@designops/lint v${esc(data.version)}</code> — every keystroke is checked by the real build against the demo design system (<code>components.json</code> aliases, Button variants, Tailwind v4 theme).`
    lintNow()
  } catch {
    pg.available = false
    note.innerHTML = `The playground needs the local server: run <code>npm run site</code> and open this page through it. (Static hosts serve the showcase only.)`
    document.getElementById("results").innerHTML =
      `<li class="pg-empty">API unreachable — start the server to lint.</li>`
  }
}

/* ── Boot ─────────────────────────────────────────────────────────── */

renderRules()
wireCopy()
wireSetup()
runTerminal()
wirePlayground()
checkHealth()
