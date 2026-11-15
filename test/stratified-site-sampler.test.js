import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFrame, assignStrata, interleavedOrder, stratumQuotas } from '../src/sampling/stratified-site-sampler.js';
import { pageProblem } from '../src/sampling/storefront-probe.js';

const ref = (domain, page_type, tbt, extra = {}) => ({
  domain, page_type, url: `https://${domain}/${page_type}`, lh_tbt_ms: String(tbt), status: 'ok',
  ablation_condition: 'baseline', is_reference_config: 'true', platform: 'shopify', ...extra,
});

test('frame keeps stores with both page types and uses the median home TBT', () => {
  const frame = buildFrame([
    ref('a.com', 'home', 100), ref('a.com', 'home', 300), ref('a.com', 'product', 0),
    ref('b.com', 'home', 50), // no product page → dropped
    ref('c.com', 'home', 900, { status: 'error' }), ref('c.com', 'product', 1),
  ]);
  assert.deepEqual(frame.map((s) => [s.site, s.refTbt]), [['a.com', 200]]);
});

test('tertile strata; missing reference TBT counts as heavy', () => {
  const frame = [10, 20, 30, 40, 50, 60, NaN].map((refTbt, i) => ({ site: `s${i}`, refTbt }));
  const { stores } = assignStrata(frame);
  assert.deepEqual(stores.map((s) => s.stratum), ['light', 'light', 'medium', 'medium', 'heavy', 'heavy', 'heavy']);
});

test('interleaved order is reproducible and alternates strata', () => {
  const stores = ['light', 'medium', 'heavy'].flatMap((stratum) => [1, 2, 3].map((i) => ({ site: `${stratum}${i}`, stratum })));
  const order = interleavedOrder(stores, 42);
  assert.deepEqual(order, interleavedOrder(stores, 42));
  assert.deepEqual(order.slice(0, 3).map((s) => s.stratum), ['light', 'medium', 'heavy']);
  assert.notDeepEqual(order.map((s) => s.site), interleavedOrder(stores, 7).map((s) => s.site));
});

test('quotas split the total evenly and subtract stores already in the study', () => {
  assert.deepEqual(stratumQuotas(40, [{ stratum: 'light' }, { stratum: 'light' }, { stratum: 'heavy' }]), { light: 12, medium: 13, heavy: 12 });
});

test('probe rejects error, cross-host, gated and non-Shopify pages', () => {
  const page = (status, url, body = '<link href="//cdn.shopify.com/x.css">') => ({ status, finalUrl: new URL(url), body });
  assert.equal(pageProblem('a.com', page(200, 'https://www.a.com/')), null);
  assert.equal(pageProblem('a.com', page(404, 'https://a.com/')), 'http_404');
  assert.equal(pageProblem('a.com', page(200, 'https://google.com/')), 'cross_host_redirect');
  assert.equal(pageProblem('a.com', page(200, 'https://a.com/password')), 'storefront_blocked');
  assert.equal(pageProblem('a.com', page(200, 'https://a.com/', '<html></html>')), 'not_shopify');
});
