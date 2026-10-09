/**
 * DesignOps · component library for the demo generator
 * ─────────────────────────────────────────────────────────────
 * Parameterised builders for the eight shipped DesignOps components:
 * button, input, badge, card, alert, avatar, data-table, toast.
 *
 * The demo pages are COMPOSED from these, not from hand-written class
 * strings — the nav uses button(), the hero uses badge() + input() +
 * button() + avatarGroup(), features and pricing use card(). So the
 * components are on screen from the first viewport, which is the whole
 * point of shipping a component library.
 *
 * The classes mirror the token references in assets/data.js (COMPONENTS).
 * Where a variant declares `background: var(--color-primary-900)`, this
 * emits `bg-primary-900` — same declaration, but now the linter can see
 * it. Token-only throughout: no raw palette, no arbitrary values.
 */

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/* ── shared scales ──────────────────────────────────────────── */

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-opacity"

const BUTTON_VARIANT = {
  primary: "bg-primary-900 text-neutral-900 hover:bg-primary-800",
  secondary: "border border-neutral-600 text-ink-default hover:bg-neutral-700",
  destructive: "bg-danger-600 text-neutral-900 hover:bg-danger-600",
  ghost: "text-ink-muted hover:bg-neutral-700",
}

const BUTTON_SIZE = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
}

const BADGE_VARIANT = {
  success: "bg-success-600 text-neutral-900",
  warning: "bg-warning-600 text-neutral-900",
  danger: "bg-danger-600 text-neutral-900",
  info: "bg-info-600 text-neutral-900",
  neutral: "bg-neutral-700 text-ink-muted",
}

/* ── Button ─────────────────────────────────────────────────── */

export function button(label, opts = {}) {
  const { variant = "primary", size = "md", href, disabled, extra = "" } = opts
  const cls = [
    BUTTON_BASE,
    BUTTON_VARIANT[variant] || BUTTON_VARIANT.primary,
    BUTTON_SIZE[size] || BUTTON_SIZE.md,
    disabled ? "opacity-50" : "",
    extra,
  ]
    .filter(Boolean)
    .join(" ")
  if (href) {
    return `<a class="${cls}" href="${esc(href)}"${disabled ? ' aria-disabled="true"' : ""}>${esc(
      label
    )}</a>`
  }
  return `<button class="${cls}" type="button"${
    disabled ? " disabled=\"\"" : ""
  }>${esc(label)}</button>`
}

/* ── Input ──────────────────────────────────────────────────── */

const FIELD =
  "w-full rounded-md border bg-neutral-800 px-3 py-2 text-sm text-ink-default placeholder:text-ink-subtle"

export function input(opts = {}) {
  const {
    id = "field",
    label,
    type = "text",
    placeholder = "",
    value = "",
    hint = "",
    error = "",
    disabled = false,
    required = false,
    extra = "",
  } = opts
  const border = error ? "border-danger-600" : "border-neutral-600"
  const state = disabled ? " opacity-50" : ""
  const describedBy = error || hint ? ` aria-describedby="${esc(id)}-note"` : ""
  return `<div class="${extra}">
  ${
    label
      ? `<label class="block text-xs font-medium text-ink-muted mb-1" for="${esc(
          id
        )}">${esc(label)}${required ? " *" : ""}</label>`
      : ""
  }
  <input class="${FIELD} ${border}${state}" id="${esc(id)}" type="${esc(type)}"${
    placeholder ? ` placeholder="${esc(placeholder)}"` : ""
  }${value ? ` value="${esc(value)}"` : ""}${disabled ? " disabled=\"\"" : ""}${
    required ? " required=\"\"" : ""
  }${describedBy}/>
  ${
    error || hint
      ? `<p class="mt-1 text-xs ${
          error ? "text-danger-600" : "text-ink-subtle"
        }" id="${esc(id)}-note">${esc(error || hint)}</p>`
      : ""
  }
