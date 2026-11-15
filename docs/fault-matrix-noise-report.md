# Fault matrix & noise report (protocol v1.0 pilot)

> Sinh tự động bởi `node scripts/build-fault-matrix-noise-report.js`. Không sửa tay.
> Dữ liệu: 612 phép đo · ok 582 · invalid 16 · error 14. Ô = median [IQR] (ms).

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
| www.livreeleve.com.br / product | 5 | 5 | 0 | 7578 [700] | 5.5% | 6854–7681 | 7395 [1063] | 16.7% | 0/5 | 2 |
| stevemadden.co.za / product | 5 | 4 | 1 | 5132 [743] | 10.2% | 4579–5711 | 6400 [828] | 11.6% | 0/4 | 5 |
| www.miniclub.com.pk / home | 5 | 5 | 0 | 6968 [169] | 2.1% | 6796–7176 | 2512 [398] | 13.1% | 0/5 | 1 |
| wearme.ua / product | 5 | 0 | 5 | – [–] | – | ––– | – [–] | – | 0/0 | – |
| www.campusshoes.com / home | 5 | 5 | 0 | 2858 [189] | 9.2% | 2676–3387 | 762 [44] | 9.7% | 2/5 | 4 |
| www.miniclub.com.pk / product | 5 | 5 | 0 | 6416 [48] | 2.6% | 6355–6772 | 3360 [969] | 16.7% | 0/5 | 1 |
| shop.angel.com / product | 5 | 5 | 0 | 8173 [661] | 5.5% | 7436–8448 | 7234 [2860] | 22.0% | 0/5 | 2 |
| shopusa.season-of-mist.com / product | 5 | 5 | 0 | 4385 [38] | 6.1% | 4348–4991 | 3224 [836] | 19.8% | 0/5 | 2 |
| pampili.com.br / home | 5 | 5 | 0 | 11469 [81] | 2.8% | 11349–12165 | 3683 [247] | 9.3% | 0/5 | 1 |
| pepco.ro / home | 5 | 5 | 0 | 10267 [264] | 3.8% | 9636–10692 | 1841 [96] | 11.2% | 0/5 | 1 |
| verysmart.ca / product | 5 | 5 | 0 | 14752 [336] | 18.0% | 9479–15683 | 3162 [1149] | 31.4% | 0/5 | 13 |
| www.joone.fr / home | 5 | 5 | 0 | 21999 [413] | 2.0% | 21772–22865 | 3078 [156] | 11.0% | 0/5 | 1 |
| matcha-karu.com / product | 5 | 5 | 0 | 12170 [835] | 6.3% | 11713–13701 | 5551 [1698] | 34.2% | 0/5 | 2 |
| matcha-karu.com / home | 5 | 5 | 0 | 3646 [4526] | 48.1% | 3275–8311 | 5819 [710] | 16.4% | 0/5 | 89 |
| shop.angel.com / home | 5 | 5 | 0 | 18180 [147] | 2.3% | 17871–18957 | 4772 [1118] | 16.6% | 1/5 | 1 |
| pepco.ro / product | 5 | 5 | 0 | 8816 [419] | 3.9% | 8460–9331 | 1542 [156] | 20.6% | 0/5 | 1 |
| www.campusshoes.com / product | 5 | 5 | 0 | 2729 [927] | 19.3% | 2545–3826 | 5 [18] | 113.1% | 0/5 | 15 |
| verysmart.ca / home | 5 | 5 | 0 | 8562 [1035] | 33.8% | 3071–9167 | 8223 [87] | 3.7% | 0/5 | 44 |
| stevemadden.co.za / home | 5 | 5 | 0 | 10016 [790] | 5.5% | 9882–11152 | 4578 [385] | 5.6% | 0/5 | 2 |
| www.joone.fr / product | 5 | 5 | 0 | 5519 [646] | 20.7% | 5315–8305 | 6775 [1710] | 19.8% | 0/5 | 17 |
| wearme.ua / home | 5 | 5 | 0 | 8512 [1321] | 15.4% | 6886–10246 | 7785 [969] | 12.7% | 5/5 | 10 |
| www.livreeleve.com.br / home | 5 | 5 | 0 | 12818 [2162] | 15.0% | 12008–16945 | 7122 [907] | 18.9% | 0/5 | 9 |
| shopusa.season-of-mist.com / home | 5 | 5 | 0 | 31786 [61] | 0.7% | 31344–31888 | 2577 [348] | 8.3% | 0/5 | 1 |
| pampili.com.br / product | 5 | 5 | 0 | 15433 [872] | 5.2% | 14769–16858 | 5572 [194] | 3.7% | 0/5 | 2 |
| www.quadlockcase.eu / product | 5 | 5 | 0 | 13649 [575] | 7.4% | 11718–14304 | 5072 [2618] | 37.4% | 0/5 | 3 |
| misterradio-gps.com / product | 5 | 5 | 0 | 10246 [190] | 5.4% | 10172–11501 | 10298 [2582] | 32.0% | 0/5 | 2 |
| www.ayntec.com / home | 5 | 5 | 0 | 7554 [892] | 6.8% | 7291–8425 | 1917 [634] | 26.8% | 0/5 | 2 |
| www.cherrykitten.com / home | 5 | 5 | 0 | 18206 [937] | 4.8% | 16679–18889 | 8911 [941] | 30.8% | 0/5 | 1 |
| kabegamiyahonpo.com / product | 5 | 5 | 0 | 13589 [66] | 1.0% | 13504–13855 | 2887 [504] | 26.6% | 0/5 | 1 |
| pgservice.cc / product | 5 | 5 | 0 | 4147 [98] | 9.3% | 4085–5046 | 2057 [584] | 23.5% | 0/5 | 4 |
| www.natori.com / home | 5 | 5 | 0 | 9665 [850] | 5.2% | 9337–10438 | 7702 [1262] | 23.9% | 0/5 | 2 |
| kabegamiyahonpo.com / home | 5 | 5 | 0 | 11350 [1264] | 16.5% | 11139–16023 | 4017 [2824] | 45.9% | 5/5 | 11 |
| rdstudio.co / product | 5 | 5 | 0 | 11554 [514] | 4.2% | 11107–12326 | 10765 [177] | 29.6% | 0/5 | 1 |
| www.pichara.cl / home | 5 | 5 | 0 | 19023 [878] | 2.9% | 18414–19659 | 9048 [887] | 9.9% | 0/5 | 1 |
| vimergy.com / product | 5 | 5 | 0 | 9641 [231] | 5.6% | 9400–10769 | 8082 [2961] | 27.7% | 0/5 | 2 |
| miraggiolife.com / product | 5 | 4 | 1 | 3674 [193] | 4.1% | 3550–3881 | 9619 [2067] | 31.5% | 0/4 | 1 |
| buyniconi.com / product | 5 | 5 | 0 | 3344 [314] | 6.0% | 2992–3419 | 8643 [1947] | 26.3% | 0/5 | 2 |
| rdstudio.co / home | 5 | 5 | 0 | 10418 [947] | 30.0% | 10226–18699 | 9901 [1983] | 28.4% | 0/5 | 35 |
| mssaz.com / home | 5 | 5 | 0 | 4497 [2447] | 30.0% | 3486–6693 | 4810 [1590] | 19.8% | 0/5 | 35 |
| www.puropelle.com / home | 5 | 5 | 0 | 3060 [966] | 15.6% | 2998–4016 | 2389 [227] | 11.9% | 0/5 | 10 |
| www.puropelle.com / product | 5 | 5 | 0 | 8908 [581] | 7.5% | 8612–10339 | 4317 [1806] | 24.1% | 0/5 | 3 |
| www.bajaao.com / home | 5 | 5 | 0 | 15418 [695] | 8.1% | 13540–16987 | 9811 [669] | 13.5% | 0/5 | 3 |
| itspixie.com / product | 5 | 4 | 1 | 28114 [494] | 2.3% | 27446–29017 | 4241 [782] | 19.4% | 0/4 | 1 |
| www.pichara.cl / product | 5 | 5 | 0 | 15413 [887] | 4.0% | 14824–16315 | 13463 [2191] | 10.9% | 0/5 | 1 |
| www.quadlockcase.eu / home | 5 | 5 | 0 | 27611 [599] | 5.2% | 25062–28955 | 5493 [1358] | 23.3% | 0/5 | 2 |
| musclerepublic.com / home | 5 | 5 | 0 | 12298 [440] | 23.9% | 11538–19297 | 11929 [1993] | 11.6% | 0/5 | 22 |
| elitecarz.in / home | 5 | 5 | 0 | 9218 [566] | 4.1% | 9101–9972 | 6499 [1132] | 14.7% | 0/5 | 1 |
| stealplug.com.my / home | 5 | 5 | 0 | 19325 [138] | 5.3% | 19210–21612 | 7672 [556] | 9.7% | 0/5 | 2 |
| miraggiolife.com / home | 5 | 5 | 0 | 58843 [3203] | 3.0% | 55980–59376 | 8142 [954] | 10.3% | 5/5 | 1 |
| www.pinko.com / product | 5 | 5 | 0 | 6523 [352] | 11.9% | 6194–8251 | 11840 [709] | 18.0% | 0/5 | 6 |
| vegane-fleischerei.de / home | 5 | 5 | 0 | 30396 [547] | 1.7% | 29549–30815 | 4345 [1061] | 15.7% | 0/5 | 1 |
| stealplug.com.my / product | 5 | 5 | 0 | 5974 [32] | 6.8% | 5751–6824 | 5571 [1159] | 12.1% | 0/5 | 2 |
| www.newera.mx / home | 5 | 5 | 0 | 14879 [593] | 3.8% | 14169–15632 | 10345 [1111] | 28.2% | 5/5 | 1 |
| www.cherrykitten.com / product | 5 | 5 | 0 | 9851 [33] | 4.5% | 9834–10865 | 8852 [1176] | 11.0% | 0/5 | 1 |
| par2.pa / product | 5 | 5 | 0 | 5239 [102] | 8.4% | 4306–5300 | 4829 [1923] | 30.8% | 0/5 | 3 |
| www.bajaao.com / product | 5 | 5 | 0 | 1576 [1488] | 87.9% | 1344–7547 | 9360 [1052] | 8.0% | 0/5 | 298 |
| www.natori.com / product | 5 | 5 | 0 | 9864 [56] | 3.0% | 9755–10497 | 8596 [861] | 6.2% | 5/5 | 1 |
| par2.pa / home | 5 | 5 | 0 | 10344 [182] | 8.5% | 10237–12354 | 3841 [676] | 24.5% | 0/5 | 3 |
| www.ayntec.com / product | 5 | 5 | 0 | 13021 [450] | 5.7% | 12382–14357 | 2895 [537] | 18.7% | 0/5 | 2 |
| www.musikalcol.store / home | 5 | 5 | 0 | 3202 [767] | 12.3% | 3109–3935 | 2990 [965] | 24.3% | 0/5 | 6 |
| lukmed.cl / product | 5 | 5 | 0 | 3657 [183] | 16.5% | 2779–4459 | 3447 [1455] | 32.0% | 0/5 | 11 |
| pgservice.cc / home | 5 | 5 | 0 | 5312 [529] | 16.9% | 4624–7032 | 2488 [472] | 28.9% | 0/5 | 12 |
| lukmed.cl / home | 5 | 5 | 0 | 2928 [572] | 18.2% | 2596–4052 | 4184 [1621] | 19.7% | 0/5 | 13 |
| mssaz.com / product | 5 | 5 | 0 | 8524 [881] | 7.0% | 7481–8769 | 7149 [1108] | 11.6% | 0/5 | 2 |
| www.musikalcol.store / product | 5 | 5 | 0 | 6283 [172] | 4.5% | 6000–6759 | 4072 [707] | 16.1% | 0/5 | 1 |
| www.pinko.com / home | 5 | 5 | 0 | 9522 [447] | 6.2% | 9175–10664 | 8674 [1501] | 12.0% | 0/5 | 2 |
| vegane-fleischerei.de / product | 5 | 5 | 0 | 13200 [718] | 7.4% | 12673–15239 | 3408 [631] | 12.2% | 0/5 | 3 |
| musclerepublic.com / product | 5 | 5 | 0 | 11978 [882] | 7.1% | 10715–12940 | 11773 [967] | 4.4% | 0/5 | 2 |
| elitecarz.in / product | 5 | 5 | 0 | 6997 [154] | 4.9% | 6902–7751 | 3704 [977] | 20.9% | 0/5 | 1 |
| buyniconi.com / home | 5 | 5 | 0 | 8943 [237] | 4.1% | 8795–9731 | 9324 [285] | 4.0% | 5/5 | 1 |
| www.newera.mx / product | 5 | 5 | 0 | 7789 [270] | 3.0% | 7453–8042 | 12879 [667] | 3.4% | 5/5 | 1 |
| misterradio-gps.com / home | 5 | 5 | 0 | 26409 [1810] | 4.2% | 24543–26831 | 8268 [5231] | 40.6% | 0/5 | 1 |
| itspixie.com / home | 5 | 0 | 5 | – [–] | – | ––– | – [–] | – | 0/0 | – |
| vimergy.com / home | 5 | 5 | 0 | 25121 [17515] | 30.1% | 24414–42122 | 8134 [4741] | 37.2% | 1/5 | 35 |
| www.revesderecho.com / home | 1 | 1 | 0 | 20879 [0] | – | 20879–20879 | 11113 [0] | – | 0/1 | – |
| www.rampage.com.tr / product | 2 | 2 | 0 | 7579 [311] | 5.8% | 7268–7890 | 2963 [686] | 32.8% | 0/2 | 2 |
| www.diabolique.es / home | 1 | 1 | 0 | 13285 [0] | – | 13285–13285 | 3094 [0] | – | 0/1 | – |
| petiscope.fr / product | 2 | 2 | 0 | 10852 [2765] | 36.0% | 8087–13617 | 2503 [812] | 45.9% | 0/2 | 50 |
| kalaubeauty.com / home | 1 | 1 | 0 | 32719 [0] | – | 32719–32719 | 4877 [0] | – | 1/1 | – |
| www.orionride.com / home | 1 | 1 | 0 | 9193 [0] | – | 9193–9193 | 7722 [0] | – | 0/1 | – |
| shop.comofootball.com / home | 1 | 1 | 0 | 2923 [0] | – | 2923–2923 | 5297 [0] | – | 0/1 | – |
| leathergallery.co.za / home | 2 | 2 | 0 | 11002 [584] | 7.5% | 10418–11586 | 3880 [1315] | 47.9% | 0/2 | 3 |
| www.eden-park.com / product | 1 | 1 | 0 | 15276 [0] | – | 15276–15276 | 4911 [0] | – | 0/1 | – |
| ajantashoes.com / home | 1 | 1 | 0 | 1206 [0] | – | 1206–1206 | 5245 [0] | – | 0/1 | – |
| www.myfonts.com / home | 1 | 1 | 0 | 14319 [0] | – | 14319–14319 | 6931 [0] | – | 0/1 | – |
| housewor.com / product | 1 | 1 | 0 | 13765 [0] | – | 13765–13765 | 3780 [0] | – | 0/1 | – |
| www.redapplefireworks.com / product | 1 | 1 | 0 | 2270 [0] | – | 2270–2270 | 8035 [0] | – | 1/1 | – |
| candyfunhouse.ca / product | 1 | 1 | 0 | 7751 [0] | – | 7751–7751 | 9319 [0] | – | 0/1 | – |
| simorra.com / product | 1 | 1 | 0 | 3314 [0] | – | 3314–3314 | 9479 [0] | – | 0/1 | – |
| iyaksticker.in / product | 1 | 1 | 0 | 8677 [0] | – | 8677–8677 | 2383 [0] | – | 0/1 | – |
| pepperfield.cz / home | 1 | 1 | 0 | 16220 [0] | – | 16220–16220 | 8816 [0] | – | 0/1 | – |
| hosjosefine.no / home | 1 | 1 | 0 | 15629 [0] | – | 15629–15629 | 3851 [0] | – | 0/1 | – |
| petiscope.fr / home | 1 | 1 | 0 | 6749 [0] | – | 6749–6749 | 2540 [0] | – | 0/1 | – |

\* Ước lượng thô số lần lặp để khoảng tin cậy 95% của LCP trung bình nằm trong ±10%: n ≈ (1,96·CV/0,10)².

### 3.3 Cờ chất lượng

| quality_flags | số dòng |
|---|---|
| `total-blocking-time:NO_TTI_NETWORK_IDLE_PERIOD;load_timeout` | 8 |
| `total-blocking-time:NO_TTI_CPU_IDLE_PERIOD;load_timeout` | 35 |
| `load_timeout` | 170 |
| `host_contention` | 16 |
| `total-blocking-time:NO_TTI_CPU_IDLE_PERIOD` | 3 |
