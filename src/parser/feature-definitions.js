// NGUỒN SỰ THẬT DUY NHẤT cho mọi cột dataset: parser dùng `extract`,
// scripts/build-data-dictionary.js dùng các trường còn lại để sinh docs/data-dictionary.md.
//
// role:    metadata | target | feature
// family:  structural (trang gửi về những gì — có cả trong dữ liệu công khai) | runtime (trình duyệt làm gì)
// group:   nhóm nguyên nhân dùng cho grouped SHAP (cause_groups trong config/experiment-manifest.json)
// leakage: vì sao feature có thể "rò rỉ" đáp án với một target (tính từ cùng trace events)
import {
  auditValue, auditItems, resourceSummary, mainThreadGroup, longTaskDurations, originCount, auditFieldSum,
} from './lighthouse-report-readers.js';

const SAME_TRACE_AS_TBT = 'derived from the same main-thread tasks as TBT — exclude when target = lh_tbt_ms';

export const METADATA_COLUMNS = [
  { name: 'measurement_id', unit: '', description: 'SHA-1 of batch|url|run (testbed URL carries the fault parameters) — unique row key' },
  { name: 'batch_id', unit: '', description: 'ISO timestamp of the pilot invocation' },
  { name: 'site', unit: '', description: 'site identifier (domain or "testbed"); grouping key for GroupKFold' },
  { name: 'site_type', unit: '', description: 'shopify_storefront | controlled_testbed | shopify_staging' },
  { name: 'page_type', unit: '', description: 'home | product' },
  { name: 'url', unit: '', description: 'requested URL (fault parameters included for testbed)' },
  { name: 'final_url', unit: '', description: 'URL after redirects' },
  { name: 'fault_id', unit: '', description: 'injected fault id, "none" for baseline' },
  { name: 'fault_dose_ms', unit: 'ms', description: 'busy-wait length of each injected task (0 = baseline)' },
  { name: 'fault_count', unit: 'count', description: 'number of injected tasks' },
  { name: 'cause_group', unit: '', description: 'ground-truth cause group of the fault ("none" for baseline/observational)' },
  { name: 'run', unit: '', description: 'repetition index within one condition' },
  { name: 'profile_id', unit: '', description: 'measurement profile, e.g. mobile_cpu4x_slow4g' },
  { name: 'collected_at', unit: 'ISO time', description: 'Lighthouse fetchTime' },
  { name: 'lighthouse_version', unit: '', description: 'Lighthouse version' },
  { name: 'chrome_user_agent', unit: '', description: 'host Chrome user agent (browser version)' },
  { name: 'status', unit: '', description: 'ok | error' },
  { name: 'quality_flags', unit: '', description: 'Lighthouse error codes of missing targets (e.g. lh_tbt_ms missing because TTI was never reached) and load_timeout' },
  { name: 'order_index', unit: '', description: 'position in the randomised measurement order (seeded)' },
  { name: 'error_message', unit: '', description: 'Lighthouse runtime error or exception message' },
  { name: 'raw_path', unit: '', description: 'folder with lhr.json.gz + trace.json.gz' },
];

export const TARGET_COLUMNS = [
  { name: 'lh_lcp_ms', unit: 'ms', description: 'Largest Contentful Paint (primary outcome)', extract: (l) => auditValue(l, 'largest-contentful-paint') },
  { name: 'lh_tbt_ms', unit: 'ms', description: 'Total Blocking Time (primary outcome)', extract: (l) => auditValue(l, 'total-blocking-time') },
  { name: 'lh_fcp_ms', unit: 'ms', description: 'First Contentful Paint', extract: (l) => auditValue(l, 'first-contentful-paint') },
  { name: 'lh_si_ms', unit: 'ms', description: 'Speed Index', extract: (l) => auditValue(l, 'speed-index') },
  { name: 'lh_cls', unit: 'score', description: 'Cumulative Layout Shift', extract: (l) => auditValue(l, 'cumulative-layout-shift') },
  { name: 'lh_perf_score', unit: '0–1', description: 'Lighthouse performance score (composite, secondary)', extract: (l) => l?.categories?.performance?.score ?? null },
];

const structural = (name, group, unit, source, description, extract) =>
  ({ name, family: 'structural', group, unit, source, description, extract });
const runtime = (name, group, unit, source, description, extract, leakage = '') =>
  ({ name, family: 'runtime', group, unit, source, description, extract, leakage });

