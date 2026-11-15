import { test } from 'node:test';
import assert from 'node:assert/strict';
import { histogramSvg, heatmapSvg } from '../src/analysis/svg-charts.js';

/** True when no element repeats an attribute (invalid XML, browsers refuse to render the file). */
const noDuplicateAttributes = (svg) => [...svg.matchAll(/<[a-z]+([^>]*)>/g)].every(([, attrs]) => {
  const names = [...attrs.matchAll(/([a-z-]+)="/g)].map((m) => m[1]);
  return new Set(names).size === names.length;
});
const balanced = (svg, tag) => (svg.match(new RegExp(`<${tag}[ >]`, 'g')) || []).length === (svg.match(new RegExp(`</${tag}>`, 'g')) || []).length;

test('histogram: one bar per bin, counts every finite value, escapes labels', () => {
  const svg = histogramSvg({ values: [1, 10, 100, 1000, NaN, 0], title: 'A & B', xLabel: 'ms', bins: 3, log: true });
  assert.match(svg, /^<svg/);
  assert.match(svg, /n = 4/); // NaN and 0 (not loggable) dropped
  assert.match(svg, /A &amp; B/);
  assert.equal((svg.match(/fill="#0072B2"/g) || []).length, 3);
  assert.ok(balanced(svg, 'text') && balanced(svg, 'svg'));
  assert.ok(noDuplicateAttributes(svg));
});

test('heatmap: n × n cells, undefined correlations rendered grey', () => {
  const svg = heatmapSvg({ matrix: [[1, NaN], [NaN, 1]], labels: ['a', 'b'], title: 't' });
  assert.equal((svg.match(/<rect x="\d+" y="\d+" width="26"/g) || []).length, 4);
  assert.equal((svg.match(/fill="#ddd"/g) || []).length, 2);
  assert.ok(balanced(svg, 'text'));
  assert.ok(noDuplicateAttributes(svg));
});

test('histogram without data is a valid placeholder, not NaN axes', () => {
  const svg = histogramSvg({ values: [NaN], title: 'Empty', xLabel: 'ms' });
  assert.match(svg, /Empty: no data/);
  assert.doesNotMatch(svg, /NaN|Infinity/);
});
