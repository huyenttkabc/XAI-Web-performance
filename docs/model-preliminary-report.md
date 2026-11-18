# Kết quả mô hình preliminary — RQ1/RQ2

> Sinh tự động bởi `scripts/train_preliminary_models.py`. Không sửa tay.
> Run `dev-cv-261011-v0.4` · dataset `data/processed/dataset-v0.4.csv` sha256 `3163db4de4fece62…` · seed 42 · artifacts `data/processed/model-runs/dev-cv-261011-v0.4`.
> **PRELIMINARY (protocol §8.1):** chỉ để kiểm tra pipeline, dataset chưa đóng băng (v1.0). Không đổi feature, lưới hay target dựa trên các số này. Lockbox chưa mở.

## 1. Dữ liệu

| mục | giá trị |
|---|---|
| dòng hợp lệ (site thật) | 767 |
| trang hợp lệ | 160 |
| trang bị loại (< 4 lần hợp lệ) | 4 |
| site lockbox (giữ lại) | 19 |
| **dev:** site / trang / dòng | 60 / 118 / 570 |
| site theo fold | {0: 8, 1: 12, 2: 14, 3: 14, 4: 12} |
| site theo tầng | {'heavy': 18, 'light': 20, 'medium': 22} |
| dòng LCP ≥ 55 s (sát cửa sổ) | 5 |

## 2. LCP (`lh_lcp_ms`)

ΔMAE = MAE(mô hình) − MAE(baseline), âm là tốt hơn. CI 95% bootstrap theo site.

| bộ | mô hình | MAE (ms) | MAE CI95 | RMSE | R² | MdAPE | ΔMAE | ΔMAE CI95 | so với baseline | MAE shuffled |
|---|---|---|---|---|---|---|---|---|---|---|
| - | baseline | 6.273 | [5.209; 7.545] | 9.260 | -0.049 | 47% | 0 | [0; 0] | – | – |
| S | ridge | 5.398 | [4.306; 6.757] | 8.551 | 0.105 | 39% | -875 | [-1.569; -145] | ✅ thắng | 6.396 |
| S | random_forest | 4.755 | [3.744; 6.058] | 7.796 | 0.256 | 32% | -1.518 | [-2.246; -734] | ✅ thắng | 6.447 |
| S | xgboost | 4.802 | [3.865; 5.987] | 7.719 | 0.271 | 36% | -1.470 | [-2.209; -718] | ✅ thắng | 6.460 |
| S+R | ridge | 5.086 | [4.155; 6.337] | 7.885 | 0.239 | 38% | -1.186 | [-1.850; -487] | ✅ thắng | 6.400 |
| S+R | random_forest | 4.563 | [3.577; 5.828] | 7.555 | 0.302 | 31% | -1.709 | [-2.379; -996] | ✅ thắng | 6.323 |
| S+R | xgboost | 4.587 | [3.649; 5.747] | 7.472 | 0.317 | 32% | -1.685 | [-2.429; -896] | ✅ thắng | 6.402 |

**MAE theo fold (ms)**

| bộ | mô hình | fold 0 (8 site) | fold 1 (12 site) | fold 2 (14 site) | fold 3 (14 site) | fold 4 (12 site) |
|---|---|---|---|---|---|---|
| - | baseline | 7.460 | 5.809 | 4.255 | 7.382 | 7.097 |
| S | ridge | 7.482 | 4.242 | 4.434 | 6.351 | 5.254 |
| S | random_forest | 6.039 | 4.253 | 4.817 | 5.619 | 3.325 |
| S | xgboost | 5.941 | 4.027 | 4.716 | 5.828 | 3.733 |
| S+R | ridge | 5.480 | 4.754 | 4.183 | 6.213 | 4.919 |
| S+R | random_forest | 5.555 | 4.269 | 4.174 | 5.356 | 3.743 |
| S+R | xgboost | 5.233 | 3.601 | 4.429 | 5.459 | 4.329 |

**Độ nhạy:** MAE khi bỏ các dòng LCP ≥ 55 s khỏi đánh giá

| bộ | mô hình | MAE đầy đủ | MAE bỏ dòng sát cửa sổ |
|---|---|---|---|
| - | baseline | 6.273 | 5.901 |
| S | ridge | 5.398 | 5.004 |
| S | random_forest | 4.755 | 4.388 |
| S | xgboost | 4.802 | 4.436 |
| S+R | ridge | 5.086 | 4.707 |
| S+R | random_forest | 4.563 | 4.205 |
| S+R | xgboost | 4.587 | 4.225 |

**Site có lỗi lớn nhất — random_forest / S+R** (bias > 0: dự đoán cao hơn thực tế)

| site | tầng | dòng | LCP median | MAE | bias |
|---|---|---|---|---|---|
| miraggiolife.com | heavy | 10 | 29.930 | 24.778 | -20.262 |
| www.beauteprivee.fr | heavy | 10 | 23.297 | 15.502 | -15.502 |
| hatley.com | medium | 8 | 26.436 | 13.236 | -7.281 |
| www.redapplefireworks.com | heavy | 10 | 1.087 | 12.572 | 12.572 |
| jockey.com.au | medium | 8 | 22.821 | 11.933 | -11.933 |
| www.quadlockcase.eu | light | 10 | 19.683 | 10.023 | -10.023 |
| www.myfonts.com | medium | 9 | 15.610 | 8.876 | -8.876 |
| seoidin.com | medium | 10 | 22.846 | 8.836 | -8.836 |

