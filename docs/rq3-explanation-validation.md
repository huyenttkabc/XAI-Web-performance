# RQ3 — Kiểm chứng giải thích trên testbed

> Sinh tự động bởi `scripts/build_rq3_report.py` từ run `rq3-testbed-261108`. Không sửa tay. Chỉ dùng testbed; lockbox không liên quan.
> Mức ngẫu nhiên với 5 nhóm: Hit@1 = 0,20, Hit@3 = 0,60, MRR = 0,46.

## 1. Kết quả chính (chia theo lần lặp, chỉ phép đo đủ hiệu ứng)

| Target | Mô hình | Biến thể | n | Hit@1 [CI 95%] | Hit@3 | MRR [CI 95%] | Ổn định giữa lần lặp | Phân biệt nguồn |
|---|---|---|---|---|---|---|---|---|
| LCP | Random Forest | interventional | 115 | 0,57 [0,39; 0,73] | 0,82 | 0,73 [0,60; 0,84] | 0,65 | 0,57 |
| LCP | Random Forest | interventional_magnitude | 115 | 0,57 [0,39; 0,76] | 1,00 | 0,78 [0,68; 0,88] | 0,84 | 0,64 |
| LCP | Random Forest | path_dependent | 115 | 0,52 [0,33; 0,70] | 0,90 | 0,70 [0,57; 0,82] | 0,81 | 0,57 |
| LCP | Tham chiếu không mô hình | model_free | 115 | 0,66 [0,46; 0,83] | 1,00 | 0,83 [0,73; 0,91] | 0,73 | 0,64 |
| LCP | Ridge | interventional | 115 | 0,30 [0,14; 0,49] | 0,35 | 0,47 [0,33; 0,61] | 0,83 | 0,64 |
| LCP | Ridge | interventional_magnitude | 115 | 0,60 [0,40; 0,78] | 1,00 | 0,79 [0,69; 0,89] | 0,93 | 0,64 |
| LCP | XGBoost | interventional | 115 | 0,70 [0,55; 0,84] | 0,80 | 0,79 [0,69; 0,88] | 0,55 | 0,43 |
| LCP | XGBoost | interventional_magnitude | 115 | 0,62 [0,44; 0,80] | 1,00 | 0,78 [0,68; 0,89] | 0,91 | 0,64 |
| LCP | XGBoost | path_dependent | 115 | 0,63 [0,45; 0,79] | 0,83 | 0,74 [0,63; 0,85] | 0,74 | 0,21 |
| TBT30 | Random Forest | interventional | 65 | 0,58 [0,32; 0,86] | 1,00 | 0,79 [0,66; 0,93] | 0,68 | 0,51 |
| TBT30 | Random Forest | interventional_magnitude | 65 | 0,58 [0,32; 0,86] | 1,00 | 0,78 [0,63; 0,93] | 1,00 | 0,51 |
| TBT30 | Random Forest | path_dependent | 65 | 0,58 [0,32; 0,86] | 0,92 | 0,71 [0,53; 0,90] | 0,82 | 0,51 |
| TBT30 | Tham chiếu không mô hình | model_free | 65 | 0,57 [0,31; 0,83] | 1,00 | 0,78 [0,66; 0,91] | 0,71 | 0,51 |
| TBT30 | Ridge | interventional | 65 | 0,58 [0,32; 0,86] | 1,00 | 0,78 [0,65; 0,92] | 0,70 | 0,51 |
| TBT30 | Ridge | interventional_magnitude | 65 | 0,58 [0,32; 0,86] | 1,00 | 0,77 [0,62; 0,92] | 1,00 | 0,51 |
| TBT30 | XGBoost | interventional | 65 | 0,58 [0,32; 0,86] | 0,94 | 0,73 [0,56; 0,91] | 0,68 | 0,51 |
| TBT30 | XGBoost | interventional_magnitude | 65 | 0,58 [0,32; 0,86] | 1,00 | 0,74 [0,58; 0,91] | 1,00 | 0,51 |
| TBT30 | XGBoost | path_dependent | 65 | 0,58 [0,32; 0,86] | 0,92 | 0,71 [0,53; 0,90] | 0,79 | 0,51 |

## 2. Theo lỗi (Random Forest, interventional)

| Target | Lỗi | n | Hit@1 | Hit@3 | MRR | ρ liều–đáp ứng | Nhóm xếp đầu (số phép đo) |
|---|---|---|---|---|---|---|---|
| LCP | dom-bloat | 20 | 0,55 | 1,00 | 0,78 | -0,87 | dom_layout 11, main_thread_js 8, third_party 1 |
| LCP | js-long-task | 9 | 0,67 | 1,00 | 0,83 | 0,87 | main_thread_js 6, dom_layout 2, third_party 1 |
| LCP | lcp-heavy-image | 29 | 0,66 | 0,66 | 0,72 | 0,50 | lcp_resource 19, dom_layout 4, third_party 3, main_thread_js 2, render_blocking 1 |
| LCP | render-blocking-css | 26 | 1,00 | 1,00 | 1,00 | 0,41 | render_blocking 26 |
| LCP | third-party-long-task | 5 | 0,00 | 1,00 | 0,47 | – | main_thread_js 5 |
| LCP | third-party-scripts | 26 | 0,12 | 0,58 | 0,45 | -0,61 | main_thread_js 12, lcp_resource 7, dom_layout 4, third_party 3 |
| TBT30 | dom-bloat | 10 | 1,00 | 1,00 | 1,00 | – | dom_layout 10 |
| TBT30 | js-long-task | 28 | 1,00 | 1,00 | 1,00 | 0,94 | main_thread_js 28 |
| TBT30 | third-party-long-task | 27 | 0,00 | 1,00 | 0,49 | 0,64 | main_thread_js 27 |

