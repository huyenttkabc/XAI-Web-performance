# XAI Web Performance

Phát hiện và giải thích các yếu tố gây suy giảm hiệu năng Web phía client dựa trên Explainable Machine Learning.
Protocol hiện hành: **v1.0 (FROZEN 06/10/2026)** — [`docs/protocol-v1.0.md`](docs/protocol-v1.0.md).

## Cấu trúc

```
config/
  experiment-manifest.json   # protocol v1.0 dạng máy đọc: profile, outcomes, luật V1–V4, predictors, splits
  pilot-sites.csv            # 3 store × (home, product)
src/
  testbed/                   # testbed có kiểm soát
    fault-catalog.js         # 6 fault (5 cause group) × 3 mức, one-factor-at-a-time
    synthetic-asset-generators.js  # ảnh PNG, CSS chặn render, DOM, script bên thứ ba (tất định)
    testbed-server.js        # first-party 127.0.0.1:4173 + third-party localhost:4174
    site/                    # template trang home/product có các khe {{...}}
  collector/                 # 1 phép đo = 1 Chrome mới; lưu lhr + trace + context
  parser/
    feature-definitions.js   # NGUỒN DUY NHẤT định nghĩa cột (metadata/target/feature/diagnostic)
    trace-main-thread-extractor.js  # tbt_30s_ms + long task từ trace thô
    host-contention-filter.js       # luật V4
    rebuild-dataset-from-raw.js     # raw → dataset (V1–V4)
  analysis/descriptive-statistics.js
  pilot-plan-builder.js      # manifest + catalog → danh sách phép đo (xáo trộn có seed)
  run-pilot.js               # pipeline end-to-end
scripts/                     # reparse, data dictionary, fault-matrix/noise report, leakage checklist, lint
data/
  raw/                       # (gitignored) raw artifacts protocol v1.0
  processed/pilot-dataset.csv
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
npm run reports              # reparse → data dictionary → fault-matrix/noise → leakage checklist
```

## Kết quả pilot v1.0 (220 phép đo, 05–06/10/2026)

- Hợp lệ sau V1–V4: testbed 174/190 (15 `host_contention`, 1 error), site thật 29/30.
- Cả 6 fault đạt ρ(mức, đặc trưng cơ chế) ≥ 0,97 — xem [`docs/fault-matrix-noise-report.md`](docs/fault-matrix-noise-report.md).
- Nhiễu testbed: CV trung vị LCP 1,5%, FCP 2,0%, TBT30 0,5%; site thật: LCP 6–31%, TBT30 14–38%.
- Leakage: [`docs/leakage-checklist.md`](docs/leakage-checklist.md).
