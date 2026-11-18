import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMeasurement } from '../src/parser/lighthouse-report-parser.js';

const lhr = {
  lighthouseVersion: '12.8.2',
  fetchTime: '2026-10-04T00:00:00.000Z',
  requestedUrl: 'https://shop.example.com/',
  mainDocumentUrl: 'https://www.shop.example.com/',
  environment: { hostUserAgent: 'HeadlessChrome/154', benchmarkIndex: 1500 },
  categories: { performance: { score: 0.9 } },
  audits: {
    'largest-contentful-paint': { numericValue: 2000 },
    'first-contentful-paint': { numericValue: 1000 },
    'total-blocking-time': { numericValue: 600 },
    'resource-summary': { details: { items: [
      { resourceType: 'total', requestCount: 5, transferSize: 4000 },
      { resourceType: 'script', requestCount: 2, transferSize: 1600 },
    ] } },
    'third-party-summary': { scoreDisplayMode: 'notApplicable' },
    'speed-index': { errorMessage: 'Too slow (NO_TTI_CPU_IDLE_PERIOD)' },
    'mainthread-work-breakdown': { numericValue: 1200, details: { items: [{ group: 'scriptEvaluation', duration: 1000 }] } },
    'network-requests': { details: { items: [
      { url: 'https://www.shop.example.com/', statusCode: 200 },
      { url: 'https://cdn.shopify.com/s/files/theme.js' },
      { url: 'https://pixel.example.net/b?u=cdn.shopify.com/cdn/shop/x' },
      { url: 'data:image/png;base64,x' },
    ] } },
  },
};

const storefront = { site: 'shop.example.com', site_type: 'shopify_storefront', run: 1 };

test('extracts targets, features and diagnostics from a report', () => {
  const row = parseMeasurement(lhr, storefront);
  assert.equal(row.status, 'ok');
  assert.equal(row.lh_lcp_ms, 2000);
  assert.equal(row.lh_tbt_ms, 600);
  assert.equal(row.lh_perf_score, 0.9);
  assert.equal(row.script_bytes, 1600);
  assert.equal(row.mt_script_eval_ms, 1000);
  assert.equal(row.mt_gc_ms, 0); // breakdown present but group absent → 0
  assert.equal(row.mt_total_ms, 1200); // diagnostic column, not a feature
  assert.equal(row.origin_count, 3); // data: URL ignored
  assert.equal(row.third_party_main_thread_ms, 0); // no third party → 0, not null
  assert.equal(row.benchmark_index, 1500);
  assert.equal(row.shopify_detected, true);
  assert.equal(row.quality_flags, 'speed-index:NO_TTI_CPU_IDLE_PERIOD');
  assert.equal(row.tbt_30s_ms, null); // no trace supplied
});

test('missing audits become null, not zero', () => {
  const row = parseMeasurement(lhr, storefront);
  assert.equal(row.dom_elements, null);
  assert.equal(row.unused_js_bytes, null);
});

test('validity rules: cross-origin redirect and non-Shopify storefront are invalid', () => {
  const redirected = parseMeasurement({ ...lhr, mainDocumentUrl: 'https://www.google.com/' }, storefront);
  assert.equal(redirected.status, 'invalid');
  assert.match(redirected.quality_flags, /cross_host_redirect/);
  const jsRedirect = parseMeasurement({ ...lhr, finalDisplayedUrl: 'https://www.google.com/' }, storefront);
  assert.match(jsRedirect.quality_flags, /cross_host_redirect/); // displayed URL is checked too
  assert.equal(parseMeasurement({ ...lhr, requestedUrl: 'https://example.com/' }, storefront).status, 'ok'); // apex ↔ subdomain
  assert.match(parseMeasurement({ ...lhr, mainDocumentUrl: 'https://www.shop.example.com/password' }, storefront).quality_flags, /storefront_blocked/);

  const noShopify = { ...lhr, audits: { ...lhr.audits, 'network-requests': { details: { items: [
    { url: 'https://www.shop.example.com/', statusCode: 200 },
    { url: 'https://pixel.example.net/b?u=cdn.shopify.com/cdn/shop/x' }, // substring only → not Shopify
  ] } } } };
  assert.match(parseMeasurement(noShopify, storefront).quality_flags, /not_shopify/);
  assert.equal(parseMeasurement(noShopify, { site_type: 'controlled_testbed' }).status, 'ok'); // V3 only for storefronts
});

