"""RQ4: chẩn đoán store case study (protocol amendment 11/11/2026). RF S+R v1.0 (lưới §8.1) fit trên toàn bộ
store development; interventional TreeSHAP với background là mọi phép đo development cùng loại trang.

Dùng: npm run ml:rq4-diagnosis -- --run-id=rq4-diagnosis-261111-fullbg --case=data/processed/case-study/baseline.csv
Ghi data/processed/model-runs/<run-id>/{config.json, group-scores.csv, phi-features.csv, page-summary.json}.
Lockbox vẫn đóng: load_modeling_rows() loại store lockbox trước khi fit bất cứ thứ gì.
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
from src.ml.explanation_metrics import RANKED_GROUPS, reference_scores  # noqa: E402
from src.ml.group_cross_validation import _fit  # noqa: E402
from src.ml.model_specs import SEED, model_specs  # noqa: E402
from src.ml.modeling_dataset import feature_metadata, feature_set, file_sha256, load_modeling_rows  # noqa: E402

DATASET = ROOT / "data/processed/dataset-v1.0.csv"
TARGETS = ["lh_lcp_ms", "tbt_30s_ms"]
SOURCES = ["scripts/run_rq4_diagnosis.py", "src/ml/explanation_attributions.py", "src/ml/explanation_metrics.py",
           "src/ml/model_specs.py", "src/ml/group_cross_validation.py", "src/parser/feature-definitions.js"]


def arg(name: str) -> str:
    return next(a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith(f"--{name}="))


def page_summary(phi: pd.DataFrame, scores: pd.DataFrame, X_case: pd.DataFrame, X_dev: pd.DataFrame, groups: dict):
    """Trung vị qua các lần đo của một trang: điểm nhóm, xếp hạng, feature φ lớn nhất kèm giá trị so với trung vị dev."""
    med = scores[RANKED_GROUPS].median()
    top = phi.median().sort_values(ascending=False)
    return {
        "group_score_median": med.round(4).to_dict(),
        "group_ranking": list(med.sort_values(ascending=False).index),
        "top_features": [{"feature": f, "group": groups.get(f), "phi_median": round(float(v), 4),
                          "value_median": float(X_case[f].median()), "dev_median": float(X_dev[f].median())}
                         for f, v in top.head(8).items()],
    }


def main():
    run_id, case_csv = arg("run-id"), ROOT / arg("case")
    out = ROOT / "data/processed/model-runs" / run_id
    if out.exists():
        raise SystemExit(f"{out} đã tồn tại: không bao giờ ghi đè một run")
    dev, _ = load_modeling_rows(DATASET)
    case = pd.read_csv(case_csv)
    case = case[case["status"] == "ok"].reset_index(drop=True)
    meta = feature_metadata()
    groups = {f["name"]: f["group"] for f in meta["features"]}
    est, grid = model_specs(SEED)["random_forest"]

    score_rows, phi_rows, summary, fits = [], [], {}, []
    for target in TARGETS:
        features = feature_set(meta, "S+R", target)
        X, y_log = dev[features].astype(float), np.log1p(dev[target].astype(float))
        model, params = _fit(est, grid, X, y_log, dev["site"])
        fits.append({"target": target, "best_params": params, "dev_rows": int(len(dev)), "dev_sites": int(dev["site"].nunique())})
        for page in ("home", "product"):
            bg = X[dev["page_type"] == page]
            ex = case[case["page_type"] == page]
            Xc = ex[features].astype(float)
            phi, base = shap_values(model, Xc, bg, "interventional")
            s = group_scores(phi, pd.Series(0.0, index=phi.columns), groups)  # trung bình φ trên background ≈ 0 nên không cần trừ
            meta_cols = ex[["measurement_id", "page_type", "run"]].assign(
                target=target, base_value=base, pred_log=model.predict(Xc), obs_log=np.log1p(ex[target].astype(float)))
            score_rows.append(meta_cols.assign(model="random_forest", **s))
            score_rows.append(meta_cols.assign(model="reference", **reference_scores(Xc, bg, bg, groups)))
            phi_rows.append(meta_cols.join(phi))
            summary[f"{target}|{page}"] = {
                "observed_ms_median": float(ex[target].median()),
                "predicted_ms_median": float(np.median(np.expm1(model.predict(Xc)))),
                "dev_observed_ms_median": float(dev.loc[dev["page_type"] == page, target].median()),
                "shap": page_summary(phi, s, Xc, bg, groups),
                "reference_ranking": list(pd.DataFrame(reference_scores(Xc, bg, bg, groups)).median().sort_values(ascending=False).index),
            }
            print(target, page, "done", flush=True)

    out.mkdir(parents=True)
    pd.concat(score_rows, ignore_index=True).to_csv(out / "group-scores.csv", index=False)
    pd.concat(phi_rows, ignore_index=True).to_csv(out / "phi-features.csv", index=False)
    (out / "page-summary.json").write_text(json.dumps(summary, indent=2))
    config = {"run_id": run_id, "created_at": datetime.now(timezone.utc).isoformat(), "seed": SEED,
              "protocol": "docs/protocol-v1.0.md, amendment 11/11/2026 (RQ4)",
              "dataset": {"path": str(DATASET.relative_to(ROOT)), "sha256": file_sha256(DATASET), "lockbox_opened": False},
              "case": {"path": str(case_csv.relative_to(ROOT)), "sha256": file_sha256(case_csv), "ok_rows": int(len(case))},
              "fits": fits, "ranked_groups": RANKED_GROUPS,
              "code_sha256": {s: file_sha256(ROOT / s) for s in SOURCES},
              "versions": {"python": platform.python_version(), "numpy": np.__version__, "pandas": pd.__version__,
                           "sklearn": sklearn.__version__, "shap": shap.__version__}}
    (out / "config.json").write_text(json.dumps(config, indent=2, ensure_ascii=False))
    print("wrote", out.relative_to(ROOT))


if __name__ == "__main__":
    main()
