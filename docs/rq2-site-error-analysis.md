# RQ2 — Phân tích theo site, tầng, loại trang và phân tích sai số

> Sinh tự động bởi `scripts/build_rq2_site_analysis.py`. Không sửa tay.
> Run `dev-cv-261025-v1.0` · dự đoán out-of-fold trên store development · lockbox không dùng · không fit lại.

## LCP

### Phân bố MAE theo store

| mô hình | n store | MAE p25 | trung vị | p75 | p90 | % store tốt hơn baseline |
|---|---|---|---|---|---|---|
| Baseline | 157 | 3.236 | 4.965 | 8.037 | 13.550 | 0% |
| Random Forest S+R | 157 | 1.774 | 2.983 | 5.440 | 9.752 | 77% |
| XGBoost S+R | 157 | 1.665 | 3.083 | 5.542 | 9.063 | 78% |
| Random Forest S | 157 | 1.927 | 3.331 | 6.378 | 10.109 | 76% |
| XGBoost S | 157 | 1.634 | 3.078 | 6.114 | 9.976 | 78% |

### Theo tầng (reference TBT)

| mô hình | nhóm | n store | MAE | MAE baseline | ΔMAE [CI 95%] |
|---|---|---|---|---|---|
| Random Forest S+R | heavy | 50 | 5.662 | 7.692 | -2.030 [-2.802; -1.175] |
| Random Forest S+R | light | 54 | 3.420 | 5.858 | -2.438 [-3.175; -1.716] |
| Random Forest S+R | medium | 53 | 4.133 | 6.117 | -1.984 [-2.840; -1.240] |
| XGBoost S+R | heavy | 50 | 5.893 | 7.692 | -1.799 [-2.620; -906] |
| XGBoost S+R | light | 54 | 3.318 | 5.858 | -2.540 [-3.261; -1.823] |
| XGBoost S+R | medium | 53 | 3.951 | 6.117 | -2.166 [-3.060; -1.363] |

### Theo loại trang

| mô hình | nhóm | n store | MAE | MAE baseline | ΔMAE [CI 95%] |
|---|---|---|---|---|---|
| Random Forest S+R | home | 156 | 4.833 | 8.015 | -3.182 [-3.908; -2.439] |
| Random Forest S+R | product | 154 | 3.911 | 5.019 | -1.107 [-1.661; -489] |
| XGBoost S+R | home | 156 | 4.797 | 8.015 | -3.218 [-3.942; -2.508] |
| XGBoost S+R | product | 154 | 3.905 | 5.019 | -1.113 [-1.628; -551] |

### Sai số có dấu theo decile giá trị quan sát (dự đoán − thực tế, trung vị, ms)

| decile | Baseline | Random Forest S+R | XGBoost S+R |
|---|---|---|---|
| 1 (y ≈ 2.456) | 6.965 | 2.528 | 1.920 |
| 2 (y ≈ 3.975) | 5.446 | 1.503 | 1.163 |
| 3 (y ≈ 5.525) | 3.929 | 1.308 | 1.032 |
| 4 (y ≈ 6.863) | 2.532 | 498 | 36 |
| 5 (y ≈ 8.518) | 851 | -340 | -358 |
| 6 (y ≈ 10.155) | -680 | 116 | 55 |
| 7 (y ≈ 12.821) | -3.381 | -1.004 | -1.036 |
| 8 (y ≈ 15.746) | -6.361 | -2.737 | -2.175 |
| 9 (y ≈ 19.724) | -10.323 | -3.969 | -3.893 |
| 10 (y ≈ 31.570) | -22.105 | -14.486 | -12.875 |

## TBT30

### Phân bố MAE theo store

| mô hình | n store | MAE p25 | trung vị | p75 | p90 | % store tốt hơn baseline |
|---|---|---|---|---|---|---|
| Baseline | 157 | 1.608 | 2.296 | 3.480 | 4.811 | 0% |
| Random Forest S+R | 157 | 674 | 1.142 | 1.978 | 2.709 | 89% |
| XGBoost S+R | 157 | 604 | 1.131 | 1.915 | 2.792 | 83% |
| Random Forest S | 157 | 1.127 | 1.801 | 2.688 | 3.578 | 69% |
| XGBoost S | 157 | 1.104 | 1.851 | 2.752 | 3.744 | 68% |

### Theo tầng (reference TBT)

| mô hình | nhóm | n store | MAE | MAE baseline | ΔMAE [CI 95%] |
|---|---|---|---|---|---|
| Random Forest S+R | heavy | 50 | 1.856 | 3.399 | -1.543 [-1.969; -1.138] |
| Random Forest S+R | light | 54 | 854 | 2.378 | -1.524 [-1.842; -1.236] |
| Random Forest S+R | medium | 53 | 1.429 | 2.316 | -887 [-1.161; -648] |
| XGBoost S+R | heavy | 50 | 1.768 | 3.399 | -1.631 [-2.107; -1.234] |
| XGBoost S+R | light | 54 | 886 | 2.378 | -1.491 [-1.798; -1.191] |
| XGBoost S+R | medium | 53 | 1.500 | 2.316 | -816 [-1.092; -554] |

### Theo loại trang

| mô hình | nhóm | n store | MAE | MAE baseline | ΔMAE [CI 95%] |
|---|---|---|---|---|---|
| Random Forest S+R | home | 156 | 1.374 | 2.658 | -1.284 [-1.493; -1.086] |
| Random Forest S+R | product | 154 | 1.360 | 2.714 | -1.354 [-1.609; -1.112] |
| XGBoost S+R | home | 156 | 1.378 | 2.658 | -1.280 [-1.499; -1.071] |
| XGBoost S+R | product | 154 | 1.368 | 2.714 | -1.346 [-1.622; -1.097] |

### Sai số có dấu theo decile giá trị quan sát (dự đoán − thực tế, trung vị, ms)

| decile | Baseline | Random Forest S+R | XGBoost S+R |
|---|---|---|---|
| 1 (y ≈ 1.467) | 3.777 | 461 | 491 |
| 2 (y ≈ 2.532) | 2.723 | 233 | 208 |
| 3 (y ≈ 3.164) | 2.058 | 124 | 215 |
| 4 (y ≈ 4.016) | 1.186 | 238 | 230 |
| 5 (y ≈ 4.814) | 361 | 73 | -25 |
| 6 (y ≈ 5.652) | -483 | -176 | -137 |
| 7 (y ≈ 6.669) | -1.559 | -428 | -398 |
| 8 (y ≈ 7.947) | -2.758 | -984 | -942 |
| 9 (y ≈ 9.272) | -4.144 | -1.442 | -1.396 |
| 10 (y ≈ 12.151) | -6.969 | -3.531 | -3.218 |