test('runtime error and missing report give status=error', () => {
  assert.equal(parseMeasurement(null, {}).status, 'error');
  const failed = parseMeasurement({ ...lhr, runtimeError: { code: 'NO_FCP', message: 'no paint' } }, {});
  assert.equal(failed.status, 'error');
  assert.match(failed.error_message, /NO_FCP/);
});

test('LCP-element and server-response features (amendment 2026-10-09)', () => {
  const breakdown = (subparts) => ({ details: { type: 'list', items: [{ type: 'table', items: subparts.map((subpart) => ({ subpart, duration: 1 })) }] } });
  const discovery = (checks) => ({ details: { type: 'list', items: [{ type: 'checklist', items: Object.fromEntries(Object.entries(checks).map(([k, v]) => [k, { value: v }])) }] } });
  const image = parseMeasurement({ ...lhr, audits: { ...lhr.audits,
    'server-response-time': { numericValue: 36.5 },
    'lcp-breakdown-insight': breakdown(['timeToFirstByte', 'resourceLoadDelay', 'resourceLoadDuration', 'elementRenderDelay']),
    'lcp-discovery-insight': discovery({ eagerlyLoaded: false, requestDiscoverable: true, priorityHinted: false }),
  } }, storefront);
  assert.equal(image.server_response_time_ms, 36.5);
  assert.equal(image.lcp_has_resource, 1);
  assert.equal(image.lcp_lazy_loaded, 1); // check failed → 1
  assert.equal(image.lcp_not_discoverable, 0);

  const text = parseMeasurement({ ...lhr, audits: { ...lhr.audits,
    'lcp-breakdown-insight': breakdown(['timeToFirstByte', 'elementRenderDelay']),
    'lcp-discovery-insight': { scoreDisplayMode: 'notApplicable' },
  } }, storefront);
  assert.deepEqual([text.lcp_has_resource, text.lcp_lazy_loaded, text.lcp_not_discoverable], [0, 0, 0]); // text LCP: nothing to lazy-load

  const missing = parseMeasurement(lhr, storefront); // insights absent → null, not 0
  assert.deepEqual([missing.server_response_time_ms, missing.lcp_has_resource, missing.lcp_lazy_loaded], [null, null, null]);
});

test('LCP-resource features: size, priority and competing bytes of THE LCP request (amendment 2026-10-09 (5))', () => {
  const breakdown = (subparts) => ({ details: { type: 'list', items: [{ type: 'table', items: subparts.map((subpart) => ({ subpart, duration: 1 })) }] } });
  const imageLcp = breakdown(['timeToFirstByte', 'resourceLoadDelay', 'resourceLoadDuration', 'elementRenderDelay']);
  const requests = { details: { items: [
    { url: 'https://www.shop.example.com/', statusCode: 200, networkRequestTime: 0, transferSize: 50_000 },
    { url: 'https://cdn.shopify.com/s/files/theme.js', networkRequestTime: 100, transferSize: 300_000 },
    { url: 'https://cdn.shopify.com/hero.jpg', networkRequestTime: 400, transferSize: 120_000, priority: 'Low' },
    { url: 'https://cdn.shopify.com/below-fold.jpg', networkRequestTime: 900, transferSize: 900_000 },
  ] } };
  const withLcp = (extra) => ({ ...lhr, audits: { ...lhr.audits, 'network-requests': requests, ...extra } });
  const prioritize = { details: { debugData: { initiatorPath: [{ url: 'https://cdn.shopify.com/hero.jpg' }, { url: 'https://www.shop.example.com/' }] } } };

  const image = parseMeasurement(withLcp({ 'lcp-breakdown-insight': imageLcp, 'prioritize-lcp-image': prioritize }), storefront);
  assert.equal(image.lcp_resource_bytes, 120_000); // the LCP image only, not all images
  assert.equal(image.lcp_request_low_priority, 1);
  assert.equal(image.bytes_before_lcp_request, 350_000); // document + script started earlier

  const text = parseMeasurement(withLcp({ 'lcp-breakdown-insight': breakdown(['timeToFirstByte', 'elementRenderDelay']) }), storefront);
  assert.deepEqual([text.lcp_resource_bytes, text.lcp_request_low_priority, text.bytes_before_lcp_request], [0, 0, null]);

  const unknown = parseMeasurement(withLcp({ 'lcp-breakdown-insight': imageLcp }), storefront); // URL not recorded
  assert.deepEqual([unknown.lcp_resource_bytes, unknown.lcp_request_low_priority], [null, null]);
});
