# Protocol v1.0 — FROZEN 06/10/2026

> **Trạng thái: FROZEN.** Từ mốc này, *target, nhãn, bộ predictor và quy tắc chia dữ liệu* chỉ được thay đổi qua §10 (Amendment log), có ghi ngày và lý do, và **không bao giờ** sau khi đã xem kết quả trên fold test hoặc lockbox (Gate G2).
> Bản máy đọc: `config/experiment-manifest.json` (`manifest_version` 1.0.0). Định nghĩa cột: `src/parser/feature-definitions.js`. Catalog fault: `src/testbed/fault-catalog.js`.

## 1. Mục tiêu và phạm vi

- Đo hiệu năng phía client (trình duyệt) của storefront; không đo hay tối ưu phía server.
- Ba nhánh: **(A) Quan sát** — Shopify thật, RQ1–RQ2; **(B) Có kiểm soát** — testbed + fault injection, RQ3; **(C) Case study** — staging, RQ4.
- Phát biểu nhân quả chỉ dùng cho nhánh B và can thiệp ở RQ4. Nhánh A chỉ là liên hệ (associational).

## 2. Chọn site và trang

| Hạng mục | Quy định |
|---|---|
| Khung chọn mẫu | Origin Shopify từ HTTP Archive (crawl tham chiếu 2026-08) |
| Loại trang | `home`, `product` |
| Pilot | 3 store: adresmedikal.net, amixstore.com (nhẹ), bark.co (nặng) × 2 trang — `config/pilot-sites.csv` |
| Nghiên cứu chính | ≥ 30 store × 2 trang, chọn ngẫu nhiên phân tầng theo mức TBT tham chiếu (thực hiện ở W3) |
| Luật hợp lệ | **V1** tài liệu chính hoặc URL hiển thị rời site được yêu cầu (cho phép subdomain hai chiều) → `cross_host_redirect`; trang password/challenge/checkpoint → `storefront_blocked`. **V2** status ≥ 400 → `http_error`. **V3** không có asset từ `cdn.shopify.com` hoặc `/cdn/shop/` → `not_shopify`. **V4** `benchmark_index` < 0,6 × median của batch → `host_contention`. Dòng vi phạm có `status = invalid`, bị loại khỏi phân tích. V1–V3 xét từng dòng khi parse; V4 xét cả batch khi `npm run reparse` |
| Đạo đức | Không vượt cơ chế chặn bot. Mỗi site chỉ nhận vài chục request mỗi đợt, tuần tự |

## 3. Profile đo (thiết bị / mạng / cache) — `mobile_cpu4x_slow4g_cold`

| Thành phần | Giá trị |
|---|---|
| Công cụ | Lighthouse 12.8.2 (Node API), chrome-launcher 1.2.2, Chrome stable headless (phiên bản ghi theo dòng) |
| Thiết bị | Lighthouse mobile emulation (412×823, UA mobile, touch) |
| CPU | Chậm 4× (devtools throttling — làm chậm thật, không ước tính) |
| Mạng | slow-4G devtools: latency 562,5 ms, download 1.474,56 Kbps, upload 675 Kbps — ghim trong code |
| Cache | Cold: Chrome profile mới mỗi phép đo |
| Thứ tự | Xáo trộn mọi phép đo của batch bằng seed cố định (42) |
| Giới hạn | `maxWaitForLoad` 60 s; tối đa 150 s mỗi phép đo |
| Ghi thô | `lhr.json.gz` + `trace.json.gz` + `context.json` mỗi phép đo |
| Nhiễu máy | `benchmark_index` mỗi dòng (không bao giờ là feature) |

## 4. Nhiễu loạn có kiểm soát (fault matrix)

One-factor-at-a-time: trang testbed là template có *khe*; baseline điền mọi khe ở mức trung tính, nên mỗi điều kiện lỗi khác baseline đúng **một** cơ chế.

| Cause group | Fault id | Mức 1 / 2 / 3 | Cơ chế | Đặc trưng cơ chế | Outcome kỳ vọng |
|---|---|---|---|---|---|
| main_thread_js | `js-long-task` | 100 / 250 / 500 ms × 4 task | busy-wait sau `load` | `mt_script_eval_ms` | TBT ≈ 4·(liều − 50); LCP phẳng |
| dom_layout | `dom-bloat` | +1.500 / 4.000 / 10.000 phần tử | DOM hiển thị dưới hero | `dom_elements` | style/layout ↑, LCP ↑ nhẹ |
| lcp_resource | `lcp-heavy-image` | 300 / 900 / 2.000 KB (baseline ≈25 KB) | hero PNG cùng kích thước, hàng nhiễu không nén được | `image_bytes` | LCP ↑; FCP, TBT phẳng |
| render_blocking | `render-blocking-css` | 150 / 500 / 1.200 KB | stylesheet trong `<head>`, rule không khớp phần tử nào | `stylesheet_bytes` | FCP, LCP ↑; TBT phẳng |
| third_party | `third-party-scripts` | 4 / 12 / 30 script | script async từ origin thứ hai (20 KB, 30 ms CPU mỗi script) | `third_party_requests` | request/bytes bên thứ ba ↑; TBT ≈ 0 (task 30 ms < 50 ms) |
| third_party | `third-party-long-task` | 100 / 250 / 500 ms × 4 task | **ghép cặp với `js-long-task`**, tải từ origin thứ hai | `third_party_main_thread_ms` | TBT ≈ 4·(liều − 50); request/bytes giống baseline |

