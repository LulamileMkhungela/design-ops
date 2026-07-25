/* ═══════════════════════════════════════════════════════════════
   DESIGNOPS · data layer
   Author: Lulamile Mkhungela
   Everything the dashboard renders derives from the objects below.
   Tokens mirror tokens/tokens.json (the Figma Variables export);
   components carry a style schema that codegen.js turns into real
   code for every framework target.
   ═══════════════════════════════════════════════════════════════ */

/* ── 1 · TOKENS ────────────────────────────────────────────────
   `f` is the Figma variable path. css/js/scss/tw names are derived
   by the naming rule, exactly like tools/ship.mjs does for dist/. */
const TOKENS = [
  { f: 'color/primary/50',  v: '#f9ffe0', t: 'color', group: 'color' },
  { f: 'color/primary/800', v: '#d5ef48', t: 'color', group: 'color' },
  { f: 'color/primary/900', v: '#e8ff5a', t: 'color', group: 'color' },
  { f: 'color/neutral/900', v: '#0d0d0b', t: 'color', group: 'color' },
  { f: 'color/neutral/800', v: '#141412', t: 'color', group: 'color' },
  { f: 'color/neutral/700', v: '#1e1e1b', t: 'color', group: 'color' },
  { f: 'color/neutral/600', v: '#2a2a26', t: 'color', group: 'color' },
  { f: 'color/ink/default', v: '#f0ede6', t: 'color', group: 'color' },
  { f: 'color/ink/muted',   v: 'rgba(240,237,230,.7)',  t: 'color', group: 'color' },
  { f: 'color/ink/subtle',  v: 'rgba(240,237,230,.45)', t: 'color', group: 'color' },
  { f: 'color/danger/600',  v: '#dd4040', t: 'color', group: 'color' },
  { f: 'color/success/600', v: '#4ade80', t: 'color', group: 'color' },
  { f: 'color/warning/600', v: '#fbbf24', t: 'color', group: 'color' },
  { f: 'color/info/600',    v: '#60a5fa', t: 'color', group: 'color' },

  { f: 'space/1', v: '4px',  t: 'dimension', group: 'spacing' },
  { f: 'space/2', v: '8px',  t: 'dimension', group: 'spacing' },
  { f: 'space/3', v: '12px', t: 'dimension', group: 'spacing' },
  { f: 'space/4', v: '16px', t: 'dimension', group: 'spacing' },
  { f: 'space/5', v: '20px', t: 'dimension', group: 'spacing' },
  { f: 'space/6', v: '24px', t: 'dimension', group: 'spacing' },
  { f: 'space/7', v: '32px', t: 'dimension', group: 'spacing' },
  { f: 'space/8', v: '40px', t: 'dimension', group: 'spacing' },

  { f: 'radius/sm',   v: '4px',    t: 'dimension', group: 'radius' },
  { f: 'radius/md',   v: '8px',    t: 'dimension', group: 'radius' },
  { f: 'radius/lg',   v: '12px',   t: 'dimension', group: 'radius' },
  { f: 'radius/xl',   v: '16px',   t: 'dimension', group: 'radius' },
  { f: 'radius/full', v: '9999px', t: 'dimension', group: 'radius' },

  { f: 'typography/size/xs',   v: '0.75rem',  t: 'dimension',  group: 'typography' },
  { f: 'typography/size/sm',   v: '0.875rem', t: 'dimension',  group: 'typography' },
  { f: 'typography/size/base', v: '1rem',     t: 'dimension',  group: 'typography' },
  { f: 'typography/size/lg',   v: '1.125rem', t: 'dimension',  group: 'typography' },
  { f: 'typography/size/xl',   v: '1.5rem',   t: 'dimension',  group: 'typography' },
  { f: 'typography/weight/regular', v: '400', t: 'fontWeight', group: 'typography' },
  { f: 'typography/weight/medium',  v: '600', t: 'fontWeight', group: 'typography' },
  { f: 'typography/weight/bold',    v: '700', t: 'fontWeight', group: 'typography' },

  { f: 'shadow/sm', v: '0 1px 4px rgba(0,0,0,.2)',  t: 'shadow', group: 'shadow' },
  { f: 'shadow/md', v: '0 4px 16px rgba(0,0,0,.3)', t: 'shadow', group: 'shadow' },
  { f: 'shadow/lg', v: '0 8px 32px rgba(0,0,0,.4)', t: 'shadow', group: 'shadow' },

  { f: 'motion/duration/fast', v: '150ms', t: 'duration', group: 'motion' },
  { f: 'motion/duration/base', v: '220ms', t: 'duration', group: 'motion' },
  { f: 'motion/easing/out',    v: 'cubic-bezier(.22,1,.36,1)', t: 'cubicBezier', group: 'motion' },
];

/* Derive every consumer name for a token (single naming rule). */
const TOK = {};
TOKENS.forEach((tok) => {
  const parts = tok.f.split('/');
  tok.css  = '--' + parts.join('-');                                   // --color-primary-900
  tok.scss = '$' + parts.join('-');                                    // $color-primary-900
  tok.js   = parts.map((s, i) => (i ? s[0].toUpperCase() + s.slice(1) : s)).join(''); // colorPrimary900
  tok.tw   = parts.slice(1).join('-');                                 // primary-900 / 4 / md
  TOK[tok.f] = tok;
});
const tok = (figmaPath) => TOK[figmaPath];          // lookup helper
const cssVar = (figmaPath) => `var(${TOK[figmaPath].css})`;

/* ── 2 · PIPELINE STAGES ─────────────────────────────────────── */
const STAGES = [
  { key: 'figma',     name: 'Figma',    color: 'var(--figma)' },
  { key: 'tokens',    name: 'Tokens',   color: 'var(--token)' },
  { key: 'build',     name: 'Transform', color: 'var(--stdict)' },
  { key: 'frameworks', name: 'Frameworks', color: 'var(--accent)' },
  { key: 'storybook', name: 'Storybook', color: 'var(--storybook)' },
];

