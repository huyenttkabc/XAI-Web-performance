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
| Nghiên cứu chính | ≥ 30 store × 2 trang, chọn ngẫu nhiên phân tầng theo mức TBT tham chiếu. Thực hiện (`scripts/build-main-study-site-sample.js`, seed 42): **khung mẫu** 819 store có cả home và product hợp lệ trong crawl tham chiếu; **tầng** = tertile median TBT tham chiếu của home, cắt tại 3.695 / 7.115 ms, store thiếu TBT (không đạt TTI) xếp vào heavy; **cỡ mẫu** 80 store (27 light / 27 medium / 26 heavy, gồm 3 store pilot) × 2 trang × 5 lần = **800 phép đo**; **thứ tự rút** xáo trộn trong từng tầng rồi xen kẽ light → medium → heavy; **probe** ≤ 4 GET tuần tự, loại store chết / bị chặn / chuyển hướng sang domain khác, sản phẩm đã gỡ thì thay bằng sản phẩm đầu tiên trong `/products.json`; **wave** 0 = 3 store pilot, 1 = 4 store đầu mỗi tầng, 2 = 25 store còn lại của bản 40 store, 3 = 40 store mở rộng; 4–5 = 120 store mở rộng lên **200 store / 2.000 phép đo** (amendment 25/10/2026). Danh sách: `config/main-study-sites.csv`; nhật ký probe: `data/processed/site-sampling-log.json` |
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

- **Bộ S (structural, 17):** `request_count`, `transfer_bytes_total`, `script_requests`, `script_bytes`, `stylesheet_bytes`, `image_bytes`, `font_bytes`, `document_bytes`, `third_party_requests`, `third_party_bytes`, `origin_count`, `dom_elements`, `lcp_has_resource`, `lcp_lazy_loaded`, `lcp_not_discoverable` (3 cờ 0/1 thêm theo amendment 09/10/2026), `lcp_resource_bytes`, `lcp_request_low_priority` (post-hoc, amendment 09/10/2026 (5)).
- **Bộ R (runtime, 16):** `mt_script_eval_ms`, `mt_script_parse_ms`, `mt_gc_ms`, `mt_style_layout_ms`, `mt_rendering_ms`, `mt_parse_html_ms`, `render_blocking_count`, `bootup_js_ms`, `third_party_main_thread_ms`, `unused_js_bytes`, `unused_css_bytes`, `server_response_time_ms` (amendment 09/10/2026; **không** gồm RTT giả lập 562,5 ms), `bytes_before_lcp_request` (post-hoc, amendment 09/10/2026 (5), nhóm `mixed`), `trace_long_task_count`, `trace_long_task_total_ms`, `trace_long_task_max_ms`.
- **Nhóm `mixed`:** `request_count`, `transfer_bytes_total`, `mt_parse_html_ms`, `bytes_before_lcp_request` là tổng toàn trang, mọi cơ chế đều làm đổi ⇒ vẫn ở X (RQ1–RQ2) nhưng **không** cộng vào điểm nhóm khi chấm Hit@k (RQ3).
- **Nhóm `server`:** chỉ `server_response_time_ms`. Testbed chạy localhost nên gần như hằng số và không có fault tương ứng ⇒ dùng khi giải thích site thật, **không** nằm trong 5 nhóm xếp hạng ở RQ3.
- **Không đưa vào X** các đoạn phân rã LCP tính bằng ms (load delay, load duration, render delay): tổng của chúng bằng đúng LCP (leakage, cùng lý do L5).
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

### 8.1 Cấu hình mô hình RQ1–RQ2 (chốt 09/10/2026, trước lần train đầu tiên)

