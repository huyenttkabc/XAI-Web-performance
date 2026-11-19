"""Learning curve cho RQ1–RQ2: mẫu store development đã đủ lớn chưa? (lockbox không bị chạm)

Cách dùng: npm run ml:learning-curve -- [--run-id=<tên>] [--repeats=5] [--dataset=<csv>]
  dataset  mặc định data/processed/pilot-dataset.csv (vd snapshot data/processed/dataset-v0.4.csv)
Ghi data/processed/model-runs/<run-id>/{config.json, points.csv, summary.json},
docs/figures/learning-curve-{lcp,tbt30}.svg and docs/learning-curve-report.md.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import pandas as pd  # noqa: E402

from src.ml.learning_curve import ALL, learning_curve_points, summarise  # noqa: E402
from src.ml.learning_curve_report import learning_curve_svg, write_learning_curve_report  # noqa: E402
from src.ml.model_specs import SEED, model_specs  # noqa: E402
from src.ml.modeling_dataset import feature_metadata, feature_set, load_modeling_rows  # noqa: E402

TARGETS = ["lh_lcp_ms", "tbt_30s_ms"]
FEATURE_SETS = ["S", "S+R"]
SIZES = [12, 24, 36, ALL]
FIGURE_NAMES = {"lh_lcp_ms": "learning-curve-lcp.svg", "tbt_30s_ms": "learning-curve-tbt30.svg"}


def arg(name, default):
    return next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith(f"--{name}=")), default)


def main():
    run_id = arg("run-id", "learning-curve-" + datetime.now(timezone.utc).strftime("%y%m%d"))
    repeats = int(arg("repeats", 5))
    out_dir = ROOT / "data/processed/model-runs" / run_id
    out_dir.mkdir(parents=True, exist_ok=True)
    dataset = arg("dataset", None)
    dev, dataset_summary = load_modeling_rows(ROOT / dataset) if dataset else load_modeling_rows()
    metadata = feature_metadata()
    specs = model_specs()
    print(f"{run_id}: {dataset_summary['dev_sites']} dev sites, sizes {SIZES}, {repeats} repeats", flush=True)

    points = []
    for target in TARGETS:
        jobs = [("baseline", "-", feature_set(metadata, "S", target))]
        jobs += [(m, s, feature_set(metadata, s, target)) for s in FEATURE_SETS for m in specs if m != "baseline"]
        for model, fset, features in jobs:
            rows = learning_curve_points(dev, features, target, *specs[model], SIZES, repeats)
            for r in rows:
                points.append({"target": target, "model": model, "feature_set": fset, **r})
            print(f"  {target:11} {fset:3} {model:13} " +
                  "  ".join(f"n={p['size']}:{p['mae']:.0f}" for p in rows if p["repeat"] == 0), flush=True)

    summary = []
    for (target, model, fset), g in pd.DataFrame(points).groupby(["target", "model", "feature_set"], sort=False):
        summary += [{"target": target, "model": model, "feature_set": fset, **s} for s in summarise(g.to_dict("records"))]

    config = {"run_id": run_id, "created_at": datetime.now(timezone.utc).isoformat(), "seed": SEED,
              "sizes": [str(s) for s in SIZES], "repeats": repeats, "dataset": dataset_summary,
              "grids": {k: g for k, (_, g) in specs.items()}}
    (out_dir / "config.json").write_text(json.dumps(config, indent=2, ensure_ascii=False))
    pd.DataFrame(points).to_csv(out_dir / "points.csv", index=False)
    (out_dir / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False))

    figures = {}
    for target in TARGETS:
        svg = learning_curve_svg([s for s in summary if s["target"] == target], target)
        (ROOT / "docs/figures" / FIGURE_NAMES[target]).write_text(svg, encoding="utf-8")
        figures[target] = f"figures/{FIGURE_NAMES[target]}"
    write_learning_curve_report(ROOT / "docs/learning-curve-report.md", config, summary, figures)
    print(f"wrote {out_dir.relative_to(ROOT)}, docs/figures/learning-curve-*.svg, docs/learning-curve-report.md")


if __name__ == "__main__":
    main()
