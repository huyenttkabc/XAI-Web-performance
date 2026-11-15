import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FAULTS, parseCondition, renderPage } from '../src/testbed/fault-catalog.js';
import { heroPng, blockingCss, domBloatHtml } from '../src/testbed/synthetic-asset-generators.js';

const params = (query) => new URLSearchParams(query);
const template = await readFile(new URL('../src/testbed/site/home.html', import.meta.url), 'utf8');
const TP = 'http://localhost:4174';
const render = (query) => renderPage(template, parseCondition(params(query)), TP);

test('catalog has 6 faults in 5 cause groups × 3 increasing severities', () => {
  assert.equal(Object.keys(FAULTS).length, 6);
  const groups = new Set(Object.values(FAULTS).map((f) => f.cause_group));
  assert.deepEqual([...groups].sort(), ['dom_layout', 'lcp_resource', 'main_thread_js', 'render_blocking', 'third_party']);
  for (const fault of Object.values(FAULTS)) {
    assert.equal(fault.severities.length, 3);
    assert.ok(fault.severities.every((v, i, a) => i === 0 || v > a[i - 1]));
  }
});

test('unknown or missing fault → baseline; dose is clamped', () => {
  assert.deepEqual(parseCondition(params('')), { fault: 'none', dose: 0 });
  assert.deepEqual(parseCondition(params('fault=rm-rf&dose=9')), { fault: 'none', dose: 0 });
  assert.equal(parseCondition(params('fault=js-long-task&dose=99999')).dose, 1000);
  assert.equal(parseCondition(params('fault=js-long-task&dose=-5')).dose, 0);
});

test('every slot is filled and baseline loads the same first-party requests as a JS fault', () => {
  const baseline = render('');
  assert.doesNotMatch(baseline, /\{\{/);
  const jsFault = render('fault=js-long-task&dose=250');
  const strip = (html) => html.replace(/data-dose="\d+"/g, '');
  assert.equal(strip(jsFault), strip(baseline)); // only the dose attribute differs
});

test('third-party long task is matched to js-long-task: same request set, only origin of the work differs', () => {
  const baseline = render('');
  const tpFault = render('fault=third-party-long-task&dose=250');
  const doses = (html) => [...html.matchAll(/data-dose="(\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(doses(baseline), ['0', '0']);
  assert.deepEqual(doses(render('fault=js-long-task&dose=250')), ['250', '0']);
  assert.deepEqual(doses(tpFault), ['0', '250']);
  assert.match(tpFault, new RegExp(`src="${TP}/faults/js-long-task\\.js" data-dose="250"`));
  assert.equal(tpFault.replace(/data-dose="\d+"/g, ''), baseline.replace(/data-dose="\d+"/g, ''));
});

test('each fault changes only its own slot', () => {
  const baseline = render('');
  assert.match(render('fault=lcp-heavy-image&dose=900'), /hero\.png\?kb=900/);
  assert.match(render('fault=render-blocking-css&dose=500'), /blocking\.css\?kb=500/);
  assert.equal((render('fault=third-party-scripts&dose=12').match(/text\/javascript/g) || []).length, 12);
  assert.equal((baseline.match(/text\/javascript/g) || []).length, 0);
  assert.equal((render('fault=dom-bloat&dose=4000').match(/class="bloat"/g) || []).length, 1000);
});

test('third-party fault keeps DOM size and HTML bytes identical to baseline', () => {
  const baseline = render('');
  const maxThirdParty = render('fault=third-party-scripts&dose=30');
  const tags = (html) => (html.match(/<[a-z]/g) || []).length;
  assert.equal(maxThirdParty.length, baseline.length);
  assert.equal(tags(maxThirdParty), tags(baseline));
});

test('synthetic assets scale with the requested size and are deterministic', () => {
  const small = heroPng(20).length;
  const large = heroPng(900).length;
  assert.ok(Math.abs(large / 1024 - 900) < 30, `hero 900 KB → ${Math.round(large / 1024)} KB`);
  assert.ok(small < 40 * 1024);
  assert.ok(heroPng(300).equals(heroPng(300)));
  assert.ok(Math.abs(blockingCss(150).length / 1024 - 150) < 1);
  assert.equal((domBloatHtml(400).match(/class="bloat"/g) || []).length, 100);
});

test('fault matrix plan: 2 pages × (1 baseline + 18 fault conditions) × 5 runs = 190', async () => {
  const { testbedPlan } = await import('../src/pilot-plan-builder.js');
  const plan = testbedPlan(['home', 'product'], 'http://127.0.0.1:4173', 5);
  assert.equal(plan.length, 190);
  assert.equal(plan.filter((p) => p.fault_id === 'none').length, 10);
  assert.ok(plan.every((p) => p.severity_level >= 0 && p.severity_level <= 3));
});