## 3. TBT30 (`tbt_30s_ms`)

ΔMAE = MAE(mô hình) − MAE(baseline), âm là tốt hơn. CI 95% bootstrap theo site.

| bộ | mô hình | MAE (ms) | MAE CI95 | RMSE | R² | MdAPE | ΔMAE | ΔMAE CI95 | so với baseline | MAE shuffled |
|---|---|---|---|---|---|---|---|---|---|---|
| - | baseline | 2.599 | [2.204; 3.010] | 3.313 | -0.072 | 43% | 0 | [0; 0] | – | – |
| S | ridge | 2.065 | [1.732; 2.412] | 2.758 | 0.257 | 33% | -534 | [-804; -270] | ✅ thắng | 2.613 |
| S | random_forest | 2.045 | [1.705; 2.417] | 2.755 | 0.258 | 33% | -554 | [-804; -275] | ✅ thắng | 2.655 |
| S | xgboost | 2.077 | [1.756; 2.426] | 2.746 | 0.263 | 35% | -522 | [-809; -228] | ✅ thắng | 2.743 |
| S+R | ridge | 1.494 | [1.227; 1.779] | 2.107 | 0.566 | 23% | -1.105 | [-1.441; -752] | ✅ thắng | 2.657 |
| S+R | random_forest | 1.525 | [1.221; 1.851] | 2.183 | 0.535 | 22% | -1.073 | [-1.322; -780] | ✅ thắng | 2.731 |
| S+R | xgboost | 1.571 | [1.300; 1.859] | 2.150 | 0.548 | 24% | -1.028 | [-1.304; -710] | ✅ thắng | 2.792 |

**MAE theo fold (ms)**

| bộ | mô hình | fold 0 (8 site) | fold 1 (12 site) | fold 2 (14 site) | fold 3 (14 site) | fold 4 (12 site) |
|---|---|---|---|---|---|---|
| - | baseline | 2.312 | 2.745 | 2.992 | 2.437 | 2.351 |
| S | ridge | 1.887 | 2.212 | 2.242 | 1.765 | 2.171 |
| S | random_forest | 1.749 | 2.319 | 2.210 | 1.835 | 2.006 |
| S | xgboost | 1.680 | 2.298 | 2.439 | 1.725 | 2.089 |
| S+R | ridge | 1.804 | 1.391 | 1.529 | 1.315 | 1.568 |
| S+R | random_forest | 1.231 | 1.611 | 1.782 | 1.288 | 1.599 |
| S+R | xgboost | 1.314 | 1.653 | 2.006 | 1.338 | 1.405 |

**Site có lỗi lớn nhất — ridge / S+R** (bias > 0: dự đoán cao hơn thực tế)

| site | tầng | dòng | TBT30 median | MAE | bias |
|---|---|---|---|---|---|
| www.revesderecho.com | heavy | 9 | 11.350 | 4.949 | -4.949 |
| wearme.ua | heavy | 5 | 7.785 | 4.768 | 4.768 |
| www.newera.mx | heavy | 10 | 12.148 | 4.196 | -4.196 |
| www.jdsports.co.th | heavy | 10 | 10.802 | 3.874 | -3.252 |
| pepperfield.cz | medium | 9 | 6.954 | 3.635 | 3.635 |
| www.beauteprivee.fr | heavy | 10 | 7.272 | 3.446 | -3.446 |
| www.livreeleve.com.br | medium | 10 | 7.258 | 3.100 | -3.100 |
| rdstudio.co | medium | 10 | 10.442 | 2.977 | -2.975 |

## 4. RQ2 — runtime features thêm được bao nhiêu (S+R so với S)

ΔMAE = MAE(S+R) − MAE(S), cùng mô hình, cùng fold, bootstrap ghép cặp theo site. Âm là R giúp ích. S+R chứa đại lượng đo cùng lần với target, nên đây là *cận trên*, không phải claim dự đoán trước khi chạy trang.

| target | mô hình | ΔMAE (ms) | CI95 | kết luận |
|---|---|---|---|---|
| LCP | ridge | -311 | [-618; -4] | ✅ R giúp |
| LCP | random_forest | -191 | [-502; 138] | ≈ không phân biệt |
| LCP | xgboost | -215 | [-550; 123] | ≈ không phân biệt |
| TBT30 | ridge | -571 | [-833; -293] | ✅ R giúp |
| TBT30 | random_forest | -520 | [-679; -362] | ✅ R giúp |
| TBT30 | xgboost | -506 | [-691; -320] | ✅ R giúp |

## 5. Sanity checks

- Không site nào nằm ở cả train và test (assert trong mọi fold ngoài; tuning dùng GroupKFold theo site trên fold train).
- Imputation (median + cột chỉ báo thiếu), log1p và chuẩn hóa nằm trong Pipeline, nên được fit trong fold.
- Site lockbox bị loại trước mọi bước, kể cả EDA và leakage checklist.
- Shuffled-label (1 hoán vị, không có CI): mô hình thật phải có MAE thấp hơn rõ so với cột *MAE shuffled*.
- Độ nhạy LCP sát cửa sổ: *chấm lại* trên cùng dự đoán, không fit lại.
