import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markHostContention } from '../src/parser/host-contention-filter.js';

const row = (batch, bi, status = 'ok', flags = '') => ({ batch_id: batch, benchmark_index: bi, status, quality_flags: flags });

test('rows far below their own batch median are invalid; other batches are judged separately', () => {
  const rows = [row('a', 2400), row('a', 2500), row('a', 2450), row('a', 900, 'ok', 'load_timeout'), row('b', 1000), row('b', 1100), row('b', 1050)];
  markHostContention(rows);
  assert.deepEqual(rows.map((r) => r.status), ['ok', 'ok', 'ok', 'invalid', 'ok', 'ok', 'ok']);
  assert.equal(rows[3].quality_flags, 'host_contention;load_timeout');
});

test('error rows and rows without a benchmark score are left untouched', () => {
  const rows = [row('a', 2400), row('a', 2400), row('a', 100, 'error'), row('a', null)];
  markHostContention(rows);
  assert.deepEqual(rows.map((r) => r.status), ['ok', 'ok', 'error', 'ok']);
});
