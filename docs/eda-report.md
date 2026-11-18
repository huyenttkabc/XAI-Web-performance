# EDA ban đầu — dataset v0.4 (Shopify thật)

> Sinh tự động bởi `node scripts/build-eda-report.js`. Không sửa tay.
> Đơn vị: **1 trang** (store × loại trang) = median các lần đo hợp lệ. 61 store · 122 trang · 580 phép đo hợp lệ.
> Site thuộc **lockbox** (protocol §8) bị loại khỏi EDA. Mọi con số là mô tả, chưa dùng để kết luận hay chọn feature.

## 1. Mẫu theo tầng (reference TBT)

| tầng | store | trang | TBT30 median (ms) | LCP median (ms) |
|---|---|---|---|---|
| light | 21 | 42 | 3066 | 7533 |
| medium | 22 | 44 | 5264 | 9857 |
| heavy | 18 | 36 | 7205 | 10683 |

Kiểm tra hợp lý: nếu phân tầng có ý nghĩa thì TBT30 tăng dần light → heavy.

## 2. Phân phối target (theo loại trang)

### product

| target | n | min | p25 | median | p75 | max |
|---|---|---|---|---|---|---|
| `lh_lcp_ms` | 61 | 1070 | 4182 | 7578 | 13021 | 36298 |
| `tbt_30s_ms` | 61 | 5 | 3447 | 4829 | 7171 | 13463 |
| `lh_tbt_ms` | 58 | 5 | 3781 | 5293 | 7830 | 17951 |
| `lh_fcp_ms` | 61 | 1032 | 1826 | 2678 | 3280 | 11496 |
| `lh_si_ms` | 60 | 2717 | 4696 | 8533 | 13205 | 39654 |
| `lh_cls` | 61 | 0.00 | 0.00 | 0.04 | 0.11 | 0.95 |
| `lh_perf_score` | 57 | 0.05 | 0.27 | 0.36 | 0.46 | 0.92 |

### home

| target | n | min | p25 | median | p75 | max |
|---|---|---|---|---|---|---|
| `lh_lcp_ms` | 61 | 1103 | 7554 | 10418 | 18644 | 58843 |
| `tbt_30s_ms` | 61 | 762 | 2868 | 4578 | 7672 | 14840 |
| `lh_tbt_ms` | 55 | 762 | 3390 | 5403 | 8411 | 18755 |
| `lh_fcp_ms` | 61 | 1011 | 1554 | 2013 | 2715 | 7917 |
| `lh_si_ms` | 61 | 1778 | 5339 | 9427 | 15296 | 39544 |
| `lh_cls` | 61 | 0.00 | 0.00 | 0.04 | 0.13 | 1.60 |
| `lh_perf_score` | 55 | 0.12 | 0.29 | 0.34 | 0.43 | 0.74 |

![LCP](figures/eda-hist-lh_lcp_ms.svg)

![TBT (30 s window)](figures/eda-hist-tbt_30s_ms.svg)

Thời gian lệch phải mạnh (vài trang rất nặng) → khi huấn luyện cân nhắc biến đổi log của target; quyết định thuộc preprocessing trong inner-CV (protocol §8).

## 3. Phân phối feature (median theo trang)

