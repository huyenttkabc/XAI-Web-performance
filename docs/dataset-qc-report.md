# Dataset QC report — dataset v0.4

> Sinh tự động bởi `node scripts/build-dataset-qc-report.js`. Không sửa tay.
> Snapshot: `data/processed/dataset-v0.4.csv` · 1013 dòng × 67 cột · sha256 `3163db4de4fece62…`

## 1. Gate G3 — schema ổn định, parser tái lập

| Kiểm tra | Kết quả |
|---|---|
| Header = `feature-definitions.js` (thứ tự và tên cột) | ✅ |
| Dựng lại độc lập từ raw = file `pilot-dataset.csv` do `npm run reparse` ghi (byte) | ✅ |
| `measurement_id` duy nhất | ✅ |

## 2. Tiến độ thu thập (Shopify thật)

Kế hoạch: 80 store × 2 trang × 5 lần = **800 phép đo**. Đã đo **800** (100.0%), hợp lệ 767.

| wave | stratum | store | đã đo / kế hoạch | ok |
|---|---|---|---|---|
| 0 | heavy | 1 | 10 / 10 | 10 |
| 0 | light | 1 | 10 / 10 | 9 |
| 0 | medium | 1 | 10 / 10 | 10 |
| 1 | heavy | 4 | 40 / 40 | 37 |
| 1 | light | 4 | 40 / 40 | 40 |
| 1 | medium | 4 | 40 / 40 | 40 |
| 2 | heavy | 8 | 80 / 80 | 79 |
| 2 | light | 9 | 90 / 90 | 90 |
| 2 | medium | 8 | 80 / 80 | 80 |
| 3 | heavy | 13 | 130 / 130 | 126 |
| 3 | light | 13 | 130 / 130 | 119 |
| 3 | medium | 14 | 140 / 140 | 127 |

## 3. Trạng thái và lý do loại

| site_type | ok | invalid | error | lý do invalid (V1–V4) |
|---|---|---|---|---|
| shopify_storefront | 767 | 26 | 30 | host_contention ×26 |
| controlled_testbed | 174 | 15 | 1 | host_contention ×15 |

## 4. Nhật ký lỗi collector (`data/logs/collector-error-log.jsonl`)

30 phép đo không ok được ghi (V1–V3 lúc đo và lỗi không có report; V4 chỉ áp lúc reparse).

| status | cờ / lỗi | số lần | site |
|---|---|---|---|
| error | PAGE_HUNG | 7 | wearme.ua |
| error | collector process failed without a report | 1 | stevemadden.co.za |
| error | timeout after 150000 ms | 7 | miraggiolife.com, itspixie.com |
| error | FAILED_DOCUMENT_REQUEST | 7 | shop.comofootball.com |
| error | NO_FCP | 6 | www.orionride.com, petiscope.fr, simorra.com, hatley.com, wearme.ua, itspixie.com |
| error | collector process failed without a report (exit 1) | 1 | www.beauteprivee.fr |
| error | Connection closed. | 1 | www.jdsports.co.th |

## 5. Giá trị thiếu (dòng ok)

Chỉ liệt kê cột có thiếu; mọi cột khác đầy đủ 100%.

| cột | nhóm | thiếu — site thật | thiếu — testbed |
|---|---|---|---|
| `lh_tbt_ms` | target | 10.4% | 0.0% |
| `lh_si_ms` | target | 0.4% | 0.0% |
| `lh_perf_score` | target | 10.7% | 0.0% |
| `lcp_resource_bytes` | structural | 2.1% | 0.0% |
| `lcp_request_low_priority` | structural | 2.1% | 0.0% |
| `third_party_main_thread_ms` | runtime | 10.4% | 0.0% |
| `bytes_before_lcp_request` | runtime | 15.8% | 0.0% |

`lh_tbt_ms` thiếu khi trang không đạt TTI (dự kiến, xem protocol §5); target chính `tbt_30s_ms` không phụ thuộc TTI.

## 6. Lần đo lệch bất thường (outlier)

Quy tắc: lệch > 50% so với median của chính trang đó (cùng store, cùng loại trang). Chỉ **đánh dấu để xem lại**, không loại — dao động lớn là đặc tính thật của site thật và đã được tính vào nhiễu.

60 / 1529 giá trị được kiểm tra bị đánh dấu (bỏ qua trang có median < 50 ms).

