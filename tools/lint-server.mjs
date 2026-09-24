// DesignOps dashboard server with a live lint API. Zero dependencies.
//
// - Serves the dashboard (index.html, assets/, demo/, dist/, tokens/).
// - POST /api/lint { code } runs the REAL @designops/lint build against a
//   scratch copy of the demo design system and returns its diagnostics,
//   powering the interactive playground in the dashboard's Lint view.
// - GET /api/health reports the lint package version.
//
// Local preview tool only: it lints arbitrary code you paste and is not
// hardened for production hosting. Run with `npm start`.
//
// The lint engine is exported so tools/lint-capture.mjs can reuse it to
// refresh the verbatim diagnostics in assets/data.js (LINT_RULES).

import * as fs from "node:fs"
import * as http from "node:http"
import { createRequire } from "node:module"
import * as os from "node:os"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "..")
const PORT = Number(process.env.PORT || 4173)
const MAX_CODE_BYTES = 32 * 1024
const STATIC_ROOT = ROOT // the dashboard lives at the repo root

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
}

export function lintVersion() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, "packages/lint/package.json"), "utf-8")
  )
  return manifest.version
}

// Lazily built on the first /api/lint call so static serving stays instant.
let engine = null

async function getEngine() {
  if (engine) return engine
  const pkgRequire = createRequire(
    path.join(ROOT, "packages/lint/package.json")
  )
  const { Linter } = pkgRequire("eslint")
  const parser = pkgRequire("@typescript-eslint/parser")
  const { plugin } = await import(
    path.join(ROOT, "packages/lint/dist/index.js")
  )
  if (!fs.existsSync(path.join(ROOT, "packages/lint/dist/index.js"))) {
    throw new Error(
      "packages/lint/dist is missing: run `pnpm build` before `npm start`."
    )
  }

  // A scratch copy of the demo design system (components.json aliases,
  // Button with cva variants, Tailwind v4 theme). Each request lints a
  // real file inside it, exactly like the test suite does.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "designops-playground-"))
  fs.cpSync(path.join(ROOT, "packages/lint/test/fixtures/project"), root, {
    recursive: true,
  })
  const tw = path.join(ROOT, "packages/lint/node_modules/tailwindcss")
  if (fs.existsSync(tw)) {
    fs.mkdirSync(path.join(root, "node_modules"), { recursive: true })
    fs.symlinkSync(tw, path.join(root, "node_modules/tailwindcss"))
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
        "designops/no-restyle": ["error", { allow: ["layout"] }],
        "designops/no-raw-colors": "error",
        "designops/no-arbitrary-values": "error",
        "designops/no-inline-styles": "error",
        "designops/require-static-classes": "error",
        "designops/no-unknown-classes": "error",
      },
    },
  ]
  engine = { linter: new Linter({ cwd: root }), config, root, counter: 0 }
  return engine
}

function prunePlaygroundFiles(root, keepFrom) {
  // Keep only recent request files so the scratch dir stays small.
  let files = []
  try {
    files = fs
      .readdirSync(path.join(root, "app"))
      .filter((f) => /^pg-\d+\.tsx$/.test(f))
      .sort((a, b) => Number(a.slice(3, -4)) - Number(b.slice(3, -4)))
  } catch {
    return
  }
  for (const f of files.slice(0, Math.max(0, files.length - keepFrom))) {
    fs.rmSync(path.join(root, "app", f), { force: true })
  }
}

export async function lintCode(code) {
  if (typeof code !== "string" || code.length === 0) {
    throw new Error("`code` must be a non-empty string.")
  }
  if (code.length > MAX_CODE_BYTES) {
    throw new Error("`code` exceeds the 32KB playground limit.")
  }
  const { linter, config, root } = await getEngine()
  engine.counter += 1
  const filename = path.join(root, "app", `pg-${engine.counter}.tsx`)
  fs.writeFileSync(filename, code)
  const started = Date.now()
  const messages = linter.verify(code, config, { filename })
  const diagnostics = messages.map((m) => ({
    ruleId: m.ruleId,
    line: m.line,
    column: m.column,
    endLine: m.endLine ?? null,
    endColumn: m.endColumn ?? null,
    message: m.message,
  }))
  prunePlaygroundFiles(root, 20)
  return { diagnostics, ms: Date.now() - started }
}

function serveStatic(req, res) {
  const pathname = new URL(req.url, "http://localhost").pathname
  const rel = pathname === "/" ? "index.html" : pathname.slice(1)
  const file = path.normalize(path.join(STATIC_ROOT, rel))
  if (!file.startsWith(STATIC_ROOT + path.sep) && file !== STATIC_ROOT) {
    res.writeHead(403, { "content-type": "text/plain" })
    res.end("forbidden")
    return
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404, { "content-type": "text/plain" })
      res.end("not found")
      return
    }
    res.writeHead(200, {
      "content-type": MIME[path.extname(file)] || "application/octet-stream",
      "cache-control": "no-store",
    })
    res.end(data)
  })
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on("data", (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error("body too large"))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")))
    req.on("error", reject)
  })
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url.startsWith("/api/health")) {
      res.writeHead(200, { "content-type": MIME[".json"] })
      res.end(JSON.stringify({ ok: true, version: lintVersion() }))
      return
    }
    if (req.method === "POST" && req.url.startsWith("/api/lint")) {
      const body = await readBody(req, MAX_CODE_BYTES + 1024)
      const { code } = JSON.parse(body)
      const result = await lintCode(code)
      res.writeHead(200, { "content-type": MIME[".json"] })
      res.end(JSON.stringify(result))
      return
    }
    if (req.method === "GET") {
      serveStatic(req, res)
      return
    }
    res.writeHead(405, { "content-type": "text/plain" })
    res.end("method not allowed")
  } catch (error) {
    res.writeHead(500, { "content-type": MIME[".json"] })
    res.end(JSON.stringify({ error: String(error?.message || error) }))
  }
})

const invokedDirectly =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (invokedDirectly) {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`DesignOps dashboard: http://localhost:${PORT}`)
    console.log(`Lint playground:   http://localhost:${PORT}/#/lint`)
    console.log(`API health:        http://localhost:${PORT}/api/health`)
  })
  process.on("SIGINT", () => process.exit(0))
  process.on("exit", () => {
    if (engine) fs.rmSync(engine.root, { recursive: true, force: true })
  })
}