| feature | bộ | nhóm | n | min | p25 | median | p75 | max |
|---|---|---|---|---|---|---|---|---|
| `request_count` | S | mixed | 122 | 49 | 265 | 366 | 417 | 597 |
| `transfer_bytes_total` | S | mixed | 122 | 838459 | 4193597 | 5393051 | 6834318 | 17171577 |
| `script_requests` | S | main_thread_js | 122 | 23 | 75 | 114 | 147 | 324 |
| `script_bytes` | S | main_thread_js | 122 | 451327 | 1811118 | 2522761 | 3187563 | 6120084 |
| `stylesheet_bytes` | S | render_blocking | 122 | 0 | 52553 | 73856 | 99354 | 232413 |
| `image_bytes` | S | lcp_resource | 122 | 30280 | 471530 | 882726 | 2049027 | 8757443 |
| `font_bytes` | S | render_blocking | 122 | 0 | 77549 | 126261 | 243072 | 785134 |
| `document_bytes` | S | dom_layout | 122 | 41165 | 92468 | 137007 | 214957 | 489342 |
| `third_party_requests` | S | third_party | 122 | 23 | 130 | 178 | 236 | 434 |
| `third_party_bytes` | S | third_party | 122 | 261194 | 1834371 | 2846625 | 3559249 | 13014931 |
| `origin_count` | S | third_party | 122 | 8 | 27 | 37 | 50 | 77 |
| `dom_elements` | S | dom_layout | 122 | 703 | 1675 | 2366 | 3895 | 15626 |
| `lcp_has_resource` | S | lcp_resource | 122 | 0 | 1 | 1 | 1 | 1 |
| `lcp_lazy_loaded` | S | lcp_resource | 122 | 0 | 0 | 0 | 0 | 1 |
| `lcp_not_discoverable` | S | lcp_resource | 122 | 0 | 0 | 0 | 0 | 1 |
| `lcp_resource_bytes` | S | lcp_resource | 120 | 0 | 19060 | 46497 | 90942 | 332761 |
| `lcp_request_low_priority` | S | lcp_resource | 120 | 0 | 0 | 0 | 0 | 1 |
| `mt_script_eval_ms` | R | main_thread_js | 122 | 108 | 6446 | 10210 | 14528 | 37737 |
| `mt_script_parse_ms` | R | main_thread_js | 122 | 4 | 504 | 790 | 1059 | 2369 |
| `mt_gc_ms` | R | main_thread_js | 122 | 0 | 143 | 225 | 277 | 520 |
| `mt_style_layout_ms` | R | dom_layout | 122 | 377 | 1345 | 2520 | 5174 | 19297 |
| `mt_rendering_ms` | R | dom_layout | 122 | 71 | 565 | 1035 | 1877 | 8303 |
| `mt_parse_html_ms` | R | mixed | 122 | 89 | 208 | 313 | 445 | 1316 |
| `render_blocking_count` | R | render_blocking | 122 | 0 | 0 | 3 | 8 | 30 |
| `bootup_js_ms` | R | main_thread_js | 122 | 73 | 6857 | 10845 | 15283 | 38218 |
| `third_party_main_thread_ms` | R | third_party | 113 | 58 | 4188 | 7276 | 11882 | 29809 |
| `unused_js_bytes` | R | main_thread_js | 122 | 0 | 151318 | 302151 | 600636 | 1612654 |
| `unused_css_bytes` | R | render_blocking | 122 | 0 | 0 | 11282 | 28425 | 128136 |
| `bytes_before_lcp_request` | R | mixed | 100 | 92825 | 363397 | 729441 | 1130215 | 5298424 |
| `server_response_time_ms` | R | server | 122 | 27 | 30 | 33 | 144 | 2037 |
| `trace_long_task_count` | R | main_thread_js | 122 | 4 | 34 | 45 | 61 | 103 |
| `trace_long_task_total_ms` | R | main_thread_js | 122 | 373 | 5332 | 7308 | 10552 | 20025 |
| `trace_long_task_max_ms` | R | main_thread_js | 122 | 169 | 593 | 752 | 1021 | 4801 |

## 4. Tương quan Spearman feature ↔ target

