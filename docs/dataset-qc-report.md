# Dataset QC report — dataset v1.0

> Sinh tự động bởi `node scripts/build-dataset-qc-report.js`. Không sửa tay.
> Snapshot: `data/processed/dataset-v1.0.csv` · 2265 dòng × 67 cột · sha256 `05125d31b991516d…`

## 1. Gate G3 — schema ổn định, parser tái lập

| Kiểm tra | Kết quả |
|---|---|
| Header = `feature-definitions.js` (thứ tự và tên cột) | ✅ |
| Dựng lại độc lập từ raw = file `pilot-dataset.csv` do `npm run reparse` ghi (byte) | ✅ |
| `measurement_id` duy nhất | ✅ |

## 2. Tiến độ thu thập (Shopify thật)

Kế hoạch: 200 store × 2 trang × 5 lần = **2000 phép đo**. Đã đo **2000** (100.0%), hợp lệ 1920.

| wave | stratum | store | đã đo / kế hoạch | ok |
|---|---|---|---|---|
| 0 | heavy | 1 | 10 / 10 | 10 |
| 0 | light | 1 | 10 / 10 | 9 |
| 0 | medium | 1 | 10 / 10 | 10 |
| 1 | heavy | 4 | 40 / 40 | 40 |
| 1 | light | 4 | 40 / 40 | 40 |
| 1 | medium | 4 | 40 / 40 | 40 |
| 2 | heavy | 8 | 80 / 80 | 80 |
| 2 | light | 9 | 90 / 90 | 90 |
| 2 | medium | 8 | 80 / 80 | 80 |
| 3 | heavy | 13 | 130 / 130 | 126 |
| 3 | light | 13 | 130 / 130 | 119 |
| 3 | medium | 14 | 140 / 140 | 127 |
| 4 | heavy | 40 | 400 / 400 | 381 |
| 4 | light | 38 | 380 / 380 | 365 |
| 4 | medium | 39 | 390 / 390 | 373 |
| 5 | light | 2 | 20 / 20 | 20 |
| 5 | medium | 1 | 10 / 10 | 10 |

## 3. Trạng thái và lý do loại

| site_type | ok | invalid | error | lý do invalid (V1–V4) |
|---|---|---|---|---|
| shopify_storefront | 1920 | 104 | 51 | host_contention ×69, cross_host_redirect ×30, not_shopify ×5 |
| controlled_testbed | 174 | 15 | 1 | host_contention ×15 |

## 4. Nhật ký lỗi collector (`data/logs/collector-error-log.jsonl`)

91 phép đo không ok được ghi (V1–V3 lúc đo và lỗi không có report; V4 chỉ áp lúc reparse).

| status | cờ / lỗi | số lần | site |
|---|---|---|---|
| error | PAGE_HUNG | 18 | wearme.ua, suzyshier.com, shadyrays.com, www.dreo.com, shokz.com, www.hypeelixir.com, kuludonline.com, zatu.com |
| error | collector process failed without a report | 1 | stevemadden.co.za |
| error | timeout after 150000 ms | 7 | miraggiolife.com, itspixie.com |
| error | FAILED_DOCUMENT_REQUEST | 10 | shop.comofootball.com |
| error | NO_FCP | 6 | www.orionride.com, petiscope.fr, simorra.com, hatley.com, wearme.ua, itspixie.com |
| error | collector process failed without a report (exit 1) | 5 | www.beauteprivee.fr, www.hypeelixir.com, us.dollarshaveclub.com |
| error | Connection closed. | 1 | www.jdsports.co.th |
| error | Unexpected end of JSON input | 1 | www.dunns.co.za |
| invalid | cross_host_redirect | 30 | phonevilla.in, pursemaison.com, vidalibros.com |
| error | PROTOCOL_TIMEOUT | 1 | ajeworld.com.au |
| invalid | not_shopify | 5 | www.threebirdnest.com |
| error | ERRORED_DOCUMENT_REQUEST | 6 | colorsoutlet.it |

## 5. Giá trị thiếu (dòng ok)

Chỉ liệt kê cột có thiếu; mọi cột khác đầy đủ 100%.

| cột | nhóm | thiếu — site thật | thiếu — testbed |
|---|---|---|---|
| `lh_tbt_ms` | target | 14.7% | 0.0% |
| `lh_si_ms` | target | 0.2% | 0.0% |
| `lh_perf_score` | target | 14.8% | 0.0% |
| `lcp_resource_bytes` | structural | 2.0% | 0.0% |
| `lcp_request_low_priority` | structural | 2.0% | 0.0% |
| `third_party_main_thread_ms` | runtime | 14.7% | 0.0% |
| `bytes_before_lcp_request` | runtime | 12.8% | 0.0% |

