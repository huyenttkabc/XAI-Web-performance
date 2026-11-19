# XAI Web Performance

Phát hiện và giải thích các yếu tố gây suy giảm hiệu năng Web phía client dựa trên Explainable Machine Learning.
Protocol hiện hành: **v1.0 (FROZEN 06/10/2026)** — [`docs/protocol-v1.0.md`](docs/protocol-v1.0.md).

## Cấu trúc

```
config/
  experiment-manifest.json   # protocol v1.0 dạng máy đọc: profile, outcomes, luật V1–V4, predictors, splits
  pilot-sites.csv            # 3 store pilot × (home, product)
  main-study-sites.csv       # 200 store phân tầng light/medium/heavy, chia wave 0–5
src/
  testbed/                   # testbed có kiểm soát
    fault-catalog.js         # 6 fault (5 cause group) × 3 mức, one-factor-at-a-time
    synthetic-asset-generators.js  # ảnh PNG, CSS chặn render, DOM, script bên thứ ba (tất định)
    testbed-server.js        # first-party 127.0.0.1:4173 + third-party localhost:4174
    site/                    # template trang home/product có các khe {{...}}
  collector/                 # 1 phép đo = 1 Chrome mới trong 1 tiến trình riêng; lưu lhr + trace + context
  sampling/                  # khung mẫu, chia tầng, thứ tự xen kẽ có seed, probe store
  parser/
    feature-definitions.js   # NGUỒN DUY NHẤT định nghĩa cột (metadata/target/feature/diagnostic)
    trace-main-thread-extractor.js  # tbt_30s_ms + long task từ trace thô
    host-contention-filter.js       # luật V4
    rebuild-dataset-from-raw.js     # raw → dataset (V1–V4)
  analysis/                  # thống kê mô tả, luật chia site (fold/lockbox), biểu đồ SVG
  ml/                        # Python: dataset mô hình, 4 mô hình + lưới, GroupKFold theo site, metric + bootstrap,
                             #   learning curve, kiểm định ghép cặp theo store (Friedman / Wilcoxon / Holm)
  pilot-plan-builder.js      # manifest + catalog → danh sách phép đo (xáo trộn có seed)
  run-pilot.js               # pipeline end-to-end
scripts/                     # chọn mẫu, reparse, data dictionary, noise, leakage, QC (Gate G3), EDA, lint
data/
  raw/                       # (gitignored) raw artifacts protocol v1.0
  processed/pilot-dataset.csv   # dataset hiện hành (dựng lại từ raw)
  processed/dataset-v*.csv      # snapshot đóng băng khi Gate G3 đạt (v0.3.1, v0.4, **v1.0 FROZEN**)
  processed/model-runs/<run>/   # config.json (seed, sha256), results.json, oof-predictions.csv
  logs/collector-error-log.jsonl
  archive/                   # dữ liệu tuần 1 (protocol cũ) — không trộn
docs/                        # protocol, data dictionary, báo cáo (sinh tự động)
test/                        # node:test
```

## Chạy

```bash
nvm use && npm ci            # Node 24, Lighthouse 12.8.2 (cần Google Chrome)
npm test                     # unit tests
npm run lint                 # kiểm tra cú pháp
npm run testbed              # vd: /home.html?fault=lcp-heavy-image&dose=900
npm run pilot                # fault matrix (190) + 3 store × 2 trang × 5 lần (30), seed 42
npm run pilot -- --scope=testbed
npm run sample:sites -- --total=80 --extend   # rút mẫu store phân tầng → config/main-study-sites.csv
npm run collect:wave1        # đo theo wave 1–5 (resume: -- --resume=<batch_id>)
npm run collect:retry        # đo bù phép đo lỗi 1 lần (hard cap 300 s)
npm run reports              # reparse → dictionary → noise → leakage → QC (G3, snapshot) → EDA
npm run ml:setup             # Python 3.14 venv + requirements-explanations.txt (requirements.txt + shap)
npm run ml:train -- --run-id=dev-cv-v1.0 --dataset=data/processed/dataset-v1.0.csv
npm run ml:rq1-rq2 -- --run=dev-cv-v1.0                    # Friedman/Wilcoxon + Figure 3
npm run ml:learning-curve -- --dataset=data/processed/dataset-v0.4.csv
npm run ml:compare-size -- --small=data/processed/dataset-v0.4.csv --large=data/processed/dataset-v1.0.csv
npm run ml:rq2-sites          # RQ2 theo store / tầng / loại trang + Figure 4 (bias theo decile)
npm run ml:feature-mapping    # mapping feature → cause group trên testbed (chuẩn bị RQ3)
npm run ml:freeze            # model freeze v1.0 (từ chối ghi đè)
npm run ml:rq3               # RQ3: fit lại RF/XGBoost/Ridge S+R trên testbed, SHAP, điểm nhóm (~4 phút)
npm run ml:rq3-report        # Hit@1/Hit@3/MRR, độ ổn định, Table 8, Figure 5–6
npm run rq4:profile-stores   # thành phần trang của store dev → cấu hình store case study
npm run collect:case-study   # đo store case study 2 trang × 5 lần (raw vào data/raw, KHÔNG vào dataset chính)
npm run ml:rq4-diagnosis -- --run-id=<id> --case=data/processed/case-study/baseline.csv   # SHAP chẩn đoán
npm run rq4:before-after     # trung vị / IQR / bootstrap CI trước–sau
npm run rq4:report           # Table 9 + Figure 7
npm run test:ml              # unit test Python
```

## RQ4 — case study trên store Shopify (tuần 8)

