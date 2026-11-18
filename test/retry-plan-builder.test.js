import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRetryPlan, measurementId } from '../src/pilot-plan-builder.js';

const manifest = { measurement_profile: { id: 'mobile_cpu4x_slow4g_cold' } };
const entry = (site, run, status = 'error', page = 'home') => ({ site, page_type: page, url: `https://${site}/`, run, status });

test('retry plan: one item per failed real-site run, same run index, new batch id', () => {
  const errorLog = [
    entry('a.test', 2), entry('a.test', 2), // logged twice → one retry
    entry('b.test', 1, 'invalid'),          // V1–V3 failures are not retried
    entry('c.test', 3),                     // already ok later → skipped
    entry('testbed', 1),                    // testbed has its own rule
  ];
  const plan = buildRetryPlan({ manifest, errorLog, okRuns: new Set(['c.test|home|3']), batchId: 'B2' });
  assert.equal(plan.length, 1);
  assert.equal(plan[0].site, 'a.test');
  assert.equal(plan[0].run, 2);
  assert.equal(plan[0].batch_id, 'B2');
  assert.equal(plan[0].measurement_id, measurementId('B2', 'https://a.test/', 2));
  assert.equal(plan[0].fault_id, 'none');
});
