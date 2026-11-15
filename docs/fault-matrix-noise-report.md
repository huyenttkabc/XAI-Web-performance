# Fault matrix & noise report (protocol v1.0 pilot)

> Sinh tự động bởi `node scripts/build-fault-matrix-noise-report.js`. Không sửa tay.
> Dữ liệu: 220 phép đo · ok 203 · invalid 16 · error 1. Ô = median [IQR] (ms).

## 1. Fault matrix (testbed) — median [IQR] qua các lần lặp

### Trang `product`

| fault (cause group) | mức | liều | n | LCP | FCP | TBT30 | ΔLCP | ΔFCP | ΔTBT30 |
|---|---|---|---|---|---|---|---|---|---|
| **baseline** | 0 | 0 | 4 | 1381 [58] | 1316 [61] | 0 [0] |  |  |  |
| dom-bloat (dom_layout) | 1 | 1500 | 4 | 1464 [69] | 1454 [61] | 0 [0] | 82 | 138 | 0 |
| dom-bloat (dom_layout) | 2 | 4000 | 5 | 1578 [8] | 1569 [10] | 0 [0] | 197 | 253 | 0 |
| dom-bloat (dom_layout) | 3 | 10000 | 5 | 1640 [46] | 1630 [47] | 139 [26] | 258 | 314 | 139 |
| js-long-task (main_thread_js) | 1 | 100 | 5 | 1468 [90] | 1308 [8] | 204 [2] | 87 | -8 | 204 |
| js-long-task (main_thread_js) | 2 | 250 | 5 | 1387 [80] | 1304 [15] | 806 [1] | 6 | -13 | 806 |
| js-long-task (main_thread_js) | 3 | 500 | 4 | 1644 [467] | 1303 [21] | 1807 [3] | 262 | -13 | 1807 |
| lcp-heavy-image (lcp_resource) | 1 | 300 | 4 | 2877 [5] | 1310 [30] | 0 [0] | 1495 | -6 | 0 |
| lcp-heavy-image (lcp_resource) | 2 | 900 | 5 | 6134 [2] | 1306 [24] | 0 [0] | 4753 | -10 | 0 |
| lcp-heavy-image (lcp_resource) | 3 | 2000 | 5 | 12106 [10] | 1328 [70] | 0 [0] | 10725 | 12 | 0 |
| render-blocking-css (render_blocking) | 1 | 150 | 4 | 2292 [16] | 2292 [16] | 0 [0] | 910 | 976 | 0 |
| render-blocking-css (render_blocking) | 2 | 500 | 5 | 4229 [38] | 4229 [38] | 0 [0] | 2847 | 2912 | 0 |
| render-blocking-css (render_blocking) | 3 | 1200 | 5 | 8134 [35] | 8134 [35] | 0 [0] | 6753 | 6818 | 0 |
| third-party-long-task (third_party) | 1 | 100 | 5 | 1370 [5] | 1314 [18] | 208 [1] | -11 | -3 | 208 |
| third-party-long-task (third_party) | 2 | 250 | 4 | 1400 [156] | 1360 [135] | 807 [3] | 18 | 44 | 807 |
| third-party-long-task (third_party) | 3 | 500 | 5 | 1869 [373] | 1301 [9] | 1806 [1] | 487 | -15 | 1806 |
| third-party-scripts (third_party) | 1 | 4 | 4 | 1879 [18] | 1318 [25] | 0 [0] | 497 | 2 | 0 |
| third-party-scripts (third_party) | 2 | 12 | 4 | 2022 [20] | 1334 [104] | 0 [0] | 640 | 18 | 0 |
| third-party-scripts (third_party) | 3 | 30 | 4 | 1997 [14] | 1298 [5] | 0 [8] | 615 | -18 | 0 |

### Trang `home`

| fault (cause group) | mức | liều | n | LCP | FCP | TBT30 | ΔLCP | ΔFCP | ΔTBT30 |
|---|---|---|---|---|---|---|---|---|---|
| **baseline** | 0 | 0 | 5 | 1373 [12] | 1281 [13] | 0 [0] |  |  |  |
| dom-bloat (dom_layout) | 1 | 1500 | 5 | 1421 [168] | 1412 [165] | 0 [0] | 48 | 131 | 0 |
| dom-bloat (dom_layout) | 2 | 4000 | 5 | 1570 [41] | 1564 [43] | 0 [0] | 197 | 282 | 0 |
| dom-bloat (dom_layout) | 3 | 10000 | 5 | 1787 [240] | 1778 [258] | 157 [46] | 414 | 497 | 157 |
| js-long-task (main_thread_js) | 1 | 100 | 5 | 1486 [101] | 1297 [63] | 208 [9] | 113 | 16 | 208 |
| js-long-task (main_thread_js) | 2 | 250 | 5 | 1380 [10] | 1298 [47] | 806 [1] | 7 | 16 | 806 |
| js-long-task (main_thread_js) | 3 | 500 | 4 | 1369 [39] | 1284 [41] | 1807 [3] | -4 | 2 | 1807 |
| lcp-heavy-image (lcp_resource) | 1 | 300 | 5 | 2875 [5] | 1284 [13] | 0 [0] | 1502 | 3 | 0 |
| lcp-heavy-image (lcp_resource) | 2 | 900 | 5 | 6141 [10] | 1287 [20] | 0 [0] | 4768 | 5 | 0 |
| lcp-heavy-image (lcp_resource) | 3 | 2000 | 5 | 12100 [3] | 1293 [12] | 0 [0] | 10727 | 12 | 0 |
| render-blocking-css (render_blocking) | 1 | 150 | 4 | 2260 [16] | 2260 [16] | 0 [0] | 887 | 979 | 0 |
| render-blocking-css (render_blocking) | 2 | 500 | 4 | 4204 [21] | 4204 [21] | 0 [0] | 2831 | 2922 | 0 |
| render-blocking-css (render_blocking) | 3 | 1200 | 4 | 8091 [44] | 8091 [44] | 0 [0] | 6718 | 6810 | 0 |
| third-party-long-task (third_party) | 1 | 100 | 4 | 1376 [31] | 1298 [5] | 216 [30] | 3 | 16 | 216 |
| third-party-long-task (third_party) | 2 | 250 | 4 | 1376 [77] | 1284 [5] | 807 [3] | 3 | 2 | 807 |
| third-party-long-task (third_party) | 3 | 500 | 5 | 1375 [14] | 1284 [13] | 1806 [1] | 2 | 2 | 1806 |
| third-party-scripts (third_party) | 1 | 4 | 5 | 1875 [11] | 1289 [11] | 0 [0] | 502 | 8 | 0 |
| third-party-scripts (third_party) | 2 | 12 | 4 | 1994 [14] | 1284 [3] | 0 [0] | 621 | 3 | 0 |
| third-party-scripts (third_party) | 3 | 30 | 5 | 1995 [11] | 1286 [15] | 0 [0] | 622 | 4 | 0 |

