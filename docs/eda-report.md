# EDA — dataset v1.0 (Shopify thật)

> Sinh tự động bởi `node scripts/build-eda-report.js`. Không sửa tay.
> Đơn vị: **1 trang** (store × loại trang) = median các lần đo hợp lệ. 158 store · 316 trang · 1515 phép đo hợp lệ.
> Site thuộc **lockbox** (protocol §8) bị loại khỏi EDA. Mọi con số là mô tả, chưa dùng để kết luận hay chọn feature.

## 1. Mẫu theo tầng (reference TBT)

| tầng | store | trang | TBT30 median (ms) | LCP median (ms) |
|---|---|---|---|---|
| light | 55 | 110 | 3480 | 7551 |
| medium | 53 | 106 | 5463 | 9578 |
| heavy | 50 | 100 | 7399 | 10481 |

Kiểm tra hợp lý: nếu phân tầng có ý nghĩa thì TBT30 tăng dần light → heavy.

## 2. Phân phối target (theo loại trang)

### product

| target | n | min | p25 | median | p75 | max |
|---|---|---|---|---|---|---|
| `lh_lcp_ms` | 158 | 1070 | 5143 | 7545 | 12686 | 53260 |
| `tbt_30s_ms` | 158 | 5 | 3712 | 5578 | 7768 | 14432 |
| `lh_tbt_ms` | 151 | 5 | 3953 | 6142 | 9176 | 19636 |
| `lh_fcp_ms` | 158 | 1032 | 2066 | 2780 | 3737 | 12477 |
| `lh_si_ms` | 157 | 1426 | 4988 | 7690 | 12505 | 41655 |
| `lh_cls` | 158 | 0.00 | 0.00 | 0.03 | 0.09 | 0.95 |
| `lh_perf_score` | 150 | 0.05 | 0.30 | 0.35 | 0.44 | 0.92 |

### home

| target | n | min | p25 | median | p75 | max |
|---|---|---|---|---|---|---|
| `lh_lcp_ms` | 158 | 1103 | 7164 | 11044 | 18255 | 58843 |
| `tbt_30s_ms` | 158 | 662 | 3125 | 4909 | 7621 | 14840 |
| `lh_tbt_ms` | 142 | 662 | 3393 | 5460 | 8494 | 26977 |
| `lh_fcp_ms` | 158 | 901 | 1602 | 2111 | 2955 | 11322 |
| `lh_si_ms` | 158 | 1711 | 5028 | 8885 | 14399 | 43039 |
| `lh_cls` | 158 | 0.00 | 0.00 | 0.03 | 0.12 | 1.60 |
| `lh_perf_score` | 142 | 0.01 | 0.28 | 0.34 | 0.43 | 0.74 |

![LCP](figures/eda-hist-lh_lcp_ms.svg)

![TBT (30 s window)](figures/eda-hist-tbt_30s_ms.svg)

Thời gian lệch phải mạnh (vài trang rất nặng) → khi huấn luyện cân nhắc biến đổi log của target; quyết định thuộc preprocessing trong inner-CV (protocol §8).

## 3. Phân phối feature (median theo trang)

| feature | bộ | nhóm | n | min | p25 | median | p75 | max |
|---|---|---|---|---|---|---|---|---|
| `request_count` | S | mixed | 316 | 49 | 251 | 333 | 410 | 834 |
| `transfer_bytes_total` | S | mixed | 316 | 838459 | 3727960 | 5241534 | 6885443 | 42428727 |
| `script_requests` | S | main_thread_js | 316 | 23 | 74 | 111 | 147 | 330 |
| `script_bytes` | S | main_thread_js | 316 | 367069 | 1719890 | 2390129 | 3242784 | 6120084 |
| `stylesheet_bytes` | S | render_blocking | 316 | 0 | 45815 | 75309 | 111444 | 332118 |
| `image_bytes` | S | lcp_resource | 316 | 30280 | 477165 | 960591 | 1994391 | 23508419 |
| `font_bytes` | S | render_blocking | 316 | 0 | 79517 | 141434 | 261728 | 2807190 |
| `document_bytes` | S | dom_layout | 316 | 36029 | 97065 | 134120 | 201647 | 608985 |
| `third_party_requests` | S | third_party | 316 | 23 | 120 | 175 | 234 | 557 |
| `third_party_bytes` | S | third_party | 316 | 232737 | 1667560 | 2715035 | 3702925 | 39320408 |
| `origin_count` | S | third_party | 316 | 7 | 25 | 36 | 49 | 102 |
| `dom_elements` | S | dom_layout | 316 | 5 | 1585 | 2380 | 3873 | 15008 |
| `lcp_has_resource` | S | lcp_resource | 316 | 0 | 1 | 1 | 1 | 1 |
| `lcp_lazy_loaded` | S | lcp_resource | 316 | 0 | 0 | 0 | 0 | 1 |
| `lcp_not_discoverable` | S | lcp_resource | 316 | 0 | 0 | 0 | 0 | 1 |
| `lcp_resource_bytes` | S | lcp_resource | 312 | 0 | 24222 | 53373 | 94564 | 1116168 |
| `lcp_request_low_priority` | S | lcp_resource | 312 | 0 | 0 | 0 | 0 | 1 |
| `mt_script_eval_ms` | R | main_thread_js | 316 | 108 | 6079 | 10007 | 16235 | 41384 |
| `mt_script_parse_ms` | R | main_thread_js | 316 | 4 | 524 | 820 | 1099 | 3333 |
| `mt_gc_ms` | R | main_thread_js | 316 | 0 | 140 | 208 | 279 | 515 |
| `mt_style_layout_ms` | R | dom_layout | 316 | 262 | 1498 | 2787 | 5320 | 19297 |
| `mt_rendering_ms` | R | dom_layout | 316 | 71 | 518 | 1191 | 2595 | 12061 |
| `mt_parse_html_ms` | R | mixed | 316 | 55 | 221 | 299 | 432 | 1671 |
| `render_blocking_count` | R | render_blocking | 316 | 0 | 1 | 3 | 8 | 30 |
| `bootup_js_ms` | R | main_thread_js | 316 | 73 | 6535 | 10480 | 16730 | 42102 |
| `third_party_main_thread_ms` | R | third_party | 293 | 58 | 4073 | 7086 | 12595 | 30721 |
| `unused_js_bytes` | R | main_thread_js | 316 | 0 | 178053 | 346130 | 632694 | 1721978 |
| `unused_css_bytes` | R | render_blocking | 316 | 0 | 0 | 11294 | 28978 | 147276 |
| `bytes_before_lcp_request` | R | mixed | 276 | 89101 | 311303 | 637116 | 1113876 | 7310567 |
| `server_response_time_ms` | R | server | 316 | 27 | 32 | 36 | 178 | 2037 |
| `trace_long_task_count` | R | main_thread_js | 316 | 4 | 34 | 46 | 62 | 201 |
| `trace_long_task_total_ms` | R | main_thread_js | 316 | 373 | 5517 | 7890 | 10982 | 20389 |
| `trace_long_task_max_ms` | R | main_thread_js | 316 | 156 | 613 | 847 | 1209 | 4801 |

