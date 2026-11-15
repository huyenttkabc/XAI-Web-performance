# Data dictionary — protocol v1.0

> Sinh tự động bởi `npm run dictionary` từ `src/parser/feature-definitions.js`. Không sửa tay.
> Dataset: `data/processed/pilot-dataset.csv` · grain: 1 dòng = 1 lần đo (url × điều kiện × run) · fill rate tính trên 203 dòng status=ok.

## Metadata (không bao giờ vào X) — 24 cột

| cột | đơn vị | mô tả | fill rate |
|---|---|---|---|
| `measurement_id` |  | SHA-1 of batch|url|run (testbed URL carries the fault condition) — unique row key | 100% |
| `batch_id` |  | ISO timestamp of the collection invocation | 100% |
| `site` |  | site identifier (domain, or "testbed"); grouping key for GroupKFold and the lockbox | 100% |
| `site_type` |  | shopify_storefront | controlled_testbed | shopify_staging | 100% |
| `page_type` |  | home | product | 100% |
| `url` |  | requested URL (fault parameters included for testbed) | 100% |
| `final_url` |  | main document URL after redirects | 100% |
| `fault_id` |  | injected fault id ("none" = baseline / observational) | 100% |
| `fault_dose` |  | fault severity in the fault unit (see fault catalog) | 100% |
| `fault_unit` |  | unit of fault_dose | 81% |
| `severity_level` |  | 0 = baseline, 1–3 = low/medium/high | 100% |
| `cause_group` |  | ground-truth cause group of the fault ("none" for baseline/observational) — NEVER a feature | 100% |
| `run` |  | repetition index within one condition | 100% |
| `order_index` |  | position in the randomised (seeded) measurement order | 100% |
| `profile_id` |  | measurement profile, e.g. mobile_cpu4x_slow4g_cold | 100% |
| `collected_at` | ISO time | Lighthouse fetchTime | 100% |
| `lighthouse_version` |  | Lighthouse version | 100% |
| `chrome_user_agent` |  | host Chrome user agent (browser version) | 100% |
| `benchmark_index` |  | Lighthouse host CPU benchmark — for noise analysis, never a feature | 100% |
| `shopify_detected` |  | Shopify CDN assets seen in network requests (validity rule V3) | 100% |
| `status` |  | ok | invalid (failed a validity rule) | error (no report) | 100% |
| `quality_flags` |  | validity failures (cross_host_redirect, http_error, not_shopify, host_contention) and missing-metric codes | 6% |
| `error_message` |  | Lighthouse runtime error or exception message | 0% |
| `raw_path` |  | folder with lhr.json.gz + trace.json.gz + context.json | 100% |

## Outcomes / nhãn Y — 7 cột

| cột | tier | đơn vị | mô tả | fill rate |
|---|---|---|---|---|
| `lh_lcp_ms` | primary | ms | Largest Contentful Paint | 100% |
| `tbt_30s_ms` | primary | ms | blocking time Σmax(0,d−50) of top-level main-thread tasks in [FCP, navStart+30 s], from the raw trace | 100% |
| `lh_tbt_ms` | secondary | ms | Lighthouse TBT (window FCP→TTI; missing when TTI not reached) | 98% |
| `lh_fcp_ms` | secondary | ms | First Contentful Paint | 100% |
| `lh_si_ms` | secondary | ms | Speed Index | 100% |
| `lh_cls` | secondary | score | Cumulative Layout Shift | 100% |
| `lh_perf_score` | secondary | 0–1 | Lighthouse performance score (composite) | 98% |

## Predictors / X (danh sách chính thức v1.0) — 26 cột