- **Dữ liệu vào mô hình:** dòng Shopify `status = ok` của trang có **≥ 4 lần hợp lệ**; site lockbox bị loại trước mọi bước.
- **Đơn vị:** mỗi phép đo là một dòng; fold và bootstrap tính theo site.
- **Target:** `lh_lcp_ms`, `tbt_30s_ms`, huấn luyện trên log1p(y), metric tính lại bằng ms (expm1). LCP ≥ 55 s được gắn cờ *sát cửa sổ*: giữ giá trị, kèm phân tích độ nhạy (chấm lại, không fit lại).
- **Mô hình và lưới** (inner GroupKFold theo site k = 4, tối ưu MAE trên thang log; imputation median + cột chỉ báo thiếu, fit trong fold): *Baseline* median của fold train · *Ridge* log1p(feature) → chuẩn hóa → α ∈ {0,1; 1; 10; 100; 1000} · *Random Forest* 500 cây, min_samples_leaf ∈ {2, 5, 10}, max_features ∈ {0,33; 1,0} · *XGBoost* 300 vòng, max_depth ∈ {2, 4}, learning_rate ∈ {0,03; 0,1}, subsample = colsample = 0,8. Seed 42.
- **Bộ feature:** **S** là claim *dự đoán trước khi chạy trang*; **S+R** chứa đại lượng đo cùng lần với target ⇒ *cận trên / mô hình giải thích*. Loại trừ L5 như §6.
- **Sanity check:** (1) shuffled-label (1 hoán vị, cùng mô hình và lưới); (2) residual theo site; (3) assert không site nào ở cả train và test.
- **Báo cáo:** MAE, RMSE, R², MdAPE theo fold và gộp out-of-fold; bootstrap 95% CI theo site (1.000 lần) cho MAE và ΔMAE so với baseline; RQ2: ΔMAE(S+R − S) cùng mô hình, bootstrap ghép cặp theo site.
- **SHAP chỉ báo cáo cho cặp (mô hình, target) thắng baseline** với CI của ΔMAE không chứa 0.
- **Lần chạy trước khi đóng băng dataset là *preliminary*:** chỉ kiểm tra pipeline; không đổi feature, lưới hay target dựa trên nó. Bug phát hiện được thì sửa và ghi §10.
- `config.json` của mỗi lần chạy ghi git commit, sha256 dataset và mã pipeline, phiên bản thư viện.

## 9. Toàn vẹn dữ liệu

- `measurement_id` duy nhất; mọi lần thử (kể cả lỗi) đều có `context.json`.
- Dataset dựng lại hoàn toàn từ raw: `npm run reports` (reparse → dictionary → noise report → leakage checklist → QC → EDA). Snapshot `data/processed/dataset-<version>.csv` chỉ được ghi khi Gate G3 đạt (dựng lại giống từng byte) và không bao giờ bị ghi đè.
- Site lockbox bị loại khỏi EDA và leakage screen (amendment 09/10/2026 (3)).
- Dữ liệu tuần 1 (profile `mobile_cpu4x_slow4g`, protocol cũ) ở `data/archive/`, không trộn với dữ liệu v1.0 (`reparse` lọc theo `profile_id`).

## 10. Amendment log