## 4. Tương quan Spearman feature ↔ target

| feature | bộ | ρ với LCP | ρ với TBT30 | ghi chú |
|---|---|---|---|---|
| `trace_long_task_total_ms` | R | 0.15 | 0.98 | loại khi target = TBT (L5) |
| `trace_long_task_count` | R | 0.16 | 0.82 | loại khi target = TBT (L5) |
| `bootup_js_ms` | R | 0.21 | 0.77 |  |
| `mt_script_eval_ms` | R | 0.21 | 0.77 |  |
| `trace_long_task_max_ms` | R | 0.17 | 0.76 | loại khi target = TBT (L5) |
| `third_party_main_thread_ms` | R | 0.12 | 0.71 |  |
| `mt_script_parse_ms` | R | 0.18 | 0.68 |  |
| `mt_style_layout_ms` | R | 0.07 | 0.63 |  |
| `origin_count` | S | 0.17 | 0.62 |  |
| `request_count` | S | 0.16 | 0.62 |  |
| `third_party_requests` | S | 0.14 | 0.62 |  |
| `script_bytes` | S | 0.17 | 0.61 |  |
| `mt_parse_html_ms` | R | 0.16 | 0.60 |  |
| `mt_gc_ms` | R | 0.22 | 0.58 |  |
| `bytes_before_lcp_request` | R | 0.55 | 0.08 |  |
| `lcp_resource_bytes` | S | 0.55 | -0.01 |  |
| `script_requests` | S | 0.12 | 0.55 |  |
| `document_bytes` | S | 0.15 | 0.47 |  |
| `unused_js_bytes` | R | 0.10 | 0.46 |  |
| `third_party_bytes` | S | 0.19 | 0.45 |  |
| `image_bytes` | S | 0.44 | 0.04 |  |
| `dom_elements` | S | 0.20 | 0.43 |  |
| `mt_rendering_ms` | R | 0.16 | 0.39 |  |
| `lcp_has_resource` | S | 0.34 | 0.13 |  |
| `transfer_bytes_total` | S | 0.34 | 0.33 |  |
| `lcp_not_discoverable` | S | 0.28 | 0.08 |  |
| `lcp_lazy_loaded` | S | 0.27 | -0.08 |  |
| `font_bytes` | S | 0.13 | 0.24 |  |
| `stylesheet_bytes` | S | -0.08 | 0.20 |  |
| `server_response_time_ms` | R | -0.17 | -0.04 |  |
| `unused_css_bytes` | R | 0.00 | 0.15 |  |
| `lcp_request_low_priority` | S | 0.10 | 0.10 |  |
| `render_blocking_count` | R | -0.02 | 0.07 |  |

![Spearman heatmap](figures/eda-spearman-heatmap.svg)

Cặp feature tương quan rất cao (|ρ| > 0,9) chia sẻ đóng góp SHAP tùy ý → lý do gộp SHAP theo cause group (protocol §8).

## 5. Tóm tắt theo store

