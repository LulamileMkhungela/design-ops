/* ═══════════════════════════════════════════════════════════════
   DESIGNOPS · application
   Author: Lulamile Mkhungela
   Hash-router SPA. Everything is render-on-demand from the data
   layer; state (requests, comments, ships) persists to localStorage.
   ═══════════════════════════════════════════════════════════════ */

"use strict"

/* ── 0 · persistent state ───────────────────────────────────── */
const LS_KEY = "designops-state-v1"

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    /* corrupted state → fresh start */
  }
  return {
    requests: JSON.parse(JSON.stringify(REQUEST_SEED)), // deep clone of seed
    shipped: [], // component ids promoted via the request flow
    comments: {}, // compId → array of user comments
    roleIdx: 0, // PEOPLE index for the request composer
  }
}
let state = loadState()
const persist = () => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch (e) {}
}

/* ── 1 · small utilities ────────────────────────────────────── */
const $ = (sel, root) => (root || document).querySelector(sel)
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel))
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

function copyText(text, btn) {
  const done = () => {
    if (btn) {
      const t = btn.textContent
      btn.textContent = "copied!"
      setTimeout(() => {
        btn.textContent = t
      }, 1500)
    }
  }
  const fallback = () => {
    // pre-async-clipboard browsers
    try {
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      ta.remove()
    } catch (e) {
      /* clipboard unavailable — stay silent rather than break */
    }
    done()
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(text).then(done, fallback)
    else fallback()
  } catch (e) {
    fallback()
  }
}

function downloadFile(name, content) {
  try {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (e) {
    /* download blocked — the text is still copyable from the UI */
  }
}

let toastTimer = 0
function toast(title, sub, icon) {
  clearTimeout(toastTimer)
  const root = $("#toastRoot")
  const t = document.createElement("div")
  t.className = "toast"
  t.innerHTML =
    '<span class="toast-icon">' +
    (icon || "✓") +
    '</span><div><div class="toast-title">' +
    esc(title) +
    "</div>" +
    (sub ? '<div class="toast-sub">' + esc(sub) + "</div>" : "") +
    "</div>"
  root.appendChild(t)
  setTimeout(() => {
    t.classList.add("out")
    setTimeout(() => t.remove(), 260)
  }, 4200)
}

/* Single-pass, nest-safe syntax highlighter for escaped source. */
function highlight(src) {
  const s = esc(src)
  return s.replace(
    /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|&lt;!--[\s\S]*?--&gt;)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|(&lt;\/?[A-Za-z][\w-]*)|(\b(?:import|export|from|return|const|let|var|function|class|extends|interface|type|new|if|else|of|in|async|await|this|undefined|null|true|false|as|get)\b)|(@\w+)|(var\(--[\w-]+\))|(\$\{[^}]*\})/g,
    (m, cm, str, tag, kw, dc, vr, expr) => {
      if (cm) return '<span class="cm">' + cm + "</span>"
      if (str) return '<span class="str">' + str + "</span>"
      if (tag) return '<span class="at">' + tag + "</span>"
      if (kw) return '<span class="kw">' + kw + "</span>"
      if (dc) return '<span class="dc">' + dc + "</span>"
      if (vr) return '<span class="vr">' + vr + "</span>"
      if (expr) return '<span class="fn">' + expr + "</span>"
      return m
    }
  )
}

function codeBlock(file, lang, code) {
  return (
    '<div class="code-wrap"><div class="code-bar"><span class="code-file">' +
    esc(file) +
    "</span>" +
    '<div class="code-bar-r"><span class="lang-badge">' +
    esc(lang) +
    '</span><button class="copy-btn">copy</button></div></div>' +
    "<pre><code>" +
    highlight(code) +
    "</code></pre></div>"
  )
}

const initialsOf = (name) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

/* ── 2 · status helpers ─────────────────────────────────────── */
const STATUS_META = {
  ready: { icon: "✓", label: "Ready", color: "var(--green)", cls: "ready" },
  review: {
    icon: "⚠",
    label: "In review",
    color: "var(--amber)",
    cls: "review",
  },
  waiting: { icon: "◌", label: "Queued", color: "var(--blue)", cls: "waiting" },
  missing: {
    icon: "✕",
    label: "Not started",
    color: "var(--red)",
    cls: "missing",
  },
}

/** Effective component status — request-approved components flip to all-ready. */
function compStatus(c) {
  if (state.shipped.includes(c.id)) {
    return {
      figma: "ready",
      tokens: "ready",
      build: "ready",
      frameworks: "ready",
      storybook: "ready",
    }
  }
  return c.status
}
function compSub(c, stage) {
  if (state.shipped.includes(c.id)) {
    return {
      figma: "Design approved",
      tokens: "Tokens reserved",
      build: "Built on approval",
      frameworks: "14/14 targets live",
      storybook: "Stories scaffolded",
    }[stage]
  }
  return c.subs[stage]
}
function readyCount(c) {
  return STAGES.filter((s) => compStatus(c)[s.key] === "ready").length
}
function overallStatus(c) {
  const n = readyCount(c)
  return n === 5 ? "ready" : n === 0 ? "missing" : "partial"
}

/* ── 3 · sidebar ────────────────────────────────────────────── */
const NAV = [
  { id: "overview", label: "Overview" },
  { id: "tokens", label: "Tokens" },
  { id: "components", label: "Components" },
  { id: "frameworks", label: "Frameworks (ship)" },
  { id: "advisory", label: "Advisory", badge: () => ADVISORY.counts.length },
  { id: "demos", label: "Demos", badge: () => demosData().demos.length },
  { id: "lint", label: "Lint", badge: () => LINT_RULES.length },
  {
    id: "requests",
    label: "Requests",
    badge: () => state.requests.filter((r) => r.status !== "shipped").length,
    badgeCls: "amber",
  },
  { id: "storybook", label: "Storybook" },
  { id: "integrations", label: "Integrations" },
  { id: "guide", label: "Guide & docs" },
]
const TOPBAR_TITLES = {
  overview: "DesignOps · Overview",
  tokens: "Design tokens pipeline",
  components: "Component library",
  frameworks: "Ship to every framework",
  advisory: "Advisory → tokens → verified",
  demos: "Demo sites, built from tokens",
  lint: "Design system lint",
  requests: "Component requests",
  storybook: "Storybook sync",
  integrations: "Integration gateways",
  guide: "DesignOps guide",
}

function renderSidebar() {
  $("#sbNav").innerHTML =
    '<div class="sb-section"><div class="sb-section-label">Workspace</div>' +
    NAV.map((n) => {
      const badge = n.badge
        ? '<span class="sb-badge ' +
          (n.badgeCls || "muted") +
          '">' +
          n.badge() +
          "</span>"
        : n.id === "components"
          ? '<span class="sb-badge muted">' + COMPONENTS.length + "</span>"
          : ""
      return (
        '<div class="sb-nav-item" data-route="' +
        n.id +
        '"><div class="sb-nav-left"><span class="sb-dot" style="background:' +
        {
          overview: "var(--accent)",
          tokens: "var(--token)",
          components: "var(--green)",
          frameworks: "var(--ink-45)",
          advisory: "var(--stdict)",
          demos: "var(--green)",
          lint: "var(--blue)",
          requests: "var(--amber)",
          storybook: "var(--storybook)",
          integrations: "var(--stdict)",
          guide: "var(--figma)",
        }[n.id] +
        '"></span><span class="sb-nav-name">' +
        n.label +
        "</span></div>" +
        badge +
        "</div>"
      )
    }).join("") +
    "</div>"
}

/* ── 4 · shared fragments ───────────────────────────────────── */
function heroHTML(eyebrow, h1, lead, stats) {
  return (
    '<div class="page-hero"><div class="hero-eyebrow">' +
    eyebrow +
    "</div><h1>" +
    h1 +
    "</h1>" +
    '<p class="hero-lead">' +
    lead +
    "</p>" +
    (stats || "") +
    "</div>"
  )
}

function pipelineFlowHTML(activeIdx) {
  const stages = [
    ["01", "Figma Variables", "Tokens + auto-layout", "var(--figma)"],
    ["02", "Tokens JSON", "Versioned source of truth", "var(--token)"],
    ["03", "Transform", "Style Dictionary build", "var(--stdict)"],
    ["04", "Framework build", "14 targets at once", "var(--accent)"],
    ["05", "Storybook", "Living documentation", "var(--storybook)"],
  ]
  return (
    '<div class="pipeline-flow"><div class="pf-label">End-to-end — every component travels all five stages</div><div class="pf-row">' +
    stages
      .map(
        ([num, name, tech, col], i) =>
          '<div class="pf-step" style="' +
          (i === activeIdx ? "background:var(--surface-2)" : "") +
          '"><div class="pf-step-num">' +
          num +
          "</div>" +
          '<div class="pf-step-name">' +
          name +
          '</div><div class="pf-step-tech">' +
          tech +
          "</div>" +
          '<div class="pf-step-bar" style="background:' +
          col +
          (i <= activeIdx ? "" : ";opacity:.25") +
          '"></div></div>' +
          (i < stages.length - 1 ? '<div class="pf-arrow">→</div>' : "")
      )
      .join("") +
    "</div></div>"
  )
}

function stageChips(c) {
  return STAGES.map((s) => {
    const m = STATUS_META[compStatus(c)[s.key]]
    return (
      '<span class="ps-chip ' +
      m.cls +
      '" title="' +
      s.name +
      ": " +
      m.label +
      '"><span class="ps-dot"></span>' +
      s.name +
      "</span>"
    )
  }).join("")
}

function overviewGrid(c) {
  return (
    '<div class="overview-grid">' +
    STAGES.map((s) => {
      const st = compStatus(c)[s.key]
      const m = STATUS_META[st]
      return (
        '<div class="og-cell"><div class="og-pipe" style="color:' +
        s.color +
        '">' +
        s.name +
        "</div>" +
        '<div class="og-status" style="color:' +
        m.color +
        '">' +
        m.icon +
        " " +
        m.label +
        "</div>" +
        '<div class="og-sub">' +
        compSub(c, s.key) +
        "</div></div>"
      )
    }).join("") +
    "</div>"
  )
}

function progressHTML(c) {
  const n = readyCount(c)
  const pct = n * 20
  const col = n === 5 ? "var(--green)" : n === 0 ? "var(--red)" : "var(--amber)"
  return (
    '<div class="prog-wrap"><div class="prog-label"><span>Pipeline completion</span><span>' +
    n +
    "/5</span></div>" +
    '<div class="prog-bar"><div class="prog-fill" style="width:' +
    pct +
    "%;background:" +
    col +
    '"></div></div></div>'
  )
}

/* ── 5 · VIEW: overview ─────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════════
   LIVE CONNECTIONS · github · figma · storybook
   Real-data layer. GitHub works with zero setup (public API, cached);
   Figma and Storybook light up once a token / URL is saved in the
   Integrations view. Secrets stay in this browser (localStorage).
   ═══════════════════════════════════════════════════════════════ */
const CONN_KEY = "designops-connections-v1"

function loadConn() {
  let c = {}
  try {
    c = JSON.parse(localStorage.getItem(CONN_KEY) || "{}")
  } catch (e) {
    /* fresh start */
  }
  return Object.assign({}, CONNECTIONS_DEFAULTS, c)
}
let conn = loadConn()
const saveConn = () => {
  try {
    localStorage.setItem(CONN_KEY, JSON.stringify(conn))
  } catch (e) {}
}

/* pure helpers (covered by smoke tests) -------------------------- */
function timeAgo(iso, nowMs) {
  const t = Date.parse(iso)
  if (isNaN(t)) return ""
  const s = Math.max(0, Math.floor(((nowMs || Date.now()) - t) / 1000))
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return m + "m ago"
  const h = Math.floor(m / 60)
  if (h < 24) return h + "h ago"
  const d = Math.floor(h / 24)
  if (d < 7) return d + "d ago"
  const w = Math.floor(d / 7)
  if (w < 5) return w + "w ago"
  const mo = Math.floor(d / 30)
  if (mo < 12) return mo + "mo ago"
  return Math.floor(d / 365) + "y ago"
}

function githubIssueURL(repo, title, body) {
  return (
    "https://github.com/" +
    repo +
    "/issues/new?title=" +
    encodeURIComponent(title || "") +
    "&body=" +
    encodeURIComponent(body || "")
  )
}

/* GitHub commits API payload → activity items [dot, text, time, url]. */
function githubCommitActivity(commits) {
  return (commits || []).slice(0, 5).map((c) => {
    const msg = ((c.commit && c.commit.message) || "commit")
      .split("\n")[0]
      .slice(0, 100)
    const who =
      (c.author && c.author.login) ||
      (c.commit && c.commit.author && c.commit.author.name) ||
      ""
    return [
      "var(--github)",
      msg + (who ? " — " + who : ""),
      timeAgo(c.commit && c.commit.author && c.commit.author.date),
      c.html_url || "",
    ]
  })
}

/* Dashboard components ↔ Figma file component names. Figma names often
   carry library prefixes or variant suffixes ("Lula / Button",
   "Button / Primary") — a component matches when its name equals the
   full name or any / -separated segment (case-insensitive). */
function matchFigmaComponents(components, figmaNames) {
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .trim()
  const have = {}
  ;(figmaNames || []).forEach((n) => {
    have[norm(n)] = true
    norm(n)
      .split(/[/:]/)
      .forEach((seg) => {
        have[seg.trim()] = true
      })
  })
  const matched = [],
    missing = []
  ;(components || []).forEach((c) => {
    ;(have[norm(c.name)] ? matched : missing).push(c.id)
  })
  return { matched, missing }
}

