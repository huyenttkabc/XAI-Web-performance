# XAI Web Performance

Phát hiện và giải thích các yếu tố gây suy giảm hiệu năng Web phía client dựa trên Explainable Machine Learning.
Protocol hiện hành: **v1.0 (FROZEN 06/10/2026)** — [`docs/protocol-v1.0.md`](docs/protocol-v1.0.md).

## Cấu trúc

```
config/
  experiment-manifest.json   # protocol v1.0 dạng máy đọc: profile, outcomes, luật V1–V4, predictors, splits
  pilot-sites.csv            # 3 store pilot × (home, product)
  main-study-sites.csv       # 80 store phân tầng light/medium/heavy, chia wave 0–3
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
  ml/                        # Python: dataset mô hình, 4 mô hình + lưới, GroupKFold theo site, metric + bootstrap
  pilot-plan-builder.js      # manifest + catalog → danh sách phép đo (xáo trộn có seed)
  run-pilot.js               # pipeline end-to-end
scripts/                     # chọn mẫu, reparse, data dictionary, noise, leakage, QC (Gate G3), EDA, lint
data/
  raw/                       # (gitignored) raw artifacts protocol v1.0
  processed/pilot-dataset.csv   # dataset hiện hành (dựng lại từ raw)
  processed/dataset-v0.*.csv    # snapshot đóng băng khi Gate G3 đạt (v0.3.1, v0.4)
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
npm run collect:wave1        # đo theo wave (resume: -- --resume=<batch_id>)
npm run collect:retry        # đo bù phép đo lỗi 1 lần (hard cap 300 s)
npm run reports              # reparse → dictionary → noise → leakage → QC (G3, snapshot) → EDA
npm run ml:setup             # Python 3.14 venv + requirements.txt
npm run ml:train -- --run-id=dev-cv-v0.4 --dataset=data/processed/dataset-v0.4.csv
npm run test:ml              # unit test Python
```

## Dataset v0.4 (tuần 4) — 80 store, 800/800 phép đo + mô hình preliminary

- Xem [`docs/model-preliminary-report.md`](docs/model-preliminary-report.md) (RQ1/RQ2, GroupKFold theo site, 60 store dev).

## Dataset v0.3.1 (tuần 3) — 612 phép đo

- Pilot testbed 190 + Shopify thật 422 (wave 0–2 đầy đủ, wave 3 mới 22 phép đo) — xem [`docs/dataset-qc-report.md`](docs/dataset-qc-report.md), [`docs/eda-report.md`](docs/eda-report.md).

## Kết quả pilot v1.0 (220 phép đo, 05–06/10/2026)

- Hợp lệ sau V1–V4: testbed 174/190 (15 `host_contention`, 1 error), site thật 29/30.
- Cả 6 fault đạt ρ(mức, đặc trưng cơ chế) ≥ 0,97 — xem [`docs/fault-matrix-noise-report.md`](docs/fault-matrix-noise-report.md).
- Nhiễu testbed: CV trung vị LCP 1,5%, FCP 2,0%, TBT30 0,5%; site thật: LCP 6–31%, TBT30 14–38%.
- Leakage: [`docs/leakage-checklist.md`](docs/leakage-checklist.md).
