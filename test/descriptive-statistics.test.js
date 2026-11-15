import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toNumber, quantile, median, iqr, cv, spearman } from '../src/analysis/descriptive-statistics.js';

test('empty cell is missing, not zero', () => {
  assert.ok(Number.isNaN(toNumber('')));
  assert.equal(median([toNumber(''), 1, 3]), 2);
});

test('quantiles match numpy linear interpolation', () => {
  assert.equal(quantile([1, 2, 3, 4], 0.25), 1.75);
  assert.equal(iqr([1, 2, 3, 4]), 1.5);
  assert.ok(Number.isNaN(median([])));
});

test('coefficient of variation', () => {
  assert.ok(Math.abs(cv([10, 12, 8]) - 0.2) < 1e-9);
  assert.ok(Number.isNaN(cv([0, 0])));
});

test('spearman handles ties, monotone and constant inputs', () => {
  assert.equal(spearman([1, 2, 3, 4], [10, 20, 30, 1000]), 1);
  assert.equal(spearman([1, 2, 3], [3, 2, 1]), -1);
  assert.ok(Math.abs(spearman([1, 2, 2, 3], [1, 2, 3, 4]) - 0.9486832980505138) < 1e-12);
  assert.ok(Number.isNaN(spearman([1, 1, 1], [1, 2, 3])));
});