function storybookStoryURL(base, path, story) {
  const slug = (x) =>
    String(x || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  return (
    String(base || "").replace(/\/+$/, "") +
    "/?path=/story/" +
    slug(path) +
    "--" +
    slug(story || "docs")
  )
}

/* live activity --------------------------------------------------- */
let liveActivityCache = { at: 0, items: null }

function activityHTML(items) {
  return (items || [])
    .map((it) => {
      const open = it[3]
        ? 'a href="' + esc(it[3]) + '" target="_blank" rel="noreferrer"'
        : "div"
      return (
        "<" +
        open +
        ' class="req-item" style="cursor:' +
        (it[3] ? "pointer" : "default") +
        ';text-decoration:none;color:inherit">' +
        '<div class="req-item-top"><div class="sb-nav-left"><span class="sb-dot" style="background:' +
        it[0] +
        '"></span><span style="font-size:.84rem">' +
        esc(it[1]) +
        '</span></div><span class="req-item-meta">' +
        esc(it[2]) +
        "</span></div>" +
        "</" +
        (it[3] ? "a" : "div") +
        ">"
      )
    })
    .join("")
}

function paintLiveActivity() {
  const box = $("#liveActivityItems")
  if (!box || !liveActivityCache.items) return
  box.innerHTML = activityHTML(liveActivityCache.items)
  const badge = $("#liveActivityBadge")
  if (badge)
    badge.innerHTML =
      '<span class="live-dot"></span>live · github.com/' + esc(conn.githubRepo)
}

function refreshLiveActivity() {
  if (
    !$("#liveActivityItems") ||
    typeof fetch !== "function" ||
    !conn.githubRepo
  )
    return
  if (
    liveActivityCache.items &&
    Date.now() - liveActivityCache.at < 5 * 60 * 1000
  ) {
    paintLiveActivity()
    return
  }
  fetch(
    "https://api.github.com/repos/" + conn.githubRepo + "/commits?per_page=5",
    { headers: { accept: "application/vnd.github+json" } }
  )
    .then((r) => {
      if (!r.ok) throw new Error("github " + r.status)
      return r.json()
    })
    .then((commits) => {
      const items = githubCommitActivity(commits)
      if (!items.length) return
      liveActivityCache = { at: Date.now(), items }
      conn.githubCommits = items.length
      conn.githubCheckedAt = new Date().toISOString()
      saveConn()
      paintLiveActivity()
    })
    .catch(() => {
      /* offline or rate-limited — the seed feed stays put */
    })
}

/* figma ------------------------------------------------------------ */
/* Accepts a bare file key or a full figma.com URL (query params ignored). */
function figmaKeyFromInput(s) {
  const m = String(s || "").match(/([A-Za-z0-9]{10,})/)
  return m ? m[1] : ""
}

function figmaFetchMeta(key, token) {
  if (typeof fetch !== "function") return Promise.resolve(null)
  return fetch("https://api.figma.com/v1/files/" + key + "?depth=1", {
    headers: { "X-Figma-Token": token },
  })
    .then((r) => {
      if (!r.ok) throw new Error("figma " + r.status)
      return r.json()
    })
    .catch(() =>
      fetch("/api/figma/files/" + key, { headers: { "x-figma-token": token } })
        .then((r) => {
          if (!r.ok) throw new Error("proxy " + r.status)
          return r.json()
        })
        .catch(() => null)
    )
}

function figmaConnect() {
  const token = $("#connFigmaToken").value.trim()
  const key = figmaKeyFromInput($("#connFigmaFileKey").value)
  if (!token || !key) {
    toast("Figma needs a token + file key", "paste both, then Connect", "◈")
    return
  }
  conn.figmaToken = token
  conn.figmaFileKey = key
  saveConn()
  toast("Connecting to Figma…", key, "◈")
  figmaFetchMeta(key, token).then((meta) => {
    if (!meta || !meta.name) {
      toast(
        "Figma connection failed",
        "check the token + key (Guide → Live connections)",
        "◈"
      )
      return
    }
    const names = Object.values(meta.components || {})
      .map((c) => c.name)
      .slice(0, 200)
    conn.figma = {
      name: meta.name,
      lastModified: meta.lastModified,
      components: names,
      checkedAt: new Date().toISOString(),
    }
    saveConn()
    const m = matchFigmaComponents(COMPONENTS, names)
    toast(
      "Figma connected: " + meta.name,
      m.matched.length + " of " + COMPONENTS.length + " components matched",
      "✓"
    )
    if ((location.hash || "").replace("#/", "") === "integrations")
      renderIntegrations()
  })
}

/* connections section for the integrations view ------------------- */
function connSectionHTML() {
  const figmaURL = conn.figmaFileKey
    ? "https://www.figma.com/design/" + conn.figmaFileKey
    : ""
  const gh = conn.githubCheckedAt
    ? '<span class="conn-pill live"><span class="live-dot"></span>live</span> ' +
      (conn.githubCommits || 0) +
      " commits · checked " +
      esc(timeAgo(conn.githubCheckedAt))
    : '<span class="conn-pill demo">demo</span> overview shows the seed feed until the first fetch succeeds'
  const fg = conn.figma
    ? '<span class="conn-pill live"><span class="live-dot"></span>connected</span> ' +
      esc(conn.figma.name) +
      " · " +
      conn.figma.components.length +
      " file components · " +
      matchFigmaComponents(COMPONENTS, conn.figma.components).matched.length +
      "/" +
      COMPONENTS.length +
      " matched · synced " +
      esc(timeAgo(conn.figma.checkedAt))
    : '<span class="conn-pill demo">not connected</span> file key prefilled — paste a token to light up Figma sync' +
      (figmaURL
        ? ' · <a href="' +
          esc(figmaURL) +
          '" target="_blank" rel="noreferrer">open file ↗</a>'
        : "")
  const sb = conn.storybookUrl
    ? '<span class="conn-pill live"><span class="live-dot"></span>linked</span> <a href="' +
      esc(conn.storybookUrl) +
      '" target="_blank" rel="noreferrer">' +
      esc(conn.storybookUrl) +
      " ↗</a>"
    : '<span class="conn-pill demo">not linked</span> story cards open in-app until a published URL is set'
  return (
    '<div class="section-hdr"><h2>Live connections</h2><span class="conn-note">secrets stay in your browser — nothing is sent anywhere except the API you connect</span></div>' +
    '<div class="gateway-grid conn-grid">' +
    '<div class="gateway-card"><div class="gateway-name">◉ GitHub — live activity</div>' +
    '<div class="gateway-desc">The Overview feed reads real commits. Public repos need no token; cached 5 min with a seed fallback.</div>' +
    '<div class="req-form" style="margin:0"><label>Repository</label><input type="text" id="connGithubRepo" value="' +
    esc(conn.githubRepo) +
    '" placeholder="owner/repo"/>' +
    '<div><button class="btn btn-primary btn-sm" data-conn-github-save>Save repo</button></div></div>' +
    '<div class="conn-status">' +
    gh +
    "</div></div>" +
    '<div class="gateway-card"><div class="gateway-name">◈ Figma — component sync</div>' +
    '<div class="gateway-desc">Match dashboard components against a real Figma file. Needs a personal access token (read-only file content scope).</div>' +
    '<div class="req-form" style="margin:0"><label>Personal access token</label><input type="password" id="connFigmaToken" value="' +
    esc(conn.figmaToken) +
    '" placeholder="figd_…"/>' +
    '<label>File key or URL</label><input type="text" id="connFigmaFileKey" value="' +
    esc(conn.figmaFileKey) +
    '" placeholder="https://figma.com/design/…"/>' +
    '<div><button class="btn btn-primary btn-sm" data-conn-figma-test>Connect</button> ' +
    '<button class="btn btn-ghost btn-sm" data-conn-figma-clear>Clear</button></div></div>' +
    '<div class="conn-status">' +
    fg +
    "</div></div>" +
    '<div class="gateway-card"><div class="gateway-name">⬢ Storybook — published docs</div>' +
    '<div class="gateway-desc">Point at a published Storybook and every story card deep-links to its real page.</div>' +
    '<div class="req-form" style="margin:0"><label>Published URL</label><input type="text" id="connStorybookUrl" value="' +
    esc(conn.storybookUrl) +
    '" placeholder="https://main--xyz.chromatic.com"/>' +
    '<div><button class="btn btn-primary btn-sm" data-conn-sb-save>Save URL</button></div></div>' +
    '<div class="conn-status">' +
    sb +
    "</div></div>" +
    "</div>"
  )
}

function renderOverview() {
  const shippedN = COMPONENTS.filter((c) => overallStatus(c) === "ready").length
  const stats =
    '<div class="hero-stats">' +
    '<div class="h-stat"><div class="h-stat-n"><span>' +
    TOKENS.length +
    '</span></div><div class="h-stat-l">tokens in the pipeline</div></div>' +
    '<div class="h-stat"><div class="h-stat-n"><span>' +
    COMPONENTS.length +
    '</span></div><div class="h-stat-l">components tracked</div></div>' +
    '<div class="h-stat"><div class="h-stat-n"><span>' +
    FRAMEWORKS.length +
    '</span></div><div class="h-stat-l">framework targets</div></div>' +
    '<div class="h-stat"><div class="h-stat-n"><span>0</span>%</div><div class="h-stat-l">design drift tolerated</div></div></div>'

  const recentCard =
    '<div class="sub-hdr">Recent pipeline activity <span class="conn-src" id="liveActivityBadge">demo data</span></div><div class="comp-grid" id="liveActivityItems">' +
    activityHTML(ACTIVITY_SEED) +
    "</div>"

  const why =
    '<div class="sub-hdr">The misalignment this kills</div><div class="usage-col">' +
    '<div class="usage-box dont"><div class="ps-title" style="color:var(--red)">Without DesignOps</div><ul>' +
    "<li>Designer specs 16px → dev writes 15px, ships anyway</li>" +
    "<li>Framework can’t express a style → dev improvises a new one</li>" +
    "<li>Same component rebuilt 5× for 5 stacks, all slightly different</li>" +
    "<li>New request = Slack ping → lost in a thread</li></ul></div>" +
    '<div class="usage-box do"><div class="ps-title" style="color:var(--green)">With DesignOps</div><ul>' +
    "<li>Values ship as tokens — nobody re-types a pixel</li>" +
    "<li>Pipeline adapts per target (e.g. StyleSheet on mobile)</li>" +
    "<li>One schema generates every framework, byte-identical intent</li>" +
    "<li>Requests live on the artifact, from ask → design → ship</li></ul></div></div>"

  $("#view").innerHTML =
    heroHTML(
      "Design system engineering · Lulamile Mkhungela",
      "One design in Figma.<br/>Shipped to <em>every framework</em>.",
      "DesignOps ends the design-vs-dev drift. Tokens and components are defined once — then shipped, mechanically, to React, Vue, Angular, Svelte, Next, Nuxt, Remix, Astro, Ionic, MUI, Tailwind, React Native and beyond. Devs reference the system and reuse; new components are requested, designed and shipped without leaving it.",
      stats
    ) +
    pipelineFlowHTML(4) +
    '<div class="content">' +
    '<div class="section-hdr"><h2>Quick start — pick your gateway</h2></div>' +
    codeBlock(
      "terminal — the fastest way in",
      "sh",
      [
        "# 1 · install the packages for your stack",
        "npm i @designops/tokens @designops/react      # or vue / angular / svelte / mui …",
        "",
        "# 2 · or let the CLI wire everything automatically",
        "npx designops init          # detects your framework, imports tokens, done",
        "",
        "# 3 · prototypes / legacy: one CDN link",
        '<link rel="stylesheet" href="https://cdn.designops.dev/tokens@3/tokens.css">',
      ].join("\n")
    ) +
    '<div style="height:26px"></div>' +
    why +
    recentCard +
    "</div>"
  setTimeout(refreshLiveActivity, 60)
}

/* ── 6 · VIEW: tokens ───────────────────────────────────────── */
let tokenFilter = "all"
function renderTokens() {
  const groups = [
    "all",
    "color",
    "spacing",
    "radius",
    "typography",
    "shadow",
    "motion",
  ]
  const rows = TOKENS.filter(
    (t) => tokenFilter === "all" || t.group === tokenFilter
  )
    .map((t) => {
      const swatch =
        t.t === "color"
          ? '<span class="swatch-dot" style="background:' +
            esc(t.v) +
            '"></span>'
          : ""
      return (
        "<tr>" +
        '<td class="figma-name" data-copy="' +
        esc(t.f) +
        '" title="copy Figma variable name">' +
        esc(t.f) +
        "</td>" +
        '<td class="css-name" data-copy="' +
        esc("var(" + t.css + ")") +
        '" title="copy CSS var()">' +
        esc(t.css) +
        "</td>" +
        '<td class="val-cell css-name" style="color:var(--ink-70)" data-copy="' +
        esc(t.v) +
        '" title="copy raw value">' +
        swatch +
        esc(t.v) +
        "</td>" +
        '<td class="val-cell" data-copy="' +
        esc(t.js) +
        '" title="copy TS name" style="cursor:pointer;color:var(--stdict)">' +
        esc(t.js) +
        "</td>" +
        "</tr>"
      )
    })
    .join("")

  $("#view").innerHTML =
    heroHTML(
      "Tokens · stage 02–03",
      "Figma variable<br/>→ <em>every target format</em>",
      "Every name travels unchanged: slashes become hyphens in CSS, camelCase in TypeScript, theme keys in Tailwind. One rule, zero exceptions — click any cell to copy it in that format."
    ) +
    '<div class="content">' +
    codeBlock(
      "naming rule · enforced by tools/ship.mjs",
      "txt",
      [
        "Figma            JSON                 CSS                       TypeScript         Tailwind",
        "color/primary/900  color.primary.900    --color-primary-900       colorPrimary900    primary-900",
        "space/4            space.4              --space-4                 space4             4",
        "radius/md          radius.md            --radius-md               radiusMd           md",
      ].join("\n")
    ) +
    '<div style="height:22px"></div>' +
    '<div class="section-hdr"><h2>All tokens <span style="font-size:.78rem;font-weight:400;color:var(--ink-45)">(' +
    TOKENS.length +
    ")</span></h2>" +
    '<div class="filter-row">' +
    groups
      .map(
        (g) =>
          '<span class="filter-chip' +
          (tokenFilter === g ? " on" : "") +
          '" data-tokfilter="' +
          g +
          '">' +
          g +
          "</span>"
      )
      .join("") +
    "</div></div>" +
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden"><table class="token-table">' +
    "<thead><tr><th>Figma variable</th><th>CSS custom property</th><th>Value</th><th>TypeScript</th></tr></thead><tbody>" +
    rows +
    "</tbody></table></div>" +
    '<div style="height:20px"></div>' +
    '<div class="section-hdr"><h2>Export — same output as <span style="font-family:var(--mono);font-size:.85em;color:var(--stdict)">npm run build:tokens</span></h2></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
    ["css", "scss", "ts", "tailwind", "json"]
      .map(
        (f) =>
          '<button class="btn btn-ghost btn-sm" data-export="' +
          f +
          '">⤓ tokens.' +
          {
            css: "css",
            scss: "scss",
            ts: "ts",
            tailwind: "tailwind.js",
            json: "json",
          }[f] +
          "</button>"
      )
      .join("") +
    "</div></div>"
}

/* ── 7 · VIEW: components ───────────────────────────────────── */
let compFilter = "all"
const compBodyCache = {} // compId → rendered body HTML (built lazily on first expand)

function statusPill(c) {
  const o = overallStatus(c)
  if (o === "ready") return '<span class="status-pill all">5/5 ready</span>'
  if (o === "missing")
    return '<span class="status-pill none">Not started</span>'
  return (
    '<span class="status-pill partial">' + readyCount(c) + "/5 ready</span>"
  )
}

const COMP_ICONS = {
  button:
    '<rect x="3" y="6" width="14" height="8" rx="3" stroke="var(--accent)" stroke-width="1.5" fill="none"/><path d="M7 10h6" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>',
  input:
    '<rect x="2" y="6" width="16" height="8" rx="2.5" stroke="var(--figma)" stroke-width="1.5" fill="none"/><path d="M5.5 10h3" stroke="var(--figma)" stroke-width="1.5" stroke-linecap="round"/>',
  badge:
    '<rect x="3" y="7" width="14" height="6" rx="3" stroke="var(--amber)" stroke-width="1.5" fill="none"/>',
  card: '<rect x="2" y="3" width="16" height="14" rx="3" stroke="var(--stdict)" stroke-width="1.5" fill="none"/><path d="M5 8h10M5 11.5h6" stroke="var(--stdict)" stroke-width="1.3" stroke-linecap="round"/>',
  alert:
    '<path d="M10 3l8 14H2L10 3z" stroke="var(--amber)" stroke-width="1.5" stroke-linejoin="round" fill="none"/><path d="M10 8.5v4" stroke="var(--amber)" stroke-width="1.5" stroke-linecap="round"/>',
  avatar:
    '<circle cx="10" cy="7" r="3.5" stroke="var(--token)" stroke-width="1.5" fill="none"/><path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="var(--token)" stroke-width="1.5" stroke-linecap="round" fill="none"/>',
  "data-table":
    '<rect x="2" y="3" width="16" height="14" rx="2.5" stroke="var(--blue)" stroke-width="1.5" fill="none"/><path d="M2 7h16M8 7v10" stroke="var(--blue)" stroke-width="1.3"/>',
  toast:
    '<rect x="3" y="6" width="14" height="8" rx="4" stroke="var(--green)" stroke-width="1.5" fill="none"/><path d="M6.5 10h7" stroke="var(--green)" stroke-width="1.4" stroke-linecap="round"/>',
}
const COMP_ICON_BG = {
  button: "var(--accent-dim)",
  input: "var(--figma-dim)",
  badge: "var(--amber-dim)",
  card: "var(--stdict-dim)",
  alert: "var(--amber-dim)",
  avatar: "var(--token-dim)",
  "data-table": "var(--blue-dim)",
  toast: "var(--green-dim)",
}

function renderComponents() {
  const visible = COMPONENTS.filter((c) => {
    const o = overallStatus(c)
    return (
      compFilter === "all" ||
      (compFilter === "ready" && o === "ready") ||
      (compFilter === "partial" && o === "partial") ||
      (compFilter === "missing" && o === "missing")
    )
  })

  const figmaMatched = {}
  matchFigmaComponents(
    COMPONENTS,
    conn.figma ? conn.figma.components : []
  ).matched.forEach((id) => {
    figmaMatched[id] = true
  })
  const cards =
    visible
      .map(
        (c) =>
          '<div class="comp-card" id="comp-' +
          c.id +
          '" data-comp="' +
          c.id +
          '">' +
          '<div class="comp-card-header">' +
          '<div class="comp-card-left">' +
          '<div class="comp-card-icon" style="background:' +
          COMP_ICON_BG[c.id] +
          '"><svg width="20" height="20" viewBox="0 0 20 20" fill="none">' +
          (COMP_ICONS[c.id] || COMP_ICONS.badge) +
          "</svg></div>" +
          '<div><div class="comp-card-name">' +
          c.name +
          (state.shipped.includes(c.id)
            ? ' <span class="sb-badge green" style="vertical-align:2px">just shipped</span>'
            : "") +
          (figmaMatched[c.id]
            ? ' <span class="figma-chip" title="Matched in the connected Figma file">◈ figma</span>'
            : "") +
          "</div>" +
          '<div class="comp-card-tag">&lt;' +
          c.tag +
          "&gt; · ." +
          c.cls +
          " · " +
          c.figmaPath +
          "</div></div>" +
          "</div>" +
          '<div class="comp-card-right"><div class="pipeline-status-row">' +
          stageChips(c) +
          "</div>" +
          statusPill(c) +
          '<div class="toggle-caret">▼</div></div>' +
          "</div>" +
          '<div class="comp-body">' +
          (compBodyCache[c.id] || "") +
          "</div>" +
          "</div>"
      )
      .join("") ||
    '<div class="empty-state"><div class="big">◌</div>No components match this filter.</div>'

  const roadmap = ROADMAP.map(
    (r) =>
      '<div class="comp-card" style="opacity:.62"><div class="comp-card-header" style="cursor:default">' +
      '<div class="comp-card-left"><div class="comp-card-icon" style="background:var(--red-dim)"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="4" stroke="var(--red)" stroke-width="1.5" stroke-dasharray="3 3"/></svg></div>' +
      '<div><div class="comp-card-name">' +
      r.name +
      '</div><div class="comp-card-tag">' +
      r.note +
      "</div></div></div>" +
      '<div class="comp-card-right"><button class="btn btn-ghost btn-sm" data-goto-req="' +
      r.name +
      '">Request it →</button></div></div></div>'
  ).join("")

  const figmaBanner = conn.figma
    ? '<div class="status-banner ready"><span class="status-icon">◈</span><div><strong>Figma: ' +
      esc(conn.figma.name) +
      ".</strong> " +
      matchFigmaComponents(COMPONENTS, conn.figma.components).matched.length +
      " of " +
      COMPONENTS.length +
      " components matched · synced " +
      esc(timeAgo(conn.figma.checkedAt)) +
      ' — manage in <a href="#/integrations">Live connections</a>.</div></div>'
    : ""
  $("#view").innerHTML =
    heroHTML(
      "Component library",
      "Specified once.<br/><em>Generated everywhere.</em>",
      "Expand any component to preview the Figma design, inspect its tokens, copy working code for your stack, read usage guidelines, and discuss it. Every snippet is generated from the same schema that ships the packages."
    ) +
    '<div class="content">' +
    '<div class="section-hdr"><h2>Components <span style="font-size:.78rem;font-weight:400;color:var(--ink-45)">(' +
    visible.length +
    ")</span></h2>" +
    '<div class="filter-row">' +
    '<span class="filter-chip' +
    (compFilter === "all" ? " on" : "") +
    '" data-compfilter="all">All</span>' +
    '<span class="filter-chip' +
    (compFilter === "ready" ? " on" : "") +
    '" data-compfilter="ready">✓ Ready</span>' +
    '<span class="filter-chip' +
    (compFilter === "partial" ? " on" : "") +
    '" data-compfilter="partial">⚠ Partial</span>' +
    '<span class="filter-chip' +
    (compFilter === "missing" ? " on" : "") +
    '" data-compfilter="missing">✕ Not started</span></div></div>' +
    figmaBanner +
    '<div class="comp-grid">' +
    cards +
    roadmap +
    "</div></div>"
}

/* version-history timeline entry */
const HIST_DOT = {
  major: "var(--red)",
  stable: "var(--green)",
  minor: "var(--accent)",
  patch: "var(--blue)",
  beta: "var(--amber)",
  design: "var(--figma)",
}
function historyHTML(c) {
  const entries = c.history.slice()
  if (state.shipped.includes(c.id)) {
    entries.unshift({
      v: "1.0.0",
      date: "today",
      type: "stable",
      by: "Lulamile M.",
      notes: [
        "Approved in Requests and shipped to all 14 targets — code, inspect spec and story scaffold generated automatically",
      ],
    })
  }
  return (
    '<div class="hist-list">' +
    entries
      .map(
        (h) =>
          '<div class="hist-item"><div class="hist-v">v' +
          h.v +
          "</div>" +
          '<div class="hist-dot" style="background:' +
          (HIST_DOT[h.type] || "var(--ink-45)") +
          '"></div>' +
          '<div><div class="hist-body">' +
          h.notes.map((n) => "<div>• " + n + "</div>").join("") +
          "</div>" +
          '<div class="hist-meta"><span class="hist-type ht-' +
          h.type +
          '">' +
          h.type +
          "</span><span>" +
          h.date +
          "</span><span>by " +
          h.by +
          "</span></div>" +
          "</div></div>"
      )
      .join("") +
    "</div>"
  )
}

/** Current published version — request-shipped components land at 1.0.0. */
function currentVersion(c) {
  return state.shipped.includes(c.id) ? "1.0.0" : c.version
}

/** Lazy-built body: overview, tabs (Preview / Inspect / Code / Usage / History), comments. */
function buildCompBody(c) {
  if (compBodyCache[c.id]) return compBodyCache[c.id]

  /* Inspect table rows */
  const inspectRows = c.spec
    .map((s) => {
      const t = tok(s.token)
      if (!t) return ""
      const swatch =
        t.t === "color"
          ? '<span class="swatch-dot" style="background:' +
            esc(t.v) +
            '"></span>'
          : ""
      return (
        '<tr><td style="font-size:.8rem;color:var(--ink-70)">' +
        esc(s.prop) +
        "</td>" +
        '<td class="figma-name" data-copy="' +
        esc(t.f) +
        '">' +
        esc(t.f) +
        "</td>" +
        '<td class="css-name" data-copy="' +
        esc("var(" + t.css + ")") +
        '">var(' +
        esc(t.css) +
        ")</td>" +
        '<td class="val-cell">' +
        swatch +
        esc(t.v) +
        "</td></tr>"
      )
    })
    .join("")

  /* Code tab: framework chips + panel */
  const firstFw = "react"
  const fwTabs = FRAMEWORKS.map(
    (f, i) =>
      '<span class="fw-tab' +
      (f.key === firstFw ? " on" : "") +
      '" data-fw="' +
      f.key +
      '" data-comp="' +
      c.id +
      '">' +
      f.name +
      "</span>"
  ).join("")
  const fwPanel =
    '<div class="fw-panel" data-fw-panel>' +
    codeBlock(
      c.id + " · " + FRAMEWORKS.find((f) => f.key === firstFw).name,
      "code",
      snippetFor(c, firstFw)
    ) +
    "</div>"

  const apiRows = c.props
    .map(
      (p) =>
        '<tr><td style="font-family:var(--mono);font-size:.74rem;color:var(--accent)">' +
        p.n +
        "</td>" +
        '<td style="font-family:var(--mono);font-size:.72rem;color:var(--ink-70)">' +
        esc(p.t) +
        "</td>" +
        '<td style="font-family:var(--mono);font-size:.72rem;color:var(--ink-45)">' +
        esc(p.d) +
        "</td>" +
        '<td style="font-family:var(--mono);font-size:.72rem;color:var(--figma)">' +
        esc(p.figma) +
        "</td></tr>"
    )
    .join("")

  const seedComments =
    c.comments.map(commentHTML).join("") +
    (state.comments[c.id] || []).map(commentHTML).join("")
  const commentCount = c.comments.length + (state.comments[c.id] || []).length

  const html =
    '<div style="padding:20px 24px 0">' +
    overviewGrid(c) +
    progressHTML(c) +
    '<div class="tag-row">' +
    c.tokensUsed
      .map(
        (t) =>
          '<span class="tag" data-copy="' +
          esc(t) +
          '" style="cursor:pointer" title="copy token name">' +
          esc(t) +
          "</span>"
      )
      .join("") +
    "</div>" +
    "</div>" +
    '<div class="pipeline-tabs" style="margin-top:18px">' +
    '<div class="ptab active" data-tab="preview">◈ Preview</div>' +
    '<div class="ptab" data-tab="inspect">⌖ Inspect</div>' +
    '<div class="ptab" data-tab="code">&lt;/&gt; Code · 14 targets</div>' +
    '<div class="ptab" data-tab="usage">✦ Usage & a11y</div>' +
    '<div class="ptab" data-tab="history">🕘 History <span class="ptab-dot" style="background:var(--blue)"></span></div>' +
    "</div>" +
    '<div class="pipeline-panel active" data-panel="preview"><div class="comp-preview">' +
    c.preview +
    "</div>" +
    '<div class="info-grid">' +
    '<div class="info-card"><div class="info-card-label">Figma path</div><div class="info-card-val" style="font-family:var(--mono);font-size:.76rem">' +
    c.figmaPath +
    "</div></div>" +
    '<div class="info-card"><div class="info-card-label">Current version</div><div class="info-card-val" style="font-family:var(--mono);font-size:.76rem">v' +
    currentVersion(c) +
    " · see History tab</div></div>" +
    '<div class="info-card"><div class="info-card-label">Props = Figma properties (the contract)</div><div class="info-card-val" style="font-family:var(--mono);font-size:.76rem">' +
    c.props.map((p) => p.figma).join(" · ") +
    "</div></div>" +
    '<div class="info-card"><div class="info-card-label">Selector / classes</div><div class="info-card-val" style="font-family:var(--mono);font-size:.76rem">&lt;' +
    c.tag +
    "&gt; · ." +
    c.cls +
    "</div></div>" +
    "</div></div>" +
    '<div class="pipeline-panel" data-panel="inspect">' +
    '<div class="status-banner waiting"><span class="status-icon">⌖</span><div><strong>Inspect mode</strong> — every value below is token-referenced. Click any name to copy it. A dev never measures, assumes or approximates.</div></div>' +
    '<table class="inspect-table"><thead><tr><th>Style property</th><th>Figma token</th><th>CSS variable</th><th>Value</th></tr></thead><tbody>' +
    inspectRows +
    "</tbody></table></div>" +
    '<div class="pipeline-panel" data-panel="code">' +
    '<div class="status-banner ready"><span class="status-icon">✓</span><div><strong>Copy-ready for your stack.</strong> Generated from the same schema that ships the packages — identical output. Not ready targets show the planned shape.</div></div>' +
    '<div class="fw-tabs">' +
    fwTabs +
    "</div>" +
    fwPanel +
    "</div>" +
    '<div class="pipeline-panel" data-panel="usage">' +
    '<div class="ps-title">Component API — props are contractually identical to Figma</div>' +
    '<table class="inspect-table" style="margin-bottom:18px"><thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Figma property</th></tr></thead><tbody>' +
    apiRows +
    "</tbody></table>" +
    '<div class="usage-col" style="margin-bottom:16px">' +
    '<div class="usage-box do"><div class="ps-title" style="color:var(--green)">Do</div><ul>' +
    c.usage.do.map((d) => "<li>" + d + "</li>").join("") +
    "</ul></div>" +
    '<div class="usage-box dont"><div class="ps-title" style="color:var(--red)">Don’t</div><ul>' +
    c.usage.dont.map((d) => "<li>" + d + "</li>").join("") +
    "</ul></div></div>" +
    '<div class="ps-title">Accessibility — verified per story, enforced in CI</div>' +
    '<div class="a11y-list">' +
    c.a11y
      .map(
        (a) =>
          '<div class="a11y-item"><span class="a11y-check">✓</span><span>' +
          a +
          "</span></div>"
      )
      .join("") +
    "</div></div>" +
    '<div class="pipeline-panel" data-panel="history">' +
    '<div class="status-banner waiting"><span class="status-icon">🕘</span><div><strong>Version history</strong> — every release is tied to a request, review or token change. Semver is contractual: visual breaking changes always ship major + codemod.</div></div>' +
    historyHTML(c) +
    "</div>" +
    '<div class="comment-section" data-comments="' +
    c.id +
    '">' +
    '<div class="cs-header"><span class="cs-title">Comments & change requests</span><span class="cs-count">' +
    commentCount +
    " comment" +
    (commentCount === 1 ? "" : "s") +
    "</span></div>" +
    '<div class="comment-list">' +
    seedComments +
    "</div>" +
    '<div class="comment-input-wrap"><div class="comment-input-avatar">LM</div><div class="comment-input-right">' +
    '<textarea class="comment-textarea" rows="2" placeholder="Add a comment, change request or question…"></textarea>' +
    '<div class="comment-input-footer"><div class="cr-type-row">' +
    '<span class="cr-type selected">Comment</span><span class="cr-type">Change request</span><span class="cr-type">Question</span>' +
    '</div><button class="btn btn-primary btn-sm submit-comment" data-comp="' +
    c.id +
    '">Post</button></div>' +
    "</div></div></div>"

  compBodyCache[c.id] = html
  return html
}

function commentHTML(cm) {
  const typeCls =
    {
      "Change request": "ct-request",
      Question: "ct-question",
      Approved: "ct-approve",
      "In review": "ct-review",
      Comment: "ct-review",
    }[cm.type] || "ct-review"
  return (
    '<div class="comment"><div class="comment-top">' +
    '<div class="comment-avatar" style="background:' +
    (cm.bg || "var(--accent-dim)") +
    ";color:" +
    (cm.col || "var(--accent)") +
    '">' +
    (cm.ini || initialsOf(cm.a)) +
    "</div>" +
    '<span class="comment-author">' +
    esc(cm.a) +
    '</span><span class="comment-time">' +
    esc(cm.time) +
    "</span>" +
    (cm.type
      ? '<span class="comment-type ' + typeCls + '">' + esc(cm.type) + "</span>"
      : "") +
    (cm.where
      ? '<span style="font-size:.7rem;color:var(--ink-45)">· ' +
        esc(cm.where) +
        "</span>"
      : "") +
    "</div>" +
    '<div class="comment-text">' +
    esc(cm.text) +
    "</div>" +
    '<div class="comment-footer"><span class="comment-reaction">👍 ' +
    (cm.reactions || 0) +
    "</span></div></div>"
  )
}

/* ── 8 · VIEW: frameworks (ship center) ─────────────────────── */
function renderFrameworks() {
  const shippedComps = COMPONENTS.filter(
    (c) => compStatus(c).frameworks === "ready"
  )
  const partialComps = COMPONENTS.filter(
    (c) => compStatus(c).frameworks === "review"
  )

  const cards = FRAMEWORKS.map((f) => {
    const chips =
      shippedComps
        .map(
          (c) =>
            '<span class="tag" style="color:var(--green);border-color:rgba(74,222,128,.2)">✓ ' +
            c.name +
            "</span>"
        )
        .join("") +
      partialComps
        .map(
          (c) =>
            '<span class="tag" style="color:var(--amber);border-color:rgba(251,191,36,.2)">◐ ' +
            c.name +
            "</span>"
        )
        .join("")
    return (
      '<div class="fw-card" id="fw-' +
      f.key +
      '">' +
      '<div class="fw-card-top"><div class="fw-card-name"><span class="fw-logo" style="background:' +
      f.lc +
      "18;color:" +
      f.lc +
      '">' +
      f.logo +
      "</span>" +
      f.name +
      "</div>" +
      '<span class="fw-kind">' +
      f.kind +
      "</span></div>" +
      '<div class="ship-stat">▲ ' +
      shippedComps.length +
      " components live" +
      (partialComps.length ? " · " + partialComps.length + " in review" : "") +
      "</div>" +
      '<div class="fw-chips">' +
      chips +
      "</div>" +
      '<div class="fw-install" data-copy="' +
      esc(f.install) +
      '" title="click to copy">' +
      esc(f.install) +
      "</div></div>"
    )
  }).join("")

  $("#view").innerHTML =
    heroHTML(
      "Ship center · stage 04",
      "Write once in Figma.<br/><em>Compile for everything.</em>",
      "Each target consumes the same tokens and component schemas through its own adapter. A design never gets “re-implemented” — it gets compiled. Click any install line to copy it."
    ) +
    '<div class="content">' +
    '<div class="gateway-grid">' +
    '<div class="gateway-card recommended"><div class="gateway-rec-badge">Recommended</div>' +
    '<div class="gateway-name">⛁ Packages — design as a dependency</div>' +
    '<div class="gateway-desc">The primary way teams consume: versioned npm packages per stack. Updates arrive as <code style="font-family:var(--mono);font-size:.9em;color:var(--stdict)">npm update</code>, with changelogs generated from request approvals.</div></div>' +
    '<div class="gateway-card"><div class="gateway-name">⌁ No package manager? Copy it</div>' +
    '<div class="gateway-desc">Every component generates copy-ready code for all 14 targets (see the Code tab of any component). Zero lock-in — the snippets stand alone.</div></div>' +
    '<div class="gateway-card"><div class="gateway-name">⚡ One-command setup</div>' +
    '<div class="gateway-desc"><code style="font-family:var(--mono);font-size:.9em;color:var(--stdict)">npx designops init</code> detects the framework and wires tokens, presets and themes for you. See Integrations.</div></div>' +
    "</div>" +
    '<div class="section-hdr"><h2>14 targets · live status</h2></div>' +
    '<div class="fw-grid">' +
    cards +
    "</div></div>"
}

/* ── 9 · VIEW: requests ─────────────────────────────────────── */
let selectedReq = null

function renderRequests() {
  if (!selectedReq || !state.requests.find((r) => r.id === selectedReq))
    selectedReq = state.requests[0] && state.requests[0].id
  const person = PEOPLE[state.roleIdx]

  const list = state.requests
    .map(
      (r) =>
        '<div class="req-item' +
        (r.id === selectedReq ? " active" : "") +
        '" data-req="' +
        r.id +
        '">' +
        '<div class="req-item-top"><span class="req-item-name">' +
        esc(r.title) +
        '</span><span class="req-status ' +
        r.status +
        '">' +
        r.status.replace("-", " ") +
        "</span></div>" +
        '<div class="req-item-meta">' +
        esc(r.by) +
        " · " +
        esc(r.time) +
        " · ▲ " +
        (r.votes || 0) +
        "</div></div>"
    )
    .join("")

  const cur = state.requests.find((r) => r.id === selectedReq)
  let detail =
    '<div class="empty-state"><div class="big">✉</div>Select a request — or create one above.</div>'
  if (cur) detail = requestDetailHTML(cur, person)

  $("#view").innerHTML =
    heroHTML(
      "Requests · the human gate",
      "Ask inside the system.<br/><em>Designer ships, everyone gets it.</em>",
      "No more lost Slack threads. A dev requests; the designer answers in the thread and attaches the Figma spec; one approval runs the pipeline and ships the component to all 14 targets. Try it — approve the Data Table below."
    ) +
    '<div class="content">' +
    '<div class="section-hdr"><h2>Request board</h2>' +
    '<div class="role-switch">acting as <select id="roleSelect">' +
    PEOPLE.map(
      (p, i) =>
        '<option value="' +
        i +
        '"' +
        (i === state.roleIdx ? " selected" : "") +
        ">" +
        p.name +
        "</option>"
    ).join("") +
    "</select></div></div>" +
    '<div class="req-layout"><div>' +
    '<div class="req-form">' +
    '<div class="ps-title" style="margin-bottom:14px">✦ New component request</div>' +
    '<label>Component name</label><input type="text" id="reqTitle" placeholder="e.g. Date Picker"/>' +
    '<label>What do you need it to do?</label><textarea id="reqDesc" placeholder="Context, variants, which team is blocked…"></textarea>' +
    '<button class="btn btn-primary btn-sm" id="reqSubmit">Submit request</button>' +
    '<button class="btn btn-ghost btn-sm" id="reqFileIssue" style="margin-left:8px" title="Open a prefilled issue — no token needed">File as GitHub issue ↗</button>' +
    "</div>" +
    '<div class="req-list">' +
    list +
    "</div>" +
    "</div>" +
    '<div class="req-detail" id="reqDetail">' +
    detail +
    "</div>" +
    "</div></div>"
}

function requestDetailHTML(r, person) {
  const thread = r.thread
    .map((m) => {
      const own = m.ini === person.ini && m.role === person.role
      return (
        '<div class="chat-msg' +
        (own ? " own" : "") +
        '">' +
        '<div class="chat-avatar" style="background:' +
        m.bg +
        ";color:" +
        m.col +
        '">' +
        m.ini +
        "</div>" +
        '<div><div class="chat-meta"><span class="chat-author">' +
        esc(m.a) +
        "</span>" +
        '<span class="chat-role ' +
        m.role +
        '">' +
        (m.role === "designer" ? "designer" : "engineering") +
        "</span>" +
        '<span class="chat-time">' +
        esc(m.time) +
        "</span></div>" +
        '<div class="chat-bubble">' +
        esc(m.text) +
        "</div></div></div>"
      )
    })
    .join("")

  /* Action zone depends on status */
  let actions = ""
  if (r.status === "shipped") {
    actions =
      '<span class="req-status shipped">shipped</span><button class="btn btn-ghost btn-sm" data-open-comp="' +
      (r.compId || "") +
      '">View component →</button>'
  } else if (r.designAttached) {
    actions =
      '<span class="req-status in-design">design attached</span>' +
      '<button class="btn btn-ghost btn-sm" data-vote="' +
      r.id +
      '">▲ Upvote (' +
      (r.votes || 0) +
      ")</button>" +
      '<button class="btn btn-primary btn-sm" data-ship="' +
      r.id +
      '">✓ Approve & ship to all 14 targets</button>'
  } else if (r.status === "in-design") {
    actions =
      '<span class="req-status in-design">in design</span><button class="btn btn-ghost btn-sm" data-vote="' +
      r.id +
      '">▲ Upvote (' +
      (r.votes || 0) +
      ")</button>"
  } else {
    actions =
      '<span class="req-status requested">requested</span>' +
      '<button class="btn btn-ghost btn-sm" data-vote="' +
      r.id +
      '">▲ Upvote (' +
      (r.votes || 0) +
      ")</button>" +
      '<button class="btn btn-primary btn-sm" data-start-design="' +
      r.id +
      '">▶ Start design (designer)</button>'
  }

  const pipelineNote =
    r.status === "shipped"
      ? '<div class="status-banner ready"><span class="status-icon">✓</span><div><strong>Shipped.</strong> Tokens reserved, code generated for all 14 targets, stories scaffolded. It’s now live in Components and every framework card.</div></div>'
      : '<div class="status-banner waiting"><span class="status-icon">◈</span><div><strong>Pipeline on approval:</strong> tokens reserved → multi-target build → Storybook scaffold → published. One click runs it all.</div></div>'

  return (
    '<div class="req-detail-head"><div><div class="req-detail-title">' +
    esc(r.title) +
    "</div>" +
    '<div class="req-detail-meta">requested by ' +
    esc(r.by) +
    " · " +
    esc(r.time) +
    "</div></div>" +
    '<div class="req-actions">' +
    actions +
    "</div></div>" +
    '<div class="req-body">' +
    pipelineNote +
    '<div class="req-desc">' +
    esc(r.desc) +
    "</div>" +
    '<div class="ps-title">Discussion · design ↔ engineering in one thread</div>' +
    '<div class="chat-thread" id="chatThread">' +
    thread +
    "</div>" +
    '<div class="chat-composer">' +
    '<div class="chat-avatar" style="background:' +
    person.bg +
    ";color:" +
    person.col +
    '">' +
    person.ini +
    "</div>" +
    '<textarea class="chat-input" id="chatInput" placeholder="Reply as ' +
    esc(person.name.split(" ")[0]) +
    '… (Enter to send)"></textarea>' +
    '<button class="btn btn-primary btn-sm" data-send-chat="' +
    r.id +
    '">Send</button>' +
    "</div></div>"
  )
}

/* request actions ---------------------------------------------- */
function startDesign(reqId) {
  const r = state.requests.find((x) => x.id === reqId)
  if (!r || r.status !== "requested") return
  r.status = "in-design"
  persist()
  renderRequests()
  toast(
    "Design started: " + r.title,
    "Lulamile picked up the request in Figma",
    "🎨"
  )
  /* The designer answers in-thread shortly after (simulated async). */
  setTimeout(() => {
    r.thread.push({
      a: "Lulamile M.",
      ini: "LM",
      role: "designer",
      col: "var(--figma)",
      bg: "var(--figma-dim)",
      time: "just now",
      text: "Picked this up in Figma — spec will be token-referenced so it can ship to every target in one pass.",
    })
    r.designAttached = true
    persist()
    if (location.hash.replace("#/", "") === "requests") renderRequests()
    toast(
      "Design attached: " + r.title,
      "Ready for approval — one click ships it",
      "✓"
    )
    renderSidebar()
  }, 2200)
}

function approveAndShip(reqId) {
  const r = state.requests.find((x) => x.id === reqId)
  if (!r || !r.designAttached || r.status === "shipped") return
  r.status = "in-build"
  persist()
  renderRequests()
  renderSidebar()
  toast(
    "Pipeline running: " + r.title,
    "tokens → transform → 14 targets → Storybook",
    "⚙"
  )
  setTimeout(() => {
    r.status = "shipped"
    r.thread.push({
      a: "Lulamile M.",
      ini: "LM",
      role: "designer",
      col: "var(--figma)",
      bg: "var(--figma-dim)",
      time: "just now",
      text:
        "Approved and shipped ✓ — " +
        r.title +
        " is live on all 14 targets. Bump to the latest package version or copy the snippet from the component page.",
    })
    if (r.compId && !state.shipped.includes(r.compId))
      state.shipped.push(r.compId)
    delete compBodyCache[r.compId || ""]
    persist()
    renderRequests()
    renderSidebar()
    toast(
      r.title + " shipped to 14 targets",
      "find it in Components & Frameworks",
      "🚀"
    )
  }, 2400)
}

/* ── 10 · VIEW: storybook ───────────────────────────────────── */
function renderStorybook() {
  const live = COMPONENTS.filter((c) => compStatus(c).storybook !== "missing")
  const cards = COMPONENTS.map((c) => {
    const st = compStatus(c).storybook
    const m = STATUS_META[st]
    const sbURL = conn.storybookUrl
      ? storybookStoryURL(conn.storybookUrl, c.figmaPath, "docs")
      : ""
    return (
      "<" +
      (sbURL
        ? 'a href="' + esc(sbURL) + '" target="_blank" rel="noreferrer"'
        : 'div data-open-comp="' + c.id + '"') +
      ' class="sb-story-card" title="' +
      (sbURL
        ? "Open " + c.name + " in the published Storybook"
        : "Open " + c.name + " component") +
      '">' +
      '<div class="sb-story-path">' +
      c.figmaPath +
      "</div>" +
      '<div class="sb-story-name">' +
      c.name +
      "</div>" +
      '<div class="sb-story-meta">' +
      (st === "ready"
        ? c.stories + " stories · controls mirror props"
        : "not synced yet") +
      (sbURL ? " ↗" : "") +
      "</div>" +
      '<span class="ps-chip ' +
      m.cls +
      '"><span class="ps-dot"></span>' +
      m.label +
      "</span></" +
      (sbURL ? "a" : "div") +
      ">"
    )
  }).join("")

  $("#view").innerHTML =
    heroHTML(
      "Storybook · stage 05",
      "Living docs,<br/><em>always in sync</em>",
      "Story paths mirror Figma paths. Controls mirror component props. A component only counts as stable when its stories match the Figma spec — design sign-off happens here, not in meetings."
    ) +
    '<div class="content">' +
    '<div class="section-hdr"><h2>Story sync status</h2>' +
    (conn.storybookUrl
      ? '<a class="btn btn-ghost btn-sm" href="' +
        esc(conn.storybookUrl) +
        '" target="_blank" rel="noreferrer">Open published Storybook ↗</a>'
      : "") +
    "</div>" +
    '<div class="sb-story-grid">' +
    cards +
    "</div>" +
    '<div class="sub-hdr">Same story, every framework — generated scaffold</div>' +
    codeBlock(
      "Button.stories.tsx · auto-scaffolded on ship",
      "tsx",
      [
        "import type { Meta, StoryObj } from '@storybook/react';",
        "import { Button } from '@designops/react';",
        "",
        "// Path mirrors Figma: Components / Button",
        "const meta: Meta<typeof Button> = {",
        "  title: 'Components / Button',",
        "  component: Button,",
        "  argTypes: { variant: { control: 'select', options: ['primary','secondary','destructive','ghost'] },",
        "              size: { control: 'radio', options: ['sm','md','lg'] } },",
        "};",
        "export default meta;",
        "export const Primary: StoryObj = { args: { children: 'Save changes' } };",
      ].join("\n")
    ) +
    '<div style="height:22px"></div>' +
    '<div class="section-hdr"><h2>The Storybook addon</h2></div>' +
    codeBlock(
      "addons — DesignOps panel inside your own Storybook",
      "js",
      [
        "// .storybook/main.js — designers review without leaving the dev's tool",
        "export default { addons: ['@designops/storybook-addon'] };",
        "",
        "// Adds a “Design” panel per story: Figma spec, token diff, request thread.",
        "// Approval status syncs back to the dashboard automatically.",
      ].join("\n")
    ) +
    "</div>"
}

/* ── 11 · VIEW: integrations ────────────────────────────────── */
function renderIntegrations() {
  $("#view").innerHTML =
    heroHTML(
      "The gateway question",
      "Do devs live in this dashboard?<br/><em>No — design comes to them.</em>",
      "This dashboard is the governance surface: review, inspect, request, approve. Daily consumption happens inside each team’s own tools. Pick your gateway below — the CLI is the easiest way in, packages are the way to stay in sync."
    ) +
    '<div class="content">' +
    connSectionHTML() +
    '<div class="section-hdr"><h2>Consumption gateways</h2></div>' +
    '<div class="gateway-grid">' +
    '<div class="gateway-card recommended"><div class="gateway-rec-badge">Recommended</div>' +
    '<div class="gateway-name">1 · CLI bootstrap</div>' +
    '<div class="gateway-desc">One command detects your framework and wires everything — token import, Tailwind preset or MUI theme, done.</div>' +
    codeBlock(
      "terminal",
      "sh",
      [
        "$ npx designops init",
        "  ✓ detected: Next.js 14 (app router)",
        "  ✓ installed @designops/tokens @designops/react",
        "  ✓ imported tokens.css in app/layout.tsx",
        "  ✓ wrote designops.config.json (pin: v3.0.0)",
        "  → run npm run dev — design is live",
      ].join("\n")
    ) +
    "</div>" +
    '<div class="gateway-card"><div class="gateway-name">2 · Versioned packages</div>' +
    '<div class="gateway-desc">Design arrives as dependency updates — reviewed in PRs like any other change. Per-stack adapters keep usage idiomatic.</div>' +
    codeBlock(
      "package.json",
      "json",
      [
        '"dependencies": {',
        '  "@designops/tokens": "^3.0.0",',
        '  "@designops/react": "^2.4.0",  // or vue / angular / svelte / mui / ionic',
        "}",
      ].join("\n")
    ) +
    "</div>" +
    '<div class="gateway-card"><div class="gateway-name">3 · CDN — zero install</div>' +
    '<div class="gateway-desc">Prototypes, legacy stacks, anything with a browser: one link and every token is available as a CSS variable.</div>' +
    codeBlock(
      "index.html",
      "html",
      [
        '<link rel="stylesheet" href="https://cdn.designops.dev/tokens@3/tokens.css">',
        "<style> .cta { background: var(--color-primary-900); border-radius: var(--radius-md); } </style>",
      ].join("\n")
    ) +
    "</div>" +
    '<div class="gateway-card"><div class="gateway-name">4 · Inside your existing tools</div>' +
    '<div class="gateway-desc">Nobody switches context: the system shows up where the team already works.</div>' +
    '<div class="tag-row" style="margin:0 0 12px"><span class="tag">Storybook addon — spec + approval per story</span><span class="tag">VS Code ext — var autocomplete, hover swatches</span><span class="tag">Figma plugin — two-way token sync</span></div>' +
    codeBlock(
      ".vscode — hover any var(--…)",
      "txt",
      [
        "--color-primary-900  ● #e8ff5a  ·  Figma: color/primary/900",
        "used by: Button (primary bg), Field (focus ring), …",
      ].join("\n")
    ) +
    "</div>" +
    '<div class="gateway-card"><div class="gateway-name">5 · API + automation</div>' +
    '<div class="gateway-desc">Everything in this dashboard is available programmatically for custom gates and bots.</div>' +
    codeBlock(
      "REST + webhooks",
      "sh",
      [
        "GET  /v1/tokens?target=react        # any target format",
        "GET  /v1/components/button/react    # generated on demand",
        "POST /v1/requests                   # file a request from CI",
        "hook component.shipped → slack, teams, deploy previews",
      ].join("\n")
    ) +
    "</div>" +
    '<div class="gateway-card"><div class="gateway-name">6 · When to keep the dashboard open</div>' +
    '<div class="gateway-desc">Designers: daily — specs, approvals, drift checks. Devs: when previewing a component, inspecting values, requesting something new, or reviewing a pipeline PR. Everything else arrives through the gateways above.</div>' +
    '<div class="status-banner ready" style="margin:0"><span class="status-icon">✓</span><div><strong>TL;DR</strong> — CLI to start, packages to stay in sync, dashboard to govern. Nobody is forced into a second tool.</div></div></div>' +
    "</div>" +
    '<div class="section-hdr"><h2>Which gateway when?</h2></div>' +
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:22px">' +
    '<table class="inspect-table decision-table"><thead><tr><th>Your situation</th><th>Gateway</th><th>Why</th></tr></thead><tbody>' +
    '<tr><td>New app, any major framework</td><td style="color:var(--accent)">CLI + packages</td><td>2 minutes to tokens; updates via npm forever</td></tr>' +
    '<tr><td>Existing app, gradual adoption</td><td style="color:var(--accent)">CSS variables first, then adapters</td><td>No rewrite — values first, components later</td></tr>' +
    '<tr><td>Prototype / hackathon / legacy</td><td style="color:var(--accent)">CDN link</td><td>Zero install, still token-true</td></tr>' +
    '<tr><td>Design review & sign-off</td><td style="color:var(--accent)">Dashboard + Storybook addon</td><td>Figma spec next to real output</td></tr>' +
    '<tr><td>Custom pipelines, bots, gates</td><td style="color:var(--accent)">REST API + webhooks</td><td>Same data, machine-readable</td></tr>' +
    "</tbody></table></div></div>"
}

/* ── 12 · VIEW: guide ───────────────────────────────────────── */
function renderGuide() {
  $("#view").innerHTML =
    heroHTML(
      "Handbook",
      "The DesignOps<br/><em>guide &amp; docs</em>",
      "Everything about how this system works: the pipeline, the naming contract, the request flow, governance and how to integrate it into a real app. (Also shipped as docs/GUIDE.md in the repo.)"
    ) +
    '<div class="content"><div class="guide-layout">' +
    '<div class="guide-nav">' +
    GUIDE.map(
      (g, i) =>
        '<a href="javascript:void(0)" data-guide="' +
        g.id +
        '"' +
        (i === 0 ? ' class="on"' : "") +
        ">" +
        g.label +
        "</a>"
    ).join("") +
    "</div>" +
    '<div class="guide-body">' +
    GUIDE.map(
      (g, i) =>
        '<div class="guide-section" id="guide-' +
        g.id +
        '"><div class="guide-kicker">' +
        String(i + 1).padStart(2, "0") +
        "</div><h3>" +
        g.label +
        "</h3>" +
        g.html +
        "</div>"
    ).join("") +
    '<div class="status-banner ready"><span class="status-icon">✦</span><div>Questions, ideas, requests — use the in-app Requests board or the comment threads on any component. DesignOps is a conversation with a pipeline attached. <strong>— Lulamile</strong></div></div>' +
    "</div></div></div>"
}

/* ── 12b · VIEW: lint ─────────────────────────────────────────
   The verification gate: @designops/lint rules with verbatim
   diagnostics, a live playground (POST /api/lint when the dashboard
   runs under `npm start`), and copy-paste setup + config. */
let lintLinter = "eslint",
  lintFw = "react"
let lintTimer = 0,
  lintSeq = 0

function lintSetupPanel() {
  const e = LINT_SETUPS[lintLinter][lintFw]
  return codeBlock(e.label, lintLinter === "eslint" ? "js" : "json", e.code)
}
function syncLintTabs() {
  $$("#view [data-lint-linter]").forEach((x) =>
    x.classList.toggle("on", x.dataset.lintLinter === lintLinter)
  )
  $$("#view [data-lint-fw]").forEach((x) =>
    x.classList.toggle("on", x.dataset.lintFw === lintFw)
  )
  const p = $("#lintSetupPanel")
  if (p) p.innerHTML = lintSetupPanel()
}

function renderLint() {
  const stats =
    '<div class="hero-stats">' +
    '<div class="h-stat"><div class="h-stat-n"><span>' +
    LINT_RULES.length +
    '</span></div><div class="h-stat-l">rules that explain themselves</div></div>' +
    '<div class="h-stat"><div class="h-stat-n"><span>2</span></div><div class="h-stat-l">linters: ESLint + Oxlint</div></div>' +
    '<div class="h-stat"><div class="h-stat-n"><span>3</span></div><div class="h-stat-l">frameworks: React, Vue, Svelte</div></div>' +
    '<div class="h-stat"><div class="h-stat-n"><span>602</span></div><div class="h-stat-l">registry findings ratcheted in CI</div></div></div>'

  const rules = LINT_RULES.map(
    (r) =>
      '<article class="lt-rule">' +
      '<code class="lt-rule-id">' +
      r.id +
      "</code>" +
      '<p class="lt-rule-blurb">' +
      esc(r.blurb) +
      "</p>" +
      '<p class="lt-k bad">violation</p>' +
      codeBlock(r.short + " · violation", "tsx", r.bad) +
      '<p class="lt-k out">diagnostic · verbatim</p><p class="lt-diag">' +
      esc(r.message) +
      "</p>" +
      '<p class="lt-k ok">fix</p>' +
      codeBlock(r.short + " · fix", "tsx", r.fix) +
      "</article>"
  ).join("")

  const presets = LINT_PRESETS.map(
    (p, i) =>
      '<button class="lt-preset' +
      (i === 0 ? " on" : "") +
      '" data-lint-preset="' +
      i +
      '">' +
      esc(p.name) +
      "</button>"
  ).join("")

  $("#view").innerHTML =
    heroHTML(
      "Verification gate · @designops/lint",
      "Design rules<br/><em>agents can verify</em>",
      "DesignOps now verifies, not just ships. @designops/lint is an agent-first linter for Tailwind design systems: you define what is allowed, and every violation explains itself — with a fix drawn from your own components, variants and theme. Works with your existing design system; no rewrite required.",
      stats
    ) +
    '<div class="content">' +
    '<div class="status-banner waiting" id="lintEngine"><span class="status-icon">◌</span><div>Checking for the lint engine…</div></div>' +
    '<div class="section-hdr"><h2>The six rules</h2></div>' +
    '<p class="lt-note">Each card shows a real violation, the <strong>verbatim</strong> diagnostic the linter reports, and the fix. Diagnostics are captured from the actual build (<code>pnpm lint:capture</code>).</p>' +
    '<div class="lt-rule-grid">' +
    rules +
    "</div>" +
    '<div class="section-hdr"><h2>Playground — lint live code</h2></div>' +
    '<p class="lt-note">Runs the real <code>@designops/lint</code> build against the demo design system (Button with <code>cva</code> variants, Tailwind v4 theme). Pick a preset or type your own TSX.</p>' +
    '<div class="lt-presets">' +
    presets +
    "</div>" +
    '<div class="lt-pg"><div class="lt-pane"><div class="lt-pane-bar"><span>app/playground.tsx</span><span id="lintStatus">idle</span></div>' +
    '<textarea id="lintEditor" spellcheck="false" autocomplete="off" autocapitalize="off">' +
    esc(LINT_PRESETS[0].code) +
    "</textarea></div>" +
    '<div class="lt-pane"><div class="lt-pane-bar"><span>diagnostics</span><span id="lintCount"></span></div>' +
    '<ol class="lt-results" id="lintResults"></ol></div></div>' +
    '<div class="section-hdr"><h2>Setup — install in a minute</h2></div>' +
    '<div class="lt-tabs">' +
    '<button class="lt-tab on" data-lint-linter="eslint">ESLint</button>' +
    '<button class="lt-tab" data-lint-linter="oxlint">Oxlint</button>' +
    '<span class="lt-tabs-sep"></span>' +
    '<button class="lt-tab on" data-lint-fw="react">React</button>' +
    '<button class="lt-tab" data-lint-fw="vue">Vue</button>' +
    '<button class="lt-tab" data-lint-fw="svelte">Svelte</button>' +
    '</div><div id="lintSetupPanel">' +
    lintSetupPanel() +
    "</div>" +
    '<div class="section-hdr"><h2>Programmable config</h2></div>' +
    '<p class="lt-note">Per-component <strong>contracts</strong>, custom messages with <code>{{placeholders}}</code> filled from your variants and theme, and shared <code>settings.designops</code> — no component rewrites.</p>' +
    codeBlock("contracts + messages + shared settings", "js", LINT_CONFIG) +
    "</div>"
  lintRenderResults([], null)
  wireLintPlayground()
  checkLintEngine()
}

function lintSetStatus(txt, cls) {
  const el = $("#lintStatus")
  if (el) {
    el.textContent = txt
    el.className = cls || ""
  }
}
function lintRenderResults(list, ms) {
  const ol = $("#lintResults")
  if (!ol) return
  const count = $("#lintCount")
  if (count)
    count.textContent =
      !list.length && ms == null
        ? ""
        : list.length + (list.length === 1 ? " problem" : " problems")
  if (!list.length) {
    ol.innerHTML =
      ms == null
        ? '<li class="lt-empty">Run the server (<code>npm start</code>) to lint live.</li>'
        : '<li class="lt-empty"><span class="lt-check">✓</span> Clean — 0 problems in ' +
          ms +
          "ms.</li>"
    return
  }
  ol.innerHTML = list
    .map(
      (d) =>
        '<li class="lt-item"><span class="lt-loc">' +
        d.line +
        ":" +
        d.column +
        "</span>" +
        '<span class="lt-rule-chip">' +
        esc((d.ruleId || "error").replace("designops/", "")) +
        "</span>" +
        '<span class="lt-msg">' +
        esc(d.message) +
        "</span></li>"
    )
    .join("")
}
function lintRunSoon() {
  clearTimeout(lintTimer)
  lintTimer = setTimeout(lintRun, 450)
}
function lintRun() {
  const ed = $("#lintEditor")
  if (!ed || typeof fetch !== "function") return
  const code = ed.value
  if (!code.trim()) {
    lintRenderResults([], 0)
    lintSetStatus("idle")
    return
  }
  const seq = ++lintSeq
  lintSetStatus("linting…", "lt-busy")
  fetch("/api/lint", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code }),
  })
    .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
    .then(({ ok, d }) => {
      if (seq !== lintSeq || !$("#lintEditor")) return
      if (!ok) throw new Error((d && d.error) || "lint failed")
      lintRenderResults(d.diagnostics, d.ms)
      lintSetStatus(
        d.diagnostics.length
          ? d.diagnostics.length + " errors · " + d.ms + "ms"
          : "✓ clean · " + d.ms + "ms",
        d.diagnostics.length ? "lt-dirty" : "lt-clean"
      )
    })
    .catch((err) => {
      if (seq !== lintSeq || !$("#lintEditor")) return
      lintSetStatus("engine unreachable", "lt-dirty")
      lintRenderResults([], null)
    })
}
function wireLintPlayground() {
  const ed = $("#lintEditor")
  if (!ed) return
  ed.addEventListener("input", lintRunSoon)
  ed.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault()
      ed.setRangeText("  ", ed.selectionStart, ed.selectionEnd, "end")
      lintRunSoon()
    }
  })
}
function checkLintEngine() {
  const banner = $("#lintEngine")
  if (!banner) return
  const offline = () => {
    if (!$("#lintEngine")) return
    banner.className = "status-banner waiting"
    banner.innerHTML =
      '<span class="status-icon">◌</span><div><strong>Playground needs the local server.</strong> Run <code>npm start</code> and open the dashboard through it — static hosting shows the rules only.</div>'
    lintRenderResults([], null)
  }
  if (typeof fetch !== "function") {
    offline()
    return
  }
  fetch("/api/health")
    .then((r) => r.json())
    .then((d) => {
      if (!$("#lintEngine")) return
      if (d && d.ok) {
        banner.className = "status-banner ready"
        banner.innerHTML =
          '<span class="status-icon">✓</span><div><strong>Connected to @designops/lint v' +
          esc(d.version) +
          ".</strong> Every keystroke below is checked by the real build.</div>"
        lintRun()
      } else offline()
    })
    .catch(offline)
}