| feature | bộ | ρ với LCP | ρ với TBT30 | ghi chú |
|---|---|---|---|---|
| `trace_long_task_total_ms` | R | 0.25 | 0.97 | loại khi target = TBT (L5) |
| `trace_long_task_count` | R | 0.28 | 0.79 | loại khi target = TBT (L5) |
| `trace_long_task_max_ms` | R | 0.22 | 0.78 | loại khi target = TBT (L5) |
| `third_party_main_thread_ms` | R | 0.25 | 0.77 |  |
| `bootup_js_ms` | R | 0.30 | 0.74 |  |
| `mt_script_eval_ms` | R | 0.30 | 0.73 |  |
| `lcp_resource_bytes` | S | 0.62 | 0.15 |  |
| `origin_count` | S | 0.26 | 0.61 |  |
| `mt_style_layout_ms` | R | 0.09 | 0.61 |  |
| `mt_parse_html_ms` | R | 0.13 | 0.61 |  |
| `mt_script_parse_ms` | R | 0.20 | 0.60 |  |
| `third_party_requests` | S | 0.20 | 0.60 |  |
| `script_bytes` | S | 0.19 | 0.57 |  |
| `request_count` | S | 0.21 | 0.56 |  |
| `bytes_before_lcp_request` | R | 0.53 | -0.02 |  |
| `unused_js_bytes` | R | 0.00 | 0.51 |  |
| `mt_gc_ms` | R | 0.33 | 0.51 |  |
| `script_requests` | S | 0.20 | 0.48 |  |
| `document_bytes` | S | 0.19 | 0.44 |  |
| `mt_rendering_ms` | R | 0.18 | 0.43 |  |
| `third_party_bytes` | S | 0.30 | 0.43 |  |
| `dom_elements` | S | 0.19 | 0.43 |  |
| `image_bytes` | S | 0.42 | 0.09 |  |
| `lcp_has_resource` | S | 0.41 | 0.16 |  |
| `transfer_bytes_total` | S | 0.39 | 0.28 |  |
| `lcp_lazy_loaded` | S | 0.32 | 0.01 |  |
| `lcp_not_discoverable` | S | 0.27 | 0.08 |  |
| `server_response_time_ms` | R | -0.26 | -0.06 |  |
| `unused_css_bytes` | R | -0.12 | 0.24 |  |
| `stylesheet_bytes` | S | -0.12 | 0.23 |  |
| `font_bytes` | S | 0.23 | 0.22 |  |
| `render_blocking_count` | R | 0.17 | 0.05 |  |
| `lcp_request_low_priority` | S | 0.10 | 0.05 |  |

![Spearman heatmap](figures/eda-spearman-heatmap.svg)

Cặp feature tương quan rất cao (|ρ| > 0,9) chia sẻ đóng góp SHAP tùy ý → lý do gộp SHAP theo cause group (protocol §8).

## 5. Tóm tắt theo store

