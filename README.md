# XAI Web Performance

Phát hiện và giải thích các yếu tố gây suy giảm hiệu năng Web phía client dựa trên Explainable Machine Learning.
Trạng thái: **Tuần 1** — pilot pipeline end-to-end, 1 fault có kiểm soát (`js-long-task`).

## Cấu trúc

```
config/
  experiment-manifest.json   # protocol dạng máy đọc: profile đo, outcomes, cause groups, faults
  pilot-sites.csv            # 2 store Shopify × (home, product)
src/
  testbed/                   # trang web có kiểm soát + chèn fault qua query string
  collector/                 # 1 phép đo = 1 Chrome mới; lưu lhr + trace + context
  parser/                    # feature-definitions.js là NGUỒN DUY NHẤT định nghĩa cột
  pilot-plan-builder.js      # manifest → danh sách phép đo (xáo trộn có seed)
  run-pilot.js               # pipeline end-to-end
scripts/                     # reparse, data dictionary, lint
data/
  raw/                       # (gitignored) raw artifacts
  processed/pilot-dataset.csv
docs/data-dictionary.md      # sinh tự động
test/                        # node:test
```

## Chạy

```bash
nvm use && npm ci            # Node 24, Lighthouse 12.8.2 (cần Google Chrome)
npm test                     # unit tests
npm run lint                 # kiểm tra cú pháp
npm run testbed              # mở testbed: /home.html?fault=js-long-task&dose=250&count=4
npm run pilot                # đo thật (-- --scope=real|testbed, -- --seed=42)
npm run reparse              # dựng lại dataset từ data/raw (không đo lại)
npm run dictionary           # sinh docs/data-dictionary.md
```

## Kết quả pilot tuần 1 (28 phép đo, 2 batch ngày 03/10/2026)

| Điều kiện testbed | TBT trung vị | Kỳ vọng 4 × (dose − 50) | LCP trung vị |
|---|---|---|---|
| dose 0 (baseline) | 0 ms | 0 | ~1.30 s |
| dose 100 | ~207 ms | 200 | ~1.31 s |
| dose 250 | ~808 ms | 800 | ~1.31 s |
| dose 500 | ~1808 ms | 1800 | ~1.30 s |

⇒ Fault điều khiển được TBT gần như tuyến tính và LCP không đổi — đạt Gate G1.
