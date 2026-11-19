# Kết quả mô hình preliminary — RQ1/RQ2

> Sinh tự động bởi `scripts/train_preliminary_models.py`. Không sửa tay.
> Run `dev-cv-261025-v1.0` · dataset `data/processed/dataset-v1.0.csv` sha256 `05125d31b991516d…` · seed 42 · artifacts `data/processed/model-runs/dev-cv-261025-v1.0`.
> **Kết quả trên tập development (protocol §8.1):** cross-validation theo site, chưa phải đánh giá xác nhận. Không đổi feature, lưới hay target dựa trên các số này. Lockbox chưa mở.

## 1. Dữ liệu

| mục | giá trị |
|---|---|
| dòng hợp lệ (site thật) | 1920 |
| trang hợp lệ | 399 |
| trang bị loại (< 4 lần hợp lệ) | 7 |
| site lockbox (giữ lại) | 42 |
| **dev:** site / trang / dòng | 157 / 310 / 1499 |
| site theo fold | {0: 29, 1: 30, 2: 37, 3: 29, 4: 32} |
| site theo tầng | {'heavy': 50, 'light': 54, 'medium': 53} |
| dòng LCP ≥ 55 s (sát cửa sổ) | 8 |

## 2. LCP (`lh_lcp_ms`)

ΔMAE = MAE(mô hình) − MAE(baseline), âm là tốt hơn. CI 95% bootstrap theo site.

| bộ | mô hình | MAE (ms) | MAE CI95 | RMSE | R² | MdAPE | ΔMAE | ΔMAE CI95 | so với baseline | MAE shuffled |
|---|---|---|---|---|---|---|---|---|---|---|
| - | baseline | 6.534 | [5.811; 7.306] | 9.880 | -0.077 | 47% | 0 | [0; 0] | – | – |
| S | ridge | 4.969 | [4.293; 5.709] | 8.198 | 0.258 | 32% | -1.565 | [-2.007; -1.121] | ✅ thắng | 6.557 |
| S | random_forest | 4.880 | [4.241; 5.626] | 8.093 | 0.277 | 31% | -1.654 | [-2.048; -1.262] | ✅ thắng | 6.483 |
| S | xgboost | 4.692 | [4.082; 5.413] | 7.896 | 0.312 | 28% | -1.842 | [-2.285; -1.379] | ✅ thắng | 6.388 |
| S+R | ridge | 4.852 | [4.230; 5.517] | 7.940 | 0.304 | 32% | -1.682 | [-2.117; -1.225] | ✅ thắng | 6.506 |
| S+R | random_forest | 4.377 | [3.804; 5.018] | 7.410 | 0.394 | 28% | -2.156 | [-2.651; -1.716] | ✅ thắng | 6.480 |
| S+R | xgboost | 4.356 | [3.761; 4.996] | 7.374 | 0.400 | 28% | -2.178 | [-2.647; -1.730] | ✅ thắng | 6.439 |

**MAE theo fold (ms)**

| bộ | mô hình | fold 0 (29 site) | fold 1 (30 site) | fold 2 (37 site) | fold 3 (29 site) | fold 4 (32 site) |
|---|---|---|---|---|---|---|
| - | baseline | 7.531 | 7.022 | 5.575 | 6.542 | 6.268 |
| S | ridge | 5.773 | 5.394 | 4.084 | 5.190 | 4.656 |
| S | random_forest | 5.557 | 5.249 | 4.363 | 5.059 | 4.337 |
| S | xgboost | 5.321 | 4.958 | 4.478 | 4.876 | 3.925 |
| S+R | ridge | 5.226 | 5.157 | 4.086 | 5.117 | 4.879 |
| S+R | random_forest | 5.303 | 4.776 | 3.576 | 4.499 | 3.968 |
| S+R | xgboost | 5.002 | 4.879 | 3.743 | 4.327 | 4.010 |

**Độ nhạy:** MAE khi bỏ các dòng LCP ≥ 55 s khỏi đánh giá

| bộ | mô hình | MAE đầy đủ | MAE bỏ dòng sát cửa sổ |
|---|---|---|---|
| - | baseline | 6.534 | 6.310 |
| S | ridge | 4.969 | 4.758 |
| S | random_forest | 4.880 | 4.666 |
| S | xgboost | 4.692 | 4.489 |
| S+R | ridge | 4.852 | 4.667 |
| S+R | random_forest | 4.377 | 4.201 |
| S+R | xgboost | 4.356 | 4.167 |

**Site có lỗi lớn nhất — xgboost / S+R** (bias > 0: dự đoán cao hơn thực tế)

| site | tầng | dòng | LCP median | MAE | bias |
|---|---|---|---|---|---|
| miraggiolife.com | heavy | 10 | 29.930 | 22.797 | -19.402 |
| upway.de | heavy | 10 | 26.355 | 20.728 | -15.295 |
| ajeworld.com.au | heavy | 10 | 27.443 | 17.226 | -13.590 |
| sundrug-online.com | heavy | 10 | 27.827 | 15.133 | -15.133 |
| corlection.com | light | 9 | 14.242 | 14.740 | -14.446 |
| liftsafety.com | light | 10 | 22.706 | 13.333 | -13.333 |
| gemsmagic.com | medium | 10 | 23.268 | 12.892 | -12.244 |
| cbj-store.com | medium | 10 | 8.526 | 12.766 | -11.477 |

