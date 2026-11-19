"""RQ3 trên nhánh có kiểm soát: fit lại pipeline đã đóng băng trên testbed, tính SHAP và điểm nhóm nguyên nhân.

Dùng: npm run ml:rq3  (= scripts/run_rq3_explanations.py --run-id=rq3-testbed-261108)
Ghi data/processed/model-runs/<run-id>/{config.json, group-scores.csv, phi-features.csv}. Metric và hình:
scripts/build_rq3_report.py. Cách chia (protocol §8): GroupKFold theo lần lặp (chính) và
leave-one-severity-out (train mức 0, 1, 3 → giải thích mức 2). Chỉ testbed: không dữ liệu site thật, không lockbox.
"""
import json
import platform
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
import shap  # noqa: E402
import sklearn  # noqa: E402

from src.ml.explanation_attributions import group_scores, shap_values  # noqa: E402
from src.ml.explanation_metrics import RANKED_GROUPS, reference_scores, true_rank  # noqa: E402
from src.ml.group_cross_validation import _fit  # noqa: E402
from src.ml.model_specs import SEED, model_specs  # noqa: E402
from src.ml.modeling_dataset import feature_metadata, feature_set, file_sha256  # noqa: E402

DATASET = ROOT / "data/processed/dataset-v1.0.csv"
TARGETS = ["lh_lcp_ms", "tbt_30s_ms"]
MODELS = {"random_forest": ["interventional", "path_dependent"], "xgboost": ["interventional", "path_dependent"],
          "ridge": ["interventional"]}
SOURCES = ["src/ml/explanation_attributions.py", "src/ml/explanation_metrics.py", "src/ml/model_specs.py",
           "src/ml/group_cross_validation.py", "scripts/run_rq3_explanations.py", "src/parser/feature-definitions.js"]


def splits(bed: pd.DataFrame):
    """Sinh (tên cách chia, nhãn fold, mask train, mask giải thích). Chỉ giải thích phép đo có cấy lỗi."""
    degraded = bed["fault_id"] != "none"
    for run in sorted(bed["run"].unique()):
        test = bed["run"] == run
        yield "repetition", int(run), ~test, test & degraded
    sev = bed["severity_level"].astype(int)
    yield "leave_one_severity_out", 2, sev != 2, sev == 2


def explain_fold(bed, train, test, features, target, groups, specs, info):
    """Mọi mô hình và biến thể của một fold; trả (dòng điểm nhóm, dòng φ của mô hình chính)."""
    X, y_log = bed[features].astype(float), np.log1p(bed[target].astype(float))
    meta = ["measurement_id", "fault_id", "severity_level", "page_type", "run", "cause_group"]
    rows, phis = [], []
    fitted = {}
    for name in MODELS:
        est, grid = specs[name]
        fitted[name], params = _fit(est, grid, X[train], y_log[train], bed.loc[train, "run"])
        info.append({**params, "model": name})
    for page in sorted(bed["page_type"].unique()):
        tr_page = train & (bed["page_type"] == page)
        base_tr = tr_page & (bed["fault_id"] == "none")
        ex = test & (bed["page_type"] == page)
        if not ex.any():
            continue
        out_meta = bed.loc[ex, meta]
        ref = reference_scores(X[ex], X[tr_page], X[base_tr], groups)
        rows.append(out_meta.assign(model="reference", variant="model_free", **ref))
        for name, variants in MODELS.items():
            for variant in variants:
                phi, base = shap_values(fitted[name], pd.concat([X[ex], X[base_tr]]), X[base_tr], variant)
                phi_base_mean = phi.loc[X[base_tr].index].mean()
                phi_ex = phi.loc[X[ex].index]
                for mag in (False, True) if variant == "interventional" else (False,):
                    s = group_scores(phi_ex, phi_base_mean, groups, magnitude=mag)
                    rows.append(out_meta.assign(model=name, variant=variant + ("_magnitude" if mag else ""), **s))
                if name == "random_forest" and variant == "interventional":
                    phis.append(out_meta.assign(base_value=base, pred_log=fitted[name].predict(X[ex]),
                                                obs_log=y_log[ex]).join(phi_ex))
    return rows, phis


def main():
    run_id = next(a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--run-id="))
    out = ROOT / "data/processed/model-runs" / run_id
    if out.exists():
        raise SystemExit(f"{out} đã tồn tại: không bao giờ ghi đè một run")
    rows = pd.read_csv(DATASET, low_memory=False)
    bed = rows[(rows["site_type"] == "controlled_testbed") & (rows["status"] == "ok")].reset_index(drop=True)
    meta = feature_metadata()
    groups = {f["name"]: f["group"] for f in meta["features"]}
    specs = model_specs(SEED)
    score_rows, phi_rows, fit_info = [], [], []
    for target in TARGETS:
        features = feature_set(meta, "S+R", target)
        for split, fold, train, test in splits(bed):
            info = []
            r, p = explain_fold(bed, train, test, features, target, groups, specs, info)
            score_rows += [x.assign(target=target, split=split, fold=fold) for x in r]
            phi_rows += [x.assign(target=target, split=split, fold=fold) for x in p]
            fit_info.append({"target": target, "split": split, "fold": fold, "best_params": info})
            print(target, split, fold, "done", flush=True)

    scores = pd.concat(score_rows, ignore_index=True)
    truth = scores["cause_group"]
    scores["rank"] = true_rank(scores, truth)
    out.mkdir(parents=True)
    scores.to_csv(out / "group-scores.csv", index=False)
    pd.concat(phi_rows, ignore_index=True).to_csv(out / "phi-features.csv", index=False)
    config = {"run_id": run_id, "created_at": datetime.now(timezone.utc).isoformat(), "seed": SEED,
              "protocol": "docs/protocol-v1.0.md §8 (RQ3) + amendment 08/11/2026; manuscript §3.9",
              "dataset": {"path": str(DATASET.relative_to(ROOT)), "sha256": file_sha256(DATASET),
                          "testbed_rows": int(len(bed))},
              "ranked_groups": RANKED_GROUPS, "models": MODELS, "fits": fit_info,
              "code_sha256": {s: file_sha256(ROOT / s) for s in SOURCES},
              "versions": {"python": platform.python_version(), "numpy": np.__version__, "pandas": pd.__version__,
                           "sklearn": sklearn.__version__, "shap": shap.__version__}}
    (out / "config.json").write_text(json.dumps(config, indent=2, ensure_ascii=False))
    print("wrote", out.relative_to(ROOT))


if __name__ == "__main__":
    main()
