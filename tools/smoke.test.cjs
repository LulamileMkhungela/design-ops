/**
 * DesignOps · headless smoke test
 * Boots the dashboard in jsdom and exercises every view and the core
 * user journeys (expand → inspect → generate code → comment → request
 * → approve → ship → demo mode). Run from the repo root:
 *
 *   npm install        # once, fetches jsdom (dev-only)
 *   npm test
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('index.html', 'utf8');
const errors = [];
const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});
const { window } = dom;
// stubs jsdom lacks
window.scrollTo = () => {};
window.HTMLMediaElement.prototype.play = function(){ return Promise.reject(new Error('no audio in jsdom')); };
window.HTMLMediaElement.prototype.pause = function(){};
window.Audio = class { constructor(){ this.onended=null; this.onerror=null; } play(){ return Promise.reject(new Error('x')); } pause(){} };
window.HTMLElement.prototype.scrollIntoView = () => {};
window.location.hash = '#/overview';
window.URL.createObjectURL = () => 'blob:mock';
window.URL.revokeObjectURL = () => {};
Object.defineProperty(window.navigator, 'clipboard', { value: { writeText: () => Promise.resolve() } });

// Browsers share top-level const across classic scripts; jsdom evals don't —
// concatenate to simulate the shared global lexical environment faithfully.
const bundle = ['assets/data.js','assets/codegen.js','assets/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n;\n');
try { window.eval(bundle); } catch (e) { errors.push('eval: ' + e.message); console.log('EVAL ERROR', e.message); }

const $ = (s) => window.document.querySelector(s);
const $$ = (s) => [...window.document.querySelectorAll(s)];
const ok = (cond, label) => { console.log((cond ? 'PASS' : 'FAIL') + ' · ' + label); if (!cond) errors.push(label); };

const main = async () => {
// dispatch DOMContentLoaded to boot the app
window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));

ok($('#view').innerHTML.includes('One design in Figma'), 'overview renders');

const routes = ['tokens','components','frameworks','lint','requests','storybook','integrations','guide'];
for (const r of routes) {
  window.location.hash = '#/' + r;
  window.dispatchEvent(new window.Event('hashchange'));
  ok($('#view').innerHTML.length > 500, 'view renders: ' + r);
}

// components: expand button card
window.location.hash = '#/components';
window.dispatchEvent(new window.Event('hashchange'));
const card = $('#comp-button .comp-card-header');
card.click();
ok($('#comp-button').classList.contains('open'), 'button card opens');
ok($('#comp-button .comp-body').innerHTML.includes('Inspect mode'), 'lazy body built (inspect tab present)');

// switch to code tab + vue framework tab
$$('#comp-button .ptab', ).forEach(() => {});
const codeTab = $('#comp-button .ptab[data-tab="code"]');
codeTab.click();
ok($('#comp-button [data-panel="code"]').classList.contains('active'), 'code tab activates');
const vueTab = $('#comp-button .fw-tab[data-fw="vue"]');
vueTab.click();
ok($('#comp-button [data-fw-panel]').textContent.includes('<template>'), 'vue snippet generated');
ok($('#comp-button [data-fw-panel]').textContent.includes('defineProps'), 'vue snippet has defineProps');
const rnTab = $('#comp-button .fw-tab[data-fw="rn"]');
rnTab.click();
ok($('#comp-button [data-fw-panel]').textContent.includes('StyleSheet.create'), 'react native snippet generated');

// post a comment
const ta = $('#comp-button .comment-textarea');
ta.value = 'Test comment from smoke test';
const postBtn = $('#comp-button .submit-comment');
postBtn.click();
ok($('#comp-button .comment-list').textContent.includes('Test comment from smoke test'), 'comment posts and persists');

// tokens: filter + export
window.location.hash = '#/tokens';
window.dispatchEvent(new window.Event('hashchange'));
const chip = window.document.querySelector('[data-tokfilter="color"]');
chip.click();
ok(!$('#view').textContent.includes('space/1'), 'token group filter works');
window.document.querySelector('[data-export="css"]').click();
ok($('#toastRoot').textContent.includes('Downloaded tokens.css'), 'export downloads with toast');

// requests: approve + ship data table (click the real button, wait out the pipeline timer)
window.location.hash = '#/requests';
window.dispatchEvent(new window.Event('hashchange'));
$('#reqDetail [data-ship]').click();
ok($('#reqDetail').textContent.includes('in build') || $('#reqDetail').textContent.includes('Pipeline'), 'ship flow starts');
await new Promise(r => setTimeout(r, 2700));
ok($('#reqDetail').textContent.includes('Shipped'), 'request shows shipped');

// components now show data-table ready
window.location.hash = '#/components';
window.dispatchEvent(new window.Event('hashchange'));
$('#comp-data-table .comp-card-header').click();
ok($('#comp-data-table').textContent.includes('5/5 ready'), 'shipped component shows 5/5 ready');
const fwTab2 = $('#comp-data-table .fw-tab[data-fw="angular"]');
fwTab2.click();
ok($('#comp-data-table [data-fw-panel]').textContent.includes('standalone'), 'shipped component generates angular code');

// new request via form
window.location.hash = '#/requests';
window.dispatchEvent(new window.Event('hashchange'));
$('#reqTitle').value = 'Segmented Control';
$('#reqDesc').value = 'Need it for settings pages';
$('#reqSubmit').click();
ok($('#reqDetail .req-detail-title').textContent.includes('Segmented Control'), 'new request created and selected');
ok($('#view').textContent.includes('Start design'), 'request actionable');

// guide nav
window.location.hash = '#/guide';
window.dispatchEvent(new window.Event('hashchange'));
ok($$('#view .guide-section').length >= 7, 'guide renders all sections');

// integrations decision table
window.location.hash = '#/integrations';
window.dispatchEvent(new window.Event('hashchange'));
ok($('#view').textContent.includes('Which gateway when?'), 'integrations renders decision table');

// lint view: six rule cards with verbatim diagnostics
window.location.hash = '#/lint';
window.dispatchEvent(new window.Event('hashchange'));
ok($$('#view .lt-rule').length === 6, 'lint renders six rule cards');
ok($('#view').textContent.includes('designops/no-restyle'), 'lint shows verbatim rule ids');
ok($('#view').textContent.includes('Use "p-3.25" instead'), 'lint shows a verbatim diagnostic');

// lint playground: presets fill the editor, offline note without a server
ok($$('#view [data-lint-preset]').length === 8, 'playground presets render');
ok($('#lintEditor').value.includes('rounded-huge'), 'playground defaults to the all-six preset');
window.document.querySelector('[data-lint-preset="2"]').click();
ok($('#lintEditor').value.includes('bg-pink-500') && !$('#lintEditor').value.includes('rounded-huge'), 'preset switch fills the editor');
ok($('#lintEngine').textContent.includes('local server'), 'engine banner degrades gracefully offline');

// lint setup tabs switch linter × framework snippets
window.document.querySelector('[data-lint-linter="oxlint"]').click();
ok($('#lintSetupPanel').textContent.includes('jsPlugins'), 'oxlint setup renders');
window.document.querySelector('[data-lint-fw="vue"]').click();
ok($('#lintSetupPanel').textContent.includes('Vue'), 'vue setup label switches');
window.document.querySelector('[data-lint-linter="eslint"]').click();
window.document.querySelector('[data-lint-fw="react"]').click();
ok($('#lintSetupPanel').textContent.includes('defineConfig'), 'eslint react setup restores');

// search
const input = $('#globalSearch');
input.value = 'button';
input.dispatchEvent(new window.Event('input'));
ok($('#searchResults').classList.contains('show'), 'search shows results');
ok($('#searchResults').textContent.toLowerCase().includes('button'), 'search finds button');

// demo mode boots
$('#watchDemoBtn').click();
ok($('#demoRoot').textContent.includes('Welcome to DesignOps'), 'demo mode starts scene 1');
window.eval('demoEnd()');
ok(!$('#demoRoot').innerHTML.trim(), 'demo exits cleanly');


// version history tab renders for every component
window.location.hash = '#/components';
window.dispatchEvent(new window.Event('hashchange'));
for (const cid of ['button','input','badge','card','alert','avatar','data-table','toast']) {
  const hdr = window.document.querySelector('#comp-' + cid + ' .comp-card-header');
  ok(!!hdr, 'card present for history test: ' + cid);
  if (hdr && !hdr.parentElement.classList.contains('open')) hdr.click();
  const hist = window.document.querySelector('#comp-' + cid + ' [data-panel="history"]');
  ok(hist && hist.querySelectorAll('.hist-item').length >= 2, 'history entries present: ' + cid);
}
// shipped data-table prepends synthetic v1.0.0 entry
ok($('#comp-data-table [data-panel="history"]').textContent.includes('1.0.0'), 'shipped component history prepends v1.0.0');
// history tab switch works
const histTab = $$('#comp-button .ptab').find(p => p.dataset.tab === 'history');
ok(!!histTab, 'history tab exists');
histTab.click();
ok($('#comp-button [data-panel="history"]').classList.contains('active'), 'history tab activates');
// comment reaction toggles +1
const before = $('#comp-button .comment-reaction').textContent;
$('#comp-button .comment-reaction').click();
ok($('#comp-button .comment-reaction').textContent !== before, 'reaction toggles +1');
// storybook cards navigate to components
window.location.hash = '#/storybook';
window.dispatchEvent(new window.Event('hashchange'));
window.document.querySelector('.sb-story-card[data-open-comp]').click();
ok(window.location.hash.replace('#/','') === 'components', 'storybook card routes to component');

// live connections: pure helpers
ok(window.eval("timeAgo('2026-09-24T10:00:00.000Z', Date.parse('2026-09-24T12:30:00.000Z'))") === '2h ago', 'timeAgo hours');
ok(window.eval("timeAgo('2026-09-24T11:59:30.000Z', Date.parse('2026-09-24T12:00:00.000Z'))") === 'just now', 'timeAgo just now');
ok(window.eval("timeAgo('not-a-date')") === '', 'timeAgo bad input');
ok(window.eval("githubIssueURL('o/r', 'A & B', 'x')") === 'https://github.com/o/r/issues/new?title=A%20%26%20B&body=x', 'issue URL encodes');
ok(window.eval("githubCommitActivity([{commit:{message:'fix it\\nmore',author:{date:'2026-09-24T11:00:00.000Z',name:'N'}},author:{login:'octo'},html_url:'https://x/y'}])[0][1]") === 'fix it \u2014 octo', 'commit activity maps');
ok(window.eval("githubCommitActivity([])") + '' === '', 'commit activity empty');
ok(window.eval("matchFigmaComponents([{id:'a',name:'Button'},{id:'b',name:'Table'}], ['button / primary']).matched.join()") === 'a', 'figma matcher matches head');
ok(window.eval("storybookStoryURL('https://sb.test/', 'Components / Button', 'docs')") === 'https://sb.test/?path=/story/components-button--docs', 'story URL slugs');
ok(window.eval("figmaKeyFromInput('https://www.figma.com/design/z28iI0zJV1u1cL1wQ4HMrx/Lula-Fig-Studio?node-id=0-1&t=oqJux37ElDvne9xu-1')") === 'z28iI0zJV1u1cL1wQ4HMrx', 'figma key extracted from URL');
ok(window.eval("figmaKeyFromInput('z28iI0zJV1u1cL1wQ4HMrx')") === 'z28iI0zJV1u1cL1wQ4HMrx', 'figma key passes through');
ok(window.eval("matchFigmaComponents([{id:'a',name:'Button'}], ['Lula / Button']).matched.join()") === 'a', 'figma matcher library prefix');
ok(window.eval("matchFigmaComponents([{id:'a',name:'Button'}], ['IconButton']).matched.join()") === '', 'figma matcher no substring false-positive');
// overview falls back to the seed feed (jsdom has no fetch)
window.location.hash = '#/overview';
window.dispatchEvent(new window.Event('hashchange'));
ok($('#liveActivityBadge').textContent.includes('demo'), 'activity badge says demo offline');
ok($$('#liveActivityItems .req-item').length === 5, 'seed activity renders 5 items');
// requests view offers github filing
window.location.hash = '#/requests';
window.dispatchEvent(new window.Event('hashchange'));
ok(!!$('#reqFileIssue'), 'file-as-issue button present');
// integrations connections form persists
window.location.hash = '#/integrations';
window.dispatchEvent(new window.Event('hashchange'));
ok(!!($('#connGithubRepo') && $('#connFigmaToken') && $('#connStorybookUrl')), 'connections inputs render');
ok($('#connFigmaFileKey').value === 'z28iI0zJV1u1cL1wQ4HMrx', 'figma file key prefilled');
$('#connGithubRepo').value = 'octo/hello';
$('[data-conn-github-save]').click();
ok(window.eval("localStorage.getItem('designops-connections-v1')").includes('octo/hello'), 'github repo saves to connections');
ok($('#connGithubRepo').value === 'octo/hello', 'saved repo survives re-render');

console.log('\n' + (errors.length ? 'ERRORS:\n' + errors.join('\n') : 'ALL DOM TESTS PASSED'));
process.exit(errors.length ? 1 : 0);

};
main().catch(e => { console.log('HARNESS ERROR', e); process.exit(1); });
