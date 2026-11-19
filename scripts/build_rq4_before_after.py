"""RQ4: so sánh trước / sau khi sửa store case study (protocol amendment 11/11/2026, mục e).

Dùng: npm run rq4:before-after  [-- --before=data/processed/case-study/baseline.csv --after=data/processed/case-study/after.csv]
Ghi data/processed/case-study/before-after.json và in bảng. Mỗi trang và chỉ số: trung vị, IQR trước và sau, % thay đổi
trung vị, CI 95% bootstrap của chênh lệch trung vị (bốc lại mỗi chuỗi độc lập 1.000 lần, seed 42; các lần đo trước và
sau không ghép cặp). Feature thành phần trang cho thấy cái gì đã thay đổi. Chỉ dùng thư viện chuẩn.
"""
import csv
import json
import random
import statistics
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTCOMES = ["lh_lcp_ms", "tbt_30s_ms", "lh_fcp_ms"]
COMPOSITION = ["script_requests", "third_party_requests", "third_party_bytes", "image_bytes", "transfer_bytes_total",
               "bytes_before_lcp_request", "lcp_resource_bytes", "third_party_main_thread_ms", "bootup_js_ms"]
N_BOOT, SEED = 1000, 42


def arg(name, default):
    return next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith(f"--{name}=")), default)


def load(path):
    rows = [r for r in csv.DictReader(open(ROOT / path)) if r["status"] == "ok"]
    return {p: [r for r in rows if r["page_type"] == p] for p in ("home", "product")}


def values(rows, col):
    return [float(r[col]) for r in rows if r[col] not in ("", "NA", "nan")]


def iqr(v):
    q = statistics.quantiles(v, n=4, method="inclusive")
    return [q[0], q[2]]


def boot_ci(before, after, rng):
    """CI 95% percentile của median(sau) − median(trước)."""
    diffs = sorted(statistics.median(rng.choices(after, k=len(after))) - statistics.median(rng.choices(before, k=len(before)))
                   for _ in range(N_BOOT))
    return [diffs[int(0.025 * N_BOOT)], diffs[int(0.975 * N_BOOT) - 1]]


def main():
    before, after = load(arg("before", "data/processed/case-study/baseline.csv")), load(arg("after", "data/processed/case-study/after.csv"))
    rng = random.Random(SEED)
    out = {"n_boot": N_BOOT, "seed": SEED, "pages": {}}
    for page in ("home", "product"):
        res = {"n_before": len(before[page]), "n_after": len(after[page]), "outcomes": {}, "composition": {}}
        for col in OUTCOMES:
            b, a = values(before[page], col), values(after[page], col)
            mb, ma = statistics.median(b), statistics.median(a)
            res["outcomes"][col] = {"before_median": mb, "before_iqr": iqr(b), "after_median": ma, "after_iqr": iqr(a),
                                    "diff_median": ma - mb, "pct_change": 100 * (ma - mb) / mb, "diff_ci95": boot_ci(b, a, rng)}
        for col in COMPOSITION:
            b, a = values(before[page], col), values(after[page], col)
            if b and a:
                res["composition"][col] = {"before_median": statistics.median(b), "after_median": statistics.median(a)}
        out["pages"][page] = res
    (ROOT / "data/processed/case-study/before-after.json").write_text(json.dumps(out, indent=2))
    for page, res in out["pages"].items():
        print(f"== {page} (n before {res['n_before']}, after {res['n_after']})")
        for col, r in res["outcomes"].items():
            print(f"  {col:12s} {r['before_median']:8.0f} [{r['before_iqr'][0]:.0f}-{r['before_iqr'][1]:.0f}] -> "
                  f"{r['after_median']:8.0f} [{r['after_iqr'][0]:.0f}-{r['after_iqr'][1]:.0f}]  "
                  f"{r['pct_change']:+6.1f}%  diff {r['diff_median']:+.0f} CI [{r['diff_ci95'][0]:+.0f}; {r['diff_ci95'][1]:+.0f}]")
        for col, r in res["composition"].items():
            print(f"    {col:28s} {r['before_median']:12.0f} -> {r['after_median']:12.0f}")


if __name__ == "__main__":
    main()