- Quy mô: 2 trang × (1 baseline + 18 điều kiện) × 5 lần = **190 phép đo testbed**.
- **Ghép cặp JS:** mọi trang (kể cả baseline) tải hai bản `js-long-task.js` — first-party và origin thứ hai — mặc định liều 0. Hai fault có cùng request, cùng byte, cùng TBT, **chỉ khác nguồn gốc long task**: phép thử explanation có tách được JS của trang với JS của app bên thứ ba.
- **Đồng nhất HTML:** luôn có đủ 30 khe script bên thứ ba cùng độ dài; khe không hoạt động mang `type="text/plain-noop"` (không tải) ⇒ DOM và byte HTML không đổi theo fault bên thứ ba.
- **Chồng lấn đã biết:** fault bên thứ ba cũng làm tăng `mt_script_eval_ms` (nhóm `main_thread_js`), vì feature này đếm mọi script. Có thật ngoài đời ⇒ báo cáo ở RQ3, không khử.
- **Font ngoài phạm vi testbed:** (1) theme Dawn dùng `font-display: swap`; (2) LCP của testbed là ảnh; (3) trùng cơ chế với CSS chặn render. `font_bytes` vẫn nằm trong X cho site thật.

## 5. Outcome (Y)

| Outcome | Tier | Định nghĩa |
|---|---|---|
| `lh_lcp_ms` | **chính** | Largest Contentful Paint (Lighthouse) |
| `tbt_30s_ms` | **chính** | Σ max(0, d − 50 ms) của task cấp cao nhất trên main thread của main frame, cắt vào [FCP, min(navigationStart + 30 s, cuối trace)], tính từ trace thô. Điểm kết thúc thực tế: cột diagnostic `trace_window_end_ms` |
| `lh_tbt_ms`, `lh_fcp_ms`, `lh_si_ms`, `lh_cls`, `lh_perf_score` | phụ | giá trị Lighthouse |

**Vì sao `tbt_30s_ms`:** Lighthouse TBT bị *thiếu* khi trang không đạt TTI (`NO_TTI_CPU_IDLE_PERIOD`) — đúng ở các site nặng nhất. Bỏ các dòng đó làm mẫu lệch về site nhanh. Pilot: bark.co/product thiếu Lighthouse TBT 5/5 lần, `tbt_30s_ms` vẫn có.

## 6. Predictor (X)

- **Bộ S (structural, 12):** `request_count`, `transfer_bytes_total`, `script_requests`, `script_bytes`, `stylesheet_bytes`, `image_bytes`, `font_bytes`, `document_bytes`, `third_party_requests`, `third_party_bytes`, `origin_count`, `dom_elements`.
- **Bộ R (runtime, 14):** `mt_script_eval_ms`, `mt_script_parse_ms`, `mt_gc_ms`, `mt_style_layout_ms`, `mt_rendering_ms`, `mt_parse_html_ms`, `render_blocking_count`, `bootup_js_ms`, `third_party_main_thread_ms`, `unused_js_bytes`, `unused_css_bytes`, `trace_long_task_count`, `trace_long_task_total_ms`, `trace_long_task_max_ms`.
- **Nhóm `mixed`:** `request_count`, `transfer_bytes_total`, `mt_parse_html_ms` là tổng toàn trang, mọi cơ chế đều làm đổi ⇒ vẫn ở X (RQ1–RQ2) nhưng **không** cộng vào điểm nhóm khi chấm Hit@k (RQ3).
- Ablation RQ2: **S** so với **S+R**, cùng fold.
- **Không bao giờ vào X:** toàn bộ metadata (`site`, `page_type`, `fault_*`, `severity_level`, `cause_group`, `run`, `order_index`, `benchmark_index`, …); diagnostic (`trace_window_end_ms`, `mt_total_ms`, `render_blocking_fcp_savings_ms`); các outcome khác.
- **Loại trừ theo target (L5):** `trace_long_task_*` bị loại khi target là `tbt_30s_ms` hoặc `lh_tbt_ms` (cùng các task ≥ 50 ms). Chi tiết: `docs/leakage-checklist.md`.
- `page_type` chỉ là biến phân tầng khi báo cáo, không làm feature.

## 7. Số lần lặp và nhiễu

- **Testbed:** 5 lần mỗi điều kiện; mỗi điều kiện phải còn **≥ 4 lần hợp lệ** sau V1–V4, nếu không thì đo bù (cùng `run`, `batch_id` mới).
- **Site thật:** 5 lần mỗi trang. Đơn vị chia fold và bootstrap là **site**.
- Căn cứ: `docs/fault-matrix-noise-report.md` (§11).