| cột | family | cause group | đơn vị | nguồn | mô tả | fill rate | loại khỏi X khi target là |
|---|---|---|---|---|---|---|---|
| `request_count` | structural | mixed | count | resource-summary | total network requests | 100% |  |
| `transfer_bytes_total` | structural | mixed | bytes | resource-summary | total transferred bytes | 100% |  |
| `script_requests` | structural | main_thread_js | count | resource-summary | JavaScript requests | 100% |  |
| `script_bytes` | structural | main_thread_js | bytes | resource-summary | JavaScript transferred bytes | 100% |  |
| `stylesheet_bytes` | structural | render_blocking | bytes | resource-summary | CSS transferred bytes | 100% |  |
| `image_bytes` | structural | lcp_resource | bytes | resource-summary | image transferred bytes | 100% |  |
| `font_bytes` | structural | render_blocking | bytes | resource-summary | web-font transferred bytes | 100% |  |
| `document_bytes` | structural | dom_layout | bytes | resource-summary | HTML transferred bytes | 100% |  |
| `third_party_requests` | structural | third_party | count | resource-summary | requests to third-party entities | 100% |  |
| `third_party_bytes` | structural | third_party | bytes | resource-summary | bytes from third-party entities | 100% |  |
| `origin_count` | structural | third_party | count | network-requests | distinct hosts contacted | 100% |  |
| `dom_elements` | structural | dom_layout | count | dom-size | number of DOM elements | 100% |  |
| `mt_script_eval_ms` | runtime | main_thread_js | ms | mainthread-work-breakdown | script evaluation time (all tasks, no 50 ms threshold) | 100% |  |
| `mt_script_parse_ms` | runtime | main_thread_js | ms | mainthread-work-breakdown | script parse & compile time | 100% |  |
| `mt_gc_ms` | runtime | main_thread_js | ms | mainthread-work-breakdown | garbage collection time | 100% |  |
| `mt_style_layout_ms` | runtime | dom_layout | ms | mainthread-work-breakdown | style recalculation & layout time | 100% |  |
| `mt_rendering_ms` | runtime | dom_layout | ms | mainthread-work-breakdown | paint, composite & render time | 100% |  |
| `mt_parse_html_ms` | runtime | mixed | ms | mainthread-work-breakdown | HTML & CSS parsing time (moved by DOM and by CSS faults) | 100% |  |
| `render_blocking_count` | runtime | render_blocking | count | render-blocking-insight | render-blocking requests finishing before first paint (0 if none) | 100% |  |
| `bootup_js_ms` | runtime | main_thread_js | ms | bootup-time | CPU time of JavaScript per script, summed | 100% |  |
| `third_party_main_thread_ms` | runtime | third_party | ms | third-party-summary | main-thread time of third-party scripts (0 if none; null if audit failed) | 98% |  |
| `unused_js_bytes` | runtime | main_thread_js | bytes | unused-javascript | estimated unused JS transfer bytes (scripts wasting > 20 KiB only) | 100% |  |
| `unused_css_bytes` | runtime | render_blocking | bytes | unused-css-rules | estimated unused CSS transfer bytes (above Lighthouse threshold) | 100% |  |
| `trace_long_task_count` | runtime | main_thread_js | count | raw trace | top-level tasks ≥ 50 ms in [navStart, +30 s] | 100% | tbt_30s_ms, lh_tbt_ms |
| `trace_long_task_total_ms` | runtime | main_thread_js | ms | raw trace | total duration of those long tasks | 100% | tbt_30s_ms, lh_tbt_ms |
| `trace_long_task_max_ms` | runtime | main_thread_js | ms | raw trace | longest top-level task | 100% | tbt_30s_ms, lh_tbt_ms |

## Diagnostic (chỉ để phân tích, không vào X) — 3 cột

| cột | đơn vị | mô tả | fill rate |
|---|---|---|---|
| `trace_window_end_ms` | ms | end of the tbt_30s_ms window after navigationStart: min(30 s, end of trace) | 100% |
| `mt_total_ms` | ms | total main-thread work = sum of mt_* groups (perfectly collinear) | 100% |
| `render_blocking_fcp_savings_ms` | ms | Lighthouse-simulated FCP saving — a model estimate of a target, not a page property | 100% |