## 3. TBT30 (`tbt_30s_ms`)

ΔMAE = MAE(mô hình) − MAE(baseline), âm là tốt hơn. CI 95% bootstrap theo site.

| bộ | mô hình | MAE (ms) | MAE CI95 | RMSE | R² | MdAPE | ΔMAE | ΔMAE CI95 | so với baseline | MAE shuffled |
|---|---|---|---|---|---|---|---|---|---|---|
| - | baseline | 2.686 | [2.459; 2.905] | 3.459 | -0.049 | 42% | 0 | [0; 0] | – | – |
| S | ridge | 2.088 | [1.895; 2.285] | 2.883 | 0.271 | 31% | -598 | [-800; -407] | ✅ thắng | 2.722 |
| S | random_forest | 2.063 | [1.887; 2.242] | 2.827 | 0.299 | 32% | -623 | [-813; -440] | ✅ thắng | 2.724 |
| S | xgboost | 2.059 | [1.885; 2.234] | 2.815 | 0.305 | 31% | -626 | [-825; -435] | ✅ thắng | 2.758 |
| S+R | ridge | 1.397 | [1.263; 1.543] | 1.947 | 0.668 | 20% | -1.289 | [-1.509; -1.079] | ✅ thắng | 2.724 |
| S+R | random_forest | 1.367 | [1.216; 1.519] | 1.974 | 0.658 | 18% | -1.319 | [-1.522; -1.119] | ✅ thắng | 2.744 |
| S+R | xgboost | 1.373 | [1.231; 1.525] | 1.940 | 0.670 | 20% | -1.313 | [-1.514; -1.110] | ✅ thắng | 2.778 |

**MAE theo fold (ms)**

| bộ | mô hình | fold 0 (29 site) | fold 1 (30 site) | fold 2 (37 site) | fold 3 (29 site) | fold 4 (32 site) |
|---|---|---|---|---|---|---|
| - | baseline | 2.497 | 2.895 | 2.829 | 2.326 | 2.834 |
| S | ridge | 1.953 | 2.083 | 2.133 | 1.784 | 2.455 |
| S | random_forest | 1.869 | 2.172 | 2.156 | 1.766 | 2.313 |
| S | xgboost | 1.882 | 2.142 | 2.007 | 1.902 | 2.362 |
| S+R | ridge | 1.299 | 1.407 | 1.410 | 1.315 | 1.541 |
| S+R | random_forest | 1.242 | 1.442 | 1.400 | 1.165 | 1.566 |
| S+R | xgboost | 1.237 | 1.429 | 1.362 | 1.289 | 1.544 |

**Site có lỗi lớn nhất — random_forest / S+R** (bias > 0: dự đoán cao hơn thực tế)

| site | tầng | dòng | TBT30 median | MAE | bias |
|---|---|---|---|---|---|
| store.seikowatches.com | heavy | 10 | 10.757 | 5.128 | -5.128 |
| metamorphcenter.com | heavy | 10 | 14.254 | 4.211 | -4.183 |
| www.revesderecho.com | heavy | 9 | 11.350 | 4.200 | -4.200 |
| ebisujapan.com | heavy | 10 | 8.354 | 3.945 | -3.609 |
| www.jdsports.co.th | heavy | 10 | 10.802 | 3.805 | -3.805 |
| www.hypeelixir.com | heavy | 10 | 12.218 | 3.711 | -3.711 |
| colorsoutlet.it | medium | 5 | 9.265 | 3.352 | -3.352 |
| thebearhouse.com | heavy | 10 | 8.898 | 3.233 | -1.312 |

## 4. RQ2 — runtime features thêm được bao nhiêu (S+R so với S)

ΔMAE = MAE(S+R) − MAE(S), cùng mô hình, cùng fold, bootstrap ghép cặp theo site. Âm là R giúp ích. S+R chứa đại lượng đo cùng lần với target, nên đây là *cận trên*, không phải claim dự đoán trước khi chạy trang.

| target | mô hình | ΔMAE (ms) | CI95 | kết luận |
|---|---|---|---|---|
| LCP | ridge | -117 | [-403; 193] | ≈ không phân biệt |
| LCP | random_forest | -502 | [-818; -214] | ✅ R giúp |
| LCP | xgboost | -336 | [-636; -66] | ✅ R giúp |
| TBT30 | ridge | -692 | [-845; -550] | ✅ R giúp |
| TBT30 | random_forest | -696 | [-799; -587] | ✅ R giúp |
| TBT30 | xgboost | -686 | [-801; -567] | ✅ R giúp |

## 5. Sanity checks

- Không site nào nằm ở cả train và test (assert trong mọi fold ngoài; tuning dùng GroupKFold theo site trên fold train).
- Imputation (median + cột chỉ báo thiếu), log1p và chuẩn hóa nằm trong Pipeline, nên được fit trong fold.
- Site lockbox bị loại trước mọi bước, kể cả EDA và leakage checklist.
- Shuffled-label (1 hoán vị, không có CI): mô hình thật phải có MAE thấp hơn rõ so với cột *MAE shuffled*.
- Độ nhạy LCP sát cửa sổ: *chấm lại* trên cùng dự đoán, không fit lại.