/* ── 3 · FRAMEWORK TARGETS ───────────────────────────────────── */
const FRAMEWORKS = [
  { key: 'react',    name: 'React',         kind: 'framework',      logo: 'Re', lc: '#61dafb', install: 'npm i @designops/tokens @designops/react' },
  { key: 'next',     name: 'Next.js',       kind: 'meta-framework', logo: 'Nx', lc: '#ffffff', install: 'npm i @designops/tokens @designops/react' },
  { key: 'vue',      name: 'Vue',           kind: 'framework',      logo: 'Vu', lc: '#42d392', install: 'npm i @designops/tokens @designops/vue' },
  { key: 'nuxt',     name: 'Nuxt',          kind: 'meta-framework', logo: 'Nu', lc: '#00dc82', install: 'npx nuxi module add @designops/nuxt' },
  { key: 'svelte',   name: 'Svelte / SvelteKit', kind: 'framework', logo: 'Sv', lc: '#ff3e00', install: 'npm i @designops/tokens @designops/svelte' },
  { key: 'angular',  name: 'Angular',       kind: 'framework',      logo: 'An', lc: '#dd4040', install: 'npm i @designops/tokens @designops/angular' },
  { key: 'remix',    name: 'Remix',         kind: 'meta-framework', logo: 'Rm', lc: '#8ab4f8', install: 'npm i @designops/tokens @designops/react' },
  { key: 'astro',    name: 'Astro',         kind: 'meta-framework', logo: 'As', lc: '#bc52ee', install: 'npx astro add @designops/astro' },
  { key: 'ionic',    name: 'Ionic',         kind: 'framework',      logo: 'Io', lc: '#498aff', install: 'npm i @designops/tokens @designops/ionic' },
  { key: 'mui',      name: 'MUI · Material UI', kind: 'ui library', logo: 'Mu', lc: '#00b0ff', install: 'npm i @designops/tokens @designops/mui' },
  { key: 'tailwind', name: 'Tailwind CSS',  kind: 'css framework',  logo: 'Tw', lc: '#38bdf8', install: 'npm i @designops/tokens-tailwind' },
  { key: 'rn',       name: 'React Native',  kind: 'mobile',         logo: 'Rn', lc: '#61dafb', install: 'npm i @designops/native' },
  { key: 'css',      name: 'Any stack · plain CSS', kind: 'universal', logo: '{}', lc: '#e8ff5a', install: '<link rel="stylesheet" href="https://cdn.designops.dev/tokens@3/tokens.css">' },
  { key: 'webc',     name: 'Web Components', kind: 'universal',     logo: 'Wc', lc: '#34d399', install: 'npm i @designops/elements' },
];
const fwByKey = (k) => FRAMEWORKS.find((f) => f.key === k);

/* ── 4 · COMPONENTS ────────────────────────────────────────────
   Schema-driven: `css.base/variants/modifiers` are the design, and
   codegen.js emits real framework code from them. Element + props
   drive the markup each generator produces. statuses: ready |
   review | waiting | missing. */
