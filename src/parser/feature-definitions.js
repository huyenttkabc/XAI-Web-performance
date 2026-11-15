// NGUỒN SỰ THẬT DUY NHẤT cho mọi cột dataset (protocol v1.0, FROZEN 06/10/2026; amendment 09/10/2026).
// Parser gọi `extract(lhr, traceMetrics)`; scripts/build-data-dictionary.js dùng các trường còn lại.
//
// role:       metadata | target | feature | diagnostic (giữ để phân tích, không bao giờ vào X)
// family:     structural (trang gửi về những gì — biết được từ HTML / crawl công khai) | runtime (trình duyệt làm gì)
// group:      cause group cho grouped SHAP — main_thread_js | dom_layout | lcp_resource | render_blocking | third_party,
//             `server` (không có fault ở testbed: hằng số trên localhost, không tính vào xếp hạng RQ3),
//             hoặc `mixed` cho các tổng toàn trang mà cơ chế nào cũng làm thay đổi (không tính vào điểm nhóm ở RQ3)
// excludeFor: các target mà feature này là leakage (tính từ cùng sự kiện / cùng ngưỡng với target đó)
import {
  auditValue, auditItems, resourceSummary, mainThreadGroup, originCount, auditFieldSum, lcpHasResource, lcpDiscoveryFailure,
} from './lighthouse-report-readers.js';

const TBT_TARGETS = ['tbt_30s_ms', 'lh_tbt_ms'];

export const METADATA_COLUMNS = [
  { name: 'measurement_id', description: 'SHA-1 of batch|url|run (testbed URL carries the fault condition) — unique row key' },
  { name: 'batch_id', description: 'ISO timestamp of the collection invocation' },
  { name: 'site', description: 'site identifier (domain, or "testbed"); grouping key for GroupKFold and the lockbox' },
  { name: 'site_type', description: 'shopify_storefront | controlled_testbed | shopify_staging' },
  { name: 'page_type', description: 'home | product' },
  { name: 'url', description: 'requested URL (fault parameters included for testbed)' },
  { name: 'final_url', description: 'main document URL after redirects' },
  { name: 'fault_id', description: 'injected fault id ("none" = baseline / observational)' },
  { name: 'fault_dose', description: 'fault severity in the fault unit (see fault catalog)' },
  { name: 'fault_unit', description: 'unit of fault_dose' },
  { name: 'severity_level', description: '0 = baseline, 1–3 = low/medium/high' },
  { name: 'cause_group', description: 'ground-truth cause group of the fault ("none" for baseline/observational) — NEVER a feature' },
  { name: 'run', description: 'repetition index within one condition' },
  { name: 'order_index', description: 'position in the randomised (seeded) measurement order' },
  { name: 'profile_id', description: 'measurement profile, e.g. mobile_cpu4x_slow4g_cold' },
  { name: 'collected_at', unit: 'ISO time', description: 'Lighthouse fetchTime' },
  { name: 'lighthouse_version', description: 'Lighthouse version' },
  { name: 'chrome_user_agent', description: 'host Chrome user agent (browser version)' },
  { name: 'benchmark_index', description: 'Lighthouse host CPU benchmark — for noise analysis, never a feature' },
  { name: 'shopify_detected', description: 'Shopify CDN assets seen in network requests (validity rule V3)' },
  { name: 'status', description: 'ok | invalid (failed a validity rule) | error (no report)' },
  { name: 'quality_flags', description: 'validity failures (cross_host_redirect, http_error, not_shopify, host_contention) and missing-metric codes' },
  { name: 'error_message', description: 'Lighthouse runtime error or exception message' },
  { name: 'raw_path', description: 'folder with lhr.json.gz + trace.json.gz + context.json' },
];

