# Kiểm định ghép cặp theo store — RQ1/RQ2 (bổ sung cho CI bootstrap)

> Sinh tự động bởi `scripts/build_rq1_rq2_results.py`. Không sửa tay.
> Run `dev-cv-261025-v1.0` · đơn vị = store (MAE trung bình các dòng out-of-fold của store) · lockbox không dùng.

## 1. Kiểm tra giả định

- **Ghép cặp:** mọi mô hình dự đoán cùng các dòng của cùng một store → mỗi store cho một bộ giá trị ghép cặp ✅
- **Độc lập giữa các đơn vị:** store khác nhau, fold theo store; các dòng trong cùng store được gộp thành 1 giá trị ✅
- **Khối đầy đủ (Friedman):** mọi store có giá trị cho mọi mô hình ✅
- **Đối xứng của chênh lệch (Wilcoxon):** xem cột độ lệch (skewness); |skew| > 1 là lệch mạnh → dựa vào sign test (không cần giả định này).

## 2. Friedman (4 mô hình, khối = store)

| target | bộ | χ² (df) | p (Holm) | hạng TB: baseline / Ridge / RF / XGBoost |
|---|---|---|---|---|
| LCP | S | 88.1 (3) | < 0,001 | 3.32 / 2.29 / 2.29 / 2.09 |
| LCP | S+R | 86.3 (3) | < 0,001 | 3.28 / 2.50 / 2.10 / 2.11 |
| TBT30 | S | 38.9 (3) | < 0,001 | 3.05 / 2.38 / 2.25 / 2.32 |
| TBT30 | S+R | 145.7 (3) | < 0,001 | 3.57 / 2.19 / 2.06 / 2.18 |

## 3. Mô hình vs baseline (họ 12 phép thử)

| target | so sánh | n store | trung vị Δ (ms) | % store tốt hơn | skew | p Wilcoxon (Holm) | p sign |
|---|---|---|---|---|---|---|---|
| LCP | Ridge S − baseline | 157 | -1,513 | 78% | 0.19 | < 0,001 | < 0,001 |
| LCP | Random Forest S − baseline | 157 | -1,811 | 76% | 0.19 | < 0,001 | < 0,001 |
| LCP | XGBoost S − baseline | 157 | -1,990 | 78% | 0.21 | < 0,001 | < 0,001 |
| LCP | Ridge S+R − baseline | 157 | -1,532 | 73% | -0.00 | < 0,001 | < 0,001 |
| LCP | Random Forest S+R − baseline | 157 | -1,959 | 77% | -0.24 | < 0,001 | < 0,001 |
| LCP | XGBoost S+R − baseline | 157 | -2,187 | 78% | 0.01 | < 0,001 | < 0,001 |
| TBT30 | Ridge S − baseline | 157 | -405 | 68% | -0.55 | < 0,001 | < 0,001 |
| TBT30 | Random Forest S − baseline | 157 | -391 | 69% | -0.63 | < 0,001 | < 0,001 |
| TBT30 | XGBoost S − baseline | 157 | -447 | 68% | -0.59 | < 0,001 | < 0,001 |
| TBT30 | Ridge S+R − baseline | 157 | -969 | 85% | -0.62 | < 0,001 | < 0,001 |
| TBT30 | Random Forest S+R − baseline | 157 | -1,134 | 89% | -0.66 | < 0,001 | < 0,001 |
| TBT30 | XGBoost S+R − baseline | 157 | -1,173 | 83% | -0.75 | < 0,001 | < 0,001 |

## 4. RQ2: S+R vs S cùng mô hình (họ 6 phép thử)

| target | so sánh | n store | trung vị Δ (ms) | % store tốt hơn | skew | p Wilcoxon (Holm) | p sign |
|---|---|---|---|---|---|---|---|
| LCP | Ridge: S+R − S | 157 | -122 | 61% | 1.54 | 0,130 | 0,010 |
| LCP | Random Forest: S+R − S | 157 | -360 | 66% | 0.27 | < 0,001 | < 0,001 |
| LCP | XGBoost: S+R − S | 157 | -179 | 59% | 0.28 | 0,026 | 0,038 |
| TBT30 | Ridge: S+R − S | 157 | -599 | 80% | -0.38 | < 0,001 | < 0,001 |
| TBT30 | Random Forest: S+R − S | 157 | -597 | 86% | -1.06 | < 0,001 | < 0,001 |
| TBT30 | XGBoost: S+R − S | 157 | -610 | 85% | -1.27 | < 0,001 | < 0,001 |

## 5. G5: Random Forest vs XGBoost, S+R (họ 2 phép thử)

| target | so sánh | n store | trung vị Δ (ms) | % store tốt hơn | skew | p Wilcoxon (Holm) | p sign |
|---|---|---|---|---|---|---|---|
| LCP | RF − XGBoost | 157 | -23 | 50% | 0.35 | 1,000 | 1,000 |
| TBT30 | RF − XGBoost | 157 | -8 | 54% | 0.37 | 1,000 | 0,425 |

## 6. Pearson r của dự đoán out-of-fold (để so với [2])

| target | bộ | Ridge | RF | XGBoost |
|---|---|---|---|---|
| LCP | S | 0.54 | 0.56 | 0.58 |
| LCP | S+R | 0.58 | 0.64 | 0.65 |
| TBT30 | S | 0.55 | 0.57 | 0.57 |
| TBT30 | S+R | 0.82 | 0.83 | 0.83 |

Δ < 0 nghĩa là vế trước có sai số thấp hơn. Kết luận chính vẫn dựa trên CI 95% bootstrap theo store; p-value chỉ là bằng chứng bổ sung.
