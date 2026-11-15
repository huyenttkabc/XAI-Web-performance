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
| L8 | Chọn feature/tham số nhìn vào test | feature selection, tuning chỉ trong inner-CV của fold train | ⏳ luật đã chốt; kiểm tra khi có pipeline ML (W4) |
| L9 | Tiền xử lý fit trên toàn bộ dữ liệu | imputer/scaler fit trong pipeline theo từng fold | ⏳ luật đã chốt; kiểm tra khi có pipeline ML (W4) |

## B. Loại trừ theo target (`excludeFor`)

| feature | loại khỏi X khi target là | lý do |
|---|---|---|
| `trace_long_task_count` | `tbt_30s_ms`, `lh_tbt_ms` | tính từ cùng các task ≥ 50 ms như TBT |
| `trace_long_task_total_ms` | `tbt_30s_ms`, `lh_tbt_ms` | tính từ cùng các task ≥ 50 ms như TBT |
| `trace_long_task_max_ms` | `tbt_30s_ms`, `lh_tbt_ms` | tính từ cùng các task ≥ 50 ms như TBT |

## C. Sàng lọc thực nghiệm — |ρ Spearman| ≥ 0.95

Dữ liệu: 29 dòng Shopify thật (ok), 174 dòng testbed (ok).
Trên **testbed**, ρ cao với đặc trưng cơ chế là *chủ ý thiết kế* (fault điều khiển trực tiếp cơ chế) → chỉ để tham khảo.
Trên **site thật** (3 site), |ρ| ≥ 0,95 nghĩa là đặc trưng gần như là một phép biến đổi của target → phải xem xét loại. Kiểm tra lại khi có ≥ 30 site (W3).

### Target `lh_lcp_ms`

| feature | family | group | ρ real | ρ testbed | cờ |
|---|---|---|---|---|---|
| `script_bytes` | structural | main_thread_js | 0.82 | 0.14 |  |
| `origin_count` | structural | third_party | 0.81 | – |  |
| `script_requests` | structural | main_thread_js | 0.79 | 0.14 |  |
| `third_party_requests` | structural | third_party | 0.79 | 0.14 |  |
| `document_bytes` | structural | dom_layout | 0.78 | -0.06 |  |
| `request_count` | structural | mixed | 0.71 | 0.14 |  |
| `third_party_bytes` | structural | third_party | 0.71 | 0.14 |  |
| `mt_script_eval_ms` | runtime | main_thread_js | 0.70 | -0.52 |  |
| `bootup_js_ms` | runtime | main_thread_js | 0.68 | -0.55 |  |
| `font_bytes` | structural | render_blocking | 0.66 | – |  |
| `render_blocking_count` | runtime | render_blocking | 0.63 | -0.17 |  |
| `transfer_bytes_total` | structural | mixed | 0.63 | 0.91 |  |
| `dom_elements` | structural | dom_layout | 0.61 | -0.06 |  |
| `stylesheet_bytes` | structural | render_blocking | 0.60 | 0.46 |  |
| `mt_parse_html_ms` | runtime | mixed | 0.48 | 0.25 |  |
| `trace_long_task_max_ms` | runtime | main_thread_js | 0.46 | -0.42 |  |
| `mt_gc_ms` | runtime | main_thread_js | 0.44 | -0.02 |  |
| `unused_css_bytes` | runtime | render_blocking | -0.43 | 0.46 |  |
| `trace_long_task_total_ms` | runtime | main_thread_js | 0.41 | -0.55 |  |
| `mt_script_parse_ms` | runtime | main_thread_js | 0.31 | -0.03 |  |
| `trace_long_task_count` | runtime | main_thread_js | 0.29 | -0.51 |  |
| `third_party_main_thread_ms` | runtime | third_party | 0.25 | -0.30 |  |
| `image_bytes` | structural | lcp_resource | 0.18 | 0.58 |  |
| `mt_style_layout_ms` | runtime | dom_layout | 0.17 | 0.13 |  |
| `unused_js_bytes` | runtime | main_thread_js | 0.06 | – |  |
| `mt_rendering_ms` | runtime | dom_layout | -0.01 | -0.02 |  |

### Target `tbt_30s_ms`

| feature | family | group | ρ real | ρ testbed | cờ |
|---|---|---|---|---|---|
| `trace_long_task_total_ms` | runtime | main_thread_js | 0.99 | 0.86 | loại (L5) |
| `trace_long_task_count` | runtime | main_thread_js | 0.92 | 0.89 | loại (L5) |
| `mt_script_parse_ms` | runtime | main_thread_js | 0.90 | -0.09 |  |
| `bootup_js_ms` | runtime | main_thread_js | 0.75 | 0.83 |  |
| `mt_script_eval_ms` | runtime | main_thread_js | 0.74 | 0.76 |  |
| `third_party_main_thread_ms` | runtime | third_party | 0.73 | 0.34 |  |
| `document_bytes` | structural | dom_layout | 0.68 | 0.10 |  |
| `script_requests` | structural | main_thread_js | 0.67 | -0.29 |  |
| `mt_parse_html_ms` | runtime | mixed | 0.66 | -0.31 |  |
| `origin_count` | structural | third_party | 0.65 | – |  |
| `script_bytes` | structural | main_thread_js | 0.61 | -0.29 |  |
| `third_party_requests` | structural | third_party | 0.60 | -0.29 |  |
| `third_party_bytes` | structural | third_party | 0.56 | -0.29 |  |
| `dom_elements` | structural | dom_layout | 0.53 | -0.05 |  |
| `stylesheet_bytes` | structural | render_blocking | 0.53 | -0.31 |  |
| `mt_rendering_ms` | runtime | dom_layout | 0.50 | -0.11 |  |
| `font_bytes` | structural | render_blocking | 0.50 | – |  |
| `request_count` | structural | mixed | 0.49 | -0.29 |  |
| `mt_gc_ms` | runtime | main_thread_js | 0.48 | -0.03 |  |
| `mt_style_layout_ms` | runtime | dom_layout | 0.47 | -0.16 |  |
| `transfer_bytes_total` | structural | mixed | 0.46 | -0.66 |  |
| `trace_long_task_max_ms` | runtime | main_thread_js | 0.40 | 0.64 | loại (L5) |
| `render_blocking_count` | runtime | render_blocking | 0.24 | -0.24 |  |
| `unused_css_bytes` | runtime | render_blocking | 0.23 | -0.31 |  |
| `image_bytes` | structural | lcp_resource | 0.20 | -0.34 |  |
| `unused_js_bytes` | runtime | main_thread_js | 0.12 | – |  |