export const TARGET_COLUMNS = [
  { name: 'lh_lcp_ms', unit: 'ms', tier: 'primary', description: 'Largest Contentful Paint', extract: (l) => auditValue(l, 'largest-contentful-paint') },
  { name: 'tbt_30s_ms', unit: 'ms', tier: 'primary', description: 'blocking time Σmax(0,d−50) of top-level main-thread tasks in [FCP, navStart+30 s], from the raw trace', extract: (l, t) => t.tbt_30s_ms },
  { name: 'lh_tbt_ms', unit: 'ms', tier: 'secondary', description: 'Lighthouse TBT (window FCP→TTI; missing when TTI not reached)', extract: (l) => auditValue(l, 'total-blocking-time') },
  { name: 'lh_fcp_ms', unit: 'ms', tier: 'secondary', description: 'First Contentful Paint', extract: (l) => auditValue(l, 'first-contentful-paint') },
  { name: 'lh_si_ms', unit: 'ms', tier: 'secondary', description: 'Speed Index', extract: (l) => auditValue(l, 'speed-index') },
  { name: 'lh_cls', unit: 'score', tier: 'secondary', description: 'Cumulative Layout Shift', extract: (l) => auditValue(l, 'cumulative-layout-shift') },
  { name: 'lh_perf_score', unit: '0–1', tier: 'secondary', description: 'Lighthouse performance score (composite)', extract: (l) => l?.categories?.performance?.score ?? null },
];

const feature = (family) => (name, group, unit, source, description, extract, excludeFor = []) =>
  ({ name, family, group, unit, source, description, extract, excludeFor });
const structural = feature('structural');
const runtime = feature('runtime');