| trang | target | run | giá trị | median trang |
|---|---|---|---|---|
| bark.co / product | tbt_30s_ms | 5 | 6856 | 4430 |
| bark.co / product | tbt_30s_ms | 3 | 6754 | 4430 |
| bark.co / home | tbt_30s_ms | 2 | 9319 | 4758 |
| amixstore.com / home | tbt_30s_ms | 3 | 1702 | 4300 |
| adresmedikal.net / home | tbt_30s_ms | 5 | 4307 | 2724 |
| verysmart.ca / product | tbt_30s_ms | 4 | 5925 | 3162 |
| matcha-karu.com / product | tbt_30s_ms | 4 | 8775 | 5551 |
| matcha-karu.com / home | lh_lcp_ms | 5 | 8311 | 3646 |
| matcha-karu.com / home | lh_lcp_ms | 2 | 8038 | 3646 |
| verysmart.ca / home | lh_lcp_ms | 4 | 3071 | 8562 |
| www.joone.fr / product | lh_lcp_ms | 3 | 8305 | 5519 |
| www.quadlockcase.eu / product | tbt_30s_ms | 1 | 2401 | 5072 |
| misterradio-gps.com / product | tbt_30s_ms | 4 | 4585 | 10298 |
| www.ayntec.com / home | tbt_30s_ms | 4 | 3051 | 1917 |
| www.cherrykitten.com / home | tbt_30s_ms | 1 | 4334 | 8911 |
| kabegamiyahonpo.com / home | tbt_30s_ms | 4 | 1666 | 4017 |
| kabegamiyahonpo.com / home | tbt_30s_ms | 2 | 1633 | 4017 |
| rdstudio.co / product | tbt_30s_ms | 5 | 4549 | 10765 |
| rdstudio.co / home | lh_lcp_ms | 4 | 18699 | 10418 |
| rdstudio.co / home | tbt_30s_ms | 2 | 4889 | 9901 |
| musclerepublic.com / home | lh_lcp_ms | 1 | 19297 | 12298 |
| www.newera.mx / home | tbt_30s_ms | 4 | 4960 | 10345 |
| www.bajaao.com / product | lh_lcp_ms | 5 | 2991 | 1576 |
| www.bajaao.com / product | lh_lcp_ms | 3 | 7547 | 1576 |
| par2.pa / home | tbt_30s_ms | 1 | 5821 | 3841 |
| pgservice.cc / home | tbt_30s_ms | 4 | 4164 | 2488 |
| misterradio-gps.com / home | tbt_30s_ms | 4 | 3969 | 8268 |
| misterradio-gps.com / home | tbt_30s_ms | 2 | 3877 | 8268 |
| vimergy.com / home | lh_lcp_ms | 4 | 42041 | 25121 |
| vimergy.com / home | lh_lcp_ms | 3 | 42122 | 25121 |
| petiscope.fr / product | tbt_30s_ms | 1 | 1692 | 3769 |
| kalaubeauty.com / home | tbt_30s_ms | 4 | 4877 | 1495 |
| www.orionride.com / home | tbt_30s_ms | 3 | 7722 | 5124 |
| leathergallery.co.za / home | tbt_30s_ms | 2 | 5196 | 3017 |
| ajantashoes.com / home | tbt_30s_ms | 4 | 5245 | 2868 |
| www.myfonts.com / home | tbt_30s_ms | 4 | 6931 | 3811 |
| housewor.com / product | tbt_30s_ms | 3 | 3780 | 1981 |
| www.redapplefireworks.com / product | lh_lcp_ms | 2 | 2270 | 1070 |
| simorra.com / product | tbt_30s_ms | 5 | 9479 | 5898 |
| iyaksticker.in / product | tbt_30s_ms | 4 | 2383 | 1227 |
| pepperfield.cz / home | lh_lcp_ms | 3 | 16220 | 10418 |
| hosjosefine.no / home | tbt_30s_ms | 2 | 3851 | 2396 |
| www.revesderecho.com / product | tbt_30s_ms | 3 | 11350 | 6291 |
| ajantashoes.com / product | lh_lcp_ms | 2 | 1291 | 2746 |
| reebok.com.ar / product | tbt_30s_ms | 2 | 7135 | 4234 |
| kalaubeauty.com / product | tbt_30s_ms | 2 | 3171 | 1922 |
| www.orionride.com / product | lh_lcp_ms | 4 | 4423 | 10624 |
| www.orionride.com / product | lh_lcp_ms | 3 | 4451 | 10624 |
| leathergallery.co.za / product | tbt_30s_ms | 3 | 5954 | 3732 |
| vedix.com / product | tbt_30s_ms | 5 | 9613 | 5878 |
| vedix.com / product | tbt_30s_ms | 2 | 557 | 5878 |
| www.goodmonk.in / home | lh_lcp_ms | 5 | 6276 | 14424 |
| www.rampage.com.tr / home | lh_lcp_ms | 3 | 2895 | 8303 |
| ship.erewhon.com / product | tbt_30s_ms | 5 | 3861 | 2403 |
| store.seikowatches.com / home | lh_lcp_ms | 1 | 14168 | 9213 |
| housewor.com / home | tbt_30s_ms | 3 | 2878 | 1882 |
| www.chumbak.com / home | tbt_30s_ms | 4 | 3485 | 1813 |
| dalbe.fr / home | tbt_30s_ms | 5 | 5936 | 3694 |
| shop.comofootball.com / product | tbt_30s_ms | 3 | 3267 | 1717 |
| www.beauteprivee.fr / product | tbt_30s_ms | 4 | 9899 | 6554 |

## 7. Nhiễu giữa các lần lặp (site thật)

| target | số trang | CV trung vị | CV p90 | CV max |
|---|---|---|---|---|
| `lh_lcp_ms` | 160 | 6.0% | 23.8% | 87.9% |
| `tbt_30s_ms` | 160 | 19.7% | 37.2% | 113.1% |
| `lh_fcp_ms` | 160 | 15.3% | 40.7% | 64.0% |

