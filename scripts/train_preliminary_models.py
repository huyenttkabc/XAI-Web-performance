"""Pipeline mô hình RQ1–RQ2 end-to-end (protocol §8.1): dataset → GroupKFold theo site → 4 mô hình × {S, S+R}
× {LCP, TBT30} → metric out-of-fold, bootstrap theo site, kiểm tra shuffled-label, sai số theo site.

Cách dùng: npm run ml:train -- [--run-id=<tên>] [--dataset=<csv>] [--report=<md>]
  dataset  mặc định data/processed/pilot-dataset.csv (vd snapshot đóng băng data/processed/dataset-v0.4.csv)
  report   mặc định docs/model-preliminary-report.md
Ghi data/processed/model-runs/<run-id>/{config.json, results.json, oof-predictions.csv}
và báo cáo. Lockbox không bao giờ bị chạm tới.
"""
import json
import platform
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
import sklearn  # noqa: E402
import xgboost  # noqa: E402

from src.ml.evaluation_metrics import per_fold_metrics, point_metrics, site_bootstrap, site_residuals  # noqa: E402
from src.ml.group_cross_validation import out_of_fold_predictions  # noqa: E402
from src.ml.model_report_writer import write_report  # noqa: E402
from src.ml.model_specs import SEED, model_specs  # noqa: E402
from src.ml.modeling_dataset import feature_metadata, feature_set, file_sha256, load_modeling_rows  # noqa: E402

TARGETS = ["lh_lcp_ms", "tbt_30s_ms"]
FEATURE_SETS = ["S", "S+R"]


def evaluate(dev, target, pred, baseline_pred, near_window):
    y = dev[target].to_numpy(float)
    result = {"pooled": point_metrics(y, pred), "per_fold": per_fold_metrics(y, pred, dev["fold"].to_numpy()),
              **site_bootstrap(y, pred, baseline_pred, dev["site"].to_numpy())}
    if near_window.any():  # độ nhạy: CÙNG dự đoán, chỉ bỏ các dòng LCP sát cửa sổ 60 s khỏi phần chấm
        result["pooled_without_near_window"] = point_metrics(y[~near_window], pred[~near_window])
    return result


def code_provenance() -> dict:
    """Git commit (nếu có) + sha256 của mã pipeline, để lần chạy chính thức chứng minh được là cùng một code."""
    git = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True)
    sources = sorted([*ROOT.glob("src/ml/*.py"), ROOT / "scripts/train_preliminary_models.py",
                      ROOT / "src/parser/feature-definitions.js", ROOT / "requirements.txt"])
    return {"git_commit": git.stdout.strip() or "no commit yet",
            "source_sha256": {str(f.relative_to(ROOT)): file_sha256(f) for f in sources}}


def arg(name, default):
    return next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith(f"--{name}=")), default)


def main():
    run_id = arg("run-id", datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"))
    report_path = ROOT / arg("report", "docs/model-preliminary-report.md")
    out_dir = ROOT / "data/processed/model-runs" / run_id
    out_dir.mkdir(parents=True, exist_ok=True)
    dev, summary = load_modeling_rows(ROOT / arg("dataset", "data/processed/pilot-dataset.csv"))
    metadata = feature_metadata()
    specs = model_specs()
    all_features = feature_set(metadata, "S+R", "lh_lcp_ms")
    negative = [f for f in all_features if (dev[f] < 0).any()]
    if negative:  # Ridge áp log1p lên feature: feature phải không âm
        raise ValueError(f"negative feature values (log1p undefined): {negative}")
    print(f"run {run_id}: {summary['dev_sites']} dev sites, {summary['dev_rows']} rows, "
          f"sites per fold {summary['dev_sites_per_fold']}")

    oof = dev[["measurement_id", "site", "page_type", "stratum", "fold", *TARGETS]].copy()
    results, config_sets, real_preds = [], {}, {}
    for target in TARGETS:
        near_window = (dev["lcp_near_window_end"].to_numpy() if target == "lh_lcp_ms" else np.zeros(len(dev), bool))
        # baseline median bỏ qua X; danh sách feature nào cũng được, truyền S để ma trận hợp lệ
        baseline_pred, baseline_folds = out_of_fold_predictions(
            dev, feature_set(metadata, "S", target), target, *specs["baseline"])
        oof[f"pred__{target}__baseline"] = baseline_pred
        results.append({"target": target, "feature_set": "-", "model": "baseline", "shuffled": False,
                        **evaluate(dev, target, baseline_pred, baseline_pred, near_window), "folds": baseline_folds})
        for set_name in FEATURE_SETS:
            features = feature_set(metadata, set_name, target)
            config_sets[f"{target}|{set_name}"] = features
            for name, (estimator, grid) in specs.items():
                if name == "baseline":
                    continue
                for shuffled in (False, True):
                    pred, folds = out_of_fold_predictions(dev, features, target, estimator, grid, shuffle_labels=shuffled)
                    tag = f"pred__{target}__{set_name}__{name}" + ("__shuffled" if shuffled else "")
                    oof[tag] = pred
                    row = {"target": target, "feature_set": set_name, "model": name, "shuffled": shuffled,
                           **evaluate(dev, target, pred, baseline_pred, near_window), "folds": folds}
                    if not shuffled:
                        row["worst_sites"] = site_residuals(dev, target, pred)
                    results.append(row)
                    if not shuffled:
                        real_preds[(target, set_name, name)] = pred
                    print(f"  {target:11} {set_name:3} {name:13} shuffled={shuffled!s:5} "
                          f"MAE={row['pooled']['mae']:8.0f}  R2={row['pooled']['r2']:6.3f}  "
                          f"ΔMAE={row['delta_mae_vs_baseline']:8.0f} {row['delta_mae_ci95']}")

    # RQ2: ΔMAE = MAE(S+R) − MAE(S), cùng mô hình, cùng fold; bootstrap ghép cặp theo site (âm = runtime giúp ích)
    rq2 = [{"target": t, "model": m, **site_bootstrap(dev[t].to_numpy(float), real_preds[(t, "S+R", m)],
                                                      real_preds[(t, "S", m)], dev["site"].to_numpy())}
           for t in TARGETS for m in specs if m != "baseline"]

    config = {"run_id": run_id, "created_at": datetime.now(timezone.utc).isoformat(), "seed": SEED,
              "protocol": "docs/protocol-v1.0.md §8.1", "code": code_provenance(), "dataset": summary, "feature_sets": config_sets,
              "grids": {k: {p: v for p, v in g.items()} for k, (_, g) in specs.items()},
              "versions": {"python": platform.python_version(), "numpy": np.__version__, "pandas": pd.__version__,
                           "scikit-learn": sklearn.__version__, "xgboost": xgboost.__version__}}
    (out_dir / "config.json").write_text(json.dumps(config, indent=2, ensure_ascii=False))
    (out_dir / "results.json").write_text(json.dumps({"models": results, "rq2_sr_vs_s": rq2}, indent=2, ensure_ascii=False, default=str))
    oof.to_csv(out_dir / "oof-predictions.csv", index=False)
    write_report(report_path, config, results, rq2, out_dir.relative_to(ROOT))
    print(f"wrote {out_dir.relative_to(ROOT)} and {report_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