| Ngày | Thay đổi | Lý do |
|---|---|---|
| 06/10/2026 | Phát hành v1.0 (FROZEN). So với bản nháp 05/10: thêm `third-party-long-task` (ghép cặp với `js-long-task`); font ra ngoài phạm vi testbed (§4); thêm luật V4 `host_contention` | Fault bên thứ ba cũ không gây long task, trong khi chặn main thread là tác hại phổ biến nhất của app bên thứ ba. 15/190 phép đo testbed có `benchmark_index` tụt (máy bận). Chưa có mô hình nào được huấn luyện ⇒ chưa xem kết quả test nào |
| 07/10/2026 | Làm rõ (không đổi luật): chi tiết thực hiện chọn mẫu và chia wave ở §2 | Chi tiết vận hành của "chọn ngẫu nhiên phân tầng" đã có từ trước; target, label, predictor, split không đổi |
| 08/10/2026 | Tăng cỡ mẫu site thật từ 40 lên 80 store (vẫn thỏa "≥ 30 store"; số lần lặp, target, label, predictor, split không đổi). Mở rộng bằng `--extend`: rút tiếp theo đúng thứ tự seeded cũ, 40 store cũ giữ nguyên | Đơn vị độc lập của RQ1–RQ2 là **store**: 40 store chỉ còn ≈ 30 store phát triển sau lockbox, quá ít so với 26 feature. Pilot: chênh lệch giữa store (LCP 2,7–31,8 s) lớn hơn nhiều nhiễu giữa lần lặp (CV trung vị 6–17%) ⇒ thêm store có lợi hơn thêm lần lặp. Quyết định trước khi huấn luyện mô hình nào |
| 09/10/2026 | Thêm 4 predictor: S + `lcp_has_resource`, `lcp_lazy_loaded`, `lcp_not_discoverable`; R + `server_response_time_ms` (S 12 → 15, R 14 → 15, tổng 26 → 30). Nhóm cause mới `server`, loại khỏi xếp hạng RQ3 như `mixed` | EDA cho thấy feature set chỉ phủ phần *render delay* và một phần *load duration* của LCP; TTFB và *resource load delay* (ảnh LCP lazy-load hoặc do JS chèn) không có biến nào. Cả 4 lấy từ report đã lưu (`npm run reparse`), không đo lại. Đoạn phân rã LCP không được thêm vì cộng lại bằng LCP. Quyết định trước khi huấn luyện mô hình nào |
| 09/10/2026 (3) | EDA và leakage checklist **loại site lockbox** từ nay | **Công bố:** EDA ngày 08–09/10 (căn cứ thêm 4 predictor) đã dùng cả site lockbox ⇒ kết quả lockbox có thể hơi lạc quan. Feature thêm vào là feature cơ chế chuẩn của LCP, không chọn theo tương quan, nhưng vẫn ghi nhận |
| 09/10/2026 (4) | **Sửa bug** tính `tbt_30s_ms` và `trace_long_task_*`: khi store redirect phía server, code lấy navigationStart *cuối cùng* có cờ main frame (thường là iframe chat/tracking lúc 47–58 s, khác process) thay cho lần tải trang. Nay chỉ xét navigation có URL tài liệu thật, lấy lần đầu, vẫn ưu tiên khớp chính xác URL. Có regression test | Phát hiện qua pinko.com: TBT30 = 0 trong khi Lighthouse TBT 9–18 s. Bug đo lường, không phải đổi thiết kế. Ảnh hưởng 27 dòng site thật ở 4 site; testbed 0 dòng. Dataset trước khi sửa (v0.3) bị thay bằng **v0.3.1** |
| 09/10/2026 (2) | Chốt §8.1 (cấu hình mô hình). **Đo bù:** mỗi phép đo `error` của site thật được đo lại 1 lần sau wave 3, giữ nguyên `run`, `batch_id` mới, giới hạn cứng 150 → 300 s (`maxWaitForLoad`, throttling, cấu hình Lighthouse không đổi; kiểm tra `configSettings` trùng khớp trước khi gộp — `scripts/check-measurement-config-consistency.js`). Phép đo vẫn lỗi sau đo bù được báo cáo là thiếu không ngẫu nhiên theo tầng | Chốt trước lần train đầu tiên. Mọi lỗi collector thuộc tầng heavy, phần lớn do giới hạn cứng 150 s chứ không do cửa sổ tải 60 s |
| 09/10/2026 (3) bổ sung | (a) imputation = median **+ cột chỉ báo thiếu** cho mọi mô hình; (b) báo cáo thêm ΔMAE(S+R − S); (d) độ nhạy LCP sát cửa sổ là *chấm lại* trên cùng dự đoán; (e) `config.json` ghi git commit và sha256 | (a) `third_party_main_thread_ms` thiếu ở các site nặng ⇒ thiếu là có thông tin. (b) §8 yêu cầu Δ giữa S và S+R |
| 09/10/2026 (5) — **POST-HOC** | Thêm 3 predictor cho LCP: S + `lcp_resource_bytes`, `lcp_request_low_priority`; R + `bytes_before_lcp_request` (nhóm `mixed`). Tổng 30 → 33. Thêm metric MdAPE | **Quyết định sau khi đã xem kết quả preliminary** (LCP gần như không hơn baseline). Phân tích trên site dev, không đụng lockbox: thời gian tải chính tài nguyên LCP chiếm trung vị 58% LCP, trong khi `image_bytes` cộng mọi ảnh kể cả ảnh lazy dưới màn hình đầu. Thời điểm bắt đầu tải ảnh LCP **không** được dùng vì là một phần của LCP. Vì post-hoc, mọi cải thiện LCP trên dev chỉ là *exploratory*; **bằng chứng xác nhận duy nhất là lockbox** |
| 09/10/2026 (6) | RQ1–RQ2 luôn dùng GroupKFold theo site (k = 5) trên tập dev | Một phương pháp chia cố định giúp các lần chạy so sánh được với nhau |
| 13/10/2026 | Ghi nhận (không đổi luật): store pilot **bark.co** rơi vào lockbox theo luật hash. Giữ nguyên luật; khi mở lockbox, kết quả chính trên toàn bộ lockbox, kèm độ nhạy bỏ bark.co (chấm lại, không fit lại) | Dữ liệu pilot của bark.co đã dùng để ra quyết định thiết kế. Không đổi salt để bốc lại vì luật chia phải cố định trước khi biết kết quả |
| 25/10/2026 — **Dataset v1.0 FROZEN** | Mở rộng mẫu từ 80 lên **200 store** (67 light / 67 medium / 66 heavy) bằng `--extend`: wave 4–5 rút tiếp theo đúng thứ tự seeded cũ từ khung 819 store, 80 store cũ giữ nguyên. 3 store wave 4 bị loại toàn bộ (30/30 phép đo invalid) và được thay bằng 3 store cùng tầng ở wave 5 (`--replace`, có ghi log). 2.000 phép đo kế hoạch → **1.920 hợp lệ**, 74 invalid (V4), 6 vẫn lỗi sau đo bù (38 phép đo được đo bù, cứu được 32). **Dataset v1.0** = `data/processed/dataset-v1.0.csv` (sha256 `05125d31b991516d0a332087004617c18a7b455361d1390171e4de44401c1543`), Gate G3 đạt. Từ mốc này không sửa parser, feature, target hay luật chia. Dev 157 store / 310 trang / 1.499 dòng; lockbox 42 store (gồm 19 store lockbox của bản 80 store) **giữ đóng** | Learning curve trên v0.4 (60 store dev) chưa phẳng hẳn với Ridge/XGBoost và CI của ΔMAE(S+R − S) cho LCP còn rộng ⇒ cần thêm store. **Công bố:** (a) mở rộng mẫu *sau khi* đã xem kết quả preliminary trên 80 store; (b) một số phép đo của 80 store cũ được đo bù thêm (770 thay vì 767 hợp lệ); (c) 3 store bị thay sau khi đo. Vì vậy mọi kết quả trên tập development là *khám phá*; bằng chứng xác nhận là lần đánh giá lockbox duy nhất |
| 01/11/2026 — **Model freeze v1.0 / RQ1–RQ2 FROZEN** | Chốt kết quả chính RQ1–RQ2 trên run `dev-cv-261025-v1.0` (dataset v1.0; code trùng sha256 với run). Lưới tham số §8.1 giữ nguyên, không tìm thêm hyperparameter. Mô hình giải thích chính cho RQ3: Random Forest S+R; XGBoost S+R dùng kiểm tra độ bền. Manifest + danh sách fold (mọi store kế hoạch, kể cả lockbox): `data/processed/model-runs/model-freeze-v1.0/` | G5: RF và XGBoost S+R không phân biệt được (Wilcoxon p_Holm = 1,0). G6: chỉ sửa mô hình khi phát hiện lỗi phương pháp, ghi amendment; không sửa để số đẹp hơn. Lockbox vẫn đóng |