/* ── 12b · advisory view ─────────────────────────────────────
   The vendored catalogue (packages/advisory) is searchable live through
   /api/advisory when the dashboard runs under `npm start`. Offline it
   still explains the seam: what maps to what, and who has the last word. */
let adMode = "propose"
let adQuery = ADVISORY.queries[0].q

function adLoopHTML() {
  const steps = [
    [
      "Advise",
      "Search the catalogue for a style, palette, type scale or UX rule.",
    ],
    [
      "Tokenize",
      "It becomes a DTCG proposal in tokens/proposals/ — never the source of truth.",
    ],
    ["Build", "Ship to CSS, SCSS, TS and a Tailwind preset across 14 targets."],
    [
      "Verify",
      "@designops/lint checks it. A failure sends you back to Tokenize.",
    ],
  ]
  return (
    '<div class="ad-loop">' +
    steps
      .map(
        (st, i) =>
          '<div class="ad-step"><div class="ad-step-n">0' +
          (i + 1) +
          "</div>" +
          '<div class="ad-step-t">' +
          st[0] +
          '</div><div class="ad-step-b">' +
          st[1] +
          "</div></div>"
      )
      .join("") +
    "</div>"
  )
}

function adCatalogHTML() {
  return (
    '<div class="ad-catalog">' +
    ADVISORY.counts
      .map(
        (c) =>
          '<div class="ad-cat-cell"><div class="ad-cat-n">' +
          c.n +
          '</div><div class="ad-cat-l">' +
          esc(c.label) +
          "</div></div>"
      )
      .join("") +
    "</div>"
  )
}