const COMPONENTS = [
  {
    id: 'button', name: 'Button', tag: 'ds-button', cls: 'ds-btn', element: 'button',
    version: '2.1.0', figmaPath: 'Components / Button', stories: 9,
    status: { figma: 'ready', tokens: 'ready', build: 'ready', frameworks: 'ready', storybook: 'ready' },
    subs: { figma: '4 variants · 3 sizes', tokens: '6 tokens exported', build: 'CSS + TS generated', frameworks: '14/14 targets live', storybook: '9 stories · docs current' },
    desc: 'Trigger actions and submits. All color, spacing, radius and weight values are token-referenced; nothing is hard-coded.',
    props: [
      { n: 'variant', t: "'primary' | 'secondary' | 'destructive' | 'ghost'", d: "'primary'", figma: 'variant' },
      { n: 'size',    t: "'sm' | 'md' | 'lg'", d: "'md'", figma: 'size' },
      { n: 'disabled', t: 'boolean', d: 'false', figma: 'disabled' },
      { n: 'loading',  t: 'boolean', d: 'false', figma: 'loading' },
    ],
    spec: [
      { prop: 'background (primary)', token: 'color/primary/900' },
      { prop: 'background (destructive)', token: 'color/danger/600' },
      { prop: 'text color (on primary)', token: 'color/neutral/900' },
      { prop: 'padding block (md)', token: 'space/2' },
      { prop: 'padding inline (md)', token: 'space/4' },
      { prop: 'corner radius', token: 'radius/md' },
      { prop: 'label weight', token: 'typography/weight/medium' },
      { prop: 'label size (md)', token: 'typography/size/base' },
    ],
    tokensUsed: ['color/primary/900', 'color/primary/800', 'color/danger/600', 'color/neutral/900', 'space/2', 'space/4', 'radius/md', 'typography/weight/medium'],
    css: {
      base: [['display', 'inline-flex'], ['align-items', 'center'], ['gap', cssVar('space/2')], ['padding', `${cssVar('space/2')} ${cssVar('space/4')}`], ['border', 'none'], ['border-radius', cssVar('radius/md')], ['font-weight', cssVar('typography/weight/medium')], ['cursor', 'pointer'], ['transition', `opacity ${cssVar('motion/duration/fast')}`]],
      variants: {
        primary:     [['background', cssVar('color/primary/900')], ['color', cssVar('color/neutral/900')]],
        secondary:   [['background', 'transparent'], ['color', cssVar('color/ink/default')], ['border', '1.5px solid rgba(255,255,255,.2)']],
        destructive: [['background', cssVar('color/danger/600')], ['color', '#ffffff']],
        ghost:       [['background', 'transparent'], ['color', cssVar('color/ink/muted')]],
      },
      modifiers: {
        sm: [['padding', `${cssVar('space/1')} ${cssVar('space/3')}`], ['font-size', cssVar('typography/size/sm')]],
        lg: [['padding', `${cssVar('space/3')} ${cssVar('space/6')}`], ['font-size', cssVar('typography/size/lg')]],
      },
    },
    preview: `
      <div class="preview-row"><span class="preview-label">Variants</span>
        <span class="prev-btn prev-btn-primary">Primary</span>
        <span class="prev-btn prev-btn-secondary">Secondary</span>
        <span class="prev-btn prev-btn-destructive">Destructive</span>
        <span class="prev-btn prev-btn-ghost">Ghost</span>
      </div>
      <div class="preview-row"><span class="preview-label">Sizes</span>
        <span class="prev-btn prev-btn-primary prev-btn-sm">Small</span>
        <span class="prev-btn prev-btn-primary">Medium</span>
        <span class="prev-btn prev-btn-primary prev-btn-lg">Large</span>
      </div>
      <div class="preview-row"><span class="preview-label">States</span>
        <span class="prev-btn prev-btn-primary prev-btn-disabled">Disabled</span>
        <span class="prev-btn prev-btn-primary prev-btn-loading">Loading</span>
      </div>`,
    a11y: [
      'Uses a native <code>&lt;button&gt;</code> — keyboard and screen-reader support is free.',
      '<code>aria-busy</code> is set while <code>loading</code> is true and the click handler is suppressed.',
      'Focus ring is visible in both color schemes (tested at 4.5:1+).',
    ],
    usage: {
      do: ['One primary button per view — it owns the main action', 'Use destructive only for irreversible actions', 'Use loading during async submits instead of disabling silently'],
      dont: ['Never hard-code hex colors — always compose variants', 'Don’t place two primary buttons side by side', 'Don’t use ghost for critical actions'],
    },
    comments: [
      { a: 'Thabo M.', ini: 'TM', col: 'var(--figma)', bg: 'var(--figma-dim)', time: '2d ago', type: 'Change request', where: 'Frameworks', text: 'Ghost hover background was missing in the React build — spec says color/primary/50 wash.', reactions: 2 },
      { a: 'Lulamile M.', ini: 'LM', col: 'var(--accent)', bg: 'var(--accent-dim)', time: '1d ago', type: 'Approved', where: 'Frameworks', text: 'Fixed in v2.1.0 — ghost hover now resolves to --color-primary-50 in every target. Storybook updated.', reactions: 1 },
      { a: 'Sipho R.', ini: 'SR', col: 'var(--blue)', bg: 'var(--blue-dim)', time: '5h ago', type: 'Question', where: 'Figma', text: 'Do we need a full-width variant? Onboarding flows need width:100%.', reactions: 3 },
    ],
    /* Release history — every entry is tied to a request, review or token change. */
    history: [
      { v: '2.1.0', date: '22 Jul 2026', type: 'minor', by: 'Lulamile M.', notes: ['Ghost hover now resolves to --color-primary-50 in every target (closes Thabo’s change request)', 'Loading spinner is aria-hidden; click suppressed while loading'] },
      { v: '2.0.0', date: '30 Jun 2026', type: 'major', by: 'Lulamile M.', notes: ['Migrated to tokens v3 palette (primary/800 hover)', 'loading prop promoted from flag to first-class Figma property', 'Codemod shipped for the removed textColor prop'] },
      { v: '1.4.2', date: '18 May 2026', type: 'patch', by: 'Thabo M.', notes: ['Secondary border bumped to 1.5px to hit 3:1 non-text contrast'] },
      { v: '1.0.0', date: '02 Apr 2026', type: 'stable', by: 'Lulamile M.', notes: ['First stable release: 4 variants × 3 sizes across all 14 targets'] },
    ],
  },

  {
    id: 'input', name: 'Input Field', tag: 'ds-field', cls: 'ds-input', element: 'div',
    version: '2.0.3', figmaPath: 'Components / Input Field', stories: 6,
    status: { figma: 'ready', tokens: 'ready', build: 'ready', frameworks: 'ready', storybook: 'ready' },
    subs: { figma: '4 states designed', tokens: 'All tokens exported', build: 'CSS + TS generated', frameworks: '14/14 targets live', storybook: '6 stories · docs current' },
    desc: 'Labelled text input with hint and error messaging. Reactive-forms / v-model / controlled compatible.',
    props: [
      { n: 'label', t: 'string', d: '—', figma: 'label' },
      { n: 'type', t: "'text' | 'email' | 'password' | 'number'", d: "'text'", figma: 'type' },
      { n: 'hint', t: 'string', d: '—', figma: 'hint' },
      { n: 'error', t: 'string', d: '—', figma: 'error' },
      { n: 'disabled', t: 'boolean', d: 'false', figma: 'disabled' },
      { n: 'required', t: 'boolean', d: 'false', figma: 'required' },
    ],
    spec: [
      { prop: 'padding block', token: 'space/2' },
      { prop: 'padding inline', token: 'space/3' },
      { prop: 'corner radius', token: 'radius/md' },
      { prop: 'focus ring', token: 'color/primary/900' },
      { prop: 'error border', token: 'color/danger/600' },
      { prop: 'text size', token: 'typography/size/base' },
    ],
    tokensUsed: ['color/primary/900', 'color/danger/600', 'space/2', 'space/3', 'radius/md', 'typography/size/base'],
    css: {
      base: [['padding', `${cssVar('space/2')} ${cssVar('space/3')}`], ['border-radius', cssVar('radius/md')], ['font-size', cssVar('typography/size/base')], ['border', '1px solid rgba(255,255,255,.12)'], ['background', cssVar('color/neutral/800')], ['color', cssVar('color/ink/default')], ['transition', `border-color ${cssVar('motion/duration/fast')}`], ['outline', 'none']],
      variants: {
        focus: [['border-color', cssVar('color/primary/900')], ['box-shadow', `0 0 0 3px ${cssVar('color/primary/50')}`]],
        error: [['border-color', cssVar('color/danger/600')]],
      },
      modifiers: {},
    },
    preview: `
      <div class="preview-row"><span class="preview-label">Default</span>
        <div class="prev-input"><div class="prev-input-label">Email address</div><div class="prev-input-field prev-input-default">you@example.com</div><div class="prev-input-hint">We’ll never share your email</div></div>
      </div>
      <div class="preview-row"><span class="preview-label">Focused</span>
        <div class="prev-input"><div class="prev-input-label">Password</div><div class="prev-input-field prev-input-focus">••••••••</div></div>
      </div>
      <div class="preview-row"><span class="preview-label">Error</span>
        <div class="prev-input"><div class="prev-input-label">Username</div><div class="prev-input-field prev-input-error">taken_name</div><div class="prev-input-error-msg">Username already taken</div></div>
      </div>
      <div class="preview-row"><span class="preview-label">Disabled</span>
        <div class="prev-input"><div class="prev-input-label">Account ID</div><div class="prev-input-field prev-input-disabled">ACC-00482</div></div>
      </div>`,
    a11y: [
      'Label is a real <code>&lt;label&gt;</code> bound with for/id in every target.',
      'Error text uses role="alert" so screen readers announce it on submit.',
      'aria-invalid mirrors the error state automatically.',
    ],
    usage: {
      do: ['Always pair with a visible label', 'Use hint for format expectations (e.g. “min. 8 characters”)', 'Show errors after submit, not while typing'],
      dont: ['Don’t rely on placeholder as the label', 'Don’t disable without explaining why nearby'],
    },
    comments: [
      { a: 'Nandi K.', ini: 'NK', col: 'var(--amber)', bg: 'var(--amber-dim)', time: '3d ago', type: 'In review', where: 'Figma', text: 'Textarea variant isn’t spec’d yet — request logged for a multiline flag.', reactions: 3 },
    ],
    history: [
      { v: '2.0.3', date: '10 Jul 2026', type: 'patch', by: 'Thabo M.', notes: ['Error text announced via role="alert" on submit in React and Vue targets'] },
      { v: '2.0.0', date: '12 Jun 2026', type: 'major', by: 'Lulamile M.', notes: ['helpText renamed to hint with codemod; errorMessages map replaced by hint + error', 'aria-invalid now mirrors error automatically'] },
      { v: '1.5.0', date: '02 May 2026', type: 'minor', by: 'Lulamile M.', notes: ['Focus ring shadow tokenized (--color-primary-50 wash)', 'Disabled state contrast fixed per QA report'] },
      { v: '1.0.0', date: '02 Apr 2026', type: 'stable', by: 'Lulamile M.', notes: ['First stable release — 4 states, Reactive-forms/v-model/controlled compatible'] },
    ],
  },

  {
    id: 'badge', name: 'Badge / Chip', tag: 'ds-badge', cls: 'ds-badge', element: 'span',
    version: '1.0.2', figmaPath: 'Components / Badge', stories: 5,
    status: { figma: 'ready', tokens: 'ready', build: 'ready', frameworks: 'ready', storybook: 'review' },
    subs: { figma: '5 status variants', tokens: 'Tokens exported', build: 'CSS + TS generated', frameworks: '14/14 targets live', storybook: '5 stories · PR #51 in review' },
    desc: 'Compact status and count indicators. Pill radius and semantic colors are fully tokenized.',
    props: [
      { n: 'variant', t: "'success' | 'warning' | 'danger' | 'info' | 'neutral'", d: "'neutral'", figma: 'variant' },
      { n: 'dot', t: 'boolean', d: 'false', figma: 'showDot' },
    ],
    spec: [
      { prop: 'padding block', token: 'space/1' },
      { prop: 'padding inline', token: 'space/3' },
      { prop: 'corner radius', token: 'radius/full' },
      { prop: 'text size', token: 'typography/size/sm' },
      { prop: 'text weight', token: 'typography/weight/medium' },
      { prop: 'success color', token: 'color/success/600' },
    ],
    tokensUsed: ['color/success/600', 'color/warning/600', 'color/danger/600', 'color/info/600', 'space/1', 'space/3', 'radius/full'],
    css: {
      base: [['display', 'inline-flex'], ['align-items', 'center'], ['gap', cssVar('space/1')], ['padding', `${cssVar('space/1')} ${cssVar('space/3')}`], ['border-radius', cssVar('radius/full')], ['font-size', cssVar('typography/size/sm')], ['font-weight', cssVar('typography/weight/medium')]],
      variants: {
        success: [['background', 'rgba(74,222,128,.1)'], ['color', cssVar('color/success/600')]],
        warning: [['background', 'rgba(251,191,36,.1)'], ['color', cssVar('color/warning/600')]],
        danger:  [['background', 'rgba(248,113,113,.1)'], ['color', cssVar('color/danger/600')]],
        info:    [['background', 'rgba(96,165,250,.1)'],  ['color', cssVar('color/info/600')]],
        neutral: [['background', 'rgba(240,237,230,.06)'], ['color', cssVar('color/ink/subtle')]],
      },
      modifiers: {},
    },
    preview: `
      <div class="preview-row"><span class="preview-label">Status</span>
        <span class="prev-badge prev-badge-success"><span class="prev-badge-dot"></span>Active</span>
        <span class="prev-badge prev-badge-warning"><span class="prev-badge-dot"></span>Pending</span>
        <span class="prev-badge prev-badge-danger"><span class="prev-badge-dot"></span>Error</span>
        <span class="prev-badge prev-badge-info"><span class="prev-badge-dot"></span>Info</span>
        <span class="prev-badge prev-badge-neutral">Draft</span>
      </div>
      <div class="preview-row"><span class="preview-label">Counts</span>
        <span class="prev-badge prev-badge-danger" style="border-radius:50%;width:24px;height:24px;justify-content:center;padding:0">4</span>
        <span class="prev-badge prev-badge-neutral">New</span>
        <span class="prev-badge prev-badge-success">v1.2.0</span>
      </div>`,
    a11y: ['Count badges include visually-hidden context (“4 unread”).', 'Color is never the only signal — pair with text or dot.'],
    usage: {
      do: ['Keep label to one or two words', 'Use semantic variants for system status only'],
      dont: ['Don’t use badges as buttons', 'Don’t stack more than two badges in a table cell'],
    },
    comments: [
      { a: 'Jana D.', ini: 'JD', col: 'var(--figma)', bg: 'var(--figma-dim)', time: '1d ago', type: 'Change request', where: 'Transform', text: 'Warning variant was mapped to --color-warning-500 in one target — corrected to warning-600 per Figma.', reactions: 4 },
    ],
    history: [
      { v: '1.0.2', date: '19 Jul 2026', type: 'patch', by: 'Lulamile M.', notes: ['Warning variant corrected to --color-warning-600 (one target mapped 500) — closes Jana’s change request'] },
      { v: '1.0.0', date: '25 Jun 2026', type: 'stable', by: 'Lulamile M.', notes: ['First stable: 5 status variants + dot indicator on all targets'] },
      { v: '0.9.0', date: '05 Jun 2026', type: 'beta', by: 'Thabo M.', notes: ['Count variant added for nav/src badges', 'Sprint 8 hardening pass'] },
    ],
  },

  {
    id: 'card', name: 'Card', tag: 'ds-card', cls: 'ds-card', element: 'div',
    version: '1.2.0', figmaPath: 'Components / Card', stories: 4,
    status: { figma: 'ready', tokens: 'ready', build: 'ready', frameworks: 'ready', storybook: 'review' },
    subs: { figma: '3 variants designed', tokens: 'Tokens exported', build: 'CSS + TS generated', frameworks: '14/14 targets live', storybook: '4 stories · PR #52 open' },
    desc: 'Content grouping surface with default, elevated and outlined treatments. Children compose via header/body/footer slots.',
    props: [
      { n: 'variant', t: "'default' | 'elevated' | 'outlined'", d: "'default'", figma: 'variant' },
    ],
    spec: [
      { prop: 'padding', token: 'space/5' },
      { prop: 'corner radius', token: 'radius/lg' },
      { prop: 'elevation (elevated)', token: 'shadow/md' },
      { prop: 'surface', token: 'color/neutral/700' },
    ],
    tokensUsed: ['color/neutral/700', 'color/neutral/800', 'space/5', 'radius/lg', 'shadow/md'],
    css: {
      base: [['background', cssVar('color/neutral/800')], ['border', '1px solid rgba(255,255,255,.07)'], ['border-radius', cssVar('radius/lg')], ['padding', cssVar('space/5')]],
      variants: {
        elevated: [['background', cssVar('color/neutral/700')], ['box-shadow', cssVar('shadow/md')]],
        outlined: [['background', 'transparent'], ['border', '1.5px solid rgba(255,255,255,.2)']],
      },
      modifiers: {},
    },
    preview: `
      <div class="preview-row" style="align-items:flex-start">
        <div class="prev-card">
          <div class="prev-card-title">Default Card</div>
          <div class="prev-card-body">Content grouping with a subtle surface treatment.</div>
          <div class="prev-card-footer"><span class="prev-btn prev-btn-primary prev-btn-sm">View</span><span class="prev-btn prev-btn-ghost prev-btn-sm">Dismiss</span></div>
        </div>
        <div class="prev-card-elevated">
          <div class="prev-card-title">Elevated Card</div>
          <div class="prev-card-body">Featured content that needs visual hierarchy.</div>
          <div class="prev-card-footer"><span class="prev-btn prev-btn-primary prev-btn-sm">Open</span></div>
        </div>
      </div>`,
    a11y: ['Cards are neutral containers — interactive cards use a real link/button child, not a click handler on the card itself.'],
    usage: {
      do: ['Elevated for featured / hero content only', 'Keep actions in the footer slot'],
      dont: ['Don’t nest cards inside cards', 'Don’t mix default and outlined in one list'],
    },
    comments: [],
    history: [
      { v: '1.2.0', date: '15 Jul 2026', type: 'minor', by: 'Lulamile M.', notes: ['Outlined variant added', 'Footer slot normalized across React/Vue/Angular/Svelte'] },
      { v: '1.1.0', date: '20 Jun 2026', type: 'minor', by: 'Lulamile M.', notes: ['Elevated shadow tokenized (--shadow-md) after tokens v3 transform'] },
      { v: '1.0.0', date: '28 May 2026', type: 'stable', by: 'Lulamile M.', notes: ['First stable release — default + elevated'] },
    ],
  },

  {
    id: 'alert', name: 'Alert / Toast', tag: 'ds-alert', cls: 'ds-alert', element: 'div',
    version: '0.9.0', figmaPath: 'Components / Alert', stories: 0,
    status: { figma: 'ready', tokens: 'ready', build: 'ready', frameworks: 'review', storybook: 'missing' },
    subs: { figma: '4 states designed', tokens: 'Tokens exported', build: 'CSS + TS generated', frameworks: '12/14 targets · ionic + rn in PR', storybook: 'Sprint 9' },
    desc: 'Inline status messaging with success, warning, error and info tones. Toast variant planned on the same token set.',
    props: [
      { n: 'variant', t: "'success' | 'warning' | 'error' | 'info'", d: "'info'", figma: 'variant' },
      { n: 'title', t: 'string', d: '—', figma: 'title' },
      { n: 'dismissible', t: 'boolean', d: 'false', figma: 'dismissible' },
    ],
    spec: [
      { prop: 'padding block', token: 'space/3' },
      { prop: 'padding inline', token: 'space/4' },
      { prop: 'corner radius', token: 'radius/lg' },
      { prop: 'icon gap', token: 'space/3' },
    ],
    tokensUsed: ['color/success/600', 'color/warning/600', 'color/danger/600', 'color/info/600', 'space/3', 'space/4', 'radius/lg'],
    css: {
      base: [['display', 'flex'], ['gap', cssVar('space/3')], ['padding', `${cssVar('space/3')} ${cssVar('space/4')}`], ['border-radius', cssVar('radius/lg')], ['font-size', cssVar('typography/size/sm')]],
      variants: {
        success: [['background', 'rgba(74,222,128,.1)'], ['border', '1px solid rgba(74,222,128,.2)'], ['color', cssVar('color/success/600')]],
        warning: [['background', 'rgba(251,191,36,.1)'], ['border', '1px solid rgba(251,191,36,.2)'], ['color', cssVar('color/warning/600')]],
        error:   [['background', 'rgba(248,113,113,.1)'], ['border', '1px solid rgba(248,113,113,.2)'], ['color', cssVar('color/danger/600')]],
        info:    [['background', 'rgba(96,165,250,.1)'], ['border', '1px solid rgba(96,165,250,.2)'], ['color', cssVar('color/info/600')]],
      },
      modifiers: {},
    },
    preview: `
      <div style="display:flex;flex-direction:column;gap:10px;width:100%">
        <div class="prev-alert prev-alert-success"><span>✓</span><div><strong>Changes saved</strong>Your project settings have been updated.</div></div>
        <div class="prev-alert prev-alert-warning"><span>⚠</span><div><strong>Account expiring</strong>Your trial ends in 3 days. Upgrade to continue.</div></div>
        <div class="prev-alert prev-alert-error"><span>✕</span><div><strong>Failed to save</strong>Please check your connection and try again.</div></div>
        <div class="prev-alert prev-alert-info"><span>ℹ</span><div><strong>Maintenance scheduled</strong>The platform will be offline from 02:00–04:00 SAST.</div></div>
      </div>`,
    a11y: ['role="alert" for assertive messages; role="status" for passive updates.', 'Never auto-dismiss error messages.'],
    usage: {
      do: ['Lead with the outcome in the title', 'One alert per region'],
      dont: ['Don’t use alerts for promotional content', 'Don’t stack more than two'],
    },
    comments: [],
    history: [
      { v: '0.9.0', date: '12 Jul 2026', type: 'beta', by: 'Lulamile M.', notes: ['All 4 tones spec-complete; 12/14 targets shipped', 'Ionic + React Native adapters open in PR #60'] },
      { v: '0.8.0', date: '15 Jun 2026', type: 'beta', by: 'Lulamile M.', notes: ['Inline alert design approved', 'Toast variant split into its own request to keep scope tight'] },
    ],
  },

  {
    id: 'avatar', name: 'Avatar', tag: 'ds-avatar', cls: 'ds-avatar', element: 'span',
    version: '0.7.0', figmaPath: 'Components / Avatar', stories: 0,
    status: { figma: 'ready', tokens: 'ready', build: 'review', frameworks: 'waiting', storybook: 'missing' },
    subs: { figma: 'sm/md/lg + group', tokens: 'Size tokens exported', build: 'PR #61 open', frameworks: 'Queued after transform', storybook: 'Queued' },
    desc: 'User identity as image or initials, with an overlapping group treatment.',
    props: [
      { n: 'size', t: "'sm' | 'md' | 'lg'", d: "'md'", figma: 'size' },
      { n: 'src', t: 'string', d: '—', figma: 'image' },
      { n: 'initials', t: 'string', d: '—', figma: 'initials' },
    ],
    spec: [
      { prop: 'corner radius', token: 'radius/full' },
      { prop: 'size (md)', token: 'space/8' },
      { prop: 'group ring', token: 'color/neutral/800' },
    ],
    tokensUsed: ['radius/full', 'space/8', 'color/neutral/800'],
    css: {
      base: [['width', cssVar('space/8')], ['height', cssVar('space/8')], ['border-radius', cssVar('radius/full')], ['display', 'inline-flex'], ['align-items', 'center'], ['justify-content', 'center'], ['font-weight', cssVar('typography/weight/bold')]],
      variants: {},
      modifiers: {
        sm: [['width', cssVar('space/7')], ['height', cssVar('space/7')], ['font-size', cssVar('typography/size/xs')]],
        lg: [['width', cssVar('space/8')], ['height', cssVar('space/8')], ['font-size', cssVar('typography/size/lg')]],
      },
    },
    preview: `
      <div class="preview-row"><span class="preview-label">Sizes</span>
        <div class="prev-avatar" style="background:var(--figma-mid);color:var(--figma);width:28px;height:28px;font-size:.6rem">LM</div>
        <div class="prev-avatar" style="background:var(--token-mid);color:var(--token)">TM</div>
        <div class="prev-avatar" style="background:var(--stdict-mid);color:var(--stdict);width:52px;height:52px;font-size:1rem">SR</div>
      </div>
      <div class="preview-row"><span class="preview-label">Group</span>
        <div class="prev-avatar-group">
          <div class="prev-avatar" style="background:var(--figma-mid);color:var(--figma)">LM</div>
          <div class="prev-avatar" style="background:var(--token-mid);color:var(--token)">TM</div>
          <div class="prev-avatar" style="background:var(--stdict-mid);color:var(--stdict)">NK</div>
          <div class="prev-avatar" style="background:var(--surface-3);color:var(--ink-45);font-size:.7rem">+4</div>
        </div>
      </div>`,
    a11y: ['Always pass an alt / aria-label with the person’s name.'],
    usage: { do: ['Fall back to initials while the image loads'], dont: ['Don’t show more than 3 + overflow count in a group'] },
    comments: [],
    history: [
      { v: '0.7.0', date: '18 Jul 2026', type: 'beta', by: 'Lulamile M.', notes: ['Group overflow (+n) spec finalized', 'Size tokens exported; transform PR #61 open'] },
      { v: '0.6.0', date: '28 Jun 2026', type: 'beta', by: 'Lulamile M.', notes: ['Initials fallback rule approved: always render initials until image loads', 'alt/aria-label required at lint time'] },
    ],
  },

  /* ── Request-pipeline components (ship live from the Requests view) ── */
  {
    id: 'data-table', name: 'Data Table', tag: 'ds-table', cls: 'ds-table', element: 'div',
    version: '—', figmaPath: 'Components / Data Table', stories: 0, requested: true,
    status: { figma: 'review', tokens: 'ready', build: 'review', frameworks: 'missing', storybook: 'missing' },
    subs: { figma: 'Design attached ✓', tokens: 'Tokens reserved', build: 'Awaiting approval', frameworks: 'Ships on approval', storybook: 'Auto-created on ship' },
    desc: 'Sortable, paginated data grid with selection and loading skeletons. Requested by Palesa W. — see Requests.',
    props: [
      { n: 'columns', t: 'ColumnDef[]', d: '[]', figma: 'columns' },
      { n: 'rows', t: 'Row[]', d: '[]', figma: 'rows' },
      { n: 'sortable', t: 'boolean', d: 'true', figma: 'sortable' },
      { n: 'paginated', t: 'boolean', d: 'true', figma: 'paginated' },
    ],
    spec: [
      { prop: 'row padding block', token: 'space/2' },
      { prop: 'row padding inline', token: 'space/3' },
      { prop: 'header text', token: 'typography/size/xs' },
      { prop: 'row hover', token: 'color/neutral/700' },
      { prop: 'corner radius', token: 'radius/lg' },
    ],
    tokensUsed: ['space/2', 'space/3', 'typography/size/xs', 'color/neutral/700', 'radius/lg'],
    css: {
      base: [['width', '100%'], ['border-collapse', 'collapse'], ['font-size', cssVar('typography/size/sm')], ['border', '1px solid rgba(255,255,255,.07)'], ['border-radius', cssVar('radius/lg')]],
      variants: {},
      modifiers: {},
    },
    preview: `
      <div class="prev-table-wrap"><table class="prev-table">
        <thead><tr><th>Name</th><th>Status</th><th>Role</th><th>Last active</th></tr></thead>
        <tbody>
          <tr><td>Lulamile M.</td><td><span class="prev-badge prev-badge-success" style="font-size:.66rem">Active</span></td><td>Design Lead</td><td>Just now</td></tr>
          <tr><td>Thabo M.</td><td><span class="prev-badge prev-badge-success" style="font-size:.66rem">Active</span></td><td>Frontend Dev</td><td>2h ago</td></tr>
          <tr><td>Nandi K.</td><td><span class="prev-badge prev-badge-warning" style="font-size:.66rem">Away</span></td><td>Product Manager</td><td>1d ago</td></tr>
          <tr><td>Sipho R.</td><td><span class="prev-badge prev-badge-neutral" style="font-size:.66rem">Inactive</span></td><td>QA Engineer</td><td>3d ago</td></tr>
        </tbody>
      </table></div>`,
    a11y: ['Uses real <code>&lt;table&gt;</code> markup, sort state exposed via aria-sort.', 'Keyboard: arrow-key row navigation.'],
    usage: { do: ['Show a loading skeleton, never a spinner alone'], dont: ['Don’t sort on the client above 500 rows'] },
    comments: [],
    history: [
      { v: '0.9.0', date: '22 Jul 2026', type: 'design', by: 'Lulamile M.', notes: ['Design attached to request: loading skeleton, sort icons, empty state', 'Tokens reserved (row padding, hover surface, header text)'] },
      { v: '0.1.0', date: '14 Jul 2026', type: 'design', by: 'Palesa W.', notes: ['Requested via the board — 7 upvotes; unblocks the reporting squad'] },
    ],
  },
  {
    id: 'toast', name: 'Toast / Snackbar', tag: 'ds-toast', cls: 'ds-toast', element: 'div',
    version: '—', figmaPath: 'Components / Toast', stories: 0, requested: true,
    status: { figma: 'review', tokens: 'ready', build: 'review', frameworks: 'missing', storybook: 'missing' },
    subs: { figma: 'Design attached ✓', tokens: 'Tokens reserved', build: 'Awaiting approval', frameworks: 'Ships on approval', storybook: 'Auto-created on ship' },
    desc: 'Transient confirmation message with optional action. Requested by Sipho R. — see Requests.',
    props: [
      { n: 'variant', t: "'success' | 'error' | 'info'", d: "'info'", figma: 'variant' },
      { n: 'message', t: 'string', d: '—', figma: 'message' },
      { n: 'duration', t: 'number', d: '4000', figma: 'duration' },
    ],
    spec: [
      { prop: 'padding', token: 'space/3' },
      { prop: 'corner radius', token: 'radius/lg' },
      { prop: 'elevation', token: 'shadow/lg' },
      { prop: 'enter motion', token: 'motion/duration/base' },
    ],
    tokensUsed: ['space/3', 'radius/lg', 'shadow/lg', 'motion/duration/base', 'color/success/600'],
    css: {
      base: [['padding', cssVar('space/3')], ['border-radius', cssVar('radius/lg')], ['box-shadow', cssVar('shadow/lg')], ['background', cssVar('color/neutral/700')], ['font-size', cssVar('typography/size/sm')], ['animation', `toast-in ${cssVar('motion/duration/base')} ${cssVar('motion/easing/out')}`]],
      variants: {},
      modifiers: {},
    },
    preview: `
      <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:380px">
        <div class="prev-alert prev-alert-success"><span>✓</span><div><strong>Saved</strong>Changes synced to all frameworks.</div></div>
        <div class="prev-alert prev-alert-error"><span>✕</span><div><strong>Publish failed</strong>Retry in a few seconds.</div></div>
      </div>`,
    a11y: ['role="status" + aria-live="polite".', 'Pause auto-dismiss on hover/focus.'],
    usage: { do: ['Offer an undo action for destructive confirms'], dont: ['Never toast errors that block the user'] },
    comments: [],
    history: [
      { v: '0.2.0', date: '17 Jul 2026', type: 'design', by: 'Lulamile M.', notes: ['Elevation (shadow/lg) + entrance motion (motion/duration/base) tokens finalized', 'Auto-dismiss pauses on hover/focus per a11y rule'] },
      { v: '0.1.0', date: '15 Jul 2026', type: 'design', by: 'Sipho R.', notes: ['Requested via the board — QA flagged inconsistent save confirmations across the app'] },
    ],
  },
];