export const FEATURE_COLUMNS = [
  structural('request_count', 'third_party', 'count', 'resource-summary', 'total network requests', (l) => resourceSummary(l, 'total', 'requestCount')),
  structural('transfer_bytes_total', 'heavy_media', 'bytes', 'resource-summary', 'total transferred bytes', (l) => resourceSummary(l, 'total', 'transferSize')),
  structural('script_requests', 'main_thread_js', 'count', 'resource-summary', 'JavaScript requests', (l) => resourceSummary(l, 'script', 'requestCount')),
  structural('script_bytes', 'main_thread_js', 'bytes', 'resource-summary', 'JavaScript transferred bytes', (l) => resourceSummary(l, 'script', 'transferSize')),
  structural('stylesheet_bytes', 'render_blocking', 'bytes', 'resource-summary', 'CSS transferred bytes', (l) => resourceSummary(l, 'stylesheet', 'transferSize')),
  structural('image_bytes', 'heavy_media', 'bytes', 'resource-summary', 'image transferred bytes', (l) => resourceSummary(l, 'image', 'transferSize')),
  structural('font_bytes', 'render_blocking', 'bytes', 'resource-summary', 'web-font transferred bytes', (l) => resourceSummary(l, 'font', 'transferSize')),
  structural('document_bytes', 'dom_complexity', 'bytes', 'resource-summary', 'HTML transferred bytes', (l) => resourceSummary(l, 'document', 'transferSize')),
  structural('third_party_requests', 'third_party', 'count', 'resource-summary', 'requests to third-party entities', (l) => resourceSummary(l, 'third-party', 'requestCount')),
  structural('third_party_bytes', 'third_party', 'bytes', 'resource-summary', 'bytes from third-party entities', (l) => resourceSummary(l, 'third-party', 'transferSize')),
  structural('origin_count', 'third_party', 'count', 'network-requests', 'distinct hosts contacted', (l) => originCount(l)),
  structural('dom_elements', 'dom_complexity', 'count', 'dom-size', 'number of DOM elements', (l) => auditValue(l, 'dom-size')),

  runtime('mt_total_ms', 'main_thread_js', 'ms', 'mainthread-work-breakdown', 'total main-thread work', (l) => auditValue(l, 'mainthread-work-breakdown'), SAME_TRACE_AS_TBT),
  runtime('mt_script_eval_ms', 'main_thread_js', 'ms', 'mainthread-work-breakdown', 'script evaluation time', (l) => mainThreadGroup(l, 'scriptEvaluation'), SAME_TRACE_AS_TBT),
  runtime('mt_script_parse_ms', 'main_thread_js', 'ms', 'mainthread-work-breakdown', 'script parse & compile time', (l) => mainThreadGroup(l, 'scriptParseCompile')),
  runtime('mt_style_layout_ms', 'dom_complexity', 'ms', 'mainthread-work-breakdown', 'style recalculation & layout time', (l) => mainThreadGroup(l, 'styleLayout')),
  runtime('mt_rendering_ms', 'dom_complexity', 'ms', 'mainthread-work-breakdown', 'paint, composite & render time', (l) => mainThreadGroup(l, 'paintCompositeRender')),
  runtime('mt_parse_html_ms', 'dom_complexity', 'ms', 'mainthread-work-breakdown', 'HTML & CSS parsing time', (l) => mainThreadGroup(l, 'parseHTML')),
  runtime('mt_gc_ms', 'main_thread_js', 'ms', 'mainthread-work-breakdown', 'garbage collection time', (l) => mainThreadGroup(l, 'garbageCollection')),
  runtime('bootup_js_ms', 'main_thread_js', 'ms', 'bootup-time', 'CPU time spent on JavaScript (all scripts)', (l) => auditValue(l, 'bootup-time'), SAME_TRACE_AS_TBT),
  runtime('long_task_count', 'main_thread_js', 'count', 'main-thread-tasks', 'top-level tasks ≥ 50 ms (whole trace, uncapped)', (l) => longTaskDurations(l)?.length ?? null, SAME_TRACE_AS_TBT),
  runtime('long_task_total_ms', 'main_thread_js', 'ms', 'main-thread-tasks', 'sum of durations of tasks ≥ 50 ms', (l) => longTaskDurations(l)?.reduce((a, b) => a + b, 0) ?? null, SAME_TRACE_AS_TBT),
  runtime('long_task_max_ms', 'main_thread_js', 'ms', 'main-thread-tasks', 'longest top-level task', (l) => { const d = longTaskDurations(l); return d ? Math.max(0, ...d) : null; }, SAME_TRACE_AS_TBT),
  runtime('third_party_main_thread_ms', 'third_party', 'ms', 'third-party-summary', 'main-thread time of third-party scripts (0 if no third party; null if audit failed)', (l) => auditFieldSum(l, 'third-party-summary', 'mainThreadTime')),
  runtime('render_blocking_count', 'render_blocking', 'count', 'render-blocking-insight', 'render-blocking requests', (l) => auditItems(l, 'render-blocking-insight')?.length ?? null),
  runtime('render_blocking_fcp_savings_ms', 'render_blocking', 'ms', 'render-blocking-insight', 'estimated FCP saving if render-blocking removed', (l) => l?.audits?.['render-blocking-insight']?.metricSavings?.FCP ?? null),
  runtime('unused_js_bytes', 'main_thread_js', 'bytes', 'unused-javascript', 'estimated transfer bytes of unused JS, only scripts wasting > 20 KiB (Lighthouse threshold)', (l) => l?.audits?.['unused-javascript']?.details?.overallSavingsBytes ?? null),
  runtime('unused_css_bytes', 'render_blocking', 'bytes', 'unused-css-rules', 'estimated transfer bytes of unused CSS, only above Lighthouse threshold', (l) => l?.audits?.['unused-css-rules']?.details?.overallSavingsBytes ?? null),
];

export const ALL_COLUMNS = [
  ...METADATA_COLUMNS.map((c) => ({ ...c, role: 'metadata' })),
  ...TARGET_COLUMNS.map((c) => ({ ...c, role: 'target' })),
  ...FEATURE_COLUMNS.map((c) => ({ ...c, role: 'feature' })),
];