`lh_tbt_ms` thiếu khi trang không đạt TTI (dự kiến, xem protocol §5); target chính `tbt_30s_ms` không phụ thuộc TTI.

## 6. Lần đo lệch bất thường (outlier)

Quy tắc: lệch > 50% so với median của chính trang đó (cùng store, cùng loại trang). Chỉ **đánh dấu để xem lại**, không loại — dao động lớn là đặc tính thật của site thật và đã được tính vào nhiễu.

239 / 3835 giá trị được kiểm tra bị đánh dấu (bỏ qua trang có median < 50 ms).

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
| lucienne.shop / product | tbt_30s_ms | 5 | 4817 | 2021 |
| dixxon.co.uk / product | tbt_30s_ms | 5 | 2776 | 6201 |
| www.threebirdnest.com / product | tbt_30s_ms | 5 | 13516 | 5799 |
| cbj-store.com / home | lh_lcp_ms | 4 | 6004 | 39866 |
| cbj-store.com / home | tbt_30s_ms | 2 | 761 | 2508 |
| cbj-store.com / home | tbt_30s_ms | 1 | 915 | 2508 |
| cbj-store.com / home | tbt_30s_ms | 4 | 5252 | 2508 |
| tincan.kids / home | tbt_30s_ms | 5 | 14034 | 6549 |
| tincan.kids / home | tbt_30s_ms | 2 | 3238 | 6549 |
| eveoc.com / product | tbt_30s_ms | 1 | 1712 | 3432 |
| ebisujapan.com / home | lh_lcp_ms | 5 | 36324 | 5342 |
| ebisujapan.com / home | lh_lcp_ms | 4 | 36423 | 5342 |
| ebisujapan.com / home | tbt_30s_ms | 4 | 17880 | 11714 |
| gemsmagic.com / home | lh_lcp_ms | 4 | 13046 | 28590 |
| gemsmagic.com / home | tbt_30s_ms | 4 | 2836 | 7058 |
| gemsmagic.com / home | tbt_30s_ms | 2 | 10727 | 7058 |
| www.legit.co.za / product | lh_lcp_ms | 1 | 7329 | 4808 |
| www.legit.co.za / product | tbt_30s_ms | 4 | 1925 | 3976 |
| www.legit.co.za / product | tbt_30s_ms | 1 | 1542 | 3976 |
| www.legit.co.za / product | tbt_30s_ms | 5 | 7544 | 3976 |
| www.legit.co.za / product | tbt_30s_ms | 3 | 6027 | 3976 |
| smartwatchbanden.nl / home | tbt_30s_ms | 3 | 1949 | 5421 |
| smartwatchbanden.nl / home | tbt_30s_ms | 1 | 9744 | 5421 |
| smartwatchbanden.nl / home | tbt_30s_ms | 5 | 8715 | 5421 |
| www.jaywalking.in / product | tbt_30s_ms | 1 | 1519 | 919 |
| templedesigner.com / home | tbt_30s_ms | 2 | 2774 | 1736 |
| motifz.com.pk / home | lh_lcp_ms | 4 | 8733 | 2451 |
| motifz.com.pk / home | lh_lcp_ms | 3 | 12829 | 2451 |
| suzyshier.com / product | tbt_30s_ms | 1 | 4255 | 11059 |
| schilder.kaufen / product | lh_lcp_ms | 4 | 7746 | 4839 |
| schilder.kaufen / product | tbt_30s_ms | 4 | 2319 | 7150 |
| schilder.kaufen / product | tbt_30s_ms | 5 | 13987 | 7150 |
| preethiwear.in / home | lh_lcp_ms | 4 | 1440 | 15989 |
| hug-u.2plus8.co.jp / home | tbt_30s_ms | 1 | 8654 | 5435 |
| evexiapharmadz.com / product | lh_lcp_ms | 1 | 6641 | 3600 |
| eu.oneill.com / product | lh_lcp_ms | 2 | 5426 | 3389 |
| meripharmacy.pk / home | lh_lcp_ms | 1 | 33725 | 15143 |
| meripharmacy.pk / home | tbt_30s_ms | 1 | 21276 | 7642 |
| blurgvillage.com / home | tbt_30s_ms | 4 | 9115 | 5284 |
| badasshatco.com / home | lh_lcp_ms | 4 | 4795 | 16652 |
| naturasummarum.de / product | tbt_30s_ms | 4 | 11061 | 6647 |
| www.belladoctor.com.br / product | tbt_30s_ms | 2 | 15288 | 9132 |
| shop.kenanddanadesign.com / product | lh_lcp_ms | 1 | 14678 | 6637 |
| shop.kenanddanadesign.com / product | tbt_30s_ms | 1 | 345 | 212 |
| www.nicobar.com / home | tbt_30s_ms | 5 | 9549 | 4934 |
| jpbulk.daisonet.com / product | tbt_30s_ms | 1 | 11314 | 6835 |
| quicketail.com / home | lh_lcp_ms | 3 | 12971 | 8496 |
| kalpraag.com / product | tbt_30s_ms | 2 | 14307 | 5890 |
| www.domesticappliances.philips.co.in / product | tbt_30s_ms | 1 | 1253 | 751 |
| www.domesticappliances.philips.co.in / product | tbt_30s_ms | 2 | 1370 | 751 |
| thebearhouse.com / product | lh_lcp_ms | 4 | 4410 | 12805 |
| thebearhouse.com / product | tbt_30s_ms | 4 | 1551 | 7222 |
| thebearhouse.com / product | tbt_30s_ms | 1 | 13550 | 7222 |
| dozadesanatate.net / home | tbt_30s_ms | 5 | 5125 | 3120 |
| www.haniatextile.com / home | lh_lcp_ms | 4 | 52543 | 28429 |
| www.haniatextile.com / home | tbt_30s_ms | 4 | 927 | 4523 |
| sundrug-online.com / product | tbt_30s_ms | 5 | 17416 | 9813 |
| mybombae.in / product | lh_lcp_ms | 2 | 4216 | 12329 |
| mybombae.in / product | tbt_30s_ms | 5 | 18407 | 8649 |
| dakurtis.com / product | tbt_30s_ms | 4 | 10059 | 4363 |
| liftsafety.com / home | lh_lcp_ms | 4 | 42783 | 25304 |
| liftsafety.com / home | tbt_30s_ms | 4 | 15568 | 6968 |
| liftsafety.com / home | tbt_30s_ms | 1 | 2612 | 6968 |
| templedesigner.com / product | tbt_30s_ms | 4 | 3969 | 2620 |
| pruthvirajsarees.com / product | lh_lcp_ms | 4 | 10465 | 5595 |
| pruthvirajsarees.com / product | lh_lcp_ms | 5 | 11904 | 5595 |
| pruthvirajsarees.com / product | tbt_30s_ms | 2 | 1308 | 2867 |
| pruthvirajsarees.com / product | tbt_30s_ms | 5 | 6674 | 2867 |
| www.domesticappliances.philips.co.in / home | tbt_30s_ms | 3 | 1339 | 860 |
| artveraprint.com / home | tbt_30s_ms | 4 | 4107 | 2666 |
| corlection.com / product | lh_lcp_ms | 4 | 8090 | 53260 |
| rideoutsupply.com / home | tbt_30s_ms | 5 | 1813 | 934 |
| www.jaywalking.in / home | lh_lcp_ms | 4 | 2178 | 7668 |
| jazmin.pk / home | tbt_30s_ms | 4 | 1507 | 3201 |
| poolhousenewyork.com / product | tbt_30s_ms | 4 | 15652 | 9616 |
| lideewoman.com.au / home | lh_lcp_ms | 4 | 20906 | 12803 |
| lideewoman.com.au / home | lh_lcp_ms | 3 | 22197 | 12803 |
| pruthvirajsarees.com / home | tbt_30s_ms | 2 | 7065 | 4562 |
| hug-u.2plus8.co.jp / product | tbt_30s_ms | 3 | 7573 | 4013 |
| jpbulk.daisonet.com / home | tbt_30s_ms | 4 | 3139 | 1703 |
| www.canterburytimbers.com.au / product | lh_lcp_ms | 1 | 6207 | 3446 |
| www.dpam.com / product | tbt_30s_ms | 5 | 6242 | 3349 |
| artveraprint.com / product | tbt_30s_ms | 3 | 2235 | 5064 |
| artveraprint.com / product | tbt_30s_ms | 4 | 10887 | 5064 |
| facetofacegames.com / home | tbt_30s_ms | 2 | 2185 | 5492 |
| hu-ha.com / home | lh_lcp_ms | 2 | 3796 | 10990 |
| hu-ha.com / home | lh_lcp_ms | 5 | 3527 | 10990 |
| hu-ha.com / home | tbt_30s_ms | 2 | 3428 | 8614 |
| jasminumm.com / home | lh_lcp_ms | 5 | 4473 | 19863 |
| jasminumm.com / home | lh_lcp_ms | 1 | 1849 | 19863 |
| poolhousenewyork.com / home | lh_lcp_ms | 2 | 19133 | 8823 |
| johnrossjewellers.com / product | tbt_30s_ms | 1 | 19244 | 4807 |
| victoriamarbella.es / home | tbt_30s_ms | 4 | 3031 | 1916 |
| victoriamarbella.es / home | tbt_30s_ms | 2 | 805 | 1916 |
| theigt.com / product | lh_lcp_ms | 2 | 5783 | 3360 |
| theigt.com / product | lh_lcp_ms | 3 | 5313 | 3360 |
| theigt.com / product | tbt_30s_ms | 4 | 2180 | 4531 |
| rideoutsupply.com / product | tbt_30s_ms | 2 | 2793 | 1682 |
| www.dreo.com / home | lh_lcp_ms | 3 | 5092 | 3250 |
| www.dreo.com / home | tbt_30s_ms | 5 | 16476 | 10420 |
| pnjakt.se / home | lh_lcp_ms | 5 | 4450 | 2902 |
| blurgvillage.com / product | tbt_30s_ms | 2 | 13001 | 8138 |
| www.atk.store / home | lh_lcp_ms | 3 | 4419 | 9227 |
| www.atk.store / home | lh_lcp_ms | 2 | 4344 | 9227 |
| www.vastrado.com / product | tbt_30s_ms | 4 | 816 | 2036 |
| www.vastrado.com / product | tbt_30s_ms | 1 | 3453 | 2036 |
| luxus18k.com / product | tbt_30s_ms | 1 | 8669 | 5164 |
| jazmin.pk / product | tbt_30s_ms | 5 | 10707 | 6736 |
| www.illanificio.com / home | lh_lcp_ms | 5 | 19813 | 10162 |
| www.illanificio.com / home | lh_lcp_ms | 2 | 21247 | 10162 |
| laura.ca / product | tbt_30s_ms | 2 | 9777 | 4550 |
| laura.ca / product | tbt_30s_ms | 5 | 7887 | 4550 |
| alwaysfit.com.br / home | tbt_30s_ms | 5 | 1956 | 4685 |
| www.dpam.com / home | tbt_30s_ms | 1 | 11936 | 7357 |
| facetofacegames.com / product | tbt_30s_ms | 1 | 13203 | 8640 |
| www.ioannoushoes.eu / home | lh_lcp_ms | 1 | 3158 | 2063 |
| thebearhouse.com / home | lh_lcp_ms | 1 | 26495 | 16587 |
| thebearhouse.com / home | lh_lcp_ms | 4 | 7207 | 16587 |
| thebearhouse.com / home | tbt_30s_ms | 4 | 16487 | 10177 |
| tincan.kids / product | tbt_30s_ms | 3 | 3475 | 7558 |
| zatu.com / home | lh_lcp_ms | 2 | 11044 | 4998 |
| zatu.com / home | lh_lcp_ms | 5 | 10155 | 4998 |
| theigt.com / home | tbt_30s_ms | 4 | 5263 | 3255 |
| theigt.com / home | tbt_30s_ms | 3 | 8035 | 3255 |
| acemagic.eu / product | lh_lcp_ms | 2 | 52512 | 7292 |
| acemagic.eu / product | lh_lcp_ms | 4 | 26707 | 7292 |
| bbb.com.pa / product | lh_lcp_ms | 4 | 11421 | 5729 |
| bbb.com.pa / product | tbt_30s_ms | 3 | 6967 | 3883 |
| flyingcarts.in / home | lh_lcp_ms | 3 | 21586 | 2555 |
| flyingcarts.in / home | tbt_30s_ms | 1 | 1871 | 3761 |
| flyingcarts.in / home | tbt_30s_ms | 2 | 885 | 3761 |
| www.haniatextile.com / product | lh_lcp_ms | 1 | 25943 | 13290 |
| www.haniatextile.com / product | tbt_30s_ms | 1 | 3441 | 7989 |
| www.haniatextile.com / product | tbt_30s_ms | 3 | 12092 | 7989 |
| shop.megadeth.com / product | tbt_30s_ms | 2 | 2596 | 6052 |
| shop.megadeth.com / product | tbt_30s_ms | 1 | 10470 | 6052 |
| www.belladoctor.com.br / home | tbt_30s_ms | 2 | 5577 | 3656 |
| www.belladoctor.com.br / home | tbt_30s_ms | 3 | 5578 | 3656 |
| www.nicobar.com / product | lh_lcp_ms | 5 | 7068 | 15921 |
| www.nicobar.com / product | lh_lcp_ms | 3 | 7079 | 15921 |
| www.nicobar.com / product | tbt_30s_ms | 1 | 13060 | 3002 |
| blackcamels.com.pk / product | tbt_30s_ms | 3 | 12355 | 6997 |
| blackcamels.com.pk / product | tbt_30s_ms | 4 | 15135 | 6997 |
| www.aachho.com / home | lh_lcp_ms | 3 | 27720 | 14304 |
| www.aachho.com / home | lh_lcp_ms | 1 | 21689 | 14304 |
| www.aachho.com / home | tbt_30s_ms | 2 | 13025 | 6235 |
| www.aachho.com / home | tbt_30s_ms | 4 | 11981 | 6235 |
| lajreedesigner.com / product | tbt_30s_ms | 1 | 17465 | 10663 |
| lajreedesigner.com / product | tbt_30s_ms | 3 | 4652 | 10663 |
| bbb.com.pa / home | tbt_30s_ms | 2 | 2759 | 5877 |
| www.oscardelarenta.com / product | tbt_30s_ms | 2 | 5822 | 2959 |
| www.legit.co.za / home | tbt_30s_ms | 1 | 3317 | 6694 |
| jamilaofficial.com / home | tbt_30s_ms | 3 | 7084 | 3637 |
| magazineshop.us / product | tbt_30s_ms | 3 | 3807 | 2413 |
| faberindia.com / home | tbt_30s_ms | 4 | 13242 | 6454 |
| colorsoutlet.it / home | lh_lcp_ms | 4 | 4573 | 10232 |
| colorsoutlet.it / home | lh_lcp_ms | 1 | 4078 | 10232 |
| www.theseatshop.com / home | lh_lcp_ms | 3 | 37995 | 23046 |
| www.theseatshop.com / home | tbt_30s_ms | 5 | 2279 | 4919 |
| www.theseatshop.com / home | tbt_30s_ms | 3 | 13681 | 4919 |
| www.theseatshop.com / home | tbt_30s_ms | 2 | 8995 | 4919 |
| johnrossjewellers.com / home | tbt_30s_ms | 1 | 6817 | 3520 |
| hu-ha.com / product | lh_lcp_ms | 3 | 9714 | 5670 |
| hu-ha.com / product | tbt_30s_ms | 3 | 2397 | 9419 |
| schilder.kaufen / home | tbt_30s_ms | 1 | 1686 | 3411 |
| schilder.kaufen / home | tbt_30s_ms | 2 | 9222 | 3411 |
| ankhway.com / home | tbt_30s_ms | 3 | 12798 | 8059 |
| www.ratchetclothing.co.uk / product | tbt_30s_ms | 4 | 4234 | 2714 |
| www.atk.store / product | lh_lcp_ms | 1 | 6811 | 4202 |
| shadyrays.com / product | lh_lcp_ms | 2 | 21538 | 8191 |
| shadyrays.com / product | tbt_30s_ms | 1 | 7166 | 4397 |
| suzyshier.com / home | lh_lcp_ms | 4 | 19580 | 7260 |
| suzyshier.com / home | lh_lcp_ms | 2 | 18370 | 7260 |
| suzyshier.com / home | tbt_30s_ms | 4 | 13770 | 7116 |
| laura.ca / home | tbt_30s_ms | 5 | 6671 | 4006 |
| laura.ca / home | tbt_30s_ms | 4 | 8641 | 4006 |
| engine.com.pk / home | tbt_30s_ms | 2 | 10370 | 6725 |
| thursdayboots.com / product | tbt_30s_ms | 5 | 4612 | 11412 |
| www.scentsplit.com / product | lh_lcp_ms | 1 | 2655 | 6120 |

## 7. Nhiễu giữa các lần lặp (site thật)

| target | số trang | CV trung vị | CV p90 | CV max |
|---|---|---|---|---|
| `lh_lcp_ms` | 399 | 7.4% | 34.4% | 143.8% |
| `tbt_30s_ms` | 399 | 23.1% | 44.7% | 113.1% |
| `lh_fcp_ms` | 399 | 17.7% | 40.7% | 151.7% |