/* Roadmap placeholders (no design attached yet) */
const ROADMAP = [
  { id: 'tabs', name: 'Tabs', tag: 'ds-tabs', note: 'Sprint 10 — horizontal, vertical and pill variants' },
  { id: 'tooltip', name: 'Tooltip', tag: 'ds-tooltip', note: 'Sprint 10 — anchored to the data-table release' },
];

/* ── 5 · COMPONENT REQUESTS (designer ↔ dev conversation) ────── */
const REQUEST_SEED = [
  {
    id: 'req-table', compId: 'data-table', title: 'Data Table',
    by: 'Palesa W.', byRole: 'dev', time: '1w ago', status: 'in-design', votes: 7, designAttached: true,
    desc: 'Reporting dashboard needs a real data table — sortable columns, row selection and pagination. Today every squad ships bespoke <table> markup with inline styles that match nothing in the system.',
    thread: [
      { a: 'Palesa W.', ini: 'PW', role: 'dev', col: 'var(--blue)', bg: 'var(--blue-dim)', time: '1w ago', text: 'Requesting a Data Table with highest priority. The reports squad is blocked — three teams have built three different tables already this quarter.' },
      { a: 'Lulamile M.', ini: 'LM', role: 'designer', col: 'var(--figma)', bg: 'var(--figma-dim)', time: '6d ago', text: 'Picked up. Designing in Figma this week — every cell padding and header style will reference tokens, so it ships to all frameworks at once.' },
      { a: 'Thabo M.', ini: 'TM', role: 'dev', col: 'var(--stdict)', bg: 'var(--stdict-dim)', time: '5d ago', text: '+1 — please include a loading skeleton spec. That’s where all three bespoke tables drifted.' },
      { a: 'Lulamile M.', ini: 'LM', role: 'designer', col: 'var(--figma)', bg: 'var(--figma-dim)', time: '2d ago', text: 'Design attached ✓ — skeleton, sort icons and empty state included. Ready for review; approve to ship to all 14 targets.' },
    ],
  },
  {
    id: 'req-toast', compId: 'toast', title: 'Toast / Snackbar',
    by: 'Sipho R.', byRole: 'dev', time: '5d ago', status: 'in-design', votes: 4, designAttached: true,
    desc: 'We have Alert for inline messages but nothing transient. QA keeps flagging inconsistent “saved” confirmations across the app.',
    thread: [
      { a: 'Sipho R.', ini: 'SR', role: 'dev', col: 'var(--blue)', bg: 'var(--blue-dim)', time: '5d ago', text: 'Can we get a toast? Needs success + error tones and an optional action button (undo).' },
      { a: 'Lulamile M.', ini: 'LM', role: 'designer', col: 'var(--figma)', bg: 'var(--figma-dim)', time: '3d ago', text: 'On it. Will reuse the Alert token set so colors can’t drift, with elevation shadow/lg and motion/duration/base for the entrance.' },
    ],
  },
  {
    id: 'req-datepicker', compId: null, title: 'Date Picker',
    by: 'Nandi K.', byRole: 'dev', time: '3d ago', status: 'requested', votes: 2, designAttached: false,
    desc: 'Needed for the bookings flow — single date and range modes, min/max limits, keyboard navigation.',
    thread: [
      { a: 'Nandi K.', ini: 'NK', role: 'dev', col: 'var(--amber)', bg: 'var(--amber-dim)', time: '3d ago', text: 'Bookings needs a proper date picker. Currently importing a third-party one that ignores all our tokens.' },
    ],
  },
];