</div>`
}

/* ── Badge ──────────────────────────────────────────────────── */

export function badge(text, opts = {}) {
  const { variant = "neutral", dot = false, extra = "" } = opts
  // The dot sits on top of the pill, so it has to be the page background
  // colour to read against it — except on the neutral pill, where the
  // accent is what reads. (Using the pill's own colour made it invisible.)
  const dotColor =
    variant === "neutral" ? "bg-primary-900" : "bg-neutral-900"
  return `<span class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
    BADGE_VARIANT[variant] || BADGE_VARIANT.neutral
  } ${extra}">${
    dot ? `<span class="h-1.5 w-1.5 rounded-full ${dotColor}"></span>` : ""
  }${esc(text)}</span>`
}

/* ── Card ───────────────────────────────────────────────────── */

export function card(inner, opts = {}) {
  const { variant = "elevated", extra = "" } = opts
  const skin =
    variant === "outlined"
      ? "border border-neutral-600"
      : "border border-neutral-700 bg-neutral-800 shadow-md"
  return `<article class="rounded-lg ${skin} ${extra}">${inner}</article>`
}

/* ── Alert ──────────────────────────────────────────────────── */

const ALERT_BORDER = {
  success: "border-success-600",
  warning: "border-warning-600",
  error: "border-danger-600",
  info: "border-info-600",
}

const ALERT_ICON = {
  success: "M4 8.5l2.5 2.5L12 5.5",
  warning: "M8 5v4M8 11.5h.01",
  error: "M6 6l4 4M10 6l-4 4",
  info: "M8 7.5v4M8 5h.01",
}

export function alert(title, body, opts = {}) {
  const { variant = "info", dismissible = true, extra = "" } = opts
  return `<div class="flex items-start gap-3 rounded-md border ${
    ALERT_BORDER[variant] || ALERT_BORDER.info
  } bg-neutral-800 p-4 ${extra}" role="status">
  <svg class="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/>
    <path d="${ALERT_ICON[variant] || ALERT_ICON.info}" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <div class="min-w-0 flex-1">
    <p class="text-sm font-medium text-ink-default">${esc(title)}</p>
    <p class="mt-1 text-sm text-ink-muted">${esc(body)}</p>
  </div>
  ${
    dismissible
      ? '<button class="shrink-0 rounded-md px-2 py-1 text-xs text-ink-subtle hover:bg-neutral-700" type="button" aria-label="Dismiss">✕</button>'
      : ""
  }
</div>`
}

/* ── Avatar ─────────────────────────────────────────────────── */

const AVATAR_SIZE = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
}

export function avatar(initials, opts = {}) {
  const { size = "md", name = "", ring = false } = opts
  const cls = [
    "inline-flex items-center justify-center rounded-full bg-primary-900 font-heading text-neutral-900",
    AVATAR_SIZE[size] || AVATAR_SIZE.md,
    ring ? "border-2 border-neutral-900" : "",
  ]
    .filter(Boolean)
    .join(" ")
  return `<span class="${cls}"${
    name ? ` title="${esc(name)}"` : ""
  }>${esc(initials)}</span>`
}

/** Overlapping group with a +N overflow chip. */
export function avatarGroup(people, opts = {}) {
  const { size = "md", overflow = 0 } = opts
  const dims = AVATAR_SIZE[size] || AVATAR_SIZE.md
  const items = people.map(([initials, name], i) => {
    const cls = [
      "inline-flex items-center justify-center rounded-full",
      "bg-primary-900 font-heading text-neutral-900",
      "border-2 border-neutral-900",
      dims,
      i === 0 ? "" : "-ml-2",
    ]
      .filter(Boolean)
      .join(" ")
    return `<span class="${cls}"${
      name ? ` title="${esc(name)}"` : ""
    }>${esc(initials)}</span>`
  })
  if (overflow > 0) {
    items.push(
      `<span class="-ml-2 inline-flex ${dims} items-center justify-center rounded-full border-2 border-neutral-900 bg-neutral-700 text-ink-muted">+${overflow}</span>`
    )
  }
  return items.join("\n    ")
}

/* ── Data table ─────────────────────────────────────────────── */

export function dataTable(opts = {}) {
  const { caption = "Data table", columns = [], rows = [] } = opts
  const th = "px-4 py-2 text-left text-xs font-medium text-ink-subtle"
  const td = "px-4 py-3 text-sm text-ink-muted"
  return `<div class="overflow-hidden rounded-lg border border-neutral-700">
  <table class="w-full border-collapse">
    <caption class="sr-only">${esc(caption)}</caption>
    <thead class="bg-neutral-800">
      <tr>
        ${columns
          .map((col) => `<th class="${th}" scope="col">${esc(col)}</th>`)
          .join("\n        ")}
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (cells) => `<tr class="border-t border-neutral-700">
        ${cells
          .map((cell) =>
            cell && cell.badge
              ? `<td class="${td}">${badge(cell.text, {
                  variant: cell.badge,
                  dot: true,
                })}</td>`
              : `<td class="${td}${
                  cell && cell.mono ? " font-mono text-ink-default" : ""
                }">${cell && cell.text !== undefined ? esc(cell.text) : esc(cell)}</td>`
          )
          .join("\n        ")}
      </tr>`
        )
        .join("\n      ")}
    </tbody>
  </table>
</div>`
}