function adMapHTML() {
  return (
    '<div class="ad-map">' +
    ADVISORY.mapping
      .map(
        (m) =>
          '<div class="ad-map-row"><span class="ad-map-to">' +
          esc(m.to) +
          "</span>" +
          '<span class="ad-map-from">' +
          esc(m.from) +
          (m.note
            ? ' <span class="ad-map-note">· ' + esc(m.note) + "</span>"
            : "") +
          "</span>" +
          '<span class="ad-badge ' +
          m.how +
          '">' +
          m.how +
          "</span></div>"
      )
      .join("") +
    "</div>"
  )
}

function adSwatches(result) {
  const colors = []
  const walk = (node, path) => {
    Object.keys(node).forEach((k) => {
      if (k.charAt(0) === "$") return
      const v = node[k]
      const p = path ? path + "." + k : k
      if (v && typeof v === "object" && "$value" in v) {
        if (p.indexOf("color.") === 0 && /^#[0-9a-fA-F]{6}$/.test(v.$value))
          colors.push([p, v.$value])
      } else if (v && typeof v === "object") walk(v, p)
    })
  }
  walk(result.tokens || {}, "")
  if (!colors.length) return ""
  return (
    '<div class="ad-swatches">' +
    colors
      .map(
        (c) =>
          '<div class="ad-sw"><div class="ad-sw-chip" style="background:' +
          esc(c[1]) +
          '"></div>' +
          '<div class="ad-sw-v">' +
          esc(c[1]) +
          '</div><div class="ad-sw-n">' +
          esc(c[0]) +
          "</div></div>"
      )
      .join("") +
    "</div>"
  )
}

function adContrastHTML(result) {
  const rows = (result.contrast || [])
    .map(
      (c) =>
        '<li class="ad-cr ' +
        (c.pass ? "pass" : "fail") +
        '"><span class="ad-cr-note">' +
        esc(c.note) +
        "</span>" +
        '<span class="ad-cr-ratio">' +
        c.ratio +
        ':1 <span class="ad-map-note">/ ' +
        c.required +
        ":1</span></span>" +
        '<span class="ad-mark ' +
        (c.pass ? "pass" : "fail") +
        '">' +
        (c.pass ? "pass" : "fix") +
        "</span></li>"
    )
    .join("")
  if (!rows) return ""
  return (
    '<p class="lt-k ' +
    (result.contrast.some((c) => !c.pass) ? "bad" : "ok") +
    '">contrast · measured by designops, not the catalogue</p>' +
    '<ul class="ad-contrast">' +
    rows +
    "</ul>"
  )
}

function adRender(result, err) {
  const body = $("#adOutBody")
  const bar = $("#adOutBar")
  if (!body) return
  if (err) {
    bar.textContent = "error"
    body.textContent = err
    return
  }
  if (!result) {
    bar.textContent = "idle"
    body.textContent = "Run a query to see what the catalogue returns."
    return
  }
  const src = result.source || {}
  bar.textContent =
    (src.style || "—") +
    " · " +
    (src.product || "—") +
    (src.exactMatch ? "" : " · fallback")
  const head =
    "STYLE     " +
    (src.style || "—") +
    "\n" +
    "PRODUCT   " +
    (src.product || "—") +
    "\n" +
    "TYPE      " +
    (src.typographyPairing || "—") +
    "\n" +
    "MATCH     " +
    (src.exactMatch ? "exact" : "fallback — verify before applying") +
    "\n\n" +
    "MAPPING (" +
    result.mapping.length +
    " tokens)\n" +
    result.mapping
      .map(
        (m) =>
          "  " +
          m.source.toUpperCase().padEnd(10) +
          m.token.padEnd(30) +
          String(m.value).padEnd(24) +
          "<- " +
          m.from
      )
      .join("\n")
  const guide = result.guidance || {}
  const tail =
    "\n\nTYPOGRAPHY  " +
    (guide.typography && guide.typography.heading
      ? guide.typography.heading + " / " + guide.typography.body
      : "—") +
    "\nANTI-PATTERNS  " +
    ((guide.antiPatterns || []).join(", ") || "—") +
    "\nNOT TOKENS  " +
    ((guide.unmappedAdvisoryFields || []).map((u) => u.field).join(", ") ||
      "—") +
    "\n\nNEXT\n" +
    (result.next || []).map((n) => "  " + n).join("\n")
  body.textContent = head + tail
  const extra = $("#adExtra")
  if (extra) extra.innerHTML = adSwatches(result) + adContrastHTML(result)
}

function adRun() {
  const btn = $("#adRun")
  const input = $("#adInput")
  if (!input || typeof fetch !== "function") return
  const query = input.value.trim()
  if (!query) return
  adQuery = query
  if (btn) {
    btn.disabled = true
    btn.textContent = "searching…"
  }
  $("#adOutBar").textContent = "running…"
  fetch("/api/advisory", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: query, mode: adMode }),
  })
    .then((r) => r.json().then((d) => ({ ok: r.ok, d: d })))
    .then((pair) => {
      if (btn) {
        btn.disabled = false
        btn.textContent = "Run"
      }
      if (!$("#adOutBody")) return
      if (!pair.ok)
        throw new Error((pair.d && pair.d.error) || "advisory failed")
      adRender(pair.d, null)
    })
    .catch((e) => {
      if (btn) {
        btn.disabled = false
        btn.textContent = "Run"
      }
      adRender(null, String(e.message || e))
    })
}

