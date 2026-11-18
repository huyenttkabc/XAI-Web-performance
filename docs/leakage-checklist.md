# Leakage checklist (protocol v1.0)

> Sinh tự động bởi `node scripts/build-leakage-checklist.js` từ `src/parser/feature-definitions.js` và dữ liệu pilot. Không sửa tay.

## A. Luật theo định nghĩa (bắt buộc, kiểm tra bằng code)

| # | Loại leakage | Luật | Trạng thái |
|---|---|---|---|
| L1 | Nhãn nguyên nhân lọt vào X | `fault_id`, `fault_dose`, `severity_level`, `cause_group` là metadata, không bao giờ vào X | ✅ role=metadata (24 cột metadata) |
| L2 | Định danh site/thời gian | `site`, `url`, `run`, `order_index`, `batch_id`, `collected_at`, `benchmark_index` không vào X | ✅ role=metadata |
| L3 | Target làm feature | các outcome khác (LCP, TBT, FCP, SI, CLS, score) không dùng làm X cho nhau | ✅ role=target |
| L4 | Tổng/ước lượng của target | `trace_window_end_ms`, `mt_total_ms`, `render_blocking_fcp_savings_ms` chỉ để phân tích | ✅ role=diagnostic |
| L5 | Cùng sự kiện + cùng ngưỡng với target | xem bảng B (`excludeFor`) | ✅ loại theo từng target |
| L6 | Cùng site ở train và test | GroupKFold theo `site` (k = 5); lockbox ~20% site | ✅ quy tắc băm cố định trong manifest |
| L7 | Lặp lại của cùng điều kiện ở train và test (RQ3) | GroupKFold theo `run`: train 4 lần lặp, giải thích lần còn lại | ✅ manifest `splits.rq3_testbed` |
| L8 | Chọn feature/tham số nhìn vào test | feature selection, tuning chỉ trong inner-CV của fold train | ✅ inner GroupKFold theo site trong fold train (`src/ml/group_cross_validation.py`) |
| L9 | Tiền xử lý fit trên toàn bộ dữ liệu | imputer/scaler fit trong pipeline theo từng fold | ✅ mọi bước tiền xử lý nằm trong sklearn Pipeline (`src/ml/model_specs.py`) |

## B. Loại trừ theo target (`excludeFor`)

| feature | loại khỏi X khi target là | lý do |
|---|---|---|
| `trace_long_task_count` | `tbt_30s_ms`, `lh_tbt_ms` | tính từ cùng các task ≥ 50 ms như TBT |
| `trace_long_task_total_ms` | `tbt_30s_ms`, `lh_tbt_ms` | tính từ cùng các task ≥ 50 ms như TBT |
| `trace_long_task_max_ms` | `tbt_30s_ms`, `lh_tbt_ms` | tính từ cùng các task ≥ 50 ms như TBT |

## C. Sàng lọc thực nghiệm — |ρ Spearman| ≥ 0.95

Dữ liệu: 580 dòng Shopify thật (ok), 174 dòng testbed (ok).
Trên **testbed**, ρ cao với đặc trưng cơ chế là *chủ ý thiết kế* (fault điều khiển trực tiếp cơ chế) → chỉ để tham khảo.
Trên **site thật** (61 site, đã loại lockbox), |ρ| ≥ 0,95 nghĩa là đặc trưng gần như là một phép biến đổi của target → phải xem xét loại.

### Target `lh_lcp_ms`