- Development store (Horizon, cấu hình theo dịch vụ phổ biến của 158 store dev, khóa trước baseline): [`docs/case-study-store-configuration.md`](docs/case-study-store-configuration.md).
- Chẩn đoán (run `rq4-diagnosis-261111-fullbg`): SHAP xếp `lcp_resource` đầu ở LCP trang sản phẩm; trace xác nhận ảnh LCP 56 KB tải mất ~7 s vì chia băng thông với ảnh gallery ngoài màn hình và 4 thư viện tracking.
- Hai điểm sửa (diff trong `data/processed/case-study/theme-changes/`): lazy-load ảnh gallery 2–6; trì hoãn tracking đến sau `load`.
- Trang sản phẩm: LCP 8.320 → 5.767 ms (**−30,7%**, CI −3.072; −2.373), TBT30 −15,2%; trang chủ LCP −6,6%. Một store, hai điểm sửa cùng lúc.
- Run `rq4-diagnosis-261111` chỉ giữ làm hồ sơ: chạy trước khi sửa cách chọn background SHAP (bị rút còn 100 dòng), nên checksum code trong config của nó không khớp code hiện tại — đúng như mong đợi. Run dùng cho kết quả là `-fullbg` và `-after`.
- Chi tiết: [`docs/case-study-diagnosis.md`](docs/case-study-diagnosis.md); Table 9, Figure 7 trong `docs/figures/`. Amendment 11/11 (protocol §10).

## RQ3 — kiểm chứng giải thích trên testbed (tuần 7)

- Run `data/processed/model-runs/rq3-testbed-261108/`: SHAP interventional, background = phép đo baseline cùng loại trang; chia theo lần lặp (chính) và leave-one-severity-out (độ bền).
- Random Forest S+R: LCP Hit@1 0,57 [0,39; 0,73], MRR 0,73; TBT30 Hit@1 0,58 [0,32; 0,86], MRR 0,79. Mức ngẫu nhiên MRR 0,46.
- Vượt xa ngẫu nhiên nhưng **không tốt hơn xếp hạng tham chiếu không dùng mô hình** (MRR 0,83 / 0,78).
- Đúng 100% khi lỗi có feature riêng (CSS chặn hiển thị, JS trang với TBT30, DOM với TBT30); sai khi lỗi làm tăng tổng dung lượng trang (ảnh LCP, script bên thứ ba); không phân biệt được long task của trang với của bên thứ ba (0/27).
- Chi tiết: [`docs/rq3-explanation-validation.md`](docs/rq3-explanation-validation.md); Table 8, Figure 5–6 trong `docs/figures/`. Amendment 08/11 (protocol §10).

## Model freeze v1.0 (tuần 6) — RQ1–RQ2 FROZEN

- Run `dev-cv-261025-v1.0`, dataset v1.0, code trùng sha256 với run; manifest + danh sách fold: `data/processed/model-runs/model-freeze-v1.0/`.
- Mô hình giải thích chính cho RQ3: **Random Forest S+R**; XGBoost S+R kiểm tra độ bền. Không tìm thêm hyperparameter (G6).
- Theo store (RF S+R): MAE trung vị LCP 2.983 ms (77% store tốt hơn baseline), TBT30 1.142 ms (89%); tốt hơn baseline ở mọi tầng và cả hai loại trang.
- Sai số co về trung bình: đoán cao trang nhanh, đoán thấp trang rất chậm — [`docs/rq2-site-error-analysis.md`](docs/rq2-site-error-analysis.md), Figure 4.
- Mapping feature → cause group và 10 chồng lấn cần báo cáo ở RQ3: [`docs/feature-cause-group-mapping.md`](docs/feature-cause-group-mapping.md).

## Dataset v1.0 FROZEN (tuần 5) — 200 store, 1.920/2.000 phép đo hợp lệ

- Dev 157 store / 1.499 dòng; lockbox 42 store **đóng**. sha256 `05125d31…` (protocol §10, amendment 25/10).
- RQ1: LCP XGBoost S+R MAE 4.356 ms (baseline 6.534, R² 0,40); TBT30 Random Forest S+R 1.367 ms (baseline 2.686, R² 0,66).
- Xem [`docs/model-preliminary-report.md`](docs/model-preliminary-report.md), [`docs/paired-store-tests-report.md`](docs/paired-store-tests-report.md),
  [`docs/learning-curve-report.md`](docs/learning-curve-report.md), [`docs/training-set-size-comparison.md`](docs/training-set-size-comparison.md).

## Dataset v0.4 (tuần 4) — 80 store, 800/800 phép đo + mô hình preliminary

- Mô hình preliminary trên 60 store dev: run `data/processed/model-runs/dev-cv-261011-v0.4/`.

## Dataset v0.3.1 (tuần 3) — 612 phép đo

- Pilot testbed 190 + Shopify thật 422 (wave 0–2 đầy đủ, wave 3 mới 22 phép đo) — xem [`docs/dataset-qc-report.md`](docs/dataset-qc-report.md), [`docs/eda-report.md`](docs/eda-report.md).

## Kết quả pilot v1.0 (220 phép đo, 05–06/10/2026)

- Hợp lệ sau V1–V4: testbed 174/190 (15 `host_contention`, 1 error), site thật 29/30.
- Cả 6 fault đạt ρ(mức, đặc trưng cơ chế) ≥ 0,97 — xem [`docs/fault-matrix-noise-report.md`](docs/fault-matrix-noise-report.md).
- Nhiễu testbed: CV trung vị LCP 1,5%, FCP 2,0%, TBT30 0,5%; site thật: LCP 6–31%, TBT30 14–38%.
- Leakage: [`docs/leakage-checklist.md`](docs/leakage-checklist.md).