function renderAdvisory() {
  const stats =
    '<div class="hero-stats">' +
    '<div class="h-stat"><div class="h-stat-n"><span>4</span></div><div class="h-stat-l">steps: advise → verify</div></div>' +
    '<div class="h-stat"><div class="h-stat-n"><span>' +
    ADVISORY.counts[0].n +
    '</span></div><div class="h-stat-l">searchable UI styles</div></div>' +
    '<div class="h-stat"><div class="h-stat-n"><span>7</span></div><div class="h-stat-l">contrast checks per proposal</div></div>' +
    '<div class="h-stat"><div class="h-stat-n"><span>6</span></div><div class="h-stat-l">rules that overrule it</div></div></div>'

  const presets = ADVISORY.queries
    .map(
      (q) =>
        '<button class="ad-q' +
        (q.q === adQuery ? " on" : "") +
        '" data-ad-q="' +
        esc(q.q) +
        '" data-ad-mode="' +
        q.mode +
        '">' +
        esc(q.q) +
        (q.domain || q.stack
          ? ' <span class="ad-map-note">· ' +
            esc(q.domain || q.stack) +
            "</span>"
          : "") +
        "</button>"
    )
    .join("")

  const charter = ADVISORY.charter
    .map(
      (c) =>
        '<div class="ad-charter-item"><h4>' +
        esc(c.rule) +
        "</h4><p>" +
        c.body +
        "</p></div>"
    )
    .join("")

  const cmds = ADVISORY.commands
    .map(
      (c) =>
        '<div class="ad-cmd"><code>' +
        esc(c.cmd) +
        "</code><span>" +
        esc(c.note) +
        "</span></div>"
    )
    .join("")

  $("#view").innerHTML =
    heroHTML(
      "Advisory layer · @designops/advisory",
      "Design intelligence<br/><em>that answers to your tokens</em>",
      "A vendored design-intelligence catalogue — styles, palettes, type pairings, UX guidelines and stack conventions — wired into the token pipeline. It proposes; tokens/tokens.json disposes; @designops/lint has the last word. The catalogue never measured the palette it hands over, so the bridge measures it.",
      stats
    ) +
    '<div class="content">' +
    '<div class="status-banner waiting" id="adEngine"><span class="status-icon">◌</span><div>Checking for the advisory catalogue…</div></div>' +
    '<div class="section-hdr"><h2>The loop</h2></div>' +
    adLoopHTML() +
    '<div class="section-hdr"><h2>What is in the catalogue</h2></div>' +
    '<p class="lt-note">Vendored from <code>' +
    esc(ADVISORY.upstream) +
    "@" +
    esc(ADVISORY.commit) +
    "</code> (MIT) into <code>packages/advisory</code>. Offline BM25 search, Python 3 standard library only. See <code>packages/advisory/VENDOR.md</code> for provenance and what was deliberately left out.</p>" +
    adCatalogHTML() +
    '<div class="section-hdr"><h2>Where it lands in your tokens</h2></div>' +
    '<p class="lt-note">Every advisory field has a home, or is recorded as having none. <strong>Derived</strong> values (hover, wash, subtle ink) are computed in OKLab, not curated — read them before you promote them.</p>' +
    adMapHTML() +
    '<div class="section-hdr"><h2>Query the catalogue</h2></div>' +
    '<p class="lt-note">Runs <code>tools/advisory.mjs</code> against <code>packages/advisory</code>. <code>propose</code> returns a full token proposal; <code>search</code> answers one targeted concern.</p>' +
    '<div class="ad-queries">' +
    presets +
    "</div>" +
    '<div class="ad-bar">' +
    '<input class="ad-input" id="adInput" value="' +
    esc(adQuery) +
    '" spellcheck="false" autocomplete="off" placeholder="dark fintech dashboard"/>' +
    '<button class="ad-radio' +
    (adMode === "propose" ? " on" : "") +
    '" data-ad-mode-set="propose">propose</button>' +
    '<button class="ad-radio' +
    (adMode === "search" ? " on" : "") +
    '" data-ad-mode-set="search">search</button>' +
    '<button class="ad-run" id="adRun">Run</button></div>' +
    '<div class="ad-out"><div class="ad-out-bar"><span id="adOutBar">idle</span><span>packages/advisory</span></div>' +
    '<pre class="ad-out-body" id="adOutBody">Run a query to see what the catalogue returns.</pre></div>' +
    '<div id="adExtra"></div>' +
    '<div class="section-hdr"><h2>Who has the last word</h2></div>' +
    '<div class="ad-charter">' +
    charter +
    "</div>" +
    '<div class="section-hdr"><h2>From the terminal</h2></div>' +
    '<div class="ad-cmds">' +
    cmds +
    "</div>" +
    "</div>"

  $("#adRun").addEventListener("click", adRun)
  $("#adInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") adRun()
  })
  checkAdvisoryEngine()
}