| feature | family | group | ρ real | ρ testbed | cờ |
|---|---|---|---|---|---|
| `lcp_resource_bytes` | structural | lcp_resource | 0.61 | 0.58 |  |
| `bytes_before_lcp_request` | runtime | mixed | 0.56 | 0.20 |  |
| `image_bytes` | structural | lcp_resource | 0.44 | 0.58 |  |
| `transfer_bytes_total` | structural | mixed | 0.40 | 0.91 |  |
| `lcp_has_resource` | structural | lcp_resource | 0.38 | – |  |
| `lcp_lazy_loaded` | structural | lcp_resource | 0.32 | – |  |
| `third_party_bytes` | structural | third_party | 0.30 | 0.14 |  |
| `mt_script_eval_ms` | runtime | main_thread_js | 0.29 | -0.52 |  |
| `bootup_js_ms` | runtime | main_thread_js | 0.29 | -0.55 |  |
| `mt_gc_ms` | runtime | main_thread_js | 0.29 | -0.02 |  |
| `third_party_main_thread_ms` | runtime | third_party | 0.27 | -0.30 |  |
| `lcp_not_discoverable` | structural | lcp_resource | 0.27 | – |  |
| `origin_count` | structural | third_party | 0.25 | – |  |
| `trace_long_task_count` | runtime | main_thread_js | 0.25 | -0.51 |  |
| `trace_long_task_total_ms` | runtime | main_thread_js | 0.23 | -0.55 |  |
| `font_bytes` | structural | render_blocking | 0.23 | – |  |
| `mt_script_parse_ms` | runtime | main_thread_js | 0.23 | -0.03 |  |
| `script_requests` | structural | main_thread_js | 0.22 | 0.14 |  |
| `server_response_time_ms` | runtime | server | -0.22 | -0.00 |  |
| `request_count` | structural | mixed | 0.21 | 0.14 |  |
| `document_bytes` | structural | dom_layout | 0.20 | -0.06 |  |
| `dom_elements` | structural | dom_layout | 0.19 | -0.06 |  |
| `trace_long_task_max_ms` | runtime | main_thread_js | 0.19 | -0.42 |  |
| `mt_rendering_ms` | runtime | dom_layout | 0.19 | -0.02 |  |
| `script_bytes` | structural | main_thread_js | 0.19 | 0.14 |  |
| `third_party_requests` | structural | third_party | 0.19 | 0.14 |  |
| `mt_parse_html_ms` | runtime | mixed | 0.15 | 0.25 |  |
| `stylesheet_bytes` | structural | render_blocking | -0.13 | 0.46 |  |
| `unused_css_bytes` | runtime | render_blocking | -0.13 | 0.46 |  |
| `lcp_request_low_priority` | structural | lcp_resource | 0.12 | 0.46 |  |
| `render_blocking_count` | runtime | render_blocking | 0.12 | -0.17 |  |
| `mt_style_layout_ms` | runtime | dom_layout | 0.10 | 0.13 |  |
| `unused_js_bytes` | runtime | main_thread_js | -0.00 | – |  |

### Target `tbt_30s_ms`

| feature | family | group | ρ real | ρ testbed | cờ |
|---|---|---|---|---|---|
| `trace_long_task_total_ms` | runtime | main_thread_js | 0.98 | 0.86 | loại (L5) |
| `trace_long_task_max_ms` | runtime | main_thread_js | 0.80 | 0.64 | loại (L5) |
| `trace_long_task_count` | runtime | main_thread_js | 0.80 | 0.89 | loại (L5) |
| `third_party_main_thread_ms` | runtime | third_party | 0.76 | 0.34 |  |
| `bootup_js_ms` | runtime | main_thread_js | 0.75 | 0.83 |  |
| `mt_script_eval_ms` | runtime | main_thread_js | 0.74 | 0.76 |  |
| `mt_parse_html_ms` | runtime | mixed | 0.66 | -0.31 |  |
| `mt_style_layout_ms` | runtime | dom_layout | 0.63 | -0.16 |  |
| `mt_script_parse_ms` | runtime | main_thread_js | 0.62 | -0.09 |  |
| `origin_count` | structural | third_party | 0.57 | – |  |
| `third_party_requests` | structural | third_party | 0.56 | -0.29 |  |
| `request_count` | structural | mixed | 0.54 | -0.29 |  |
| `script_bytes` | structural | main_thread_js | 0.54 | -0.29 |  |
| `mt_gc_ms` | runtime | main_thread_js | 0.49 | -0.03 |  |
| `unused_js_bytes` | runtime | main_thread_js | 0.49 | – |  |
| `script_requests` | structural | main_thread_js | 0.46 | -0.29 |  |
| `document_bytes` | structural | dom_layout | 0.43 | 0.10 |  |
| `dom_elements` | structural | dom_layout | 0.43 | -0.05 |  |
| `mt_rendering_ms` | runtime | dom_layout | 0.43 | -0.11 |  |
| `third_party_bytes` | structural | third_party | 0.39 | -0.29 |  |
| `transfer_bytes_total` | structural | mixed | 0.28 | -0.66 |  |
| `unused_css_bytes` | runtime | render_blocking | 0.25 | -0.31 |  |
| `stylesheet_bytes` | structural | render_blocking | 0.22 | -0.31 |  |
| `font_bytes` | structural | render_blocking | 0.20 | – |  |
| `lcp_has_resource` | structural | lcp_resource | 0.13 | – |  |
| `lcp_resource_bytes` | structural | lcp_resource | 0.13 | -0.34 |  |
| `lcp_request_low_priority` | structural | lcp_resource | 0.11 | -0.32 |  |
| `image_bytes` | structural | lcp_resource | 0.11 | -0.34 |  |
| `server_response_time_ms` | runtime | server | -0.08 | 0.07 |  |
| `lcp_not_discoverable` | structural | lcp_resource | 0.08 | – |  |
| `render_blocking_count` | runtime | render_blocking | 0.03 | -0.24 |  |
| `bytes_before_lcp_request` | runtime | mixed | -0.02 | -0.07 |  |
| `lcp_lazy_loaded` | structural | lcp_resource | -0.01 | – |  |
