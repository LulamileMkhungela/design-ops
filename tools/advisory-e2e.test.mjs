/**
 * DesignOps · advisory → tokens → lint, end to end
 *
 *   pnpm build && node --test tools/advisory-e2e.test.mjs
 *
 * The advisory catalogue can only recommend. This test proves the other half:
 * that a proposal it produces becomes a theme the real @designops/lint build
 * can read, and that the linter then accepts code written against the
 * proposed tokens and rejects code that ignores them.
 *
 * It is the one test in the repo that spans both projects, so it runs the
 * built linter rather than mocks. It skips — loudly — when packages/lint/dist
 * is missing, because `pnpm test:lint` already covers the rules themselves.
 */

import assert from "node:assert/strict"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { createRequire } from "node:module"
import * as os from "node:os"
import { dirname, join, resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

import { buildProposal, buildThemeCss } from "./advisory.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const LINT_DIST = join(ROOT, "packages", "lint", "dist", "index.js")
const BUILT = existsSync(LINT_DIST)

const currentTokens = JSON.parse(
  readFileSync(join(ROOT, "tokens", "tokens.json"), "utf8")
)

// The palette the catalogue returns for "dark fintech dashboard". Fixed here
// so the test does not need Python; tools/advisory.mjs check covers the
// search engine, and advisory.test.mjs covers the mapping.
const ADVISORY = {
  style: { id: "dark-mode-oled", name: "Dark Mode (OLED)" },
  category: "Financial Dashboard",
  colors: {
    primary: "#22C55E",
    on_primary: "#0F172A",
    secondary: "#1E293B",
    accent: "#22C55E",
    background: "#020617",
    foreground: "#F8FAFC",
    card: "#0E1223",
    muted: "#1A1E2F",
    muted_foreground: "#94A3B8",
    destructive: "#EF4444",
    ring: "#FFFFFF",
  },
  typography: { heading: "Fira Code", body: "Fira Sans" },
  spacing_scale: {
    xs: "2px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "24px",
    "3xl": "32px",
  },
  anti_patterns: "Light mode default",
  severity: "HIGH",
  source_identities: {
    product: "Financial Dashboard",
    style: "dark-mode-oled",
  },
  reasoning_default: false,
}

/** Stand up a project whose theme comes entirely from an advisory proposal. */
function scratchProject(slug) {
  const { tree } = buildProposal(ADVISORY, currentTokens)
  const root = mkdtemp(slug)
  mkdirSync(join(root, "app"), { recursive: true })
  mkdirSync(join(root, "lib"), { recursive: true })
  mkdirSync(join(root, "components", "ui"), { recursive: true })

  writeFileSync(
    join(root, "components.json"),
    JSON.stringify(
      {
        $schema: "https://ui.shadcn.com/schema.json",
        tailwind: { css: "app/globals.css" },
        aliases: {
          components: "@/components",
          utils: "@/lib/utils",
          ui: "@/components/ui",
          lib: "@/lib",
        },
      },
      null,
      2
    )
  )
  writeFileSync(join(root, "app", "globals.css"), buildThemeCss(tree, { slug }))
  writeFileSync(
    join(root, "lib", "utils.ts"),
    "export function cn(...parts: unknown[]) { return parts.filter(Boolean).join(' ') }\n"
  )
  writeFileSync(
    join(root, "components", "ui", "button.tsx"),
    `import { cn } from "@/lib/utils"

export function Button({ className, ...props }: any) {
  return <button className={cn("rounded-md bg-primary-900 px-4", className)} {...props} />
}
`
  )
  return { root, tree }
}

function mkdtemp(slug) {
  return mkdtempSync(join(os.tmpdir(), `designops-advisory-${slug}-`))
}

async function lintScratch(root, code) {
  // eslint and the parser are dependencies of packages/lint, so resolve
  // from there rather than the repo root — pnpm does not hoist them.
  const lintRequire = createRequire(
    join(ROOT, "packages", "lint", "package.json")
  )
  const { Linter } = lintRequire("eslint")
  const parser = lintRequire("@typescript-eslint/parser")
  const { plugin } = await import(LINT_DIST)

  const file = join(root, "app", "page.tsx")
  writeFileSync(file, code)

  // The proposal's theme declares these tokens; tailwindcss must resolve for
  // no-unknown-classes to check them against Tailwind's own utilities.
  const tw = join(ROOT, "packages", "lint", "node_modules", "tailwindcss")
  if (
    existsSync(tw) &&
    !existsSync(join(root, "node_modules", "tailwindcss"))
  ) {
    mkdirSync(join(root, "node_modules"), { recursive: true })
    symlinkSync(tw, join(root, "node_modules", "tailwindcss"))
  }

  const config = [
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
        "designops/no-inline-styles": "error",
        "designops/no-restyle": "error",
      },
    },
  ]
  return new Linter({ cwd: root }).verify(code, config, file)
}