function checkAdvisoryEngine() {
  const banner = $("#adEngine")
  if (!banner) return
  const offline = () => {
    if (!$("#adEngine")) return
    banner.className = "status-banner waiting"
    banner.innerHTML =
      '<span class="status-icon">◌</span><div><strong>Live querying needs the local server.</strong> Run <code>npm start</code> and open the dashboard through it. Everything above still works: the catalogue ships with the repo.</div>'
  }
  if (typeof fetch !== "function") {
    offline()
    return
  }
  fetch("/api/advisory/health")
    .then((r) => r.json())
    .then((d) => {
      if (!$("#adEngine")) return
      if (d && d.ok) {
        banner.className = "status-banner ready"
        const c = d.counts || {}
        banner.innerHTML =
          '<span class="status-icon">✓</span><div><strong>Advisory catalogue connected.</strong> ' +
          esc(String(d.styles || "—")) +
          " styles · " +
          esc(String(d.products || "—")) +
          " product palettes · " +
          esc(String(d.ux || "—")) +
          " UX guidelines · " +
          esc(String(d.stacks || "—")) +
          " stacks · vendored at " +
          esc(ADVISORY.upstream) +
          "@" +
          esc(ADVISORY.commit) +
          " (MIT).</div>"
        adRun()
      } else offline()
    })
    .catch(offline)
}

/* ── 12c · demos view ────────────────────────────────────────
   Real sites generated from advisory proposals by tools/demo-build.mjs.
   The manifest is fetched at runtime so regenerating demos updates the
   gallery with no rebuild; DEMO_FALLBACK keeps the view useful when it is
   missing (static hosting, or before the first build). */
let demosManifest = null

function demosData() {
  return demosManifest || DEMO_FALLBACK
}

/**
 * Gallery filter state. Kept in module scope so it survives re-renders
 * within the view; the router resets it when leaving the page.
 */
const demoFilter = { category: "All", mode: "All Modes" }

/** Category chips, mode chips and a palette row for filtering the grid. */
function demoFilters() {
  const data = demosData()
  const cats = ["All"].concat(
    data.categories || [...new Set(data.demos.map((d) => d.category))].sort()
  )
  const modes = ["All Modes", "Light", "Dark"]

  const chip = (active, label, kind, value) =>
    '<button class="dm-filter' +
    (active ? " on" : "") +
    '" data-fkind="' +
    kind +
    '" data-fval="' +
    esc(value) +
    '" type="button">' +
    esc(label) +
    "</button>"

  return (
    '<div class="dm-filters">' +
    '<div class="dm-filter-row"><span class="dm-filter-l">Category</span>' +
    cats
      .map((c) => chip(demoFilter.category === c, c, "category", c))
      .join("") +
    "</div>" +
    '<div class="dm-filter-row"><span class="dm-filter-l">Mode</span>' +
    modes.map((m) => chip(demoFilter.mode === m, m, "mode", m)).join("") +
    "</div>" +
    '<div class="dm-filter-row"><span class="dm-filter-l">Palette</span>' +
    '<div class="dm-palettes">' +
    data.demos
      .slice()
      .sort((a, b) => a.category.localeCompare(b.category))
      .map((d) => {
        return (
          '<button class="dm-pal" data-fkind="category" data-fval="' +
          esc(d.category) +
          '" title="' +
          esc(d.category + " · " + d.brand) +
          '" type="button">' +
          [
            d.colors && d.colors.background,
            d.colors && d.colors.surface,
            d.colors && d.colors.accent,
            d.colors && d.colors.ink,
          ]
            .filter(Boolean)
            .map(
              (c) =>
                '<span class="dm-pal-s" style="background:' +
                esc(c) +
                '"></span>'
            )
            .join("") +
          "</button>"
        )
      })
      .join("") +
    "</div></div>" +
    "</div>" +
    '<p class="dm-count">' +
    demoCountLine() +
    "</p>"
  )
}

/** "Showing 6 of 40 demos" — the running count under the filter row. */
function demoCountLine() {
  const data = demosData()
  const shown = demoVisible()
  return (
    "<strong>Showing " +
    shown.length +
    " of " +
    data.demos.length +
    " demos</strong>" +
    (demoFilter.category !== "All" ? " in " + esc(demoFilter.category) : "") +
    (demoFilter.mode !== "All Modes" ? " · " + esc(demoFilter.mode) : "") +
    " &nbsp;•&nbsp; " +
    data.demos.length +
    " demos available &nbsp;•&nbsp; " +
    (data.categories ? data.categories.length : 0) +
    " categories &nbsp;•&nbsp; " +
    data.demos.filter((d) => d.mode === "Light").length +
    " light &nbsp;•&nbsp; " +
    data.demos.filter((d) => d.mode === "Dark").length +
    " dark"
  )
}

function demoVisible() {
  return demosData().demos.filter(
    (d) =>
      (demoFilter.category === "All" || d.category === demoFilter.category) &&
      (demoFilter.mode === "All Modes" || d.mode === demoFilter.mode)
  )
}

/**
 * Previews render the page at a virtual 1400x900 and scale it down. A
 * fixed scale either clips the page on a narrow card or leaves dead
 * space on a wide one, so measure the card and fit it exactly.
 */
const DEMO_VIRTUAL_W = 1400
const DEMO_VIRTUAL_H = 900

function fitDemoShots() {
  document.querySelectorAll(".dm-shot").forEach((shot) => {
    const frame = shot.querySelector("iframe")
    if (!frame) return
    const w = shot.clientWidth
    // jsdom and detached nodes report 0; leave the CSS fallback in place.
    if (!w) return
    const scale = w / DEMO_VIRTUAL_W
    frame.style.transform = `scale(${scale})`
    shot.style.height = `${Math.round(DEMO_VIRTUAL_H * scale)}px`
  })
}