## 2. Manipulation check & dose–response

Spearman ρ giữa mức nghiêm trọng (0 = baseline … 3) và (a) đặc trưng cơ chế, (b) outcome chính của fault, gộp hai trang. ρ ≈ 1 = tăng đơn điệu theo liều.

| fault | cause group | đặc trưng cơ chế | ρ(mức, đặc trưng) | outcome chính | ρ(mức, outcome) | median outcome theo mức 0→3 |
|---|---|---|---|---|---|---|
| js-long-task | main_thread_js | `mt_script_eval_ms` | 0.97 | `tbt_30s_ms` | 0.97 | 0 → 206 → 806 → 1807 |
| dom-bloat | dom_layout | `dom_elements` | 0.98 | `lh_lcp_ms` | 0.86 | 1373 → 1447 → 1575 → 1659 |
| lcp-heavy-image | lcp_resource | `image_bytes` | 1.00 | `lh_lcp_ms` | 0.97 | 1373 → 2875 → 6136 → 12102 |
| render-blocking-css | render_blocking | `stylesheet_bytes` | 1.00 | `lh_fcp_ms` | 0.97 | 1293 → 2282 → 4220 → 8116 |
| third-party-scripts | third_party | `third_party_requests` | 1.00 | `lh_lcp_ms` | 0.86 | 1373 → 1877 → 2008 → 1995 |
| third-party-long-task | third_party | `third_party_main_thread_ms` | 0.97 | `tbt_30s_ms` | 0.98 | 0 → 208 → 807 → 1806 |

## 3. Noise — biến thiên giữa các lần lặp

### 3.1 Testbed (môi trường xác định)

- LCP: median CV 1.5%, max 16.9% (trên 38 điều kiện)
- FCP: median CV 2.0%, max 14.1% (trên 38 điều kiện)
- TBT30 (chỉ điều kiện có median TBT30 ≥ 50 ms): median CV 0.5%, max 29.3% (trên 14 điều kiện)

### 3.2 Trang Shopify thật

| site / trang | đo | ok | invalid/error | LCP median [IQR] | LCP CV | LCP min–max | TBT30 median [IQR] | TBT30 CV | lh_tbt thiếu | n cần cho ±10% median* |
|---|---|---|---|---|---|---|---|---|---|---|
| bark.co / product | 5 | 5 | 0 | 6858 [901] | 9.5% | 5655–7019 | 4430 [3095] | 33.8% | 5/5 | 4 |
| bark.co / home | 5 | 5 | 0 | 12817 [1378] | 6.0% | 11869–13487 | 4758 [269] | 37.8% | 0/5 | 2 |
| adresmedikal.net / home | 5 | 4 | 1 | 2979 [326] | 9.5% | 2853–3480 | 2724 [613] | 31.4% | 0/4 | 4 |
| adresmedikal.net / product | 5 | 5 | 0 | 4198 [1812] | 30.5% | 2191–4245 | 2479 [1] | 14.1% | 0/5 | 36 |
| amixstore.com / home | 5 | 5 | 0 | 2845 [538] | 20.8% | 2143–3777 | 4300 [720] | 37.2% | 0/5 | 17 |
| amixstore.com / product | 5 | 5 | 0 | 4182 [443] | 7.7% | 3743–4502 | 6304 [2839] | 29.8% | 0/5 | 3 |

\* Ước lượng thô số lần lặp để khoảng tin cậy 95% của LCP trung bình nằm trong ±10%: n ≈ (1,96·CV/0,10)².

### 3.3 Cờ chất lượng

| quality_flags | số dòng |
|---|---|
| `total-blocking-time:NO_TTI_NETWORK_IDLE_PERIOD;load_timeout` | 1 |
| `total-blocking-time:NO_TTI_CPU_IDLE_PERIOD;load_timeout` | 4 |
| `load_timeout` | 7 |
| `host_contention` | 16 |