## 8. Chia dữ liệu và đánh giá

| RQ | Chiến lược | Chi tiết |
|---|---|---|
| RQ1–RQ2 | **GroupKFold theo site**, k = 5 | fold = int(sha1("fold:" + site)[:8], 16) mod 5 — mọi trang và lần lặp của một site cùng fold |
| RQ1–RQ2 | **Lockbox** | site có int(sha1("lockbox:" + site)[:8], 16) mod 5 == 0 (~20%) giữ lại đến lần đánh giá cuối, chạy đúng một lần |
| RQ1–RQ2 | Bất định | bootstrap 95% CI theo site (1.000 lần) |
| RQ3 | GroupKFold theo `run` (5 fold) | train trên 4 lần lặp của mọi điều kiện, giải thích lần còn lại |
| RQ3 (độ bền) | Leave-one-severity-out | train mức 0, 1, 3 → giải thích mức 2 |
| Mọi RQ | Tiền xử lý / chọn tham số | chỉ fit trong fold train (inner CV) |

**Metric:** RQ1–RQ2: MAE, RMSE, R² theo fold và site; so với median baseline; ΔMetric giữa S và S+R. RQ3: điểm nhóm = Σ φ của các feature trong nhóm (trừ `mixed`) so với baseline cùng trang → xếp hạng 5 nhóm → Hit@1, Hit@3, MRR (chance: 0,20 / 0,60); Jaccard top-3 giữa fold; liều–đáp ứng. Chỉ chấm cặp (fault, target) mà fault thật sự làm xấu target: Δmedian > 2 × IQR baseline và > 5%. Phép thử ghép cặp: tỷ lệ `main_thread_js` xếp trên `third_party` (và ngược lại) so với chance 0,5. RQ4: median/IQR trước–sau, % cải thiện, bootstrap CI.

## 9. Toàn vẹn dữ liệu

- `measurement_id` duy nhất; mọi lần thử (kể cả lỗi) đều có `context.json`.
- Dataset dựng lại hoàn toàn từ raw: `npm run reports` (reparse → dictionary → noise report → leakage checklist).
- Dữ liệu tuần 1 (profile `mobile_cpu4x_slow4g`, protocol cũ) ở `data/archive/`, không trộn với dữ liệu v1.0 (`reparse` lọc theo `profile_id`).

## 10. Amendment log

| Ngày | Thay đổi | Lý do |
|---|---|---|
| 06/10/2026 | Phát hành v1.0 (FROZEN). So với bản nháp 05/10: thêm `third-party-long-task` (ghép cặp với `js-long-task`); font ra ngoài phạm vi testbed (§4); thêm luật V4 `host_contention` | Fault bên thứ ba cũ không gây long task, trong khi chặn main thread là tác hại phổ biến nhất của app bên thứ ba. 15/190 phép đo testbed có `benchmark_index` tụt (máy bận). Chưa có mô hình nào được huấn luyện ⇒ chưa xem kết quả test nào |

## 11. Kết luận pilot làm căn cứ freeze

Pilot v1.0: testbed 190 phép đo (06/10/2026), site thật 30 phép đo (05/10/2026). Sau V1–V4: **174/190** testbed hợp lệ (15 `host_contention`, 1 error) và **29/30** site thật hợp lệ.

1. **Manipulation check:** cả 6 fault đạt ρ(mức, đặc trưng cơ chế) ≥ 0,97. Liều–đáp ứng đơn điệu với JS, ảnh LCP, CSS và third-party long task (ρ ≥ 0,97), và DOM (ρ = 0,86). `third-party-scripts` bão hòa từ mức 2 (LCP ≈ 2.000 ms ở 12 và 30 script) — là một kết quả, không sửa liều.
2. **Cặp JS ghép cặp đúng:** TBT30 `js-long-task` 206 / 806 / 1.807 ms so với `third-party-long-task` 208 / 807 / 1.806 ms; request, byte, DOM giống baseline; chỉ `third_party_main_thread_ms` phân biệt hai fault.
3. **Giữ nguyên severity cả 6 fault.** Đổi liều sau khi xem pilot thì phải đo lại toàn bộ và không cải thiện câu hỏi nghiên cứu.
4. **Nhiễu testbed nhỏ:** CV trung vị LCP 1,5%, FCP 2,0%, TBT30 0,5% ⇒ 5 lần lặp là đủ.
5. **Nhiễu site thật lớn:** CV LCP 6–31%, TBT30 14–38%. Giữ 5 lần/trang vì độ chính xác RQ1–RQ2 phụ thuộc chủ yếu vào **số site**. Ước lượng LCP từng trang trong ±10% có khi cần 36 lần — không khả thi, ghi vào Threats to Validity.
6. **`tbt_30s_ms` là cần thiết:** Lighthouse TBT thiếu ở bark.co/product 5/5 lần.
7. **Leakage:** chỉ `trace_long_task_total_ms` có |ρ| ≥ 0,95 với TBT30 (0,99) và đã bị loại theo L5. Kiểm tra lại khi có ≥ 30 site (W3).