let demoFitRaf = 0
if (typeof window !== "undefined") {
  window.addEventListener("resize", () => {
    if (typeof cancelAnimationFrame === "function")
      cancelAnimationFrame(demoFitRaf)
    if (typeof requestAnimationFrame === "function")
      demoFitRaf = requestAnimationFrame(fitDemoShots)
    else fitDemoShots()
  })
}

function demoGrid() {
  const shown = demoVisible()
  return shown.length
    ? shown.map(demoCard).join("")
    : '<p class="lt-note">No demo matches that combination.</p>'
}

/** Swap the grid and the count line without rebuilding the whole view. */
function demoApplyFilter(kind, value) {
  demoFilter[kind] = value
  document
    .querySelectorAll(".dm-filter")
    .forEach((b) =>
      b.classList.toggle(
        "on",
        b.dataset.fval === value && b.dataset.fkind === kind
      )
    )
  const grid = document.getElementById("dm-grid")
  if (grid) grid.innerHTML = demoGrid()
  const count = document.querySelector(".dm-count")
  if (count) count.innerHTML = demoCountLine()
  fitDemoShots()
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest && e.target.closest("[data-fkind]")
  if (!btn) return
  demoApplyFilter(btn.dataset.fkind, btn.dataset.fval)
})

function demosLoad() {
  if (demosManifest || typeof fetch !== "function")
    return Promise.resolve(demosData())
  return fetch("demos/manifest.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d && d.demos && d.demos.length) {
        demosManifest = d
        render()
        fitDemoShots()
      }
      return demosData()
    })
    .catch(() => demosData())
}

function demoCard(d) {
  const lintOk = d.lint && d.lint.findings === 0
  const sw = [
    d.colors && d.colors.background,
    d.colors && d.colors.surface,
    d.colors && d.colors.accent,
    d.colors && d.colors.ink,
  ]
    .filter(Boolean)
    .map(
      (c) =>
        '<span class="dm-sw" style="background:' +
        esc(c) +
        '" title="' +
        esc(c) +
        '"></span>'
    )
    .join("")
  const contrastOk = !d.contrast || d.contrast.pass === d.contrast.total
  return (
    '<article class="dm-card">' +
    '<div class="dm-shot"><iframe src="' +
    esc(d.path || "demos/" + d.slug + "/index.html") +
    '" loading="lazy" title="' +
    esc(d.brand) +
    '"></iframe>' +
    '<div class="dm-links">' +
    '<a href="' +
    esc(d.path || "demos/" + d.slug + "/index.html") +
    '" target="_blank" rel="noreferrer">Open live demo ↗</a>' +
    '<a href="' +
    esc((d.path || "demos/" + d.slug + "/index.html") + "#components") +
    '" target="_blank" rel="noreferrer">Components ↗</a>' +
    "</div></div>" +
    '<div class="dm-body">' +
    '<div class="dm-top"><span class="dm-brand">' +
    esc(d.brand) +
    "</span>" +
    '<span class="dm-mode' +
    (d.mode === "Dark" ? " dark" : "") +
    '">' +
    esc(d.mode || "—") +
    "</span></div>" +
    '<div class="dm-cat">' +
    esc(d.category || "") +
    "</div>" +
    '<div class="dm-tag">' +
    esc(d.tagline || "") +
    "</div>" +
    '<div class="dm-style-row"><span class="dm-style">' +
    esc(d.style || "") +
    "</span>" +
    '<span class="dm-style">' +
    esc(d.typography || "") +
    "</span></div>" +
    '<div class="dm-swatches">' +
    sw +
    "</div>" +
    '<div class="dm-meta">' +
    '<span class="dm-chip' +
    (lintOk ? " ok" : " warn") +
    '">' +
    (lintOk
      ? "✓ 0 lint findings"
      : d.lint
        ? d.lint.findings + " findings"
        : "not linted") +
    "</span>" +
    '<span class="dm-chip' +
    (contrastOk ? " ok" : " warn") +
    '">contrast ' +
    (d.contrast ? d.contrast.pass + "/" + d.contrast.total : "—") +
    "</span>" +
    '<span class="dm-chip">' +
    (d.tokens || "—") +
    " tokens</span>" +
    '<span class="dm-chip">' +
    esc(d.typography || "") +
    "</span>" +
    "</div></div></article>"
  )
}

function renderDemos() {
  demoFilter.category = "All"
  demoFilter.mode = "All Modes"
  const data = demosData()
  const clean = data.demos.filter((d) => d.lint && d.lint.findings === 0).length
  const stats =
    '<div class="hero-stats">' +
    '<div class="h-stat"><div class="h-stat-n"><span>' +
    data.demos.length +
    '</span></div><div class="h-stat-l">generated demo sites</div></div>' +
    '<div class="h-stat"><div class="h-stat-n"><span>' +
    clean +
    '</span></div><div class="h-stat-l">pass @designops/lint clean</div></div>' +
    '<div class="h-stat"><div class="h-stat-n"><span>0</span></div><div class="h-stat-l">raw palette utilities</div></div>' +
    '<div class="h-stat"><div class="h-stat-n"><span>44</span></div><div class="h-stat-l">tokens per site, all declared</div></div></div>'

  const cmds = [
    [
      "node tools/demo-build.mjs --all",
      "rebuild the whole catalogue — 40 sites, 20 categories",
    ],
    [
      "node tools/demo-build.mjs --category=Gaming",
      "rebuild just one category",
    ],
    [
      'node tools/demo-build.mjs "pet grooming service"',
      "generate a single site from an advisory query",
    ],
    [
      'node tools/demo-build.mjs "query" --slug my-demo',
      "choose the output folder",
    ],
  ]
    .map(
      (c) =>
        '<div class="dm-cmd"><code>' +
        esc(c[0]) +
        "</code><span>" +
        esc(c[1]) +
        "</span></div>"
    )
    .join("")

  $("#view").innerHTML =
    heroHTML(
      "Demo gallery · generated + verified",
      "Twenty categories, forty sites,<br/><em>all eight components</em>",
      "Every site here was generated from an advisory proposal, rendered from tokens the proposal declared, and then run through @designops/lint. The markup is emitted twice — once as the page you are looking at, once as JSX for the linter — so a finding is a finding about the page, not about a separate copy.",
      stats
    ) +
    '<div class="content">' +
    '<div class="status-banner' +
    (data.generated ? " ready" : " waiting") +
    '"><span class="status-icon">' +
    (data.generated ? "✓" : "◌") +
    "</span><div>" +
    (data.generated
      ? "<strong>Manifest loaded.</strong> Generated " +
        esc(data.generated.slice(0, 10)) +
        ". Regenerate with <code>node tools/demo-build.mjs --all</code>."
      : '<strong>Showing the bundled manifest.</strong> Run <code>node tools/demo-build.mjs "&lt;query&gt;"</code> to generate sites and write <code>demos/manifest.json</code>.') +
    "</div></div>" +
    '<div class="section-hdr"><h2>The gallery</h2></div>' +
    '<p class="lt-note">Each card previews the real generated page. Click through to open it full size. The chips on every card are measured, not claimed: lint findings from the real build, and WCAG contrast on every pair the site renders. Every site also carries a <strong>Components</strong> section rendering all eight DesignOps components — button, input, badge, card, alert, avatar, data table and toast — in that page\u2019s own tokens.</p>' +
    demoFilters() +
    '<div id="dm-grid" class="dm-grid">' +
    demoGrid() +
    "</div>" +
    '<div class="section-hdr"><h2>Every site carries the component set</h2></div>' +
    '<p class="lt-note">Each generated page has a <strong>Components</strong> section rendering all eight DesignOps components — button, input, badge, card, alert, avatar, data table and toast — with every variant, using that page\u2019s own tokens. The same eight components, forty different design systems, and not one of them was edited to make the system fit.</p>' +
    '<div class="section-hdr"><h2>Why this is not just a gallery</h2></div>' +
    '<div class="ad-charter">' +
    '<div class="ad-charter-item"><h4>Every colour is a token</h4><p>There is no <code>bg-white</code>, no <code>text-gray-400</code>, no <code>border-slate-200</code> and no arbitrary value in any generated page. All four <code>@designops/lint</code> rules are enabled, so one raw utility and the build says so.</p></div>' +
    '<div class="ad-charter-item"><h4>What you see is what was checked</h4><p>The class strings in the shipped <code>index.html</code> and in the linted <code>page.tsx</code> come from the same template function. They cannot drift apart.</p></div>' +
    '<div class="ad-charter-item"><h4>Palettes are measured, not asserted</h4><p>The catalogue has never checked a contrast ratio. The bridge measures seven pairs per proposal, and the result is on the card — including the ones that fail.</p></div>' +
    '<div class="ad-charter-item"><h4>Contrast failures are shown</h4><p>Several of these sites ship with a failing pair. That number is on the card rather than quietly fixed, because the fix is a design decision, not a build step.</p></div>' +
    '<div class="ad-charter-item"><h4>The palette filter is the point</h4><p>Every card shows its four measured colours. Click a swatch row to filter to that category. These are not screenshots — they are the tokens the page actually compiles against.</p></div>' +
    "</div>" +
    '<div class="section-hdr"><h2>Generate your own</h2></div>' +
    '<div class="dm-cmds">' +
    cmds +
    "</div>" +
    "</div>"

  demosLoad()
  fitDemoShots()
}

/* ── 13 · router ────────────────────────────────────────────── */
const ROUTES = {
  overview: renderOverview,
  tokens: renderTokens,
  components: renderComponents,
  frameworks: renderFrameworks,
  advisory: renderAdvisory,
  demos: renderDemos,
  lint: renderLint,
  requests: renderRequests,
  storybook: renderStorybook,
  integrations: renderIntegrations,
  guide: renderGuide,
}

function currentRoute() {
  const h = location.hash.replace("#/", "")
  return ROUTES[h] ? h : "overview"
}
function render() {
  const r = currentRoute()
  ROUTES[r]()
  renderSidebar()
  $$(".sb-nav-item[data-route]").forEach((n) =>
    n.classList.toggle("active", n.dataset.route === r)
  )
  $("#topbarTitle").textContent = TOPBAR_TITLES[r]
  $("#sidebar").classList.remove("open")
  if (!demo.active) window.scrollTo({ top: 0 })
}
function go(route) {
  location.hash = "#/" + route
}

/* ── 14 · search ────────────────────────────────────────────── */
function searchItems() {
  return [
    ...COMPONENTS.map((c) => ({
      name: c.name,
      tag: "<" + c.tag + ">",
      kind: "component",
      run: () => {
        go("components")
        setTimeout(() => openComp(c.id), 90)
      },
    })),
    ...TOKENS.map((t) => ({
      name: t.f,
      tag: t.css,
      kind: "token",
      run: () => {
        go("tokens")
      },
    })),
    ...FRAMEWORKS.map((f) => ({
      name: f.name,
      tag: f.kind,
      kind: "framework",
      run: () => go("frameworks"),
    })),
    ...state.requests.map((r) => ({
      name: r.title,
      tag: "request · " + r.status,
      kind: "request",
      run: () => {
        selectedReq = r.id
        go("requests")
      },
    })),
    ...GUIDE.map((g) => ({
      name: g.label,
      tag: "guide",
      kind: "guide",
      run: () => {
        go("guide")
        setTimeout(() => {
          const el = $("#guide-" + g.id)
          if (el) el.scrollIntoView({ behavior: "smooth" })
        }, 90)
      },
    })),
    ...LINT_RULES.map((r) => ({
      name: r.id,
      tag: "lint rule",
      kind: "rule",
      run: () => {
        go("lint")
      },
    })),
  ]
}
function runSearch(q) {
  const box = $("#searchResults")
  if (!q.trim()) {
    box.classList.remove("show")
    return
  }
  const hits = searchItems()
    .filter((i) =>
      (i.name + " " + i.tag).toLowerCase().includes(q.toLowerCase())
    )
    .slice(0, 8)
  box.innerHTML = hits.length
    ? hits
        .map(
          (h, idx) =>
            '<div class="sr-item" data-hit="' +
            idx +
            '"><span style="flex:1;font-weight:600">' +
            esc(h.name) +
            '</span><span class="sr-pill" style="background:var(--ink-06);color:var(--ink-45)">' +
            esc(h.kind) +
            '</span><span class="sr-pill" style="background:var(--ink-06);color:var(--ink-45)">' +
            esc(h.tag) +
            "</span></div>"
        )
        .join("")
    : '<div class="sr-item" style="color:var(--ink-45)">No results for “' +
      esc(q) +
      "”</div>"
  box.dataset.hits = JSON.stringify(hits.length)
  box.classList.add("show")
  box.querySelectorAll(".sr-item[data-hit]").forEach((el) => {
    el.addEventListener("mousedown", (e) => {
      e.preventDefault()
      hits[+el.dataset.hit].run()
      box.classList.remove("show")
      $("#globalSearch").value = ""
    })
  })
}