/* ── Toast ──────────────────────────────────────────────────── */

export function toast(title, body, opts = {}) {
  const { variant = "info", action = "" } = opts
  return `<div class="flex items-center gap-3 rounded-md border ${
    ALERT_BORDER[variant] || ALERT_BORDER.info
  } bg-neutral-800 p-4 shadow-lg">
  <div class="min-w-0 flex-1">
    <p class="text-sm font-medium text-ink-default">${esc(title)}</p>
    <p class="mt-0.5 text-xs text-ink-muted">${esc(body)}</p>
  </div>
  ${
    action
      ? `<button class="shrink-0 rounded-md px-2 py-1 text-xs text-primary-900 hover:bg-neutral-700" type="button">${esc(
          action
        )}</button>`
      : ""
  }
</div>`
}

/* ── the labelled showcase, built from the same primitives ──── */

export function componentShowcase() {
  const parts = [
    [
      "Button",
      "Four variants, three sizes, plus the disabled state.",
      () => `<div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-3">
      ${button("Primary", { variant: "primary" })}
      ${button("Secondary", { variant: "secondary" })}
      ${button("Destructive", { variant: "destructive" })}
      ${button("Ghost", { variant: "ghost" })}
      ${button("Disabled", { variant: "primary", disabled: true })}
    </div>
    <div class="flex flex-wrap items-center gap-3">
      ${button("Small", { size: "sm" })}
      ${button("Medium", { size: "md" })}
      ${button("Large", { size: "lg" })}
    </div>
  </div>`,
    ],
    [
      "Input Field",
      "Labels, hints, the error state and a disabled field.",
      () => `<div class="grid gap-4 md:grid-cols-2">
    ${input({
      id: "cs-email",
      label: "Email",
      type: "email",
      placeholder: "you@example.com",
      hint: "We only use this to send the receipt.",
    })}
    ${input({
      id: "cs-error",
      label: "Card number",
      value: "4242 4242",
      error: "That card number is not valid.",
    })}
    ${input({
      id: "cs-disabled",
      label: "Promo code",
      placeholder: "Not available",
      disabled: true,
    })}
    ${input({
      id: "cs-required",
      label: "Workspace name",
      placeholder: "Acme Inc",
      required: true,
    })}
  </div>`,
    ],
    [
      "Badge / Chip",
      "Five semantic variants, with an optional leading dot.",
      () => `<div class="flex flex-wrap items-center gap-2">
    ${badge("Active", { variant: "success" })}
    ${badge("Pending", { variant: "warning" })}
    ${badge("Failed", { variant: "danger" })}
    ${badge("Syncing", { variant: "info" })}
    ${badge("Draft", { variant: "neutral" })}
    ${badge("With dot", { variant: "neutral", dot: true })}
  </div>`,
    ],
    [
      "Card",
      "Elevated and outlined, sharing one radius and space scale.",
      () => `<div class="grid gap-4 md:grid-cols-2">
    ${card(
      `<h4 class="font-heading text-base font-semibold text-ink-default">Elevated</h4>
      <p class="mt-2 text-sm text-ink-muted">Uses the system's shadow scale and the raised surface token.</p>`,
      { variant: "elevated", extra: "p-6" }
    )}
    ${card(
      `<h4 class="font-heading text-base font-semibold text-ink-default">Outlined</h4>
      <p class="mt-2 text-sm text-ink-muted">Same spacing and radius, no fill, a visible edge.</p>`,
      { variant: "outlined", extra: "p-6" }
    )}
  </div>`,
    ],
    [
      "Alert",
      "Dismissible, four tones, icon and action slot.",
      () => `<div class="flex flex-col gap-3">
    ${alert("Payment received", "Your invoice for this month has been settled.", {
      variant: "success",
    })}
    ${alert("Card expiring", "Your card expires at the end of next month.", {
      variant: "warning",
    })}
    ${alert("Sync failed", "We could not reach the billing provider. Retrying.", {
      variant: "error",
    })}
    ${alert(
      "Scheduled maintenance",
      "Read-only mode on Sunday, 02:00 to 04:00 UTC.",
      { variant: "info" }
    )}
  </div>`,
    ],
    [
      "Avatar",
      "Three sizes, initials fallback and a stacked group.",
      () => `<div class="flex flex-col gap-5">
    <div class="flex items-center gap-3">
      ${avatar("AR", { size: "sm", name: "Amelia R." })}
      ${avatar("AR", { size: "md", name: "Amelia R." })}
      ${avatar("AR", { size: "lg", name: "Amelia R." })}
    </div>
    <div class="flex items-center">
      ${avatarGroup(
        [
          ["AR", "Amelia R."],
          ["TK", "Thabo K."],
          ["MS", "Marta S."],
          ["JB", "Jonas B."],
        ],
        { overflow: 6 }
      )}
    </div>
  </div>`,
    ],
    [
      "Data Table",
      "Badge cells, monospace identifiers and a footer.",
      () =>
        dataTable({
          caption: "Recent invoices",
          columns: ["Invoice", "Customer", "Amount", "Status"],
          rows: [
            [
              { text: "INV-2041", mono: true },
              "Northwind Ltd",
              "$4,800",
              { text: "Paid", badge: "success" },
            ],
            [
              { text: "INV-2040", mono: true },
              "Kestrel Group",
              "$1,250",
              { text: "Pending", badge: "warning" },
            ],
            [
              { text: "INV-2039", mono: true },
              "Arbor Systems",
              "$9,400",
              { text: "Failed", badge: "danger" },
            ],
            [
              { text: "INV-2038", mono: true },
              "Vela Digital",
              "$640",
              { text: "Syncing", badge: "info" },
            ],
          ],
        }),
    ],
    [
      "Toast",
      "Stacked snackbars with an action.",
      () => `<div class="flex flex-col gap-3">
    ${toast("Changes saved", "Your settings are live.", {
      variant: "success",
      action: "Undo",
    })}
    ${toast("Upload failed", "The file was larger than 25 MB.", {
      variant: "error",
      action: "Retry",
    })}
    ${toast("New version ready", "Refresh to update.", { variant: "info" })}
  </div>`,
    ],
  ]

  return `<section id="components" class="mx-auto max-w-6xl px-6 py-20">
  <h2 class="font-heading text-center text-3xl font-bold text-ink-default">Every component, in this system's tokens</h2>
  <p class="mx-auto mt-4 max-w-2xl text-center text-sm text-ink-muted">The eight components shipped by DesignOps, rendered with this page's own tokens. They are not a bolted-on appendix — the page above is built from them, and this is the full set with every variant.</p>
  <div class="mt-12 grid gap-6 lg:grid-cols-2">
    ${parts
      .map(
        ([name, blurb, render]) => `${card(
          `<h3 class="font-heading text-base font-semibold text-ink-default">${esc(
            name
          )}</h3>
      <p class="mb-5 mt-1 text-sm text-ink-muted">${esc(blurb)}</p>
      ${render()}`,
          { variant: "elevated", extra: "p-6" }
        )}`
      )
      .join("\n    ")}
  </div>
</section>`
}
