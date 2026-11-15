# Data dictionary — pilot dataset v0.1

> Sinh tự động bởi `npm run dictionary` từ `src/parser/feature-definitions.js`. Không sửa tay.
> Dataset: `data/processed/pilot-dataset.csv` · grain: 1 dòng = 1 lần đo (url × fault condition × run) · fill rate tính trên 28 dòng status=ok.

## Metadata (không đưa vào X) — 21 cột

| cột | đơn vị | mô tả | fill rate |
|---|---|---|---|
| `measurement_id` |  | SHA-1 of batch|url|run (testbed URL carries the fault parameters) — unique row key | 100% |
| `batch_id` |  | ISO timestamp of the pilot invocation | 100% |
| `site` |  | site identifier (domain or "testbed"); grouping key for GroupKFold | 100% |
| `site_type` |  | shopify_storefront | controlled_testbed | shopify_staging | 100% |
| `page_type` |  | home | product | 100% |
| `url` |  | requested URL (fault parameters included for testbed) | 100% |
| `final_url` |  | URL after redirects | 100% |
| `fault_id` |  | injected fault id, "none" for baseline | 100% |
| `fault_dose_ms` | ms | busy-wait length of each injected task (0 = baseline) | 100% |
| `fault_count` | count | number of injected tasks | 100% |
| `cause_group` |  | ground-truth cause group of the fault ("none" for baseline/observational) | 100% |
| `run` |  | repetition index within one condition | 100% |
| `profile_id` |  | measurement profile, e.g. mobile_cpu4x_slow4g | 100% |
| `collected_at` | ISO time | Lighthouse fetchTime | 100% |
| `lighthouse_version` |  | Lighthouse version | 100% |
| `chrome_user_agent` |  | host Chrome user agent (browser version) | 100% |
| `status` |  | ok | error | 100% |
| `quality_flags` |  | Lighthouse error codes of missing targets (e.g. lh_tbt_ms missing because TTI was never reached) and load_timeout | 14% |
| `order_index` |  | position in the randomised measurement order (seeded) | 100% |
| `error_message` |  | Lighthouse runtime error or exception message | 0% |
| `raw_path` |  | folder with lhr.json.gz + trace.json.gz | 100% |

## Outcomes / nhãn Y — 6 cột

| cột | đơn vị | mô tả | fill rate |
|---|---|---|---|
| `lh_lcp_ms` | ms | Largest Contentful Paint (primary outcome) | 100% |
| `lh_tbt_ms` | ms | Total Blocking Time (primary outcome) | 96% |
| `lh_fcp_ms` | ms | First Contentful Paint | 100% |
| `lh_si_ms` | ms | Speed Index | 100% |
| `lh_cls` | score | Cumulative Layout Shift | 100% |
| `lh_perf_score` | 0–1 | Lighthouse performance score (composite, secondary) | 96% |

## Features / X — 28 cột

| cột | family | cause group | đơn vị | nguồn (LH audit) | mô tả | fill rate | rủi ro leakage |
|---|---|---|---|---|---|---|---|
| `request_count` | structural | third_party | count | resource-summary | total network requests | 100% |  |
| `transfer_bytes_total` | structural | heavy_media | bytes | resource-summary | total transferred bytes | 100% |  |
| `script_requests` | structural | main_thread_js | count | resource-summary | JavaScript requests | 100% |  |
| `script_bytes` | structural | main_thread_js | bytes | resource-summary | JavaScript transferred bytes | 100% |  |
| `stylesheet_bytes` | structural | render_blocking | bytes | resource-summary | CSS transferred bytes | 100% |  |
| `image_bytes` | structural | heavy_media | bytes | resource-summary | image transferred bytes | 100% |  |
| `font_bytes` | structural | render_blocking | bytes | resource-summary | web-font transferred bytes | 100% |  |
| `document_bytes` | structural | dom_complexity | bytes | resource-summary | HTML transferred bytes | 100% |  |
| `third_party_requests` | structural | third_party | count | resource-summary | requests to third-party entities | 100% |  |
| `third_party_bytes` | structural | third_party | bytes | resource-summary | bytes from third-party entities | 100% |  |
| `origin_count` | structural | third_party | count | network-requests | distinct hosts contacted | 100% |  |
| `dom_elements` | structural | dom_complexity | count | dom-size | number of DOM elements | 100% |  |
| `mt_total_ms` | runtime | main_thread_js | ms | mainthread-work-breakdown | total main-thread work | 93% | derived from the same main-thread tasks as TBT — exclude when target = lh_tbt_ms |
| `mt_script_eval_ms` | runtime | main_thread_js | ms | mainthread-work-breakdown | script evaluation time | 93% | derived from the same main-thread tasks as TBT — exclude when target = lh_tbt_ms |
| `mt_script_parse_ms` | runtime | main_thread_js | ms | mainthread-work-breakdown | script parse & compile time | 93% |  |
| `mt_style_layout_ms` | runtime | dom_complexity | ms | mainthread-work-breakdown | style recalculation & layout time | 93% |  |
| `mt_rendering_ms` | runtime | dom_complexity | ms | mainthread-work-breakdown | paint, composite & render time | 93% |  |
| `mt_parse_html_ms` | runtime | dom_complexity | ms | mainthread-work-breakdown | HTML & CSS parsing time | 93% |  |
| `mt_gc_ms` | runtime | main_thread_js | ms | mainthread-work-breakdown | garbage collection time | 93% |  |
| `bootup_js_ms` | runtime | main_thread_js | ms | bootup-time | CPU time spent on JavaScript (all scripts) | 93% | derived from the same main-thread tasks as TBT — exclude when target = lh_tbt_ms |
| `long_task_count` | runtime | main_thread_js | count | main-thread-tasks | top-level tasks ≥ 50 ms (whole trace, uncapped) | 93% | derived from the same main-thread tasks as TBT — exclude when target = lh_tbt_ms |
| `long_task_total_ms` | runtime | main_thread_js | ms | main-thread-tasks | sum of durations of tasks ≥ 50 ms | 93% | derived from the same main-thread tasks as TBT — exclude when target = lh_tbt_ms |
| `long_task_max_ms` | runtime | main_thread_js | ms | main-thread-tasks | longest top-level task | 93% | derived from the same main-thread tasks as TBT — exclude when target = lh_tbt_ms |
| `third_party_main_thread_ms` | runtime | third_party | ms | third-party-summary | main-thread time of third-party scripts (0 if no third party; null if audit failed) | 89% |  |
| `render_blocking_count` | runtime | render_blocking | count | render-blocking-insight | render-blocking requests | 100% |  |
| `render_blocking_fcp_savings_ms` | runtime | render_blocking | ms | render-blocking-insight | estimated FCP saving if render-blocking removed | 96% |  |
| `unused_js_bytes` | runtime | main_thread_js | bytes | unused-javascript | estimated transfer bytes of unused JS, only scripts wasting > 20 KiB (Lighthouse threshold) | 100% |  |
| `unused_css_bytes` | runtime | render_blocking | bytes | unused-css-rules | estimated transfer bytes of unused CSS, only above Lighthouse threshold | 100% |  |