export const FEATURE_COLUMNS = [
  // Bộ S — structural (15)
  structural('request_count', 'mixed', 'count', 'resource-summary', 'total network requests', (l) => resourceSummary(l, 'total', 'requestCount')),
  structural('transfer_bytes_total', 'mixed', 'bytes', 'resource-summary', 'total transferred bytes', (l) => resourceSummary(l, 'total', 'transferSize')),
  structural('script_requests', 'main_thread_js', 'count', 'resource-summary', 'JavaScript requests', (l) => resourceSummary(l, 'script', 'requestCount')),
  structural('script_bytes', 'main_thread_js', 'bytes', 'resource-summary', 'JavaScript transferred bytes', (l) => resourceSummary(l, 'script', 'transferSize')),
  structural('stylesheet_bytes', 'render_blocking', 'bytes', 'resource-summary', 'CSS transferred bytes', (l) => resourceSummary(l, 'stylesheet', 'transferSize')),
  structural('image_bytes', 'lcp_resource', 'bytes', 'resource-summary', 'image transferred bytes', (l) => resourceSummary(l, 'image', 'transferSize')),
  structural('font_bytes', 'render_blocking', 'bytes', 'resource-summary', 'web-font transferred bytes', (l) => resourceSummary(l, 'font', 'transferSize')),
  structural('document_bytes', 'dom_layout', 'bytes', 'resource-summary', 'HTML transferred bytes', (l) => resourceSummary(l, 'document', 'transferSize')),
  structural('third_party_requests', 'third_party', 'count', 'resource-summary', 'requests to third-party entities', (l) => resourceSummary(l, 'third-party', 'requestCount')),
  structural('third_party_bytes', 'third_party', 'bytes', 'resource-summary', 'bytes from third-party entities', (l) => resourceSummary(l, 'third-party', 'transferSize')),
  structural('origin_count', 'third_party', 'count', 'network-requests', 'distinct hosts contacted', (l) => originCount(l)),
  structural('dom_elements', 'dom_layout', 'count', 'dom-size', 'number of DOM elements', (l) => auditValue(l, 'dom-size')),
  // Amendment 09/10/2026: thuộc tính markup của phần tử LCP (nguyên nhân load delay của LCP); 0/1, đọc được từ HTML
  structural('lcp_has_resource', 'lcp_resource', '0/1', 'lcp-breakdown-insight', 'LCP element loads a resource (image/video/background) rather than text', (l) => lcpHasResource(l)),
  structural('lcp_lazy_loaded', 'lcp_resource', '0/1', 'lcp-discovery-insight', 'LCP resource has loading="lazy" (0 for text LCP)', (l) => lcpDiscoveryFailure(l, 'eagerlyLoaded')),
  structural('lcp_not_discoverable', 'lcp_resource', '0/1', 'lcp-discovery-insight', 'LCP resource not discoverable in the initial HTML, e.g. injected by JS (0 for text LCP)', (l) => lcpDiscoveryFailure(l, 'requestDiscoverable')),

  // Bộ R — runtime (15)
  runtime('mt_script_eval_ms', 'main_thread_js', 'ms', 'mainthread-work-breakdown', 'script evaluation time (all tasks, no 50 ms threshold)', (l) => mainThreadGroup(l, 'scriptEvaluation')),
  runtime('mt_script_parse_ms', 'main_thread_js', 'ms', 'mainthread-work-breakdown', 'script parse & compile time', (l) => mainThreadGroup(l, 'scriptParseCompile')),
  runtime('mt_gc_ms', 'main_thread_js', 'ms', 'mainthread-work-breakdown', 'garbage collection time', (l) => mainThreadGroup(l, 'garbageCollection')),
  runtime('mt_style_layout_ms', 'dom_layout', 'ms', 'mainthread-work-breakdown', 'style recalculation & layout time', (l) => mainThreadGroup(l, 'styleLayout')),
  runtime('mt_rendering_ms', 'dom_layout', 'ms', 'mainthread-work-breakdown', 'paint, composite & render time', (l) => mainThreadGroup(l, 'paintCompositeRender')),
  runtime('mt_parse_html_ms', 'mixed', 'ms', 'mainthread-work-breakdown', 'HTML & CSS parsing time (moved by DOM and by CSS faults)', (l) => mainThreadGroup(l, 'parseHTML')),
  runtime('render_blocking_count', 'render_blocking', 'count', 'render-blocking-insight', 'render-blocking requests finishing before first paint (0 if none)', (l) => (l?.audits?.['render-blocking-insight']?.scoreDisplayMode === 'notApplicable' ? 0 : auditItems(l, 'render-blocking-insight')?.length ?? null)),
  runtime('bootup_js_ms', 'main_thread_js', 'ms', 'bootup-time', 'CPU time of JavaScript per script, summed', (l) => auditValue(l, 'bootup-time')),
  runtime('third_party_main_thread_ms', 'third_party', 'ms', 'third-party-summary', 'main-thread time of third-party scripts (0 if none; null if audit failed)', (l) => auditFieldSum(l, 'third-party-summary', 'mainThreadTime')),
  runtime('unused_js_bytes', 'main_thread_js', 'bytes', 'unused-javascript', 'estimated unused JS transfer bytes (scripts wasting > 20 KiB only)', (l) => l?.audits?.['unused-javascript']?.details?.overallSavingsBytes ?? null),
  runtime('unused_css_bytes', 'render_blocking', 'bytes', 'unused-css-rules', 'estimated unused CSS transfer bytes (above Lighthouse threshold)', (l) => l?.audits?.['unused-css-rules']?.details?.overallSavingsBytes ?? null),
  // Amendment 09/10/2026: thời gian server xử lý tài liệu chính; KHÔNG gồm RTT giả lập 562,5 ms
  runtime('server_response_time_ms', 'server', 'ms', 'server-response-time', 'main-document server response time (emulated network latency excluded)', (l) => auditValue(l, 'server-response-time')),
  runtime('trace_long_task_count', 'main_thread_js', 'count', 'raw trace', 'top-level tasks ≥ 50 ms in [navStart, +30 s]', (l, t) => t.trace_long_task_count, TBT_TARGETS),
  runtime('trace_long_task_total_ms', 'main_thread_js', 'ms', 'raw trace', 'total duration of those long tasks', (l, t) => t.trace_long_task_total_ms, TBT_TARGETS),
  runtime('trace_long_task_max_ms', 'main_thread_js', 'ms', 'raw trace', 'longest top-level task', (l, t) => t.trace_long_task_max_ms, TBT_TARGETS),
];

/** Chỉ để phân tích: là tổng chính xác hoặc ước lượng bằng mô hình của target. */
export const DIAGNOSTIC_COLUMNS = [
  { name: 'trace_window_end_ms', unit: 'ms', description: 'end of the tbt_30s_ms window after navigationStart: min(30 s, end of trace)', extract: (l, t) => t.trace_window_end_ms },
  { name: 'mt_total_ms', unit: 'ms', description: 'total main-thread work = sum of mt_* groups (perfectly collinear)', extract: (l) => auditValue(l, 'mainthread-work-breakdown') },
  { name: 'render_blocking_fcp_savings_ms', unit: 'ms', description: 'Lighthouse-simulated FCP saving — a model estimate of a target, not a page property', extract: (l) => l?.audits?.['render-blocking-insight']?.metricSavings?.FCP ?? null },
];

export const ALL_COLUMNS = [
  ...METADATA_COLUMNS.map((c) => ({ ...c, role: 'metadata' })),
  ...TARGET_COLUMNS.map((c) => ({ ...c, role: 'target' })),
  ...FEATURE_COLUMNS.map((c) => ({ ...c, role: 'feature' })),
  ...DIAGNOSTIC_COLUMNS.map((c) => ({ ...c, role: 'diagnostic' })),
];