function openComp(id) {
  const card = $("#comp-" + id)
  if (!card) return
  if (compFilter !== "all") {
    compFilter = "all"
    renderComponents()
  }
  const target = $("#comp-" + id)
  if (!target.classList.contains("open")) {
    const body = target.querySelector(".comp-body")
    body.innerHTML = buildCompBody(COMPONENTS.find((c) => c.id === id))
    target.classList.add("open")
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" })
}

/* ── 15 · export menu ───────────────────────────────────────── */
function toggleExportMenu() {
  let menu = $("#exportMenu")
  if (menu) {
    menu.remove()
    return
  }
  menu = document.createElement("div")
  menu.id = "exportMenu"
  menu.style.cssText =
    "position:fixed;top:60px;right:26px;z-index:120;background:var(--surface-2);border:1px solid var(--border-mid);border-radius:12px;padding:8px;box-shadow:0 16px 44px rgba(0,0,0,.55);display:flex;flex-direction:column;gap:4px;min-width:210px"
  menu.innerHTML = [
    ["css", "tokens.css — :root variables"],
    ["scss", "tokens.scss — Sass"],
    ["ts", "tokens.ts — TypeScript"],
    ["tailwind", "tailwind preset (js)"],
    ["json", "tokens.json — raw"],
  ]
    .map(
      ([f, label]) =>
        '<button class="sb-nav-item" data-export="' +
        f +
        '" style="font-size:.78rem"><span class="sb-nav-name">' +
        label +
        '</span><span class="sr-pill" style="background:var(--ink-06);color:var(--ink-45)">' +
        f +
        "</span></button>"
    )
    .join("")
  document.body.appendChild(menu)
  setTimeout(
    () =>
      document.addEventListener("click", function closer(e) {
        if (!menu.contains(e.target) && e.target.id !== "exportBtn") {
          menu.remove()
          document.removeEventListener("click", closer)
        }
      }),
    10
  )
}

/* ── 16 · demo mode ─────────────────────────────────────────── */
const demo = { active: false, idx: 0, audio: null, timer: null, paused: false }

function demoStart() {
  demo.active = true
  demo.idx = 0
  demo.paused = false
  document.body.style.overflow = "hidden"
  $("#demoRoot").innerHTML =
    '<div class="demo-overlay"><div class="demo-dim" id="demoDim"></div>' +
    '<div class="demo-badge"><span class="demo-live-dot"></span>DesignOps · guided demo</div>' +
    '<div class="demo-caption">' +
    '<div class="demo-caption-head"><span class="demo-scene-tag" id="demoTag"></span>' +
    '<div class="demo-controls">' +
    '<button class="demo-ctrl" id="demoPause">❚❚ pause</button>' +
    '<button class="demo-ctrl" id="demoNext">next ›</button>' +
    '<button class="demo-ctrl" id="demoExit">✕ exit</button>' +
    "</div></div>" +
    '<div class="demo-caption-title" id="demoTitle"></div>' +
    '<div class="demo-caption-text" id="demoText"></div>' +
    '<div class="demo-progress"><div class="demo-progress-fill" id="demoFill"></div></div>' +
    "</div></div>"
  $("#demoPause").addEventListener("click", demoTogglePause)
  $("#demoNext").addEventListener("click", () => demoScene(demo.idx + 1))
  $("#demoExit").addEventListener("click", demoEnd)
  $("#demoDim").addEventListener("click", demoEnd) // click the backdrop to exit the tour
  demoScene(0)
}

function demoScene(i) {
  if (i >= DEMO_SCENES.length) {
    demoEnd()
    return
  }
  demo.idx = i
  const s = DEMO_SCENES[i]
  $$(".demo-highlight").forEach((el) => el.classList.remove("demo-highlight"))
  /* navigate while paused-safe */
  if (location.hash !== "#/" + s.view) go(s.view)
  else render()
  $("#demoTag").textContent =
    "scene " + (i + 1) + " / " + DEMO_SCENES.length + " · " + s.tag
  $("#demoTitle").textContent = s.title
  $("#demoText").textContent = s.text
  $("#demoFill").style.width = ((i + 1) / DEMO_SCENES.length) * 100 + "%"
  setTimeout(() => {
    const el = s.sel && $(s.sel)
    if (el) {
      el.classList.add("demo-highlight")
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }
    /* For scene 3/4 make sure the button card is open with its tabs visible */
    if (s.sel && s.sel.indexOf("comp-button") === 1 && i >= 3) {
      const card = $("#comp-button")
      if (card && !card.classList.contains("open")) {
        card.querySelector(".comp-body").innerHTML = buildCompBody(
          COMPONENTS[0]
        )
        card.classList.add("open")
      }
      const el2 = $(s.sel)
      if (el2) el2.classList.add("demo-highlight")
    }
  }, 120)

  /* Audio narration with graceful fallback to timed advance */
  clearTimeout(demo.timer)
  if (demo.audio) {
    try {
      demo.audio.pause()
    } catch (e) {}
    demo.audio = null
  }
  const audio = new Audio(s.audio)
  demo.audio = audio
  let advanced = false
  const advance = () => {
    if (!advanced && demo.active && !demo.paused) {
      advanced = true
      demoScene(i + 1)
    }
  }
  audio.onended = advance
  audio.onerror = () => {
    demo.audio = null
    demo.timer = setTimeout(advance, s.dur)
  }
  const p = audio.play()
  if (p && p.catch)
    p.catch(() => {
      demo.timer = setTimeout(advance, s.dur)
    })
  demo.timer = setTimeout(advance, s.dur + 1500) // hard fallback
}

function demoTogglePause() {
  demo.paused = !demo.paused
  $("#demoPause").textContent = demo.paused ? "▶ resume" : "❚❚ pause"
  if (demo.audio) {
    try {
      demo.paused ? demo.audio.pause() : demo.audio.play().catch(() => {})
    } catch (e) {}
  }
  if (demo.paused) clearTimeout(demo.timer)
  else demo.timer = setTimeout(() => demoScene(demo.idx + 1), 4000)
}
function demoEnd() {
  demo.active = false
  clearTimeout(demo.timer)
  if (demo.audio) {
    try {
      demo.audio.pause()
    } catch (e) {}
    demo.audio = null
  }
  $$(".demo-highlight").forEach((el) => el.classList.remove("demo-highlight"))
  $("#demoRoot").innerHTML = ""
  document.body.style.overflow = ""
  render()
}

/* ── 17 · global event delegation ───────────────────────────── */
document.addEventListener("click", (e) => {
  const t = e.target

  /* sidebar navigation */
  const nav = t.closest(".sb-nav-item[data-route]")
  if (nav) {
    go(nav.dataset.route)
    return
  }

  /* token other cells (copy-on-click affordances) */
  const cp = t.closest("[data-copy]")
  if (cp) {
    copyText(cp.dataset.copy)
    toast("Copied", cp.dataset.copy, "⧉")
    return
  }

  /* export buttons (topbar menu + tokens view) */
  const ex = t.closest("[data-export]")
  if (ex) {
    const f = ex.dataset.export
    const names = {
      css: "tokens.css",
      scss: "tokens.scss",
      ts: "tokens.ts",
      tailwind: "tokens.tailwind.js",
      json: "tokens.json",
    }
    downloadFile(names[f], exportTokens(f))
    toast(
      "Downloaded " + names[f],
      "identical to npm run build:tokens output",
      "⤓"
    )
    const m = $("#exportMenu")
    if (m) m.remove()
    return
  }
  if (t.closest("#exportBtn")) {
    toggleExportMenu()
    return
  }
  if (t.closest("#watchDemoBtn")) {
    demoStart()
    return
  }
  if (t.closest("#hamburger")) {
    $("#sidebar").classList.toggle("open")
    return
  }

  /* advisory: preset query chips and the propose/search toggle */
  const adq = t.closest("[data-ad-q]")
  if (adq) {
    adQuery = adq.dataset.adQ
    adMode = adq.dataset.adMode || "search"
    $$(".ad-q").forEach((b) =>
      b.classList.toggle("on", b.dataset.adQ === adQuery)
    )
    $$("[data-ad-mode-set]").forEach((b) =>
      b.classList.toggle("on", b.dataset.adModeSet === adMode)
    )
    $("#adInput").value = adQuery
    adRun()
    return
  }
  const adm = t.closest("[data-ad-mode-set]")
  if (adm) {
    adMode = adm.dataset.adModeSet
    $$("[data-ad-mode-set]").forEach((b) =>
      b.classList.toggle("on", b.dataset.adModeSet === adMode)
    )
    adRun()
    return
  }

  /* generic copy buttons in code blocks */
  if (t.classList.contains("copy-btn")) {
    const pre = t.closest(".code-wrap").querySelector("pre")
    copyText(pre.innerText, t)
    return
  }

  /* component card expand/collapse (lazy render) */
  const hdr = t.closest(".comp-card-header")
  if (hdr && !t.closest("[data-goto-req]")) {
    const card = hdr.closest(".comp-card")
    const id = card.dataset.comp
    if (id) {
      if (!card.classList.contains("open"))
        card.querySelector(".comp-body").innerHTML = buildCompBody(
          COMPONENTS.find((c) => c.id === id)
        )
      card.classList.toggle("open")
    }
    return
  }

  /* card-level tab switches */
  const ptab = t.closest(".ptab[data-tab]")
  if (ptab) {
    const card = ptab.closest(".comp-card")
    card.querySelectorAll(".ptab").forEach((x) => x.classList.remove("active"))
    ptab.classList.add("active")
    card
      .querySelectorAll(".pipeline-panel[data-panel]")
      .forEach((p) =>
        p.classList.toggle("active", p.dataset.panel === ptab.dataset.tab)
      )
    return
  }

  /* framework tab inside Code panel → regenerate snippet on demand */
  const fwt = t.closest(".fw-tab")
  if (fwt) {
    const compId = fwt.dataset.comp
    const c = COMPONENTS.find((x) => x.id === compId)
    fwt.parentElement
      .querySelectorAll(".fw-tab")
      .forEach((x) => x.classList.remove("on"))
    fwt.classList.add("on")
    const fw = fwByKey(fwt.dataset.fw)
    const panel = fwt
      .closest(".pipeline-panel")
      .querySelector("[data-fw-panel]")
    panel.innerHTML = codeBlock(
      compId + " · " + fw.name,
      fw.kind === "universal" ? "css" : "code",
      snippetFor(c, fwt.dataset.fw)
    )
    return
  }

  /* filters */
  const cf = t.closest("[data-compfilter]")
  if (cf) {
    compFilter = cf.dataset.compfilter
    renderComponents()
    return
  }
  const tf = t.closest("[data-tokfilter]")
  if (tf) {
    tokenFilter = tf.dataset.tokfilter
    renderTokens()
    return
  }

  /* lint playground presets */
  const lp = t.closest("[data-lint-preset]")
  if (lp) {
    $$("#view [data-lint-preset]").forEach((x) => x.classList.remove("on"))
    lp.classList.add("on")
    const ed = $("#lintEditor")
    if (ed) {
      ed.value = LINT_PRESETS[+lp.dataset.lintPreset].code
      lintRun()
    }
    return
  }

  /* lint setup tabs */
  const ll = t.closest("[data-lint-linter]")
  if (ll) {
    lintLinter = ll.dataset.lintLinter
    syncLintTabs()
    return
  }
  const lf = t.closest("[data-lint-fw]")
  if (lf) {
    lintFw = lf.dataset.lintFw
    syncLintTabs()
    return
  }

  /* comment reactions — toggle +1 on your vote */
  const react = t.closest(".comment-reaction")
  if (react) {
    const n = parseInt((react.textContent.match(/\d+/) || [0])[0], 10)
    const active = react.classList.toggle("reacted")
    react.textContent = "👍 " + (active ? n + 1 : Math.max(0, n - 1))
    return
  }

  /* comment type selector + submit */
  if (t.classList.contains("cr-type")) {
    t.closest(".cr-type-row")
      .querySelectorAll(".cr-type")
      .forEach((x) => x.classList.remove("selected"))
    t.classList.add("selected")
    return
  }
  if (t.classList.contains("submit-comment")) {
    const compId = t.dataset.comp
    const wrap = t.closest(".comment-input-right")
    const ta = wrap.querySelector(".comment-textarea")
    const type = wrap.querySelector(".cr-type.selected").textContent
    const text = ta.value.trim()
    if (!text) {
      ta.focus()
      return
    }
    ;(state.comments[compId] ||= []).push({
      a: "Lulamile M.",
      ini: "LM",
      col: "var(--accent)",
      bg: "var(--accent-dim)",
      time: "just now",
      type,
      where: "",
      text,
      reactions: 0,
    })
    persist()
    delete compBodyCache[compId] // invalidate cache so the new comment renders
    const card = $("#comp-" + compId) // re-render the open card body in place
    card.querySelector(".comp-body").innerHTML = buildCompBody(
      COMPONENTS.find((c) => c.id === compId)
    )
    toast("Comment posted on " + compId, type, "✎")
    return
  }

  /* requests view */
  if (t.closest("[data-goto-req]")) {
    go("requests")
    setTimeout(() => {
      const el = $("#reqTitle")
      if (el) {
        el.value = t.closest("[data-goto-req]").dataset.gotoReq
        el.focus()
      }
    }, 90)
    return
  }
  const ri = t.closest(".req-item[data-req]")
  if (ri) {
    selectedReq = ri.dataset.req
    renderRequests()
    return
  }
  if (t.closest("#reqSubmit")) {
    const title = $("#reqTitle").value.trim()
    const desc = $("#reqDesc").value.trim()
    if (!title) {
      $("#reqTitle").focus()
      return
    }
    const person = PEOPLE[state.roleIdx]
    const nr = {
      id: "req-" + Date.now(),
      compId: null,
      title,
      by: person.name.split(" (")[0],
      byRole: person.role,
      time: "just now",
      status: "requested",
      votes: 1,
      designAttached: false,
      desc:
        desc ||
        "Requested from the in-app board — details to follow in the thread.",
      thread: [
        {
          a: person.name.split(" (")[0],
          ini: person.ini,
          role: person.role,
          col: person.col,
          bg: person.bg,
          time: "just now",
          text: desc || "Requesting " + title + " — see board for context.",
        },
      ],
    }
    state.requests.unshift(nr)
    selectedReq = nr.id
    persist()
    renderRequests()
    renderSidebar()
    toast(
      "Request filed: " + title,
      "designer notified · status: requested",
      "✉"
    )
    return
  }
  if (t.closest("#reqFileIssue")) {
    const title = $("#reqTitle").value.trim()
    const desc = $("#reqDesc").value.trim()
    const body =
      (desc ? desc + "\n\n" : "") + "— filed from the DesignOps request board"
    window.open(
      githubIssueURL(
        conn.githubRepo,
        "[request] " + (title || "Untitled component request"),
        body
      ),
      "_blank",
      "noopener"
    )
    return
  }
  const vote = t.closest("[data-vote]")
  if (vote) {
    const r = state.requests.find((x) => x.id === vote.dataset.vote)
    r.votes = (r.votes || 0) + 1
    persist()
    renderRequests()
    return
  }
  const sd = t.closest("[data-start-design]")
  if (sd) {
    startDesign(sd.dataset.startDesign)
    return
  }
  const sh = t.closest("[data-ship]")
  if (sh) {
    approveAndShip(sh.dataset.ship)
    return
  }
  const oc = t.closest("[data-open-comp]")
  if (oc && oc.dataset.openComp) {
    go("components")
    setTimeout(() => openComp(oc.dataset.openComp), 90)
    return
  }
  const send = t.closest("[data-send-chat]")
  if (send) {
    const r = state.requests.find((x) => x.id === send.dataset.sendChat)
    const person = PEOPLE[state.roleIdx]
    const input = $("#chatInput")
    const text = input.value.trim()
    if (!text) {
      input.focus()
      return
    }
    r.thread.push({
      a: person.name.split(" (")[0],
      ini: person.ini,
      role: person.role,
      col: person.col,
      bg: person.bg,
      time: "just now",
      text,
    })
    persist()
    renderRequests()
    setTimeout(() => {
      const th = $("#chatThread")
      if (th) th.scrollTop = th.scrollHeight
    }, 50)
    return
  }

  /* live connections */
  if (t.closest("[data-conn-github-save]")) {
    const v =
      $("#connGithubRepo").value.trim() || CONNECTIONS_DEFAULTS.githubRepo
    conn.githubRepo = v
    conn.githubCommits = null
    conn.githubCheckedAt = null
    saveConn()
    liveActivityCache = { at: 0, items: null }
    toast(
      "GitHub repo set: " + v,
      "overview activity loads live commits from here",
      "◉"
    )
    renderIntegrations()
    return
  }
  if (t.closest("[data-conn-figma-test]")) {
    figmaConnect()
    return
  }
  if (t.closest("[data-conn-figma-clear]")) {
    conn.figmaToken = ""
    conn.figmaFileKey = ""
    conn.figma = null
    saveConn()
    toast("Figma disconnected", "token cleared from this browser", "◈")
    renderIntegrations()
    return
  }
  if (t.closest("[data-conn-sb-save]")) {
    conn.storybookUrl = $("#connStorybookUrl").value.trim().replace(/\/+$/, "")
    saveConn()
    toast(
      conn.storybookUrl ? "Storybook linked" : "Storybook link cleared",
      conn.storybookUrl
        ? "story cards now deep-link to it"
        : "cards open in-app again",
      "⬢"
    )
    renderIntegrations()
    return
  }
  /* guide nav scroll */
  const gn = t.closest("[data-guide]")
  if (gn) {
    $$(".guide-nav a").forEach((a) => a.classList.remove("on"))
    gn.classList.add("on")
    const el = $("#guide-" + gn.dataset.guide)
    if (el) el.scrollIntoView({ behavior: "smooth" })
    return
  }
})

/* role select */
document.addEventListener("change", (e) => {
  if (e.target.id === "roleSelect") {
    state.roleIdx = +e.target.value
    persist()
    renderRequests()
  }
})

/* chat: Enter sends */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && demo.active) demoEnd()
  if (e.target.id === "chatInput" && e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    const btn = document.querySelector("[data-send-chat]")
    if (btn) btn.click()
  }
})

/* search wiring */
document.addEventListener("DOMContentLoaded", () => {
  const input = $("#globalSearch")
  input.addEventListener("input", () => runSearch(input.value))
  input.addEventListener("focus", () => {
    if (input.value.trim()) $("#searchResults").classList.add("show")
  })
  input.addEventListener("blur", () =>
    setTimeout(() => $("#searchResults").classList.remove("show"), 180)
  )
  render()
})

window.addEventListener("hashchange", render)