## 11. Kết luận pilot làm căn cứ freeze

Pilot v1.0: testbed 190 phép đo (06/10/2026), site thật 30 phép đo (05/10/2026). Sau V1–V4: **174/190** testbed hợp lệ (15 `host_contention`, 1 error) và **29/30** site thật hợp lệ.

1. **Manipulation check:** cả 6 fault đạt ρ(mức, đặc trưng cơ chế) ≥ 0,97. Liều–đáp ứng đơn điệu với JS, ảnh LCP, CSS và third-party long task (ρ ≥ 0,97), và DOM (ρ = 0,86). `third-party-scripts` bão hòa từ mức 2 (LCP ≈ 2.000 ms ở 12 và 30 script) — là một kết quả, không sửa liều.
2. **Cặp JS ghép cặp đúng:** TBT30 `js-long-task` 206 / 806 / 1.807 ms so với `third-party-long-task` 208 / 807 / 1.806 ms; request, byte, DOM giống baseline; chỉ `third_party_main_thread_ms` phân biệt hai fault.
3. **Giữ nguyên severity cả 6 fault.** Đổi liều sau khi xem pilot thì phải đo lại toàn bộ và không cải thiện câu hỏi nghiên cứu.
4. **Nhiễu testbed nhỏ:** CV trung vị LCP 1,5%, FCP 2,0%, TBT30 0,5% ⇒ 5 lần lặp là đủ.
5. **Nhiễu site thật lớn:** CV LCP 6–31%, TBT30 14–38%. Giữ 5 lần/trang vì độ chính xác RQ1–RQ2 phụ thuộc chủ yếu vào **số site**. Ước lượng LCP từng trang trong ±10% có khi cần 36 lần — không khả thi, ghi vào Threats to Validity.
6. **`tbt_30s_ms` là cần thiết:** Lighthouse TBT thiếu ở bark.co/product 5/5 lần.
7. **Leakage:** chỉ `trace_long_task_total_ms` có |ρ| ≥ 0,95 với TBT30 (0,99) và đã bị loại theo L5. Kiểm tra lại khi có ≥ 30 site (W3).