| store | tầng | trang | runs ok | LCP | TBT30 | requests | KB tải | 3rd-party req | DOM |
|---|---|---|---|---|---|---|---|---|---|
| acemagic.eu | heavy | home | 5 | 2655 | 10922 | 448 | 6668 | 243 | 4176 |
| acemagic.eu | heavy | product | 5 | 7292 | 9976 | 362 | 4980 | 171 | 3613 |
| adresmedikal.net | light | home | 4 | 2979 | 2724 | 198 | 2715 | 101 | 954 |
| adresmedikal.net | light | product | 5 | 4198 | 2479 | 219 | 2837 | 120 | 765 |
| ajantashoes.com | medium | home | 5 | 1206 | 2868 | 218 | 11080 | 79 | 1121 |
| ajantashoes.com | medium | product | 3 | 2746 | 4282 | 231 | 3429 | 101 | 1583 |
| ajeworld.com.au | heavy | home | 5 | 43761 | 6393 | 406 | 10325 | 283 | 1571 |
| ajeworld.com.au | heavy | product | 5 | 10774 | 5127 | 493 | 8846 | 328 | 2890 |
| alwaysfit.com.br | medium | home | 5 | 3994 | 4685 | 272 | 25394 | 180 | 6350 |
| alwaysfit.com.br | medium | product | 5 | 7965 | 6257 | 291 | 6606 | 183 | 3056 |
| amixstore.com | medium | home | 5 | 2845 | 4300 | 464 | 7143 | 270 | 2787 |
| amixstore.com | medium | product | 5 | 4182 | 6304 | 466 | 5533 | 283 | 2299 |
| ankhway.com | heavy | home | 5 | 14728 | 8059 | 427 | 5607 | 213 | 2613 |
| ankhway.com | heavy | product | 5 | 9987 | 10236 | 471 | 5887 | 227 | 3606 |
| artveraprint.com | light | home | 5 | 6408 | 2666 | 194 | 2624 | 111 | 807 |
| artveraprint.com | light | product | 5 | 4210 | 5064 | 323 | 3480 | 235 | 1307 |
| badasshatco.com | light | home | 5 | 16652 | 10299 | 509 | 5975 | 371 | 5914 |
| badasshatco.com | light | product | 3 | 6546 | 10411 | 651 | 5718 | 513 | 4532 |
| bbabysuleman.com | heavy | home | 5 | 2341 | 6551 | 442 | 41434 | 208 | 10854 |
| bbabysuleman.com | heavy | product | 5 | 8659 | 4868 | 414 | 4086 | 226 | 3011 |
| bbb.com.pa | medium | home | 5 | 13236 | 5877 | 166 | 3005 | 66 | 1556 |
| bbb.com.pa | medium | product | 5 | 5729 | 3883 | 210 | 3005 | 84 | 1499 |
| binsaeedfabric.com | light | home | 5 | 6680 | 4132 | 203 | 4135 | 76 | 1585 |
| binsaeedfabric.com | light | product | 5 | 7154 | 6623 | 223 | 3600 | 101 | 1961 |
| blackcamels.com.pk | medium | home | 5 | 18271 | 6425 | 288 | 3804 | 150 | 1238 |
| blackcamels.com.pk | medium | product | 5 | 19849 | 6997 | 266 | 3345 | 115 | 1440 |
| blurgvillage.com | light | home | 5 | 11793 | 5284 | 341 | 4782 | 164 | 686 |
| blurgvillage.com | light | product | 5 | 9227 | 8138 | 365 | 4933 | 193 | 903 |
| candyfunhouse.ca | heavy | home | 4 | 15293 | 6639 | 423 | 6671 | 253 | 4374 |
| candyfunhouse.ca | heavy | product | 5 | 7651 | 7171 | 462 | 5708 | 296 | 1707 |
| cartouchefashion.com | medium | home | 5 | 18833 | 5894 | 499 | 5682 | 333 | 2571 |
| cartouchefashion.com | medium | product | 5 | 8270 | 8662 | 517 | 5181 | 342 | 1655 |
| cbj-store.com | medium | home | 5 | 39866 | 2508 | 336 | 10482 | 193 | 1908 |
| cbj-store.com | medium | product | 5 | 8436 | 3710 | 268 | 3616 | 175 | 778 |
| colorsoutlet.it | medium | home | 5 | 10232 | 9265 | 371 | 4706 | 229 | 3804 |
| colorsoutlet.it | medium | product | 2 | 31207 | 13915 | 427 | 4661 | 302 | 3939 |
| corlection.com | light | home | 5 | 13870 | 3211 | 196 | 3166 | 73 | 1345 |
| corlection.com | light | product | 4 | 53260 | 4304 | 231 | 3662 | 89 | 1146 |
| dakurtis.com | medium | home | 4 | 21358 | 2901 | 330 | 6117 | 157 | 1755 |
| dakurtis.com | medium | product | 5 | 16779 | 4363 | 331 | 5534 | 171 | 1325 |
| dalbe.fr | light | home | 5 | 18644 | 3694 | 264 | 4824 | 122 | 3134 |
| dalbe.fr | light | product | 5 | 11998 | 4573 | 297 | 4064 | 152 | 3163 |
| discoverpilgrim.com | heavy | home | 3 | 17307 | 9939 | 420 | 6685 | 196 | 9192 |
| discoverpilgrim.com | heavy | product | 5 | 8350 | 12353 | 386 | 6599 | 232 | 3204 |
| dixxon.co.uk | light | home | 5 | 4168 | 2955 | 266 | 6541 | 157 | 146 |
| dixxon.co.uk | light | product | 4 | 3752 | 6201 | 270 | 4250 | 183 | 831 |
| dozadesanatate.net | medium | home | 5 | 6113 | 3120 | 187 | 2762 | 59 | 2358 |
| dozadesanatate.net | medium | product | 5 | 4911 | 4018 | 218 | 3460 | 91 | 2409 |
| ebisujapan.com | heavy | home | 5 | 5342 | 11714 | 496 | 11328 | 420 | 3866 |
| ebisujapan.com | heavy | product | 5 | 3167 | 6590 | 338 | 3777 | 265 | 1930 |
| engine.com.pk | light | home | 5 | 10758 | 6725 | 243 | 3066 | 108 | 4227 |
| engine.com.pk | light | product | 5 | 2912 | 3133 | 245 | 2989 | 112 | 1364 |
| eu.oneill.com | heavy | home | 5 | 9207 | 11471 | 383 | 11688 | 247 | 4789 |
| eu.oneill.com | heavy | product | 4 | 3389 | 6336 | 358 | 4961 | 226 | 4011 |
| facetofacegames.com | medium | home | 5 | 2035 | 5492 | 365 | 9065 | 189 | 2055 |
| facetofacegames.com | medium | product | 5 | 5674 | 8640 | 340 | 3403 | 165 | 2006 |
| flyingcarts.in | medium | home | 5 | 2555 | 3761 | 224 | 10525 | 115 | 1357 |
| flyingcarts.in | medium | product | 5 | 9089 | 6071 | 291 | 10242 | 183 | 1370 |
| gemsmagic.com | medium | home | 5 | 28590 | 7058 | 358 | 7506 | 197 | 3335 |
| gemsmagic.com | medium | product | 5 | 22030 | 5255 | 406 | 6635 | 229 | 3372 |
| gruv.com | light | home | 5 | 20632 | 1137 | 236 | 16769 | 133 | 1247 |
| gruv.com | light | product | 4 | 3938 | 1299 | 187 | 2929 | 79 | 1074 |
| hamercop.com | light | home | 5 | 5467 | 2646 | 202 | 10266 | 107 | 31 |
| hamercop.com | light | product | 5 | 6860 | 2799 | 264 | 6173 | 149 | 31 |
| hansawax.de | light | home | 5 | 3329 | 4193 | 278 | 3205 | 133 | 3127 |
| hansawax.de | light | product | 5 | 10397 | 3548 | 283 | 3146 | 130 | 2904 |
| hatley.com | medium | home | 4 | 41886 | 1473 | 405 | 10931 | 234 | 3056 |
| hatley.com | medium | product | 4 | 9572 | 6048 | 560 | 6661 | 307 | 4673 |
| hobbii.fr | medium | home | 5 | 13574 | 6471 | 350 | 4243 | 173 | 2803 |
| hobbii.fr | medium | product | 5 | 21315 | 5712 | 423 | 5445 | 194 | 2605 |
| hu-ha.com | medium | home | 5 | 10990 | 8614 | 416 | 6859 | 240 | 1694 |
| hu-ha.com | medium | product | 5 | 5670 | 9419 | 492 | 7151 | 285 | 2205 |
| hug-u.2plus8.co.jp | medium | home | 5 | 12798 | 5435 | 245 | 5020 | 137 | 2898 |
| hug-u.2plus8.co.jp | medium | product | 4 | 31073 | 4013 | 339 | 7833 | 206 | 1860 |
| iyaksticker.in | light | home | 5 | 12824 | 1185 | 251 | 3487 | 122 | 891 |
| iyaksticker.in | light | product | 5 | 7511 | 1227 | 263 | 2217 | 130 | 703 |
| jamilaofficial.com | light | home | 5 | 10444 | 3637 | 301 | 2712 | 198 | 4417 |
| jamilaofficial.com | light | product | 5 | 8066 | 2975 | 313 | 2832 | 203 | 1268 |
| jasminumm.com | light | home | 5 | 19863 | 2857 | 349 | 4897 | 87 | 4050 |
| jasminumm.com | light | product | 4 | 5892 | 2792 | 250 | 2354 | 114 | 1681 |
| jockey.com.au | medium | home | 4 | 33701 | 5760 | 277 | 10717 | 151 | 2032 |
| jockey.com.au | medium | product | 4 | 17196 | 7651 | 367 | 5035 | 245 | 2395 |
| johnrossjewellers.com | medium | home | 5 | 9823 | 3520 | 377 | 4440 | 221 | 3150 |
| johnrossjewellers.com | medium | product | 5 | 3849 | 4807 | 380 | 3819 | 218 | 3014 |
| joyeriapaco.com | light | home | 5 | 17582 | 4961 | 217 | 5789 | 81 | 1804 |
| joyeriapaco.com | light | product | 4 | 2477 | 4868 | 282 | 3561 | 121 | 1503 |
| jpbulk.daisonet.com | medium | home | 5 | 45358 | 1703 | 294 | 9716 | 165 | 7084 |
| jpbulk.daisonet.com | medium | product | 5 | 17556 | 6835 | 293 | 4559 | 200 | 6751 |
| jvnhair.com | light | home | 5 | 7547 | 6557 | 246 | 3638 | 158 | 1880 |
| jvnhair.com | light | product | 5 | 6190 | 8439 | 285 | 4503 | 181 | 2152 |
| kabegamiyahonpo.com | heavy | home | 5 | 11350 | 4017 | 303 | 10316 | 134 | 3675 |
| kabegamiyahonpo.com | heavy | product | 5 | 13589 | 2887 | 343 | 6978 | 174 | 2387 |
| kalpraag.com | medium | home | 5 | 20278 | 6488 | 221 | 10888 | 126 | 4317 |
| kalpraag.com | medium | product | 4 | 6122 | 5890 | 260 | 4416 | 154 | 2251 |
| kuludonline.com | heavy | home | 5 | 29637 | 9174 | 435 | 8009 | 201 | 9666 |
| kuludonline.com | heavy | product | 5 | 15623 | 11702 | 445 | 5719 | 273 | 6997 |
| kyzo.in | light | home | 4 | 2448 | 4649 | 293 | 5561 | 157 | 1818 |
| kyzo.in | light | product | 5 | 2969 | 4435 | 316 | 4542 | 168 | 1248 |
| laura.ca | heavy | home | 5 | 32533 | 4006 | 380 | 10417 | 269 | 3956 |
| laura.ca | heavy | product | 5 | 20110 | 4550 | 461 | 5901 | 307 | 1420 |
| leathergallery.co.za | medium | home | 4 | 11099 | 3017 | 293 | 6337 | 121 | 2364 |
| leathergallery.co.za | medium | product | 5 | 4521 | 3732 | 344 | 5088 | 151 | 2301 |
| liftsafety.com | light | home | 5 | 25304 | 6968 | 320 | 26286 | 233 | 1895 |
| liftsafety.com | light | product | 5 | 21294 | 5843 | 327 | 5928 | 207 | 2215 |
| lucienne.shop | light | home | 5 | 5532 | 1984 | 275 | 2500 | 108 | 404 |
| lucienne.shop | light | product | 5 | 6511 | 2021 | 304 | 2852 | 128 | 690 |
| lukmed.cl | light | home | 5 | 2928 | 4184 | 181 | 5469 | 59 | 1473 |
| lukmed.cl | light | product | 5 | 3657 | 3447 | 160 | 2562 | 65 | 976 |
| magazineshop.us | heavy | home | 5 | 10255 | 2767 | 211 | 2719 | 81 | 3797 |
| magazineshop.us | heavy | product | 5 | 7221 | 2413 | 178 | 2143 | 79 | 3771 |
| mangystexports.com | heavy | home | 5 | 16724 | 6002 | 206 | 5984 | 87 | 3892 |
| mangystexports.com | heavy | product | 5 | 15283 | 5028 | 197 | 3667 | 95 | 1234 |
| meripharmacy.pk | heavy | home | 5 | 15143 | 7642 | 147 | 2251 | 63 | 10484 |
| meripharmacy.pk | heavy | product | 5 | 11646 | 5042 | 156 | 2222 | 75 | 867 |
| metamorphcenter.com | heavy | home | 5 | 9596 | 13986 | 354 | 4920 | 212 | 5947 |
| metamorphcenter.com | heavy | product | 5 | 5146 | 14432 | 393 | 4049 | 253 | 4840 |
| miraggiolife.com | heavy | home | 5 | 58843 | 8142 | 432 | 10433 | 224 | 5529 |
| miraggiolife.com | heavy | product | 5 | 3601 | 9350 | 525 | 5650 | 256 | 3246 |
| mofusand-mofumofu-market.jp | heavy | home | 5 | 12556 | 9757 | 312 | 8175 | 153 | 5942 |
| mofusand-mofumofu-market.jp | heavy | product | 4 | 6573 | 8782 | 341 | 7514 | 170 | 4946 |
| motifz.com.pk | light | home | 5 | 2451 | 3513 | 167 | 3555 | 76 | 1689 |
| motifz.com.pk | light | product | 5 | 19825 | 4663 | 195 | 4525 | 89 | 1610 |
| mssaz.com | light | home | 5 | 4497 | 4810 | 332 | 2533 | 138 | 4522 |
| mssaz.com | light | product | 5 | 8524 | 7149 | 366 | 3691 | 154 | 3858 |
| mybombae.in | medium | home | 5 | 6078 | 8544 | 374 | 5270 | 225 | 1437 |
| mybombae.in | medium | product | 5 | 12329 | 8649 | 459 | 5727 | 275 | 1146 |
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
| pnjakt.se | medium | home | 5 | 2902 | 4734 | 379 | 4691 | 185 | 2241 |
| pnjakt.se | medium | product | 4 | 2459 | 5005 | 424 | 5271 | 231 | 1184 |
| poolhousenewyork.com | medium | home | 4 | 8823 | 7146 | 418 | 4833 | 222 | 2149 |
| poolhousenewyork.com | medium | product | 5 | 7759 | 9616 | 437 | 5266 | 270 | 2576 |
| preethiwear.in | light | home | 5 | 15989 | 6467 | 260 | 4654 | 145 | 1468 |
| preethiwear.in | light | product | 5 | 10636 | 7640 | 288 | 5331 | 192 | 2631 |
| quicketail.com | light | home | 5 | 8496 | 3586 | 172 | 2510 | 60 | 1277 |
| quicketail.com | light | product | 4 | 5704 | 2237 | 180 | 2166 | 80 | 775 |
| rdstudio.co | medium | home | 5 | 10418 | 9901 | 401 | 4671 | 267 | 2646 |
| rdstudio.co | medium | product | 5 | 11554 | 10765 | 409 | 4430 | 303 | 2247 |
| rideoutsupply.com | light | home | 5 | 15722 | 934 | 116 | 2795 | 47 | 299 |
| rideoutsupply.com | light | product | 5 | 6477 | 1682 | 127 | 1735 | 54 | 299 |
| saysky.co.uk | light | home | 5 | 9987 | 3568 | 398 | 2793 | 86 | 8390 |
| saysky.co.uk | light | product | 4 | 16876 | 3216 | 280 | 4592 | 125 | 6103 |
| schilder.kaufen | light | home | 5 | 4594 | 3411 | 269 | 3074 | 148 | 919 |
| schilder.kaufen | light | product | 5 | 4839 | 7150 | 303 | 3849 | 172 | 1428 |
| seoidin.com | medium | home | 5 | 31861 | 2074 | 384 | 6429 | 136 | 2162 |
| seoidin.com | medium | product | 5 | 13875 | 4798 | 366 | 4123 | 188 | 1676 |
| shokz.com | heavy | home | 5 | 18799 | 9821 | 606 | 7365 | 326 | 6168 |
| shokz.com | heavy | product | 5 | 9338 | 10427 | 590 | 7142 | 373 | 4033 |
| shop.comofootball.com | light | home | 2 | 3495 | 3782 | 454 | 6675 | 157 | 3233 |
| shop.comofootball.com | light | product | 3 | 1469 | 1717 | 505 | 4854 | 173 | 2368 |
| shop.kenanddanadesign.com | heavy | home | 4 | 26903 | 1119 | 236 | 5790 | 35 | 3841 |
| shop.kenanddanadesign.com | heavy | product | 4 | 6637 | 212 | 166 | 1913 | 35 | 1763 |
| shop.maujual.com | medium | home | 5 | 2154 | 9482 | 253 | 4491 | 91 | 2044 |
| shop.maujual.com | medium | product | 4 | 3732 | 5982 | 253 | 3518 | 118 | 1650 |
| shop.megadeth.com | light | home | 5 | 18353 | 2470 | 246 | 5122 | 112 | 2749 |
| shop.megadeth.com | light | product | 5 | 9212 | 6052 | 275 | 5394 | 127 | 2837 |
| shopusa.season-of-mist.com | light | home | 5 | 31786 | 2577 | 265 | 5838 | 129 | 1204 |
| shopusa.season-of-mist.com | light | product | 5 | 4385 | 3224 | 384 | 3685 | 200 | 1373 |
| silkandcotton.store | medium | home | 5 | 7131 | 3531 | 327 | 9783 | 175 | 2732 |
| silkandcotton.store | medium | product | 4 | 6714 | 2999 | 285 | 2299 | 139 | 1900 |
| simorra.com | heavy | home | 4 | 16868 | 5028 | 340 | 5057 | 200 | 950 |
| simorra.com | heavy | product | 5 | 3314 | 5898 | 379 | 5229 | 222 | 1993 |
| stealplug.com.my | heavy | home | 5 | 19325 | 7672 | 221 | 5115 | 110 | 6313 |
| stealplug.com.my | heavy | product | 5 | 5974 | 5571 | 265 | 3402 | 137 | 1964 |
| stetson.com | heavy | home | 5 | 5167 | 6437 | 292 | 11401 | 185 | 1223 |
| stetson.com | heavy | product | 5 | 6481 | 6501 | 342 | 11225 | 227 | 2293 |
| stevemadden.co.za | heavy | home | 5 | 10016 | 4578 | 371 | 6291 | 215 | 3471 |
| stevemadden.co.za | heavy | product | 5 | 4879 | 6133 | 374 | 5037 | 201 | 1872 |
| store.seikowatches.com | heavy | home | 5 | 9213 | 10367 | 465 | 7205 | 263 | 3560 |
| store.seikowatches.com | heavy | product | 5 | 21675 | 11627 | 425 | 5255 | 268 | 2211 |
| sundrug-online.com | heavy | home | 5 | 41815 | 8443 | 401 | 5865 | 315 | 4910 |
| sundrug-online.com | heavy | product | 5 | 16307 | 9813 | 423 | 5009 | 310 | 4500 |
| suzyshier.com | heavy | home | 5 | 7260 | 7116 | 537 | 9196 | 321 | 5067 |
| suzyshier.com | heavy | product | 5 | 13371 | 11059 | 621 | 8821 | 423 | 3238 |
| templedesigner.com | heavy | home | 4 | 34940 | 1736 | 240 | 11616 | 172 | 2382 |
| templedesigner.com | heavy | product | 4 | 14525 | 2620 | 283 | 8618 | 197 | 1943 |
| thebearhouse.com | heavy | home | 5 | 16587 | 10177 | 834 | 9299 | 537 | 2461 |
| thebearhouse.com | heavy | product | 5 | 12805 | 7222 | 628 | 10631 | 478 | 2097 |
| theigt.com | light | home | 5 | 3734 | 3255 | 217 | 9373 | 120 | 5 |
| theigt.com | light | product | 5 | 3360 | 4531 | 234 | 3482 | 148 | 5 |
| thursdayboots.com | heavy | home | 4 | 16076 | 10452 | 486 | 4991 | 227 | 2491 |
| thursdayboots.com | heavy | product | 5 | 11317 | 11412 | 560 | 4930 | 250 | 2709 |
| timeconcept.com | medium | home | 5 | 9584 | 4605 | 366 | 5345 | 187 | 1906 |
| timeconcept.com | medium | product | 4 | 9554 | 4505 | 345 | 4801 | 188 | 1466 |
| tincan.kids | medium | home | 4 | 7975 | 6549 | 367 | 4649 | 158 | 1177 |
| tincan.kids | medium | product | 5 | 5844 | 7558 | 374 | 3939 | 142 | 971 |
| torecacamp-pokemon.com | heavy | home | 5 | 22957 | 5935 | 344 | 7413 | 152 | 5209 |
| torecacamp-pokemon.com | heavy | product | 5 | 15889 | 7056 | 328 | 6089 | 193 | 4427 |
| trixiecosmetics.com | light | home | 5 | 14923 | 2888 | 207 | 8665 | 124 | 1761 |
| trixiecosmetics.com | light | product | 5 | 27138 | 3721 | 236 | 6385 | 124 | 1591 |
| upway.de | heavy | home | 5 | 56163 | 3688 | 403 | 9648 | 317 | 3662 |
| upway.de | heavy | product | 5 | 6891 | 5584 | 300 | 4670 | 281 | 1468 |
| us.dollarshaveclub.com | heavy | home | 5 | 18552 | 6261 | 509 | 10488 | 353 | 1903 |
| us.dollarshaveclub.com | heavy | product | 5 | 9864 | 8262 | 595 | 8418 | 369 | 1612 |
| vedix.com | medium | home | 5 | 17051 | 1292 | 236 | 12536 | 175 | 1931 |
| vedix.com | medium | product | 5 | 3824 | 5878 | 189 | 3453 | 137 | 1055 |
| vegane-fleischerei.de | medium | home | 5 | 30396 | 4345 | 352 | 6969 | 161 | 3073 |
| vegane-fleischerei.de | medium | product | 5 | 13200 | 3408 | 435 | 6887 | 227 | 2489 |
| verysmart.ca | heavy | home | 5 | 8562 | 8223 | 287 | 3539 | 226 | 5343 |
| verysmart.ca | heavy | product | 5 | 14752 | 3162 | 382 | 4594 | 244 | 2272 |
| victoriamarbella.es | light | home | 5 | 24036 | 1916 | 225 | 4943 | 59 | 1806 |
| victoriamarbella.es | light | product | 4 | 3913 | 2530 | 257 | 3031 | 76 | 1618 |
| vimergy.com | heavy | home | 5 | 25121 | 8134 | 365 | 9875 | 251 | 2779 |
| vimergy.com | heavy | product | 5 | 9641 | 8082 | 441 | 5279 | 334 | 3774 |
| watchdistrict.store | light | home | 5 | 8252 | 1803 | 172 | 2374 | 57 | 2057 |
| watchdistrict.store | light | product | 5 | 5776 | 902 | 171 | 1658 | 49 | 874 |
| wearme.ua | heavy | home | 5 | 8512 | 7785 | 472 | 9822 | 194 | 15008 |
| wearme.ua | heavy | product | 5 | 38117 | 3780 | 531 | 9761 | 229 | 12211 |
| www.ackermans.co.za | heavy | home | 5 | 16574 | 7858 | 493 | 9729 | 213 | 8470 |
| www.ackermans.co.za | heavy | product | 5 | 20535 | 6469 | 439 | 10299 | 253 | 5205 |
| www.ashleystewart.com | medium | home | 5 | 8295 | 5392 | 334 | 3761 | 206 | 2871 |
| www.ashleystewart.com | medium | product | 5 | 6543 | 12440 | 426 | 4715 | 256 | 3794 |
| www.ayntec.com | light | home | 5 | 7554 | 1917 | 141 | 1940 | 55 | 2065 |
| www.ayntec.com | light | product | 5 | 13021 | 2895 | 188 | 1979 | 82 | 2251 |
| www.bajaao.com | heavy | home | 5 | 15418 | 9811 | 398 | 6796 | 237 | 4673 |
| www.bajaao.com | heavy | product | 5 | 1576 | 9360 | 452 | 6474 | 302 | 2326 |
| www.beauteprivee.fr | heavy | home | 5 | 16989 | 7560 | 520 | 6586 | 316 | 3420 |
| www.beauteprivee.fr | heavy | product | 5 | 31160 | 6554 | 530 | 6981 | 295 | 5270 |
| www.belladoctor.com.br | medium | home | 5 | 9633 | 3656 | 198 | 2785 | 79 | 2607 |
| www.belladoctor.com.br | medium | product | 5 | 8841 | 9132 | 251 | 4469 | 109 | 3198 |
| www.campusshoes.com | light | home | 5 | 2858 | 762 | 67 | 890 | 25 | 4683 |
| www.campusshoes.com | light | product | 5 | 2729 | 5 | 49 | 819 | 23 | 1025 |
| www.cherrykitten.com | medium | home | 5 | 18206 | 8911 | 398 | 5913 | 213 | 5523 |
| www.cherrykitten.com | medium | product | 5 | 9851 | 8852 | 451 | 6035 | 281 | 4061 |
| www.chumbak.com | medium | home | 4 | 2285 | 1813 | 361 | 11699 | 187 | 3860 |
| www.chumbak.com | medium | product | 5 | 5415 | 3704 | 385 | 9654 | 234 | 3352 |
| www.compumarts.com | light | home | 5 | 13476 | 4500 | 326 | 3826 | 139 | 2201 |
| www.compumarts.com | light | product | 4 | 5877 | 5055 | 345 | 3151 | 167 | 1686 |
| www.diabolique.es | heavy | home | 5 | 12273 | 4143 | 241 | 4352 | 141 | 2213 |
| www.diabolique.es | heavy | product | 5 | 2346 | 4543 | 280 | 5565 | 172 | 1934 |
| www.dpam.com | light | home | 5 | 11935 | 7357 | 269 | 5292 | 143 | 2305 |
| www.dpam.com | light | product | 5 | 2975 | 3349 | 301 | 4952 | 153 | 2450 |
| www.dreo.com | heavy | home | 4 | 3250 | 10420 | 394 | 7793 | 222 | 9843 |
| www.dreo.com | heavy | product | 5 | 6931 | 10179 | 465 | 7653 | 301 | 4614 |
| www.eden-park.com | light | home | 5 | 20390 | 3141 | 311 | 10967 | 163 | 3395 |
| www.eden-park.com | light | product | 5 | 14430 | 4509 | 330 | 11460 | 172 | 3906 |
| www.foxhome.co.il | heavy | home | 5 | 7907 | 4654 | 442 | 8139 | 284 | 2396 |
| www.foxhome.co.il | heavy | product | 5 | 7841 | 5660 | 435 | 7647 | 269 | 2290 |
| www.goodmonk.in | medium | home | 5 | 14424 | 8255 | 378 | 5872 | 217 | 2642 |
| www.goodmonk.in | medium | product | 5 | 17106 | 7663 | 475 | 7150 | 261 | 3011 |
| www.haniatextile.com | light | home | 5 | 28429 | 4523 | 251 | 5826 | 105 | 3044 |
| www.haniatextile.com | light | product | 5 | 13290 | 7989 | 286 | 5099 | 152 | 2108 |
| www.hotwav.com | light | home | 5 | 15605 | 7210 | 413 | 4516 | 266 | 3219 |
| www.hotwav.com | light | product | 5 | 6452 | 5862 | 446 | 3867 | 285 | 3721 |
| www.hypeelixir.com | heavy | home | 5 | 13571 | 10428 | 540 | 6993 | 296 | 4891 |
| www.hypeelixir.com | heavy | product | 5 | 10707 | 13342 | 562 | 7186 | 335 | 2456 |
| www.illanificio.com | heavy | home | 5 | 10162 | 8478 | 348 | 5814 | 188 | 2832 |
| www.illanificio.com | heavy | product | 4 | 5451 | 8915 | 452 | 5928 | 279 | 2275 |
| www.ioannoushoes.eu | light | home | 5 | 2063 | 2973 | 164 | 1999 | 59 | 6654 |
| www.ioannoushoes.eu | light | product | 4 | 3494 | 4338 | 204 | 2307 | 87 | 6733 |
| www.jaywalking.in | light | home | 5 | 7668 | 662 | 155 | 2184 | 40 | 768 |
| www.jaywalking.in | light | product | 5 | 5089 | 919 | 151 | 1876 | 52 | 480 |
| www.jdsports.co.th | heavy | home | 5 | 19807 | 14840 | 370 | 6700 | 219 | 5733 |
| www.jdsports.co.th | heavy | product | 5 | 3996 | 9342 | 447 | 5609 | 259 | 6455 |
| www.joone.fr | medium | home | 5 | 21999 | 3078 | 287 | 9554 | 192 | 1313 |
| www.joone.fr | medium | product | 5 | 5519 | 6775 | 317 | 5163 | 197 | 1200 |
| www.kukirin-scooter.pl | medium | home | 4 | 19759 | 4658 | 294 | 5738 | 179 | 5099 |
| www.kukirin-scooter.pl | medium | product | 5 | 3918 | 5244 | 360 | 3552 | 200 | 1933 |
| www.legit.co.za | medium | home | 5 | 13334 | 6694 | 372 | 5443 | 271 | 2807 |
| www.legit.co.za | medium | product | 4 | 4808 | 3976 | 385 | 5360 | 273 | 1528 |
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
| www.nicobar.com | medium | home | 4 | 16640 | 4934 | 303 | 11398 | 200 | 2771 |
| www.nicobar.com | medium | product | 5 | 15921 | 3002 | 319 | 11324 | 199 | 2825 |
| www.orionride.com | medium | home | 5 | 8880 | 5124 | 339 | 4259 | 178 | 1539 |
| www.orionride.com | medium | product | 5 | 10624 | 5989 | 407 | 5368 | 239 | 2160 |
| www.oscardelarenta.com | medium | home | 5 | 8339 | 4883 | 276 | 3544 | 116 | 3787 |
| www.oscardelarenta.com | medium | product | 5 | 25996 | 2959 | 325 | 5783 | 120 | 4738 |
| www.oudstore.com | light | home | 5 | 7360 | 4113 | 155 | 2104 | 56 | 2469 |
| www.oudstore.com | light | product | 5 | 6257 | 2647 | 181 | 2172 | 67 | 973 |
| www.phonebay.ae | light | home | 5 | 2183 | 1757 | 127 | 1295 | 42 | 2888 |
| www.phonebay.ae | light | product | 5 | 3621 | 2245 | 180 | 1615 | 75 | 1110 |
| www.pichara.cl | light | home | 5 | 19023 | 9048 | 295 | 4724 | 102 | 3974 |
| www.pichara.cl | light | product | 5 | 15413 | 13463 | 309 | 4098 | 136 | 1819 |
| www.pinko.com | medium | home | 5 | 9522 | 8674 | 383 | 5773 | 211 | 2291 |
| www.pinko.com | medium | product | 5 | 6523 | 11840 | 457 | 6198 | 252 | 4881 |
| www.premieryarns.com | medium | home | 4 | 10053 | 7850 | 267 | 3630 | 117 | 5064 |
| www.premieryarns.com | medium | product | 5 | 8777 | 7820 | 298 | 3667 | 153 | 5611 |
| www.puropelle.com | light | home | 5 | 3060 | 2389 | 202 | 2331 | 85 | 1170 |
| www.puropelle.com | light | product | 5 | 8908 | 4317 | 242 | 2769 | 110 | 2378 |
| www.quadlockcase.eu | light | home | 5 | 27611 | 5493 | 576 | 10170 | 412 | 1884 |
| www.quadlockcase.eu | light | product | 5 | 13649 | 5072 | 597 | 4941 | 434 | 2306 |
| www.ratchetclothing.co.uk | light | home | 5 | 34931 | 4700 | 230 | 5943 | 108 | 7174 |
| www.ratchetclothing.co.uk | light | product | 5 | 8558 | 2714 | 291 | 4437 | 143 | 2354 |
| www.redapplefireworks.com | heavy | home | 5 | 1103 | 5845 | 274 | 10517 | 190 | 6457 |
| www.redapplefireworks.com | heavy | product | 5 | 1070 | 5847 | 365 | 5869 | 250 | 3307 |
| www.revesderecho.com | heavy | home | 5 | 20879 | 14596 | 438 | 5343 | 149 | 4431 |
| www.revesderecho.com | heavy | product | 4 | 16756 | 6291 | 374 | 4229 | 171 | 1745 |
| www.scentsplit.com | medium | home | 5 | 1375 | 2327 | 294 | 10980 | 157 | 5035 |
| www.scentsplit.com | medium | product | 5 | 6120 | 3065 | 354 | 3921 | 210 | 2595 |
| www.tennis-point.it | heavy | home | 4 | 9775 | 3771 | 202 | 2316 | 74 | 7290 |
| www.tennis-point.it | heavy | product | 5 | 4216 | 4122 | 341 | 3667 | 156 | 4158 |
| www.thecasecompany.in | heavy | home | 5 | 9281 | 7238 | 550 | 5156 | 405 | 4585 |
| www.thecasecompany.in | heavy | product | 5 | 5142 | 6977 | 556 | 5115 | 425 | 3768 |
| www.vastrado.com | light | home | 5 | 15212 | 2676 | 154 | 3141 | 62 | 764 |
| www.vastrado.com | light | product | 4 | 16363 | 2036 | 157 | 3273 | 60 | 764 |
| zatu.com | heavy | home | 5 | 4998 | 10789 | 611 | 5960 | 452 | 12129 |
| zatu.com | heavy | product | 5 | 5583 | 10468 | 719 | 6165 | 557 | 12431 |

## 6. Tóm tắt theo điều kiện (testbed)

Xem `docs/fault-matrix-noise-report.md` (median [IQR] theo fault × mức × trang, manipulation check, dose–response).