| store | tầng | trang | runs ok | LCP | TBT30 | requests | KB tải | 3rd-party req | DOM |
|---|---|---|---|---|---|---|---|---|---|
| adresmedikal.net | light | home | 4 | 2979 | 2724 | 198 | 2715 | 101 | 954 |
| adresmedikal.net | light | product | 5 | 4198 | 2479 | 219 | 2837 | 120 | 765 |
| ajantashoes.com | medium | home | 5 | 1206 | 2868 | 218 | 11080 | 79 | 1121 |
| ajantashoes.com | medium | product | 3 | 2746 | 4282 | 231 | 3429 | 101 | 1583 |
| amixstore.com | medium | home | 5 | 2845 | 4300 | 464 | 7143 | 270 | 2787 |
| amixstore.com | medium | product | 5 | 4182 | 6304 | 466 | 5533 | 283 | 2299 |
| candyfunhouse.ca | heavy | home | 4 | 15293 | 6639 | 423 | 6671 | 253 | 4374 |
| candyfunhouse.ca | heavy | product | 5 | 7651 | 7171 | 462 | 5708 | 296 | 1707 |
| dalbe.fr | light | home | 5 | 18644 | 3694 | 264 | 4824 | 122 | 3134 |
| dalbe.fr | light | product | 5 | 11998 | 4573 | 297 | 4064 | 152 | 3163 |
| gruv.com | light | home | 5 | 20632 | 1137 | 236 | 16769 | 133 | 1247 |
| gruv.com | light | product | 4 | 3938 | 1299 | 187 | 2929 | 79 | 1074 |
| hatley.com | medium | home | 4 | 41886 | 1473 | 405 | 10931 | 234 | 3056 |
| hatley.com | medium | product | 4 | 9572 | 6048 | 560 | 6661 | 307 | 4673 |
| iyaksticker.in | light | home | 5 | 12824 | 1185 | 251 | 3487 | 122 | 891 |
| iyaksticker.in | light | product | 5 | 7511 | 1227 | 263 | 2217 | 130 | 703 |
| jockey.com.au | medium | home | 4 | 33701 | 5760 | 277 | 10717 | 151 | 2032 |
| jockey.com.au | medium | product | 4 | 17196 | 7651 | 367 | 5035 | 245 | 2395 |
| kabegamiyahonpo.com | heavy | home | 5 | 11350 | 4017 | 303 | 10316 | 134 | 3675 |
| kabegamiyahonpo.com | heavy | product | 5 | 13589 | 2887 | 343 | 6978 | 174 | 2387 |
| kyzo.in | light | home | 4 | 2448 | 4649 | 293 | 5561 | 157 | 1818 |
| kyzo.in | light | product | 5 | 2969 | 4435 | 316 | 4542 | 168 | 1248 |
| leathergallery.co.za | medium | home | 4 | 11099 | 3017 | 293 | 6337 | 121 | 2364 |
| leathergallery.co.za | medium | product | 5 | 4521 | 3732 | 344 | 5088 | 151 | 2301 |
| lukmed.cl | light | home | 5 | 2928 | 4184 | 181 | 5469 | 59 | 1473 |
| lukmed.cl | light | product | 5 | 3657 | 3447 | 160 | 2562 | 65 | 976 |
| miraggiolife.com | heavy | home | 5 | 58843 | 8142 | 432 | 10433 | 224 | 5529 |
| miraggiolife.com | heavy | product | 5 | 3601 | 9350 | 525 | 5650 | 256 | 3246 |
| mssaz.com | light | home | 5 | 4497 | 4810 | 332 | 2533 | 138 | 4522 |
| mssaz.com | light | product | 5 | 8524 | 7149 | 366 | 3691 | 154 | 3858 |
| par2.pa | medium | home | 5 | 10344 | 3841 | 201 | 4463 | 96 | 1018 |
| par2.pa | medium | product | 5 | 5239 | 4829 | 227 | 4348 | 131 | 1182 |
| pepco.ro | light | home | 5 | 10267 | 1841 | 116 | 2958 | 111 | 1882 |
| pepco.ro | light | product | 5 | 8816 | 1542 | 99 | 2129 | 94 | 739 |
| pepperfield.cz | medium | home | 5 | 10418 | 6587 | 388 | 10689 | 221 | 5289 |
| pepperfield.cz | medium | product | 4 | 6105 | 7803 | 404 | 4500 | 249 | 1484 |
| petiscope.fr | light | home | 4 | 7836 | 2721 | 385 | 4624 | 206 | 1419 |
| petiscope.fr | light | product | 4 | 11496 | 3769 | 426 | 5090 | 232 | 1869 |
| pgservice.cc | light | home | 5 | 5312 | 2488 | 367 | 2420 | 174 | 6648 |
| pgservice.cc | light | product | 5 | 4147 | 2057 | 397 | 2330 | 222 | 6652 |
| rdstudio.co | medium | home | 5 | 10418 | 9901 | 401 | 4671 | 267 | 2646 |
| rdstudio.co | medium | product | 5 | 11554 | 10765 | 409 | 4430 | 303 | 2247 |
| saysky.co.uk | light | home | 5 | 9987 | 3568 | 398 | 2793 | 86 | 8390 |
| saysky.co.uk | light | product | 4 | 16876 | 3216 | 280 | 4592 | 125 | 6103 |
| seoidin.com | medium | home | 5 | 31861 | 2074 | 384 | 6429 | 136 | 2162 |
| seoidin.com | medium | product | 5 | 13875 | 4798 | 366 | 4123 | 188 | 1676 |
| shop.comofootball.com | light | home | 2 | 3495 | 3782 | 454 | 6675 | 157 | 3233 |
| shop.comofootball.com | light | product | 3 | 1469 | 1717 | 505 | 4854 | 173 | 2368 |
| shopusa.season-of-mist.com | light | home | 5 | 31786 | 2577 | 265 | 5838 | 129 | 1204 |
| shopusa.season-of-mist.com | light | product | 5 | 4385 | 3224 | 384 | 3685 | 200 | 1373 |
| simorra.com | heavy | home | 4 | 16868 | 5028 | 340 | 5057 | 200 | 950 |
| simorra.com | heavy | product | 5 | 3314 | 5898 | 379 | 5229 | 222 | 1993 |
| stealplug.com.my | heavy | home | 5 | 19325 | 7672 | 221 | 5115 | 110 | 6313 |
| stealplug.com.my | heavy | product | 5 | 5974 | 5571 | 265 | 3402 | 137 | 1964 |
| stevemadden.co.za | heavy | home | 5 | 10016 | 4578 | 371 | 6291 | 215 | 3471 |
| stevemadden.co.za | heavy | product | 5 | 4879 | 6133 | 374 | 5037 | 201 | 1872 |
| store.seikowatches.com | heavy | home | 5 | 9213 | 10367 | 465 | 7205 | 263 | 3560 |
| store.seikowatches.com | heavy | product | 5 | 21675 | 11627 | 425 | 5255 | 268 | 2211 |
| timeconcept.com | medium | home | 5 | 9584 | 4605 | 366 | 5345 | 187 | 1906 |
| timeconcept.com | medium | product | 4 | 9554 | 4505 | 345 | 4801 | 188 | 1466 |
| vedix.com | medium | home | 5 | 17051 | 1292 | 236 | 12536 | 175 | 1931 |
| vedix.com | medium | product | 5 | 3824 | 5878 | 189 | 3453 | 137 | 1055 |
| vegane-fleischerei.de | medium | home | 5 | 30396 | 4345 | 352 | 6969 | 161 | 3073 |
| vegane-fleischerei.de | medium | product | 5 | 13200 | 3408 | 435 | 6887 | 227 | 2489 |
| verysmart.ca | heavy | home | 5 | 8562 | 8223 | 287 | 3539 | 226 | 5343 |
| verysmart.ca | heavy | product | 5 | 14752 | 3162 | 382 | 4594 | 244 | 2272 |
| vimergy.com | heavy | home | 5 | 25121 | 8134 | 365 | 9875 | 251 | 2779 |
| vimergy.com | heavy | product | 5 | 9641 | 8082 | 441 | 5279 | 334 | 3774 |
| wearme.ua | heavy | home | 5 | 8512 | 7785 | 472 | 9822 | 194 | 15008 |
| wearme.ua | heavy | product | 2 | 36298 | 4008 | 515 | 9777 | 218 | 15626 |
| www.ayntec.com | light | home | 5 | 7554 | 1917 | 141 | 1940 | 55 | 2065 |
| www.ayntec.com | light | product | 5 | 13021 | 2895 | 188 | 1979 | 82 | 2251 |
| www.bajaao.com | heavy | home | 5 | 15418 | 9811 | 398 | 6796 | 237 | 4673 |
| www.bajaao.com | heavy | product | 5 | 1576 | 9360 | 452 | 6474 | 302 | 2326 |
| www.beauteprivee.fr | heavy | home | 5 | 16989 | 7560 | 520 | 6586 | 316 | 3420 |
| www.beauteprivee.fr | heavy | product | 5 | 31160 | 6554 | 530 | 6981 | 295 | 5270 |
| www.campusshoes.com | light | home | 5 | 2858 | 762 | 67 | 890 | 25 | 4683 |
| www.campusshoes.com | light | product | 5 | 2729 | 5 | 49 | 819 | 23 | 1025 |
| www.cherrykitten.com | medium | home | 5 | 18206 | 8911 | 398 | 5913 | 213 | 5523 |
| www.cherrykitten.com | medium | product | 5 | 9851 | 8852 | 451 | 6035 | 281 | 4061 |
| www.chumbak.com | medium | home | 4 | 2285 | 1813 | 361 | 11699 | 187 | 3860 |
| www.chumbak.com | medium | product | 5 | 5415 | 3704 | 385 | 9654 | 234 | 3352 |
| www.diabolique.es | heavy | home | 5 | 12273 | 4143 | 241 | 4352 | 141 | 2213 |
| www.diabolique.es | heavy | product | 5 | 2346 | 4543 | 280 | 5565 | 172 | 1934 |
| www.eden-park.com | light | home | 5 | 20390 | 3141 | 311 | 10967 | 163 | 3395 |
| www.eden-park.com | light | product | 5 | 14430 | 4509 | 330 | 11460 | 172 | 3906 |
| www.goodmonk.in | medium | home | 5 | 14424 | 8255 | 378 | 5872 | 217 | 2642 |
| www.goodmonk.in | medium | product | 5 | 17106 | 7663 | 475 | 7150 | 261 | 3011 |
| www.jdsports.co.th | heavy | home | 5 | 19807 | 14840 | 370 | 6700 | 219 | 5733 |
| www.jdsports.co.th | heavy | product | 5 | 3996 | 9342 | 447 | 5609 | 259 | 6455 |
| www.joone.fr | medium | home | 5 | 21999 | 3078 | 287 | 9554 | 192 | 1313 |
| www.joone.fr | medium | product | 5 | 5519 | 6775 | 317 | 5163 | 197 | 1200 |
| www.linkcart.in | medium | home | 4 | 6117 | 5403 | 251 | 4094 | 121 | 5673 |
| www.linkcart.in | medium | product | 4 | 5433 | 4581 | 274 | 3642 | 170 | 3171 |
| www.livreeleve.com.br | medium | home | 5 | 12818 | 7122 | 417 | 11073 | 126 | 2744 |
| www.livreeleve.com.br | medium | product | 5 | 7578 | 7395 | 387 | 9508 | 169 | 2011 |
| www.musikalcol.store | light | home | 5 | 3202 | 2990 | 199 | 2729 | 85 | 1674 |
| www.musikalcol.store | light | product | 5 | 6283 | 4072 | 209 | 2644 | 94 | 1030 |
| www.myfonts.com | medium | home | 4 | 12946 | 3811 | 316 | 6502 | 167 | 1634 |
| www.myfonts.com | medium | product | 5 | 15723 | 2873 | 334 | 6483 | 177 | 1435 |
| www.natori.com | medium | home | 5 | 9665 | 7702 | 417 | 6156 | 234 | 4982 |
| www.natori.com | medium | product | 5 | 9864 | 8596 | 547 | 8293 | 352 | 5422 |
| www.newera.mx | heavy | home | 5 | 14879 | 10345 | 382 | 5993 | 202 | 5038 |
| www.newera.mx | heavy | product | 5 | 7789 | 12879 | 490 | 5546 | 330 | 4598 |
| www.orionride.com | medium | home | 5 | 8880 | 5124 | 339 | 4259 | 178 | 1539 |
| www.orionride.com | medium | product | 5 | 10624 | 5989 | 407 | 5368 | 239 | 2160 |
| www.phonebay.ae | light | home | 5 | 2183 | 1757 | 127 | 1295 | 42 | 2888 |
| www.phonebay.ae | light | product | 5 | 3621 | 2245 | 180 | 1615 | 75 | 1110 |
| www.pichara.cl | light | home | 5 | 19023 | 9048 | 295 | 4724 | 102 | 3974 |
| www.pichara.cl | light | product | 5 | 15413 | 13463 | 309 | 4098 | 136 | 1819 |
| www.pinko.com | medium | home | 5 | 9522 | 8674 | 383 | 5773 | 211 | 2291 |
| www.pinko.com | medium | product | 5 | 6523 | 11840 | 457 | 6198 | 252 | 4881 |
| www.puropelle.com | light | home | 5 | 3060 | 2389 | 202 | 2331 | 85 | 1170 |
| www.puropelle.com | light | product | 5 | 8908 | 4317 | 242 | 2769 | 110 | 2378 |
| www.quadlockcase.eu | light | home | 5 | 27611 | 5493 | 576 | 10170 | 412 | 1884 |
| www.quadlockcase.eu | light | product | 5 | 13649 | 5072 | 597 | 4941 | 434 | 2306 |
| www.redapplefireworks.com | heavy | home | 5 | 1103 | 5845 | 274 | 10517 | 190 | 6457 |
| www.redapplefireworks.com | heavy | product | 5 | 1070 | 5847 | 365 | 5869 | 250 | 3307 |
| www.revesderecho.com | heavy | home | 5 | 20879 | 14596 | 438 | 5343 | 149 | 4431 |
| www.revesderecho.com | heavy | product | 4 | 16756 | 6291 | 374 | 4229 | 171 | 1745 |
| www.thecasecompany.in | heavy | home | 5 | 9281 | 7238 | 550 | 5156 | 405 | 4585 |
| www.thecasecompany.in | heavy | product | 5 | 5142 | 6977 | 556 | 5115 | 425 | 3768 |

## 6. Tóm tắt theo điều kiện (testbed)

Xem `docs/fault-matrix-noise-report.md` (median [IQR] theo fault × mức × trang, manipulation check, dose–response).

