"""Học trên mẫu store lớn hơn có cho mô hình tốt hơn không? Cả hai mẫu được chấm trên CÙNG các site test.

Với mỗi fold ngoài k (hash site của protocol §8, nên một store có cùng fold ở cả hai dataset), mô hình A học
trên các store fold ≠ k của dataset nhỏ, mô hình B học trên các store fold ≠ k của dataset lớn (cùng mô hình,
lưới và inner tuning như train_preliminary_models.py); cả hai dự đoán các dòng fold k của dataset LỚN.
ΔMAE = MAE(B) − MAE(A), bootstrap ghép cặp theo site: âm = mẫu lớn hơn giúp ích.
Lockbox không bị chạm (load_modeling_rows loại nó khỏi cả hai dataset).

Cách dùng: npm run ml:compare-size -- --small=<csv> --large=<csv> [--run-id=<tên>]
Ghi data/processed/model-runs/<run-id>/{config.json, results.json} và docs/training-set-size-comparison.md.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402

from src.ml.evaluation_metrics import point_metrics, site_bootstrap  # noqa: E402
from src.ml.group_cross_validation import _fit  # noqa: E402
from src.ml.model_report_writer import TARGET_LABEL, _ci, _ms, _table  # noqa: E402
from src.ml.model_specs import SEED, model_specs  # noqa: E402
from src.ml.modeling_dataset import feature_metadata, feature_set, load_modeling_rows  # noqa: E402

TARGETS = ["lh_lcp_ms", "tbt_30s_ms"]
FEATURE_SETS = ["S", "S+R"]
REPORT = ROOT / "docs/training-set-size-comparison.md"


def arg(name, default=None):
    return next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith(f"--{name}=")), default)


def predict_test_folds(train_df, test_df, features, target, estimator, grid):
    """Fold k của test_df được dự đoán bởi mô hình học (và tuning) trên các dòng fold ≠ k của train_df."""
    pred = np.full(len(test_df), np.nan)
    for fold in sorted(test_df["fold"].unique()):
        train, test = (train_df["fold"] != fold).to_numpy(), (test_df["fold"] == fold).to_numpy()
        assert not set(train_df.loc[train, "site"]) & set(test_df.loc[test, "site"]), f"site leakage in fold {fold}"
        y_log = np.log1p(train_df.loc[train, target].astype(float).to_numpy())
        model, _ = _fit(estimator, grid, train_df.loc[train, features].astype(float), y_log, train_df.loc[train, "site"])
        pred[test] = np.expm1(model.predict(test_df.loc[test, features].astype(float)))
    return pred


def compare(y, pred_a, pred_b, sites, is_new):
    """Metric của hai mô hình trên mọi dòng test, trên store chỉ có ở mẫu lớn, và ΔMAE ghép cặp."""
    boot = site_bootstrap(y, pred_b, pred_a, sites)
    return {"a": point_metrics(y, pred_a), "b": point_metrics(y, pred_b),
            "a_new_sites": point_metrics(y[is_new], pred_a[is_new]), "b_new_sites": point_metrics(y[is_new], pred_b[is_new]),
            "a_old_sites": point_metrics(y[~is_new], pred_a[~is_new]), "b_old_sites": point_metrics(y[~is_new], pred_b[~is_new]),
            "delta_mae": boot["delta_mae_vs_baseline"], "delta_mae_ci95": boot["delta_mae_ci95"]}


def verdict(row):
    lo, hi = row["delta_mae_ci95"]
    return "✅ lớn hơn tốt hơn" if hi < 0 else ("❌ lớn hơn kém hơn" if lo > 0 else "≈ không phân biệt")


def write_report(config, results, run_dir):
    s, l = config["small"], config["large"]
    lines = [
        "# So sánh cỡ mẫu huấn luyện — dataset nhỏ (A) vs lớn (B)", "",
        "> Sinh tự động bởi `scripts/compare_training_set_size.py`. Không sửa tay.",
        f"> Run `{config['run_id']}` · seed {config['seed']} · artifacts `{run_dir}`. Lockbox không bị chạm.", "",
        "## Thiết kế", "",
        f"- **A** học trên `{s['dataset_csv']}` ({s['dev_sites']} store dev, {s['dev_rows']} dòng); "
        f"**B** học trên `{l['dataset_csv']}` ({l['dev_sites']} store dev, {l['dev_rows']} dòng).",
        "- Fold theo hash site (protocol §8) → mỗi store cùng fold ở cả hai dataset. Với mỗi fold k, A và B học trên các store "
        "fold ≠ k của dataset tương ứng, cùng dự đoán **các dòng fold k của dataset lớn** → cùng một tập test, không site nào vừa train vừa test.",
        f"- Tập test: {config['test_rows']} dòng / {config['test_sites']} store, trong đó {config['test_new_sites']} store chỉ có ở dataset lớn ('store mới').",
        "- ΔMAE = MAE(B) − MAE(A), CI95 bootstrap theo site (ghép cặp, 1000 lần). Âm = dataset lớn giúp model tốt hơn.", "",
    ]
    for target in TARGETS:
        rows = [r for r in results if r["target"] == target]
        lines += [f"## {TARGET_LABEL[target]} (ms)", "", *_table(
            ["feature set", "model", "MAE A", "MAE B", "R² A", "R² B", "ΔMAE (B−A) [CI95]", "kết luận"],
            [[r["feature_set"], r["model"], _ms(r["a"]["mae"]), _ms(r["b"]["mae"]), f"{r['a']['r2']:.3f}", f"{r['b']['r2']:.3f}",
              f"{_ms(r['delta_mae'])} {_ci(r['delta_mae_ci95'])}", verdict(r)] for r in rows]), "",
            "MAE tách theo nhóm store test (A chưa từng thấy store nào trong cả hai nhóm):", "", *_table(
            ["feature set", "model", "store cũ: A", "store cũ: B", "store mới: A", "store mới: B"],
            [[r["feature_set"], r["model"], _ms(r["a_old_sites"]["mae"]), _ms(r["b_old_sites"]["mae"]),
              _ms(r["a_new_sites"]["mae"]), _ms(r["b_new_sites"]["mae"])] for r in rows]), ""]
    REPORT.write_text("\n".join(lines))


def main():
    small_csv, large_csv = arg("small"), arg("large")
    if not small_csv or not large_csv:
        raise SystemExit("usage: --small=<csv> --large=<csv> [--run-id=<name>]")
    run_id = arg("run-id", "training-size-" + datetime.now(timezone.utc).strftime("%y%m%d"))
    out_dir = ROOT / "data/processed/model-runs" / run_id
    out_dir.mkdir(parents=True, exist_ok=True)
    small, small_summary = load_modeling_rows(ROOT / small_csv)
    large, large_summary = load_modeling_rows(ROOT / large_csv)
    extra = set(small["site"]) - set(large["site"])
    if extra:
        raise ValueError(f"small dataset has dev stores missing from the large one: {sorted(extra)}")
    metadata, specs = feature_metadata(), model_specs()
    y_sites = large["site"].to_numpy()
    is_new = ~large["site"].isin(set(small["site"])).to_numpy()
    print(f"{run_id}: A {small_summary['dev_sites']} stores / B {large_summary['dev_sites']} stores, "
          f"test {len(large)} rows ({int(is_new.sum())} rows on new stores)", flush=True)

    results = []
    for target in TARGETS:
        y = large[target].to_numpy(float)
        for set_name in FEATURE_SETS:
            features = feature_set(metadata, set_name, target)
            for name, (estimator, grid) in specs.items():
                if name == "baseline" and set_name != "S":  # baseline median bỏ qua X: mỗi target một dòng
                    continue
                pred_a = predict_test_folds(small, large, features, target, estimator, grid)
                pred_b = predict_test_folds(large, large, features, target, estimator, grid)
                row = {"target": target, "feature_set": "-" if name == "baseline" else set_name, "model": name,
                       **compare(y, pred_a, pred_b, y_sites, is_new)}
                results.append(row)
                print(f"  {target:11} {row['feature_set']:3} {name:13} MAE A={row['a']['mae']:8.0f} B={row['b']['mae']:8.0f} "
                      f"ΔMAE={row['delta_mae']:8.0f} {[round(v) for v in row['delta_mae_ci95']]}", flush=True)

    config = {"run_id": run_id, "created_at": datetime.now(timezone.utc).isoformat(), "seed": SEED,
              "small": small_summary, "large": large_summary, "test_rows": int(len(large)),
              "test_sites": int(large["site"].nunique()), "test_new_sites": int(large.loc[is_new, "site"].nunique())}
    (out_dir / "config.json").write_text(json.dumps(config, indent=2, ensure_ascii=False))
    (out_dir / "results.json").write_text(json.dumps(results, indent=2, ensure_ascii=False))
    write_report(config, results, out_dir.relative_to(ROOT))
    print(f"wrote {out_dir.relative_to(ROOT)} and {REPORT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
