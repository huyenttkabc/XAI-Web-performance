# Mapping feature → cause group (chuẩn bị RQ3)

> Sinh tự động bởi `scripts/build_feature_cause_mapping.py`. Không sửa tay. Chỉ dùng dữ liệu testbed (dataset v1.0, 174 phép đo hợp lệ).
> Ô = Spearman ρ giữa mức lỗi (0 = baseline, 1–3) và feature, trên phép đo của lỗi đó cộng baseline. **In đậm** khi |ρ| ≥ 0.8. ✓ = lỗi thuộc chính nhóm của feature; ⚠ = lỗi của nhóm khác cũng làm feature thay đổi mạnh (chồng lấn).

| feature | bộ | nhóm | dùng xếp hạng RQ3 | JS | DOM | Ảnh LCP | CSS | 3P script | 3P long task |
|---|---|---|---|---|---|---|---|---|---|
| `request_count` | S | mixed | không (mixed/server) | – | – | – | – | **1.00** ⚠ | – |
| `transfer_bytes_total` | S | mixed | không (mixed/server) | 0.34 | **0.98** ⚠ | **0.98** ⚠ | **0.98** ⚠ | **0.98** ⚠ | 0.33 |
| `script_requests` | S | main_thread_js | có | – | – | – | – | **1.00** ⚠ | – |
| `script_bytes` | S | main_thread_js | có | – | – | – | – | **1.00** ⚠ | – |
| `stylesheet_bytes` | S | render_blocking | có | – | – | – | **1.00** ✓ | – | – |
| `image_bytes` | S | lcp_resource | có | – | – | **1.00** ✓ | – | – | – |
| `font_bytes` | S | render_blocking | có | – | – | – | – | – | – |
| `document_bytes` | S | dom_layout | có | 0.34 | **0.98** ✓ | 0.49 | 0.52 | 0.01 | 0.33 |
| `third_party_requests` | S | third_party | có | – | – | – | – | **1.00** ✓ | – |
| `third_party_bytes` | S | third_party | có | – | – | – | – | **1.00** ✓ | – |
| `origin_count` | S | third_party | có | – | – | – | – | – | – |
| `dom_elements` | S | dom_layout | có | 0.04 | **0.98** ✓ | 0.05 | 0.09 | 0.01 | 0.02 |
| `lcp_has_resource` | S | lcp_resource | có | – | – | – | – | – | – |
| `lcp_lazy_loaded` | S | lcp_resource | có | – | – | – | – | – | – |
| `lcp_not_discoverable` | S | lcp_resource | có | – | – | – | – | – | – |
| `lcp_resource_bytes` | S | lcp_resource | có | – | – | **1.00** ✓ | – | – | – |
| `lcp_request_low_priority` | S | lcp_resource | có | – | – | – | 0.78 | – | – |
| `mt_script_eval_ms` | R | main_thread_js | có | **0.97** ✓ | -0.02 | -0.11 | -0.09 | **0.97** ⚠ | **0.97** ⚠ |
| `mt_script_parse_ms` | R | main_thread_js | có | -0.01 | -0.17 | -0.22 | -0.31 | **0.96** ⚠ | -0.25 |
| `mt_gc_ms` | R | main_thread_js | có | -0.07 | -0.09 | – | – | 0.14 | – |
| `mt_style_layout_ms` | R | dom_layout | có | 0.03 | **0.91** ✓ | 0.16 | 0.75 | -0.18 | -0.14 |
| `mt_rendering_ms` | R | dom_layout | có | -0.22 | **0.96** ✓ | 0.52 | -0.32 | -0.26 | -0.19 |
| `mt_parse_html_ms` | R | mixed | không (mixed/server) | -0.04 | **0.95** ⚠ | -0.01 | **0.94** ⚠ | 0.49 | 0.00 |
| `render_blocking_count` | R | render_blocking | có | – | -0.11 | – | – | – | – |
| `bootup_js_ms` | R | main_thread_js | có | **0.97** ✓ | 0.10 | -0.12 | -0.26 | -0.36 | **0.97** ⚠ |
| `third_party_main_thread_ms` | R | third_party | có | -0.08 | 0.12 | -0.03 | -0.25 | **0.97** ✓ | **0.97** ✓ |
| `unused_js_bytes` | R | main_thread_js | có | – | – | – | – | – | – |
| `unused_css_bytes` | R | render_blocking | có | – | – | – | **1.00** ✓ | – | – |
| `bytes_before_lcp_request` | R | mixed | không (mixed/server) | 0.34 | **0.98** ⚠ | 0.49 | **0.98** ⚠ | 0.01 | 0.33 |
| `server_response_time_ms` | R | server | không (mixed/server) | -0.07 | 0.74 | 0.13 | -0.15 | -0.18 | -0.02 |
| `trace_long_task_count` | R | main_thread_js | có | 0.62 | 0.71 | -0.12 | 0.63 | 0.63 | 0.73 |
| `trace_long_task_total_ms` | R | main_thread_js | có | **0.97** ✓ | **0.92** ⚠ | 0.14 | 0.72 | 0.45 | **0.97** ⚠ |
| `trace_long_task_max_ms` | R | main_thread_js | có | **0.94** ✓ | **0.83** ⚠ | 0.16 | 0.72 | -0.15 | **0.95** ⚠ |

## Chồng lấn giữa các nhóm (cần báo cáo riêng ở RQ3)

- `script_requests` (main_thread_js) bị lỗi **3P script** (third_party) làm thay đổi mạnh (ρ = 1.00)
- `script_bytes` (main_thread_js) bị lỗi **3P script** (third_party) làm thay đổi mạnh (ρ = 1.00)
- `mt_script_eval_ms` (main_thread_js) bị lỗi **3P script** (third_party) làm thay đổi mạnh (ρ = 0.97)
- `mt_script_eval_ms` (main_thread_js) bị lỗi **3P long task** (third_party) làm thay đổi mạnh (ρ = 0.97)
- `mt_script_parse_ms` (main_thread_js) bị lỗi **3P script** (third_party) làm thay đổi mạnh (ρ = 0.96)
- `bootup_js_ms` (main_thread_js) bị lỗi **3P long task** (third_party) làm thay đổi mạnh (ρ = 0.97)
- `trace_long_task_total_ms` (main_thread_js) bị lỗi **DOM** (dom_layout) làm thay đổi mạnh (ρ = 0.92)
- `trace_long_task_total_ms` (main_thread_js) bị lỗi **3P long task** (third_party) làm thay đổi mạnh (ρ = 0.97)
- `trace_long_task_max_ms` (main_thread_js) bị lỗi **DOM** (dom_layout) làm thay đổi mạnh (ρ = 0.83)
- `trace_long_task_max_ms` (main_thread_js) bị lỗi **3P long task** (third_party) làm thay đổi mạnh (ρ = 0.95)

## Ghi chú

- Nhóm `mixed` (tổng toàn trang) và `server` vẫn dùng cho RQ1–RQ2 nhưng không được tính điểm nhóm ở RQ3.
- Feature có ô `–` là hằng số trên testbed (ví dụ server response time trên localhost), nên không thể mang tín hiệu nguyên nhân ở RQ3.
- ρ ≥ 0,8 chỉ cho thấy lỗi *làm thay đổi* feature (manipulation check); không phải bằng chứng SHAP sẽ xếp đúng nhóm.
