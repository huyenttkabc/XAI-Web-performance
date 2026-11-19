# So sánh cỡ mẫu huấn luyện — dataset nhỏ (A) vs lớn (B)

> Sinh tự động bởi `scripts/compare_training_set_size.py`. Không sửa tay.
> Run `training-size-261025-v0.4-vs-v1.0` · seed 42 · artifacts `data/processed/model-runs/training-size-261025-v0.4-vs-v1.0`. Lockbox không bị chạm.

## Thiết kế

- **A** học trên `data/processed/dataset-v0.4.csv` (60 store dev, 570 dòng); **B** học trên `data/processed/dataset-v1.0.csv` (157 store dev, 1499 dòng).
- Fold theo hash site (protocol §8) → mỗi store cùng fold ở cả hai dataset. Với mỗi fold k, A và B học trên các store fold ≠ k của dataset tương ứng, cùng dự đoán **các dòng fold k của dataset lớn** → cùng một tập test, không site nào vừa train vừa test.
- Tập test: 1499 dòng / 157 store, trong đó 97 store chỉ có ở dataset lớn ('store mới').
- ΔMAE = MAE(B) − MAE(A), CI95 bootstrap theo site (ghép cặp, 1000 lần). Âm = dataset lớn giúp model tốt hơn.

## LCP (ms)

| feature set | model | MAE A | MAE B | R² A | R² B | ΔMAE (B−A) [CI95] | kết luận |
|---|---|---|---|---|---|---|---|
| - | baseline | 6.535 | 6.534 | -0.067 | -0.077 | -1 [-24; 25] | ≈ không phân biệt |
| S | ridge | 5.620 | 4.969 | 0.039 | 0.258 | -651 [-1.031; -314] | ✅ lớn hơn tốt hơn |
| S | random_forest | 4.967 | 4.880 | 0.253 | 0.277 | -88 [-324; 139] | ≈ không phân biệt |
| S | xgboost | 4.921 | 4.692 | 0.289 | 0.312 | -229 [-559; 62] | ≈ không phân biệt |
| S+R | ridge | 5.436 | 4.852 | 0.145 | 0.304 | -583 [-940; -213] | ✅ lớn hơn tốt hơn |
| S+R | random_forest | 4.594 | 4.377 | 0.333 | 0.394 | -217 [-497; 56] | ≈ không phân biệt |
| S+R | xgboost | 4.663 | 4.356 | 0.351 | 0.400 | -307 [-650; -4] | ✅ lớn hơn tốt hơn |

MAE tách theo nhóm store test (A chưa từng thấy store nào trong cả hai nhóm):

| feature set | model | store cũ: A | store cũ: B | store mới: A | store mới: B |
|---|---|---|---|---|---|
| - | baseline | 6.475 | 6.474 | 6.572 | 6.571 |
| S | ridge | 5.569 | 4.627 | 5.652 | 5.182 |
| S | random_forest | 4.894 | 4.554 | 5.013 | 5.082 |
| S | xgboost | 4.910 | 4.307 | 4.929 | 4.932 |
| S+R | ridge | 5.300 | 4.661 | 5.520 | 4.971 |
| S+R | random_forest | 4.735 | 4.430 | 4.506 | 4.345 |
| S+R | xgboost | 4.751 | 4.208 | 4.608 | 4.448 |

## TBT30 (ms)

| feature set | model | MAE A | MAE B | R² A | R² B | ΔMAE (B−A) [CI95] | kết luận |
|---|---|---|---|---|---|---|---|
| - | baseline | 2.709 | 2.686 | -0.086 | -0.049 | -23 [-61; 14] | ≈ không phân biệt |
| S | ridge | 2.166 | 2.088 | 0.212 | 0.271 | -78 [-137; -24] | ✅ lớn hơn tốt hơn |
| S | random_forest | 2.168 | 2.063 | 0.215 | 0.299 | -105 [-187; -35] | ✅ lớn hơn tốt hơn |
| S | xgboost | 2.218 | 2.059 | 0.181 | 0.305 | -158 [-271; -53] | ✅ lớn hơn tốt hơn |
| S+R | ridge | 1.559 | 1.397 | 0.590 | 0.668 | -162 [-240; -92] | ✅ lớn hơn tốt hơn |
| S+R | random_forest | 1.555 | 1.367 | 0.562 | 0.658 | -188 [-248; -126] | ✅ lớn hơn tốt hơn |
| S+R | xgboost | 1.522 | 1.373 | 0.603 | 0.670 | -148 [-228; -62] | ✅ lớn hơn tốt hơn |

MAE tách theo nhóm store test (A chưa từng thấy store nào trong cả hai nhóm):

| feature set | model | store cũ: A | store cũ: B | store mới: A | store mới: B |
|---|---|---|---|---|---|
| - | baseline | 2.587 | 2.555 | 2.785 | 2.767 |
| S | ridge | 2.075 | 1.982 | 2.223 | 2.154 |
| S | random_forest | 2.039 | 1.959 | 2.249 | 2.128 |
| S | xgboost | 2.074 | 1.940 | 2.308 | 2.133 |
| S+R | ridge | 1.517 | 1.298 | 1.585 | 1.458 |
| S+R | random_forest | 1.531 | 1.355 | 1.570 | 1.375 |
| S+R | xgboost | 1.573 | 1.378 | 1.490 | 1.370 |