/* ── 6 · DEMO MODE SCENES ────────────────────────────────────── */
const DEMO_SCENES = [
  { view: 'overview',    sel: '',              title: 'Welcome to DesignOps', tag: 'Intro',        dur: 9500, audio: 'demo/audio/scene-1.mp3',
    text: 'The single source of truth that keeps design and development perfectly aligned. One design in Figma — shipped to every framework your teams use.' },
  { view: 'tokens',      sel: '.token-table',  title: 'Tokens, one rule',     tag: 'Tokens',       dur: 9500, audio: 'demo/audio/scene-2.mp3',
    text: 'Design tokens flow from Figma Variables into a versioned JSON source of truth, then transform automatically into CSS, Sass, TypeScript and Tailwind. Names never change.' },
  { view: 'components',  sel: '#comp-button',  title: 'Components everywhere', tag: 'Components',  dur: 9500, audio: 'demo/audio/scene-3.mp3',
    text: 'Every component is specified once with tokens, then generated for React, Vue, Angular, Svelte — pixel-identical across fourteen targets.' },
  { view: 'components',  sel: '#comp-button .pipeline-tabs', title: 'Preview · Inspect · Code', tag: 'Inspect', dur: 9500, audio: 'demo/audio/scene-4.mp3',
    text: 'Developers preview, inspect exact values and copy working code for their stack. Spacing, color, radius, typography — all token-referenced, zero guesswork.' },
  { view: 'frameworks',  sel: '.fw-grid',      title: 'Ship once, consume anywhere', tag: 'Ship',  dur: 9500, audio: 'demo/audio/scene-5.mp3',
    text: 'Teams install the packages, pull the CSS, or copy native code straight from the dashboard. The easiest gateway: one npx command scaffolds everything.' },
  { view: 'requests',    sel: '.req-layout',   title: 'Ask inside the system', tag: 'Requests',    dur: 9500, audio: 'demo/audio/scene-6.mp3',
    text: 'Need something new? Request it in-app. The designer answers in the thread, attaches the Figma design, and approval ships it to every framework automatically.' },
  { view: 'storybook',   sel: '.sb-story-grid', title: 'Living documentation', tag: 'Storybook',   dur: 9500, audio: 'demo/audio/scene-7.mp3',
    text: 'Approved components sync to Storybook as living documentation, keeping design and code in lock-step forever.' },
  { view: 'guide',       sel: '',              title: 'Design once. Build everywhere.', tag: 'Close', dur: 10000, audio: 'demo/audio/scene-8.mp3',
    text: 'That’s DesignOps by Lulamile Mkhungela. Explore the guide to integrate it into your workflow today — packages, CLI, CDN, or API. Your call.' },
];

