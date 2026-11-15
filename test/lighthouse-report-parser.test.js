import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMeasurement } from '../src/parser/lighthouse-report-parser.js';

const lhr = {
  lighthouseVersion: '12.8.2',
  fetchTime: '2026-10-04T00:00:00.000Z',
  finalDisplayedUrl: 'http://127.0.0.1:4173/home.html',
  environment: { hostUserAgent: 'HeadlessChrome/154' },
  categories: { performance: { score: 0.9 } },
  audits: {
    'largest-contentful-paint': { numericValue: 2000 },
    'total-blocking-time': { numericValue: 600 },
    'resource-summary': { details: { items: [
      { resourceType: 'total', requestCount: 5, transferSize: 4000 },
      { resourceType: 'script', requestCount: 2, transferSize: 1600 },
    ] } },
    'main-thread-tasks': { details: { items: [{ duration: 250 }, { duration: 60 }, { duration: 12 }] } },
    'third-party-summary': { scoreDisplayMode: 'notApplicable' },
    'speed-index': { errorMessage: 'Too slow (NO_TTI_CPU_IDLE_PERIOD)' },
    'mainthread-work-breakdown': { numericValue: 1200, details: { items: [{ group: 'scriptEvaluation', duration: 1000 }] } },
    'network-requests': { details: { items: [{ url: 'http://127.0.0.1:4173/a' }, { url: 'https://cdn.example.com/b' }, { url: 'data:image/png;base64,x' }] } },
  },
};

test('extracts targets and features from a report', () => {
  const row = parseMeasurement(lhr, { site: 'testbed', run: 1 });
  assert.equal(row.status, 'ok');
  assert.equal(row.lh_lcp_ms, 2000);
  assert.equal(row.lh_tbt_ms, 600);
  assert.equal(row.lh_perf_score, 0.9);
  assert.equal(row.script_bytes, 1600);
  assert.equal(row.long_task_count, 2);
  assert.equal(row.long_task_total_ms, 310);
  assert.equal(row.long_task_max_ms, 250);
  assert.equal(row.mt_script_eval_ms, 1000);
  assert.equal(row.mt_gc_ms, 0); // breakdown present but group absent → 0
  assert.equal(row.origin_count, 2); // data: URL ignored
  assert.equal(row.third_party_main_thread_ms, 0); // no third party → 0, not null
  assert.equal(row.quality_flags, 'speed-index:NO_TTI_CPU_IDLE_PERIOD');
  assert.equal(row.site, 'testbed');
});

test('missing audits become null, not zero', () => {
  const row = parseMeasurement(lhr, {});
  assert.equal(row.dom_elements, null);
  assert.equal(row.unused_js_bytes, null);
});

test('runtime error and missing report give status=error', () => {
  assert.equal(parseMeasurement(null, {}).status, 'error');
  const failed = parseMeasurement({ ...lhr, runtimeError: { code: 'NO_FCP', message: 'no paint' } }, {});
  assert.equal(failed.status, 'error');
  assert.match(failed.error_message, /NO_FCP/);
});