const created = []
test(
  "an advisory proposal becomes a theme the real linter accepts",
  { skip: !BUILT },
  async (t) => {
    const { root } = scratchProject("e2e")
    created.push(root)

    await t.test(
      "code written against the proposed tokens is clean",
      async () => {
        // Note what this does NOT do: put a colour class on <Button>. The
        // component owns its colour, so that is a no-restyle finding even when
        // the class names a token the proposal just declared.
        const messages = await lintScratch(
          root,
          `import { Button } from "@/components/ui/button"

export function Page() {
  return (
    <div className="bg-neutral-900 p-4">
      <p className="text-ink-default">Balance</p>
      <p className="text-ink-muted">Updated a moment ago</p>
      <div className="bg-neutral-800 rounded-md">
        <Button>Save</Button>
      </div>
    </div>
  )
}
`
        )
        assert.deepEqual(
          messages.map((m) => m.ruleId),
          [],
          `unexpected diagnostics: ${JSON.stringify(messages)}`
        )
      }
    )

    await t.test(
      "the same palette as raw hex is reported, and the proposal is offered as the fix",
      async () => {
        // #020617 is the advisory's own `background`, mapped to
        // color.neutral.900. Hardcoding it is exactly the drift the loop exists
        // to prevent — and the fix the linter suggests comes from the proposal.
        const messages = await lintScratch(
          root,
          `export function Page() {
  return <div className="bg-[#020617] text-[#22C55E]">Balance</div>
}
`
        )
        const arbitrary = messages.filter(
          (m) => m.ruleId === "designops/no-arbitrary-values"
        )
        assert.equal(arbitrary.length, 2, JSON.stringify(messages))

        const bg = arbitrary.find((m) => m.message.includes("bg-[#020617]"))
        assert.ok(bg, "the background hex was not reported")
        assert.match(
          bg.message,
          /bg-neutral-900/,
          "the proposed token must be suggested"
        )
        assert.equal(bg.suggestions[0].data.replacement, "bg-neutral-900")

        const fg = arbitrary.find((m) => m.message.includes("text-[#22C55E]"))
        assert.ok(fg, "the accent hex was not reported")
        assert.match(fg.message, /text-primary-900/)
      }
    )

    await t.test(
      "an arbitrary value is reported and the token scale offered",
      async () => {
        const messages = await lintScratch(
          root,
          `import { Button } from "@/components/ui/button"

export function Page() {
  return <div className="p-[13px]"><Button>Save</Button></div>
}
`
        )
        const arb = messages.filter(
          (m) => m.ruleId === "designops/no-arbitrary-values"
        )
        assert.equal(arb.length, 1, JSON.stringify(messages))
        assert.match(arb[0].message, /p-3|space/)
      }
    )

    await t.test("restyling the shared component is reported", async () => {
      const messages = await lintScratch(
        root,
        `import { Button } from "@/components/ui/button"

export function Page() {
  return <Button className="bg-danger-600">Save</Button>
}
`
      )
      const restyle = messages.filter(
        (m) => m.ruleId === "designops/no-restyle"
      )
      assert.equal(restyle.length, 1, JSON.stringify(messages))
      assert.match(restyle[0].message, /variant/)
    })

    t.after(() =>
      created.forEach((dir) => rmSync(dir, { recursive: true, force: true }))
    )
  }
)

test("the proposal's contrast failures are real, not tolerated", () => {
  const { contrast, tree } = buildProposal(ADVISORY, currentTokens)
  // A green accent on a near-black surface is legible; every pair the
  // system renders is measured, and pass/fail is computed, not assumed.
  assert.equal(contrast.length, 7)
  for (const c of contrast) assert.equal(c.pass, c.ratio >= c.required)
  assert.equal(tree.color.primary["900"].$value, "#22C55E")
  assert.ok(tree.color.neutral["900"].$value === "#020617")
  assert.ok(
    contrast.find(
      (c) =>
        c.background === "color.neutral.900" &&
        c.foreground === "color.ink.default"
    ).pass,
    "body text on the app background must pass for this palette"
  )
})

test("skips loudly when packages/lint is not built", { skip: BUILT }, () => {
  assert.fail(
    "packages/lint/dist is missing — run `pnpm build` before the end-to-end advisory test."
  )
})