/* ── 7 · GUIDE (in-app documentation) ────────────────────────── */
const GUIDE = [
  { id: 'what', label: 'What is DesignOps', html: `
    <p>DesignOps is the operating layer between design and engineering. It exists because teams drift: a designer specs <code>16px</code>, a developer writes <code>15px</code>; a framework doesn’t support a style, so someone improvises. Multiply by 80 components and five stacks and the product no longer looks designed.</p>
    <p>This system removes the negotiation: <strong>tokens and components are defined once in Figma and shipped, mechanically, to every framework</strong>. Nobody re-types a value. If a framework can’t express a design directly (no CSS variables in React Native, for example), the pipeline resolves the tokens to that target’s native format instead of asking a developer to guess.</p>
    <ul>
      <li><strong>Designers</strong> work in Figma with variables and component properties named to match code.</li>
      <li><strong>Developers</strong> install packages, copy generated snippets, and file requests — they never translate design by hand.</li>
      <li><strong>The pipeline</strong> (export → transform → multi-target build → Storybook) is automated and versioned.</li>
    </ul>` },
  { id: 'pipeline', label: 'The 5-stage pipeline', html: `
    <p>Every component travels the same five gates. Nothing advances until the current gate is green.</p>
    <h4>01 · Figma Variables</h4>
    <p>Components are built with auto-layout and variables. Component property names equal the eventual code prop names — that’s the contract. Every annotation references a token (<code>space/4</code>, never <code>16px</code>).</p>
    <h4>02 · Tokens JSON</h4>
    <p>Variables export to versioned JSON (<code>tokens/tokens.json</code>). Reviewed by PR, never hand-edited. This file is the single source of truth — <code>tokens.json</code> in this repo is a live example.</p>
    <h4>03 · Transform</h4>
    <p>A build step (<code>tools/ship.mjs</code> / Style Dictionary) compiles tokens to CSS variables, Sass, TypeScript constants and a Tailwind preset — see <code>dist/</code>. One rule: <code>color/primary/900</code> → <code>--color-primary-900</code>. Dots and slashes become hyphens; nothing else changes.</p>
    <h4>04 · Framework build</h4>
    <p>Each target adapter consumes the transformed tokens: styled packages for React, Vue, Angular, Svelte; config adapters for MUI and Tailwind; CSS variable mapping for Ionic; a values-only bundle for React Native. The Code tab in any component shows the exact output.</p>
    <h4>05 · Storybook</h4>
    <p>Story paths mirror Figma paths (<code>Components / Button</code>). Controls mirror props. A component is “stable” only when all five stages are green.</p>` },
  { id: 'naming', label: 'The naming contract', html: `
    <p>Names are the system. If names drift, everything downstream drifts. So there is exactly one rule and it is enforced by tooling, not by memory:</p>
    <p><code>color/primary/900</code> (Figma) → <code>"color.primary.900"</code> (JSON) → <code>--color-primary-900</code> (CSS) → <code>colorPrimary900</code> (TS) → <code>primary-900</code> (Tailwind).</p>
    <ul>
      <li>Component props are named identically in Figma and in code (<code>variant</code>, <code>size</code>, <code>loading</code>).</li>
      <li>Storybook paths mirror Figma component paths exactly.</li>
      <li>Names are lower-kebab in CSS, camelCase in TS — derived, never re-chosen.</li>
      <li>Renames are breaking changes: they ship in a major version with a codemod.</li>
    </ul>` },
  { id: 'requests', label: 'Requesting a component', html: `
    <p>When a dev needs something that doesn’t exist, they don’t build a bespoke one — they ask, inside the system, where the conversation is attached to the artifact:</p>
    <ul>
      <li><strong>1 · Request</strong> — open Requests, describe the need and the framework context. It lands on the board as <em>requested</em>.</li>
      <li><strong>2 · Design</strong> — the designer answers in the thread and attaches the Figma spec (<em>in design</em>).</li>
      <li><strong>3 · Approve &amp; ship</strong> — on approval the pipeline runs: tokens reserved, code generated for all targets, story scaffolded. Status becomes <em>shipped</em> and the component appears in Components and in every framework card.</li>
      <li><strong>4 · Consume</strong> — devs bump the package version (or copy the snippet) and use it. Try it: approve the Data Table in the Requests view and watch it appear.</li>
    </ul>
    <p>Everything persists in your browser via <code>localStorage</code> in this demo; in a real deployment the same events flow through the API and webhooks.</p>` },
  { id: 'gateway', label: 'Integrating your app (the gateway)', html: `
    <p><strong>Do developers need this dashboard open all day? No.</strong> The dashboard is the governance and review surface. Day-to-day consumption happens inside the dev’s own tools:</p>
    <ul>
      <li><strong>Packages (recommended)</strong> — <code>npm i @designops/tokens @designops/react</code> (or vue, angular, svelte, mui…). Versioned, tree-shakeable, CI-published. Design arrives as a dependency update.</li>
      <li><strong>CLI</strong> — <code>npx designops init</code> detects your framework and wires everything: token CSS import, Tailwind preset or MUI theme. Easiest possible start. See Integrations.</li>
      <li><strong>CDN link</strong> — one <code>&lt;link&gt;</code> for prototypes and legacy stacks.</li>
      <li><strong>In-tool addons</strong> — Storybook addon (token docs panel), VS Code extension (var autocomplete + hover preview), Figma plugin (sync).</li>
      <li><strong>API + webhooks</strong> — <code>GET /v1/tokens?target=react</code>, plus ship events to Slack/Teams for custom tooling.</li>
    </ul>
    <p>Recommendation: adopt <strong>packages + CLI</strong> for apps, keep this dashboard for design review, requests and sign-off. The two sync over the API, so neither side waits on the other.</p>` },
  { id: 'governance', label: 'Governance & versioning', html: `
    <ul>
      <li><strong>Semver everywhere.</strong> Tokens and each framework adapter version independently; the manifest hash (see <code>dist/manifest.json</code>) lets apps fail fast on mismatch.</li>
      <li><strong>Change requests live on components</strong> — comments, requests and approvals are part of the artifact, like this page demonstrates.</li>
      <li><strong>Breaking visual changes</strong> go through the request flow with a migration codemod.</li>
      <li><strong>Definition of “stable”</strong>: all five stages green + design sign-off comparing Storybook against Figma.</li>
      <li><strong>Accessibility is a gate</strong>: axe checks run per story; contrast is verified at token level.</li>
    </ul>` },
  { id: 'faq', label: 'FAQ', html: `
    <p><strong>A framework can’t support a design — what happens?</strong> The pipeline adapts, the developer doesn’t. Example: React Native has no CSS variables, so tokens resolve to literal values in a generated StyleSheet module. If a design is truly impossible on a target, it’s flagged at the framework stage before any code ships — never discovered in production.</p>
    <p><strong>Can we adopt gradually?</strong> Yes. Start with the CSS variables (one link), then adopt adapters per component. Class-only output (<code>.ds-btn</code>) exists for exactly this.</p>
    <p><strong>Who owns a token?</strong> The design system owner (Lulamile) owns token definitions; consuming teams own usage. Token changes are PRs to <code>tokens/tokens.json</code>.</p>
    <p><strong>Does it work with brand themes?</strong> Tokens compile per theme; ship <code>tokens.dark.css</code> / <code>tokens.light.css</code> and switch at runtime — components never change.</p>` },
  { id: 'glossary', label: 'Glossary', html: `
    <ul>
      <li><strong>Design token</strong> — the smallest design decision (color, space, radius…) stored as data.</li>
      <li><strong>Transform</strong> — mechanical compilation of tokens into a target format.</li>
      <li><strong>Adapter</strong> — the framework-specific package that maps tokens to idiomatic code.</li>
      <li><strong>Drift</strong> — any difference between the Figma spec and shipped code. Target: zero.</li>
      <li><strong>Ship</strong> — promote a component through all five stages into every target.</li>
    </ul>` },
];

/* Session people (used by role switch in Requests + comment composer) */
const PEOPLE = [
  { name: 'Thabo M. (Engineer — all targets)', ini: 'TM', role: 'dev', col: 'var(--stdict)', bg: 'var(--stdict-dim)' },
  { name: 'Lulamile M. (Design system owner)', ini: 'LM', role: 'designer', col: 'var(--figma)', bg: 'var(--figma-dim)' },
];