## 3. Độ bền: leave-one-severity-out (train mức 0, 1, 3 → giải thích mức 2)

| Target | Mô hình | Biến thể | n | Hit@1 | Hit@3 | MRR |
|---|---|---|---|---|---|---|
| LCP | Random Forest | interventional | 37 | 0,78 | 0,84 | 0,84 |
| LCP | Random Forest | interventional_magnitude | 37 | 0,78 | 1,00 | 0,87 |
| LCP | Random Forest | path_dependent | 37 | 0,73 | 1,00 | 0,84 |
| LCP | Tham chiếu không mô hình | model_free | 37 | 0,78 | 1,00 | 0,89 |
| LCP | Ridge | interventional | 37 | 0,00 | 0,00 | 0,21 |
| LCP | Ridge | interventional_magnitude | 37 | 0,78 | 1,00 | 0,89 |
| LCP | XGBoost | interventional | 37 | 0,59 | 0,65 | 0,69 |
| LCP | XGBoost | interventional_magnitude | 37 | 0,78 | 1,00 | 0,86 |
| LCP | XGBoost | path_dependent | 37 | 0,54 | 0,59 | 0,65 |
| TBT30 | Random Forest | interventional | 18 | 0,56 | 1,00 | 0,78 |
| TBT30 | Random Forest | interventional_magnitude | 18 | 0,56 | 1,00 | 0,78 |
| TBT30 | Random Forest | path_dependent | 18 | 0,56 | 1,00 | 0,70 |
| TBT30 | Tham chiếu không mô hình | model_free | 18 | 0,56 | 1,00 | 0,78 |
| TBT30 | Ridge | interventional | 18 | 0,56 | 1,00 | 0,78 |
| TBT30 | Ridge | interventional_magnitude | 18 | 0,56 | 1,00 | 0,75 |
| TBT30 | XGBoost | interventional | 18 | 0,56 | 1,00 | 0,74 |
| TBT30 | XGBoost | interventional_magnitude | 18 | 0,56 | 1,00 | 0,70 |
| TBT30 | XGBoost | path_dependent | 18 | 0,56 | 1,00 | 0,70 |

## 4. Đồng thuận Random Forest – XGBoost (Jaccard top-3 trên cùng phép đo)

- LCP: 0,55
- TBT30: 0,60

## 5. Tỷ lệ |φ| theo nhóm (Random Forest, gồm cả nhóm mixed và server không được xếp hạng)

| Target | Lỗi | main_thread_js | dom_layout | lcp_resource | render_blocking | third_party | mixed | server |
|---|---|---|---|---|---|---|---|---|
| LCP | dom-bloat | 20% | 18% | 0% | 0% | 1% | 56% | 4% |
| LCP | js-long-task | 64% | 11% | 0% | 0% | 4% | 12% | 8% |
| LCP | lcp-heavy-image | 0% | 1% | 7% | 0% | 0% | 92% | 0% |
| LCP | render-blocking-css | 1% | 1% | 2% | 11% | 0% | 85% | 0% |
| LCP | third-party-long-task | 80% | 4% | 0% | 0% | 8% | 6% | 2% |
| LCP | third-party-scripts | 9% | 1% | 0% | 0% | 3% | 87% | 0% |
| TBT30 | dom-bloat | 1% | 97% | 0% | 0% | 0% | 2% | 0% |
| TBT30 | js-long-task | 100% | 0% | 0% | 0% | 0% | 0% | 0% |
| TBT30 | third-party-long-task | 100% | 0% | 0% | 0% | 0% | 0% | 0% |

## 6. Ca local (luật chọn cố định: mức S2, trang home, điểm nhóm đúng ở trung vị)

- **lcp-heavy-image / LCP** (lần lặp 2): quan sát 6,134 ms, dự đoán 6,172 ms, mốc baseline 1,396 ms; nhóm đúng xếp hạng 5, nhóm đầu `render_blocking`. φ lớn nhất: `transfer_bytes_total` +1.519, `image_bytes` -0.017, `lcp_resource_bytes` -0.012, `mt_rendering_ms` -0.007.
- **render-blocking-css / LCP** (lần lặp 2): quan sát 4,192 ms, dự đoán 4,130 ms, mốc baseline 1,396 ms; nhóm đúng xếp hạng 1, nhóm đầu `render_blocking`. φ lớn nhất: `transfer_bytes_total` +0.682, `bytes_before_lcp_request` +0.121, `stylesheet_bytes` +0.116, `unused_css_bytes` +0.102.
- **dom-bloat / LCP** (lần lặp 1): quan sát 1,570 ms, dự đoán 1,574 ms, mốc baseline 1,398 ms; nhóm đúng xếp hạng 1, nhóm đầu `dom_layout`. φ lớn nhất: `mt_style_layout_ms` +0.035, `trace_long_task_max_ms` +0.022, `server_response_time_ms` +0.021, `mt_rendering_ms` +0.019.
- **js-long-task / TBT30** (lần lặp 3): quan sát 807 ms, dự đoán 806 ms, mốc baseline 0 ms; nhóm đúng xếp hạng 1, nhóm đầu `main_thread_js`. φ lớn nhất: `bootup_js_ms` +6.366, `mt_script_eval_ms` +0.322, `third_party_main_thread_ms` +0.001, `mt_script_parse_ms` +0.000.
- **third-party-long-task / TBT30** (lần lặp 2): quan sát 806 ms, dự đoán 807 ms, mốc baseline 0 ms; nhóm đúng xếp hạng 2, nhóm đầu `main_thread_js`. φ lớn nhất: `bootup_js_ms` +6.273, `mt_script_eval_ms` +0.379, `third_party_main_thread_ms` +0.026, `mt_rendering_ms` +0.002.
